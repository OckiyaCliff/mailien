# 🛠️ MAILIEN — API Design Document

> **"Developer-first primitives for building complex email workflows."**

Mailien's API is divided into three distinct layers: **Core Engine**, **Next.js Integration**, and **Headless UI**.

---

## 1. Core Engine API (`@mailien/core`)

The engine is framework-agnostic and responsible for the heavy lifting of ingestion, parsing, and threading.

### Initialization

```ts
import { createMailien } from "@mailien/core";

const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY,
  adapter: prismaAdapter(prisma),
  debug: true,
});
```

### Methods

| Method | Returns | Description |
| :--- | :--- | :--- |
| `send(params)` | `Promise<Message>` | Send an email via Resend and link to a thread. |
| `getInbox(mailboxId, options)` | `Promise<Thread[]>` | Fetch a paginated list of conversations. |
| `getThread(threadId)` | `Promise<ThreadWithMessages>` | Fetch a full conversation history. |
| `processWebhook(payload)` | `Promise<void>` | Handle incoming Resend events idempotently. |

---

## 2. Next.js Integration (`@mailien/next`)

Seamless integration with the App Router and Server Actions.

```ts
// app/api/webhooks/email/route.ts
import { createWebhookHandler } from "@mailien/next";

const handler = createWebhookHandler(mailien);

export const POST = handler;
```

### Key Utilities
- `createWebhookHandler(engine)`: Automated Resend webhook endpoint.
- `verifySignature(request)`: Standalone utility for manual payload verification.

---

## 3. Headless UI Primitives (`@mailien/ui`)

Inspired by the **shadcn/ui** pattern. Components are logic-heavy but style-agnostic.

```mermaid
graph LR
    Component[UI Component] --> Hook[Mailien Hook]
    Hook --> Context[Mailien Provider]
    Context --> Engine[@mailien/core]
```

### React Hooks

| Hook | Description |
| :--- | :--- |
| `useInbox(mailboxId)` | Live-synced list of threads with pagination controls. |
| `useThread(threadId)` | Real-time conversation view. |
| `useComposer()` | Management of draft state, attachments, and sending. |

### Component Examples
```tsx
<Inbox mailboxId="mbx_123" onThreadClick={(id) => setID(id)} />
<Composer onSend={(msg) => console.log(msg)} />
```

---

## 4. Adapter Interface (`MailienAdapter`)

To build a custom adapter, you must implement the following skeletal structure:

```ts
interface MailienAdapter {
  createMessage(data: MessageInput): Promise<Message>;
  findThreadByReference(references: string[]): Promise<Thread | null>;
  upsertMailbox(data: MailboxInput): Promise<Mailbox>;
  // ...
}
```

---

> [!TIP]
> All Mailien APIs are strictly typed. We recommend using `TypeScript` 5.0+ for the best developer experience.
