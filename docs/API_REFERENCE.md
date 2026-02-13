# 📖 Mailien API Reference

Complete reference for every public export in the Mailien ecosystem.

---

## `@mailien/core`

### `createMailien(config)`

Creates a new Mailien engine instance.

```ts
import { createMailien } from '@mailien/core'

const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: prismaAdapter(prisma),
  defaultFrom: 'hi@yourapp.com',
  debug: true,
})
```

#### `MailienConfig`

| Property | Type | Required | Description |
|:---------|:-----|:---------|:------------|
| `apiKey` | `string` | ✅ | Your Resend API key |
| `adapter` | `MailienAdapter` | ✅ | Database adapter (Prisma or Supabase) |
| `defaultFrom` | `string` | ❌ | Default sender address |
| `debug` | `boolean` | ❌ | Enable console logging |
| `hooks` | `MailienHooks` | ❌ | Lifecycle hooks |
| `plugins` | `MailienPlugin[]` | ❌ | Plugin chain |

---

### `MailienEngine`

Returned by `createMailien()`. All methods are async.

#### `engine.send(params)`

Send an email via Resend and track it in your database.

```ts
const result = await mailien.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello</h1>',
})
// → { messageId, threadId, resendId }
```

| Param | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `to` | `string \| string[]` | ✅ | Recipient(s) |
| `subject` | `string` | ✅ | Email subject |
| `html` | `string` | ❌ | HTML body |
| `text` | `string` | ❌ | Plain-text body |
| `from` | `string` | ❌ | Override `defaultFrom` |
| `cc` | `string \| string[]` | ❌ | CC recipients |
| `bcc` | `string \| string[]` | ❌ | BCC recipients |
| `replyTo` | `string` | ❌ | Reply-To address |
| `threadId` | `string` | ❌ | Append to existing thread |
| `headers` | `Record<string, string>` | ❌ | Custom headers |
| `attachments` | `SendAttachment[]` | ❌ | File attachments |

**Returns:** `SendResult` — `{ messageId, threadId, resendId }`

---

#### `engine.getInbox(mailboxId, options?)`

Fetch paginated threads for a mailbox.

```ts
const inbox = await mailien.getInbox('mbx_123', { limit: 20 })
// → { data: Thread[], nextCursor?, hasMore }
```

---

#### `engine.getThread(threadId)`

Fetch a single thread with all its messages.

```ts
const thread = await mailien.getThread('thr_456')
// → ThreadWithMessages | null
```

---

#### `engine.getMessage(messageId)`

Fetch a single message by ID.

```ts
const msg = await mailien.getMessage('msg_789')
// → Message | null
```

---

#### `engine.processWebhook(payload)`

Process a Resend webhook event. Handles `email.sent`, `email.delivered`, `email.opened`, `email.bounced`, `email.complained`, and `email.received`.

```ts
const result = await mailien.processWebhook(payload)
// → { type, messageId?, threadId?, action: 'created' | 'updated' | 'ignored' }
```

---

#### `engine.getOrCreateMailbox(email, name?)`

Find or auto-create a mailbox by email address.

```ts
const mailbox = await mailien.getOrCreateMailbox('team@yourapp.com', 'Team')
```

---

### Enums

```ts
enum MessageDirection { INBOUND = 'inbound', OUTBOUND = 'outbound' }

enum MessageStatus {
  QUEUED = 'queued', SENT = 'sent', DELIVERED = 'delivered',
  OPENED = 'opened', BOUNCED = 'bounced', COMPLAINED = 'complained', FAILED = 'failed'
}
```

---

### Core Types

| Type | Key Fields |
|:-----|:-----------|
| `Mailbox` | `id`, `email`, `name`, `createdAt` |
| `Thread` | `id`, `mailboxId`, `subject`, `lastMessageAt`, `messageCount`, `isRead` |
| `ThreadWithMessages` | Extends `Thread` with `messages: Message[]` |
| `Message` | `id`, `threadId`, `from`, `to[]`, `subject`, `direction`, `status` |
| `Attachment` | `id`, `messageId`, `filename`, `contentType`, `size`, `url?` |
| `PaginationOptions` | `cursor?`, `limit?`, `direction?` |
| `PaginatedResult<T>` | `data: T[]`, `nextCursor?`, `hasMore` |

