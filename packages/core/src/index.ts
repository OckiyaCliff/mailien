// ──────────────────────────────────────────────
// @mailien/core — Public API
// ──────────────────────────────────────────────

// Engine
export { createMailien, MailienError } from './engine.js'

// Internals (for advanced usage / testing)
export { ThreadEngine } from './thread-engine.js'
export { StateManager } from './state-manager.js'
export { parseInboundEmail } from './message-parser.js'

// Types
export type {
    // Config
    MailienConfig,
    MailienHooks,
    MailienPlugin,
    MailienEngine,

    // Entities
    Mailbox,
    Thread,
    ThreadWithMessages,
    Message,
    Attachment,

    // Inputs
    SendParams,
    SendAttachment,
    SendResult,
    CreateThreadData,
    CreateMessageData,
    CreateMailboxData,

    // Adapter
    MailienAdapter,

    // Webhook
    WebhookPayload,
    WebhookEventType,
    ProcessResult,

    // Parsing
    ParsedEmail,

    // Pagination
    PaginationOptions,
    PaginatedResult,
} from './types.js'

// Enums
export { MessageDirection, MessageStatus } from './types.js'
