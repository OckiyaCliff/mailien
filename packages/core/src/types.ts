// ──────────────────────────────────────────────
// @mailien/core — Type Definitions
// ──────────────────────────────────────────────

// ─── Enums ───────────────────────────────────

export enum MessageDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

export enum MessageStatus {
    QUEUED = 'queued',
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    BOUNCED = 'bounced',
    COMPLAINED = 'complained',
    FAILED = 'failed',
}

// ─── Core Entities ───────────────────────────

export interface Mailbox {
    id: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
}

export interface Thread {
    id: string
    mailboxId: string
    subject: string
    lastMessageAt: Date
    messageCount: number
    isRead: boolean
    createdAt: Date
    updatedAt: Date
}

export interface ThreadWithMessages extends Thread {
    messages: Message[]
}

export interface Message {
    id: string
    threadId: string
    emailMessageId: string
    resendId?: string | null
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    bodyHtml?: string | null
    bodyText?: string | null
    direction: MessageDirection
    status: MessageStatus
    headers?: Record<string, string>
    inReplyTo?: string | null
    references?: string[]
    sentAt?: Date | null
    createdAt: Date
    updatedAt: Date
    attachments?: Attachment[]
}

export interface Attachment {
    id: string
    messageId: string
    filename: string
    contentType: string
    size: number
    url?: string | null
}

// ─── Input Types ─────────────────────────────

export interface SendParams {
    from?: string
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    html?: string
    text?: string
    replyTo?: string
    headers?: Record<string, string>
    attachments?: SendAttachment[]
    threadId?: string
}

export interface SendAttachment {
    filename: string
    content: Buffer | string
    contentType?: string
}

export interface SendResult {
    messageId: string
    threadId: string
    resendId: string
}

// ─── Webhook Types ───────────────────────────

export type WebhookEventType =
    | 'email.sent'
    | 'email.delivered'
    | 'email.opened'
    | 'email.bounced'
    | 'email.complained'
    | 'email.received'

export interface WebhookPayload {
    type: WebhookEventType
    data: Record<string, unknown>
    created_at: string
}

export interface ProcessResult {
    type: WebhookEventType
    messageId?: string
    threadId?: string
    action: 'created' | 'updated' | 'ignored'
}

// ─── Parsed Email ────────────────────────────

export interface ParsedEmail {
    messageId: string
    from: string
    to: string[]
    cc?: string[]
    subject: string
    bodyHtml?: string
    bodyText?: string
    inReplyTo?: string
    references?: string[]
    date?: Date
    headers?: Record<string, string>
}

// ─── Pagination ──────────────────────────────

export interface PaginationOptions {
    cursor?: string
    limit?: number
    direction?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
    data: T[]
    nextCursor?: string
    hasMore: boolean
}

// ─── Adapter Interface ───────────────────────

export interface MailienAdapter {
    // Threads
    createThread(data: CreateThreadData): Promise<Thread>
    getThread(threadId: string): Promise<ThreadWithMessages | null>
    getThreads(mailboxId: string, options?: PaginationOptions): Promise<PaginatedResult<Thread>>
    updateThread(threadId: string, data: Partial<Thread>): Promise<Thread>

    // Messages
    createMessage(data: CreateMessageData): Promise<Message>
    getMessage(messageId: string): Promise<Message | null>
    getMessageByEmailId(emailMessageId: string): Promise<Message | null>
    updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>

    // Mailboxes
    getMailbox(mailboxId: string): Promise<Mailbox | null>
    getMailboxByEmail(email: string): Promise<Mailbox | null>
    createMailbox(data: CreateMailboxData): Promise<Mailbox>
}

export interface CreateThreadData {
    mailboxId: string
    subject: string
}

export interface CreateMessageData {
    threadId: string
    emailMessageId: string
    resendId?: string
    from: string
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    bodyHtml?: string
    bodyText?: string
    direction: MessageDirection
    status: MessageStatus
    inReplyTo?: string
    references?: string[]
    headers?: Record<string, string>
    sentAt?: Date
}

export interface CreateMailboxData {
    email: string
    name: string
}

// ─── Config ──────────────────────────────────

export interface MailienConfig {
    apiKey: string
    adapter: MailienAdapter
    defaultFrom?: string
    debug?: boolean
    plugins?: MailienPlugin[]
    hooks?: MailienHooks
}

export interface MailienHooks {
    beforeSend?: (params: SendParams) => Promise<SendParams>
    afterSend?: (result: SendResult) => Promise<void>
    onReceive?: (message: Message) => Promise<void>
    onStatusChange?: (messageId: string, status: MessageStatus) => Promise<void>
}

// ─── Plugin Interface ────────────────────────

export interface MailienPlugin {
    name: string
    version: string
    onSend?: (params: SendParams) => Promise<SendParams>
    onReceive?: (message: Message) => Promise<void>
    onStatusChange?: (messageId: string, status: MessageStatus) => Promise<void>
}

// ─── Engine Interface ────────────────────────

export interface MailienEngine {
    send(params: SendParams): Promise<SendResult>
    getInbox(mailboxId: string, options?: PaginationOptions): Promise<PaginatedResult<Thread>>
    getThread(threadId: string): Promise<ThreadWithMessages | null>
    getMessage(messageId: string): Promise<Message | null>
    processWebhook(payload: WebhookPayload): Promise<ProcessResult>
    getOrCreateMailbox(email: string, name?: string): Promise<Mailbox>
}
