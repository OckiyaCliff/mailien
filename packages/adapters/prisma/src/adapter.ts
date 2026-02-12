// ──────────────────────────────────────────────
// @mailien/prisma-adapter — Adapter Implementation
// ──────────────────────────────────────────────
// Implements the MailienAdapter interface using
// Prisma Client for data persistence.
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

type PrismaClient = {
    mailbox: any
    thread: any
    message: any
    [key: string]: any
}

/**
 * Create a Prisma-based Mailien adapter.
 *
 * @example
 * ```ts
 * import { PrismaClient } from "@prisma/client"
 * import { prismaAdapter } from "@mailien/prisma-adapter"
 *
 * const prisma = new PrismaClient()
 * const adapter = prismaAdapter(prisma)
 * ```
 */
export function prismaAdapter(prisma: PrismaClient): MailienAdapter {
    return {
        // ─── Threads ─────────────────────────

        async createThread(data: CreateThreadData): Promise<Thread> {
            return prisma.thread.create({
                data: {
                    mailboxId: data.mailboxId,
                    subject: data.subject,
                },
            })
        },

        async getThread(threadId: string): Promise<ThreadWithMessages | null> {
            return prisma.thread.findUnique({
                where: { id: threadId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        include: { attachments: true },
                    },
                },
            })
        },

        async getThreads(
            mailboxId: string,
            options?: PaginationOptions,
        ): Promise<PaginatedResult<Thread>> {
            const limit = options?.limit ?? 20
            const direction = options?.direction ?? 'desc'

            const where: Record<string, unknown> = { mailboxId }

            if (options?.cursor) {
                where.id = { lt: options.cursor }
            }

            const threads = await prisma.thread.findMany({
                where,
                orderBy: { lastMessageAt: direction },
                take: limit + 1, // Fetch one extra for cursor
            })

            const hasMore = threads.length > limit
            const data = hasMore ? threads.slice(0, limit) : threads
            const nextCursor = hasMore ? data[data.length - 1]?.id : undefined

            return { data, nextCursor, hasMore }
        },

        async updateThread(threadId: string, data: Partial<Thread>): Promise<Thread> {
            return prisma.thread.update({
                where: { id: threadId },
                data: {
                    ...(data.lastMessageAt && { lastMessageAt: data.lastMessageAt }),
                    ...(data.messageCount !== undefined && { messageCount: data.messageCount }),
                    ...(data.isRead !== undefined && { isRead: data.isRead }),
                    ...(data.subject && { subject: data.subject }),
                },
            })
        },

        // ─── Messages ────────────────────────

        async createMessage(data: CreateMessageData): Promise<Message> {
            return prisma.message.create({
                data: {
                    threadId: data.threadId,
                    emailMessageId: data.emailMessageId,
                    resendId: data.resendId,
                    from: data.from,
                    to: data.to,
                    cc: data.cc ?? [],
                    bcc: data.bcc ?? [],
                    subject: data.subject,
                    bodyHtml: data.bodyHtml,
                    bodyText: data.bodyText,
                    direction: data.direction,
                    status: data.status,
                    inReplyTo: data.inReplyTo,
                    references: data.references ?? [],
                    headers: data.headers ? JSON.parse(JSON.stringify(data.headers)) : undefined,
                    sentAt: data.sentAt,
                },
            })
        },

        async getMessage(messageId: string): Promise<Message | null> {
            return prisma.message.findUnique({
                where: { id: messageId },
                include: { attachments: true },
            })
        },

        async getMessageByEmailId(emailMessageId: string): Promise<Message | null> {
            return prisma.message.findUnique({
                where: { emailMessageId },
            })
        },

        async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
            await prisma.message.update({
                where: { id: messageId },
                data: { status },
            })
        },

        // ─── Mailboxes ───────────────────────

        async getMailbox(mailboxId: string): Promise<Mailbox | null> {
            return prisma.mailbox.findUnique({
                where: { id: mailboxId },
            })
        },

        async getMailboxByEmail(email: string): Promise<Mailbox | null> {
            return prisma.mailbox.findUnique({
                where: { email },
            })
        },

        async createMailbox(data: CreateMailboxData): Promise<Mailbox> {
            return prisma.mailbox.create({
                data: {
                    email: data.email,
                    name: data.name,
                },
            })
        },
    }
}
