# MAILIEN — API Design Document

**Version:** 1.0  
**Date:** February 12, 2026

---

## 1. Core Engine API (`@mailien/core`)

### 1.1 Initialization

```ts
import { createMailien } from "@mailien/core"
import { prismaAdapter } from "@mailien/prisma-adapter"

const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: prismaAdapter(prisma),
  defaultFrom: "hello@yourdomain.com",
  webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
})
```

#### `CreateMailienOptions`

```ts
interface CreateMailienOptions {
  apiKey: string
  adapter: MailienAdapter
  defaultFrom?: string
  webhookSecret?: string
  logger?: MailienLogger
}
```

---

### 1.2 Sending Email

```ts
const result = await mailien.send({
  from: "support@company.com",
  to: ["user@example.com"],
  subject: "Welcome!",
  html: "<p>Hello from Mailien</p>",
  mailboxId: "mbx_support",
})
```

#### `SendParams`

```ts
interface SendParams {
  from?: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  mailboxId?: string
  threadId?: string       // Reply to existing thread
  attachments?: AttachmentInput[]
}
```

#### `SendResult`

```ts
interface SendResult {
  messageId: string       // Internal ID
  emailMessageId: string  // RFC 2822 Message-ID
  threadId: string
}
```

---

### 1.3 Inbox & Threads

```ts
const { threads, total, hasMore } = await mailien.getInbox("mbx_support", {
  limit: 20,
  cursor: "thread_abc123",
})

const thread = await mailien.getThread("thread_abc123")
const message = await mailien.getMessage("msg_xyz789")
```

---

### 1.4 Mailboxes

```ts
const mailbox = await mailien.createMailbox({
  name: "Support",
  email: "support@company.com",
})
const mailboxes = await mailien.getMailboxes()
```

---

### 1.5 Webhook Processing

```ts
const result = await mailien.processWebhook(payload, signature)
```

---

## 2. Next.js Integration (`@mailien/next`)

### 2.1 Webhook Handler

```ts
// app/api/webhooks/email/route.ts
import { mailienWebhookHandler } from "@mailien/next"
import { mailien } from "@/lib/mailien"

export const POST = mailienWebhookHandler(mailien, {
  onEmailReceived: async (message) => { /* ... */ },
  onStatusUpdate: async (messageId, status) => { /* ... */ },
  onError: async (error) => { /* ... */ },
})
```

### 2.2 API Route Helpers

```ts
import { createInboxRoute, createSendRoute, createThreadRoute } from "@mailien/next"

export const GET = createInboxRoute(mailien)
export const POST = createSendRoute(mailien)
```

---

## 3. UI Components (`@mailien/ui`)

### 3.1 Components

```tsx
<Inbox mailboxId="mbx_support" onThreadSelect={(t) => router.push(`/inbox/${t.id}`)} />
<ThreadView threadId={params.id} showComposer={true} />
<Composer mailboxId="mbx_support" threadId={threadId} onSend={(r) => {}} />
```

### 3.2 React Hooks

```ts
const { threads, isLoading, loadMore, refresh } = useInbox({ mailboxId: "mbx_support" })
const { thread, messages, isLoading, markAsRead } = useThread({ threadId: "thread_abc" })
const { draft, setField, send, isSending, reset } = useComposer({ mailboxId: "mbx_support" })
```

---

## 4. Adapter Interface

```ts
interface MailienAdapter {
  createThread(data: CreateThreadData): Promise<Thread>
  getThread(threadId: string): Promise<ThreadWithMessages | null>
  getThreads(mailboxId: string, options?: PaginationOptions): Promise<PaginatedResult<ThreadPreview>>
  createMessage(data: CreateMessageData): Promise<Message>
  getMessage(messageId: string): Promise<Message | null>
  getMessageByEmailId(emailMessageId: string): Promise<Message | null>
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>
  createMailbox(data: CreateMailboxData): Promise<Mailbox>
  getMailbox(mailboxId: string): Promise<Mailbox | null>
  getMailboxes(): Promise<Mailbox[]>
  createAttachment(data: CreateAttachmentData): Promise<Attachment>
}
```

---

## 5. Error Handling

```ts
class MailienError extends Error { code: string; statusCode: number }
class MailienAuthError extends MailienError {}
class MailienNotFoundError extends MailienError {}
class MailienValidationError extends MailienError {}
class MailienWebhookError extends MailienError {}
class MailienAdapterError extends MailienError {}
```

---

## 6. Event Hooks

```ts
const mailien = createMailien({
  hooks: {
    beforeSend: async (params) => params,
    afterSend: async (result) => {},
    onReceive: async (message) => {},
    onStatusChange: async (messageId, oldStatus, newStatus) => {},
  },
})
```
