// ──────────────────────────────────────────────
// @mailien/supabase-adapter — Adapter Implementation
// ──────────────────────────────────────────────
// Implements the MailienAdapter interface using
// Supabase JS client for data persistence.
// ──────────────────────────────────────────────

import type {
    MailienAdapter,
    Mailbox,
    Thread,
    ThreadWithMessages,
    Message,
    CreateThreadData,
    CreateMessageData,
    CreateMailboxData,
    PaginationOptions,
    PaginatedResult,
    MessageStatus,
} from '@mailien/core'

import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Column Mapping ──────────────────────────
// Supabase uses snake_case, Mailien uses camelCase.

function toThread(row: Record<string, unknown>): Thread {
    return {
        id: row.id as string,
        mailboxId: row.mailbox_id as string,
        subject: row.subject as string,
        lastMessageAt: new Date(row.last_message_at as string),
        messageCount: row.message_count as number,
        isRead: row.is_read as boolean,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    }
}

function toMessage(row: Record<string, unknown>): Message {
    return {
        id: row.id as string,
        threadId: row.thread_id as string,
        emailMessageId: row.email_message_id as string,
        resendId: row.resend_id as string | null,
        from: row.from as string,
        to: (row.to as string[]) ?? [],
        cc: (row.cc as string[]) ?? [],
        bcc: (row.bcc as string[]) ?? [],
        subject: row.subject as string,
        bodyHtml: row.body_html as string | null,
        bodyText: row.body_text as string | null,
        direction: row.direction as Message['direction'],
        status: row.status as Message['status'],
        inReplyTo: row.in_reply_to as string | null,
        references: (row.references as string[]) ?? [],
        headers: row.headers as Record<string, string> | undefined,
        sentAt: row.sent_at ? new Date(row.sent_at as string) : null,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    }
}

function toMailbox(row: Record<string, unknown>): Mailbox {
    return {
        id: row.id as string,
        email: row.email as string,
        name: row.name as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    }
}

// ─── Adapter Factory ─────────────────────────

/**
 * Create a Supabase-based Mailien adapter.
 *
 * @example
 * ```ts
 * import { createClient } from "@supabase/supabase-js"
 * import { supabaseAdapter } from "@mailien/supabase-adapter"
 *
 * const supabase = createClient(url, key)
 * const adapter = supabaseAdapter(supabase)
 * ```
 */
export function supabaseAdapter(supabase: SupabaseClient): MailienAdapter {
    return {
        // ─── Threads ─────────────────────────

        async createThread(data: CreateThreadData): Promise<Thread> {
            const { data: row, error } = await supabase
                .from('threads')
                .insert({
                    mailbox_id: data.mailboxId,
                    subject: data.subject,
                })
                .select()
                .single()

            if (error) throw new Error(`[supabase-adapter] createThread: ${error.message}`)
            return toThread(row)
        },

        async getThread(threadId: string): Promise<ThreadWithMessages | null> {
            const { data: row, error } = await supabase
                .from('threads')
                .select('*')
                .eq('id', threadId)
                .single()

            if (error || !row) return null

            const { data: messageRows } = await supabase
                .from('messages')
                .select('*')
                .eq('thread_id', threadId)
                .order('created_at', { ascending: true })

            const thread = toThread(row)
            return {
                ...thread,
                messages: (messageRows ?? []).map(toMessage),
            }
        },

        async getThreads(
            mailboxId: string,
            options?: PaginationOptions,
        ): Promise<PaginatedResult<Thread>> {
            const limit = options?.limit ?? 20
            const ascending = options?.direction === 'asc'

            let query = supabase
                .from('threads')
                .select('*')
                .eq('mailbox_id', mailboxId)
                .order('last_message_at', { ascending })
                .limit(limit + 1)

            if (options?.cursor) {
                query = ascending
                    ? query.gt('id', options.cursor)
                    : query.lt('id', options.cursor)
            }

            const { data: rows, error } = await query

            if (error) throw new Error(`[supabase-adapter] getThreads: ${error.message}`)

            const items = rows ?? []
            const hasMore = items.length > limit
            const data = hasMore ? items.slice(0, limit) : items
            const nextCursor = hasMore ? data[data.length - 1]?.id : undefined

            return {
                data: data.map(toThread),
                nextCursor,
                hasMore,
            }
        },

        async updateThread(threadId: string, data: Partial<Thread>): Promise<Thread> {
            const update: Record<string, unknown> = {}

            if (data.lastMessageAt) update.last_message_at = data.lastMessageAt.toISOString()
            if (data.messageCount !== undefined) update.message_count = data.messageCount
            if (data.isRead !== undefined) update.is_read = data.isRead
            if (data.subject) update.subject = data.subject

            const { data: row, error } = await supabase
                .from('threads')
                .update(update)
                .eq('id', threadId)
                .select()
                .single()

            if (error) throw new Error(`[supabase-adapter] updateThread: ${error.message}`)
            return toThread(row)
        },

        // ─── Messages ────────────────────────

        async createMessage(data: CreateMessageData): Promise<Message> {
            const { data: row, error } = await supabase
                .from('messages')
                .insert({
                    thread_id: data.threadId,
                    email_message_id: data.emailMessageId,
                    resend_id: data.resendId,
                    from: data.from,
                    to: data.to,
                    cc: data.cc ?? [],
                    bcc: data.bcc ?? [],
                    subject: data.subject,
                    body_html: data.bodyHtml,
                    body_text: data.bodyText,
                    direction: data.direction,
                    status: data.status,
                    in_reply_to: data.inReplyTo,
                    references: data.references ?? [],
                    headers: data.headers ?? null,
                    sent_at: data.sentAt?.toISOString(),
                })
                .select()
                .single()

            if (error) throw new Error(`[supabase-adapter] createMessage: ${error.message}`)
            return toMessage(row)
        },

        async getMessage(messageId: string): Promise<Message | null> {
            const { data: row, error } = await supabase
                .from('messages')
                .select('*')
                .eq('id', messageId)
                .single()

            if (error || !row) return null
            return toMessage(row)
        },

        async getMessageByEmailId(emailMessageId: string): Promise<Message | null> {
            const { data: row, error } = await supabase
                .from('messages')
                .select('*')
                .eq('email_message_id', emailMessageId)
                .single()

            if (error || !row) return null
            return toMessage(row)
        },

        async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
            const { error } = await supabase
                .from('messages')
                .update({ status })
                .eq('id', messageId)

            if (error) throw new Error(`[supabase-adapter] updateMessageStatus: ${error.message}`)
        },

        // ─── Mailboxes ───────────────────────

        async getMailbox(mailboxId: string): Promise<Mailbox | null> {
            const { data: row, error } = await supabase
                .from('mailboxes')
                .select('*')
                .eq('id', mailboxId)
                .single()

            if (error || !row) return null
            return toMailbox(row)
        },

        async getMailboxByEmail(email: string): Promise<Mailbox | null> {
            const { data: row, error } = await supabase
                .from('mailboxes')
                .select('*')
                .eq('email', email)
                .single()

            if (error || !row) return null
            return toMailbox(row)
        },

        async createMailbox(data: CreateMailboxData): Promise<Mailbox> {
            const { data: row, error } = await supabase
                .from('mailboxes')
                .insert({
                    email: data.email,
                    name: data.name,
                })
                .select()
                .single()

            if (error) throw new Error(`[supabase-adapter] createMailbox: ${error.message}`)
            return toMailbox(row)
        },
    }
}
