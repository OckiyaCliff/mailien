// ──────────────────────────────────────────────
// @mailien/core — Engine Factory
// ──────────────────────────────────────────────
// The main entry point. createMailien() returns a
// fully configured MailienEngine instance.
// ──────────────────────────────────────────────

import { Resend } from 'resend'
import { ThreadEngine } from './thread-engine.js'
import { StateManager } from './state-manager.js'
import { parseInboundEmail } from './message-parser.js'
import type {
    MailienConfig,
    MailienEngine,
    Message,
    PaginatedResult,
    PaginationOptions,
    ProcessResult,
    SendParams,
    SendResult,
    Thread,
    ThreadWithMessages,
    WebhookPayload,
    Mailbox,
} from './types.js'
import { MessageDirection, MessageStatus } from './types.js'

/**
 * Create a new Mailien engine instance.
 *
 * @example
 * ```ts
 * const mailien = createMailien({
 *   apiKey: process.env.RESEND_API_KEY!,
 *   adapter: prismaAdapter(prisma),
 * })
 * ```
 */
export function createMailien(config: MailienConfig): MailienEngine {
    const resend = new Resend(config.apiKey)
    const threadEngine = new ThreadEngine(config.adapter)
    const stateManager = new StateManager(config.adapter, config.hooks, config.plugins)
    const adapter = config.adapter

    const log = config.debug
        ? (...args: unknown[]) => console.log('[mailien]', ...args)
        : () => { }

    // ─── Send ────────────────────────────────

    async function send(params: SendParams): Promise<SendResult> {
        let processedParams = { ...params }

        // Run beforeSend hook
        if (config.hooks?.beforeSend) {
            processedParams = await config.hooks.beforeSend(processedParams)
        }

        // Run plugin onSend hooks
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (plugin.onSend) {
                    processedParams = await plugin.onSend(processedParams)
                }
            }
        }

        const from = processedParams.from || config.defaultFrom
        if (!from) {
            throw new MailienError('No "from" address provided. Set defaultFrom in config or pass it in send params.')
        }

        const to = Array.isArray(processedParams.to) ? processedParams.to : [processedParams.to]

        // Send via Resend
        // Note: We cast to `any` because the Resend SDK uses a discriminated
        // union type requiring `react` | `html` | `text` — we provide html/text dynamically.
        const { data, error } = await resend.emails.send({
            from,
            to,
            cc: processedParams.cc
                ? Array.isArray(processedParams.cc)
                    ? processedParams.cc
                    : [processedParams.cc]
                : undefined,
            bcc: processedParams.bcc
                ? Array.isArray(processedParams.bcc)
                    ? processedParams.bcc
                    : [processedParams.bcc]
                : undefined,
            subject: processedParams.subject,
            html: processedParams.html,
            text: processedParams.text,
            replyTo: processedParams.replyTo,
            headers: processedParams.headers,
        } as any)

        if (error || !data) {
            throw new MailienError(`Failed to send email: ${error?.message ?? 'Unknown error'}`)
        }

        log('Email sent via Resend:', data.id)

        // Resolve mailbox
        const mailbox = await getOrCreateMailbox(from)

        // Resolve thread
        let thread: Thread
        if (processedParams.threadId) {
            const existing = await adapter.getThread(processedParams.threadId)
            if (!existing) {
                throw new MailienError(`Thread not found: ${processedParams.threadId}`)
            }
            thread = existing
        } else {
            thread = await threadEngine.findOrCreateThread(
                {
                    messageId: `<${data.id}@resend>`,
                    from,
                    to,
                    subject: processedParams.subject,
                },
                mailbox.id,
            )
        }

        // Persist message
        const message = await adapter.createMessage({
            threadId: thread.id,
            emailMessageId: `<${data.id}@resend>`,
            resendId: data.id,
            from,
            to,
            cc: processedParams.cc
                ? Array.isArray(processedParams.cc)
                    ? processedParams.cc
                    : [processedParams.cc]
                : undefined,
            subject: processedParams.subject,
            bodyHtml: processedParams.html,
            bodyText: processedParams.text,
            direction: MessageDirection.OUTBOUND,
            status: MessageStatus.SENT,
            sentAt: new Date(),
        })

        // Update thread metadata
        await adapter.updateThread(thread.id, {
            lastMessageAt: new Date(),
            messageCount: thread.messageCount + 1,
        })

        log('Message persisted:', message.id, 'in thread:', thread.id)

        // Fire afterSend hook
        const result: SendResult = {
            messageId: message.id,
            threadId: thread.id,
            resendId: data.id,
        }

        if (config.hooks?.afterSend) {
            await config.hooks.afterSend(result)
        }

        return result
    }

    // ─── Inbox ───────────────────────────────

    async function getInbox(
        mailboxId: string,
        options?: PaginationOptions,
    ): Promise<PaginatedResult<Thread>> {
        return adapter.getThreads(mailboxId, options)
    }

    // ─── Thread ──────────────────────────────

    async function getThread(threadId: string): Promise<ThreadWithMessages | null> {
        return adapter.getThread(threadId)
    }

    // ─── Message ─────────────────────────────

    async function getMessage(messageId: string): Promise<Message | null> {
        return adapter.getMessage(messageId)
    }

    // ─── Webhook Processing ──────────────────

    async function processWebhook(payload: WebhookPayload): Promise<ProcessResult> {
        log('Processing webhook:', payload.type)

        // Handle inbound email
        if (payload.type === 'email.received') {
            return handleInboundEmail(payload.data)
        }

        // Handle status updates
        return handleStatusUpdate(payload)
    }

    async function handleInboundEmail(data: Record<string, unknown>): Promise<ProcessResult> {
        const parsed = parseInboundEmail(data)

        // Idempotency check
        const existing = await adapter.getMessageByEmailId(parsed.messageId)
        if (existing) {
            log('Duplicate email ignored:', parsed.messageId)
            return { type: 'email.received', action: 'ignored' }
        }

        // Resolve mailbox by recipient
        const recipientEmail = parsed.to[0]
        const mailbox = await getOrCreateMailbox(recipientEmail)

        // Thread resolution
        const thread = await threadEngine.findOrCreateThread(parsed, mailbox.id)

        // Persist message
        const message = await adapter.createMessage({
            threadId: thread.id,
            emailMessageId: parsed.messageId,
            from: parsed.from,
            to: parsed.to,
            cc: parsed.cc,
            subject: parsed.subject,
            bodyHtml: parsed.bodyHtml,
            bodyText: parsed.bodyText,
            direction: MessageDirection.INBOUND,
            status: MessageStatus.DELIVERED,
            inReplyTo: parsed.inReplyTo,
            references: parsed.references,
            headers: parsed.headers,
            sentAt: parsed.date,
        })

        // Update thread metadata
        await adapter.updateThread(thread.id, {
            lastMessageAt: parsed.date ?? new Date(),
            messageCount: thread.messageCount + 1,
            isRead: false,
        })

        log('Inbound email threaded:', message.id, '→', thread.id)

        // Fire hooks
        if (config.hooks?.onReceive) {
            await config.hooks.onReceive(message)
        }
        if (config.plugins) {
            for (const plugin of config.plugins) {
                if (plugin.onReceive) {
                    await plugin.onReceive(message)
                }
            }
        }

        return {
            type: 'email.received',
            messageId: message.id,
            threadId: thread.id,
            action: 'created',
        }
    }

    async function handleStatusUpdate(payload: WebhookPayload): Promise<ProcessResult> {
        const resendId = payload.data.email_id as string | undefined
        if (!resendId) {
            return { type: payload.type, action: 'ignored' }
        }

        const emailMessageId = `<${resendId}@resend>`
        const message = await adapter.getMessageByEmailId(emailMessageId)
        if (!message) {
            log('Message not found for status update:', emailMessageId)
            return { type: payload.type, action: 'ignored' }
        }

        const newStatus = StateManager.eventToStatus(payload.type)
        if (!newStatus) {
            return { type: payload.type, action: 'ignored' }
        }

        const updated = await stateManager.transition(message.id, newStatus)

        return {
            type: payload.type,
            messageId: message.id,
            action: updated ? 'updated' : 'ignored',
        }
    }

    // ─── Mailbox Helper ──────────────────────

    async function getOrCreateMailbox(email: string, name?: string): Promise<Mailbox> {
        const existing = await adapter.getMailboxByEmail(email)
        if (existing) return existing

        return adapter.createMailbox({
            email,
            name: name ?? email.split('@')[0],
        })
    }

    // ─── Return Engine ───────────────────────

    return {
        send,
        getInbox,
        getThread,
        getMessage,
        processWebhook,
        getOrCreateMailbox,
    }
}

// ─── Custom Error ──────────────────────────

export class MailienError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'MailienError'
    }
}