---

## `@mailien/next`

### `createWebhookHandler(engine, options?)`

Creates a Next.js App Router POST handler.

```ts
// app/api/webhook/route.ts
import { createWebhookHandler } from '@mailien/next'
import { mailien } from '@/lib/mailien'

export const POST = createWebhookHandler(mailien, {
  signingSecret: process.env.WEBHOOK_SECRET, // optional
})
```

---

## `@mailien/prisma-adapter`

### `prismaAdapter(prisma)`

Creates a `MailienAdapter` backed by Prisma.

```ts
import { PrismaClient } from '@prisma/client'
import { prismaAdapter } from '@mailien/prisma-adapter'

const adapter = prismaAdapter(new PrismaClient())
```

Requires the Prisma schema from `@mailien/prisma-adapter/prisma/schema.prisma`.

---

## `@mailien/supabase-adapter`

### `supabaseAdapter(supabase)`

Creates a `MailienAdapter` backed by Supabase.

```ts
import { createClient } from '@supabase/supabase-js'
import { supabaseAdapter } from '@mailien/supabase-adapter'

const supabase = createClient(url, key)
const adapter = supabaseAdapter(supabase)
```

Requires running `sql/schema.sql` in the Supabase SQL Editor first.

---

## `@mailien/ui`

### Hooks

#### `useInbox(mailboxId, fetchThreads)`

Manages inbox state with pagination, loading, and error handling.

```ts
const { threads, isLoading, error, refresh, loadMore, hasMore } = useInbox(
  mailboxId,
  (id, opts) => fetch(`/api/threads?mailboxId=${id}`).then(r => r.json())
)
```

#### `useThread(threadId, fetchThread)`

Manages a single thread's state.

```ts
const { thread, isLoading, error, refresh } = useThread(
  threadId,
  (id) => fetch(`/api/threads/${id}`).then(r => r.json())
)
```

#### `useComposer(onSend)`

Manages the compose form state and submission.

```ts
const { fields, setField, send, isSending, error, reset } = useComposer(
  async (data) => {
    await fetch('/api/send', { method: 'POST', body: JSON.stringify(data) })
  }
)
```

### Components

| Component | Props | Description |
|:----------|:------|:------------|
| `InboxList` | `threads`, `isLoading`, `onSelect`, `selectedId` | Renders a list of threads |
| `ThreadItem` | `thread`, `isSelected`, `onClick` | Single thread row |
| `ThreadView` | `thread`, `isLoading`, `onReply` | Full thread with messages |
| `Composer` | `isOpen`, `onClose`, `onSend` | Compose modal |

---

## `MailienAdapter` Interface

Any custom adapter must implement these 11 methods:

| Method | Signature |
|:-------|:----------|
| `createThread` | `(data: CreateThreadData) → Promise<Thread>` |
| `getThread` | `(threadId: string) → Promise<ThreadWithMessages \| null>` |
| `getThreads` | `(mailboxId: string, options?) → Promise<PaginatedResult<Thread>>` |
| `updateThread` | `(threadId: string, data: Partial<Thread>) → Promise<Thread>` |
| `createMessage` | `(data: CreateMessageData) → Promise<Message>` |
| `getMessage` | `(messageId: string) → Promise<Message \| null>` |
| `getMessageByEmailId` | `(emailMessageId: string) → Promise<Message \| null>` |
| `updateMessageStatus` | `(messageId: string, status: MessageStatus) → Promise<void>` |
| `getMailbox` | `(mailboxId: string) → Promise<Mailbox \| null>` |
| `getMailboxByEmail` | `(email: string) → Promise<Mailbox \| null>` |
| `createMailbox` | `(data: CreateMailboxData) → Promise<Mailbox>` |
