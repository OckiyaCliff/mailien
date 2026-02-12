# MAILIEN — Technical Architecture

**Version:** 1.0  
**Date:** February 12, 2026

---

## 1. System Architecture Overview

Mailien follows a **modular, layered architecture** designed for composability and extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Application                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Presentation Layer                   │   │
│  │  ┌──────────┐ ┌─────────────┐ ┌──────────────────┐  │   │
│  │  │  Inbox   │ │ ThreadView  │ │    Composer      │  │   │
│  │  └──────────┘ └─────────────┘ └──────────────────┘  │   │
│  │  ┌──────────┐ ┌─────────────┐                       │   │
│  │  │ Sidebar  │ │MailboxSwitch│  @mailien/ui          │   │
│  │  └──────────┘ └─────────────┘                       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │                   Engine Layer                        │   │
│  │                                                      │   │
│  │  ┌──────────────┐ ┌───────────────┐ ┌────────────┐  │   │
│  │  │ Thread Engine │ │ Message Parser│ │State Manager│  │   │
│  │  └──────────────┘ └───────────────┘ └────────────┘  │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │           Resend API Client                   │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                  @mailien/core                       │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │                 Integration Layer                     │   │
│  │  ┌──────────────┐ ┌───────────────┐                  │   │
│  │  │Webhook Handler│ │ API Routes    │                  │   │
│  │  └──────────────┘ └───────────────┘                  │   │
│  │                  @mailien/next                        │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │                  Data Layer                           │   │
│  │  ┌──────────────┐ ┌───────────────┐                  │   │
│  │  │Prisma Adapter │ │Supabase Adapt.│                  │   │
│  │  └──────────────┘ └───────────────┘                  │   │
│  │                @mailien/adapters                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                   ┌──────┴──────┐
                   │  Resend API  │
                   │  (External)  │
                   └─────────────┘
```

---

## 2. Package Structure

Mailien is organized as a **pnpm workspace monorepo** managed with **Turborepo**.

```
mailien/
├── apps/
│   └── demo/                    # Next.js demo application
│       ├── app/
│       │   ├── api/webhooks/    # Webhook endpoint
│       │   ├── inbox/           # Inbox page
│       │   └── layout.tsx
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   ├── core/                    # @mailien/core
│   │   ├── src/
│   │   │   ├── engine.ts        # createMailien() factory
│   │   │   ├── thread-engine.ts # Threading logic
│   │   │   ├── message-parser.ts# Email parsing
│   │   │   ├── state-manager.ts # Status tracking
│   │   │   ├── types.ts         # Shared types
│   │   │   └── index.ts         # Public API
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── next/                    # @mailien/next
│   │   ├── src/
│   │   │   ├── webhook-handler.ts
│   │   │   ├── api-routes.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                      # @mailien/ui
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── inbox.tsx
│   │   │   │   ├── thread-view.tsx
│   │   │   │   ├── composer.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── mailbox-switcher.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-inbox.ts
│   │   │   │   ├── use-thread.ts
│   │   │   │   └── use-composer.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── adapters/
│       ├── prisma/              # @mailien/prisma-adapter
│       │   ├── src/
│       │   │   ├── adapter.ts
│       │   │   ├── schema.prisma
│       │   │   └── index.ts
│       │   └── package.json
│       │
│       └── supabase/            # @mailien/supabase-adapter
│           ├── src/
│           │   ├── adapter.ts
│           │   └── index.ts
│           └── package.json
│
├── plugins/
│   └── stellar/                 # @mailien/stellar (experimental)
│       ├── src/
│       │   ├── payment-detector.ts
│       │   ├── wallet-resolver.ts
│       │   ├── transaction-builder.ts
│       │   ├── payment-types.ts
│       │   ├── ui/
│       │   │   ├── payment-badge.tsx
│       │   │   ├── payment-action.tsx
│       │   │   └── transaction-history.tsx
│       │   └── index.ts
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── LICENSE
└── README.md
```

---

## 3. Core Engine (`@mailien/core`)

The engine is the heart of Mailien — a headless, framework-agnostic module.

### 3.1 Factory Pattern

```ts
// createMailien() — Main entry point
import { createMailien } from "@mailien/core"
import { prismaAdapter } from "@mailien/prisma-adapter"

const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: prismaAdapter(prisma),
  defaultFrom: "hello@yourdomain.com",
})
```

### 3.2 Core API Surface

```ts
interface MailienEngine {
  // Sending
  send(params: SendParams): Promise<SendResult>
  
  // Inbox
  getInbox(mailboxId: string, options?: PaginationOptions): Promise<Thread[]>
  
  // Threads
  getThread(threadId: string): Promise<ThreadWithMessages>
  
  // Messages
  getMessage(messageId: string): Promise<Message>
  
  // Webhook Processing
  processWebhook(payload: WebhookPayload): Promise<ProcessResult>
  
  // Status
  getMessageStatus(messageId: string): Promise<MessageStatus>
}
```

### 3.3 Internal Modules

| Module | Responsibility |
|---|---|
| `engine.ts` | Factory, orchestration, public API |
| `thread-engine.ts` | Thread creation, linking, lookup |
| `message-parser.ts` | Parse inbound email headers & body |
| `state-manager.ts` | Track message delivery states |
| `types.ts` | Shared TypeScript types |

---

## 4. Thread Engine (Core Differentiator)

The thread engine is Mailien's most valuable piece — it provides Gmail-style threading that Resend does not offer.

### 4.1 How Email Threading Works

Email threading relies on three headers:

| Header | Purpose |
|---|---|
| `Message-ID` | Unique identifier for each email |
| `In-Reply-To` | The `Message-ID` of the email being replied to |
| `References` | Chain of all `Message-ID`s in the conversation |

### 4.2 Threading Algorithm

```
┌─────────────────────────────────────────┐
│         Inbound Email Received          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Extract: Message-ID, In-Reply-To,  │
│           References, Subject        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Has In-Reply-To or References?      │
└───┬──────────────────────┬───────────┘
    │ YES                  │ NO
    ▼                      ▼
┌────────────────┐  ┌────────────────────┐
│ Find thread by │  │ Subject matches    │
│ referenced     │  │ existing thread?   │
│ Message-ID     │  │ (Re: / Fwd:)       │
└───┬────────────┘  └──┬─────────┬───────┘
    │                   │ YES     │ NO
    ▼                   ▼         ▼
┌────────────┐  ┌──────────┐ ┌──────────┐
│ Attach to  │  │ Attach   │ │ Create   │
│ existing   │  │ to match │ │ new      │
│ thread     │  │          │ │ thread   │
└────────────┘  └──────────┘ └──────────┘
```

### 4.3 Thread Engine Interface

```ts
interface ThreadEngine {
  findOrCreateThread(email: ParsedEmail): Promise<Thread>
  attachMessage(threadId: string, message: Message): Promise<void>
  getThreadByMessageId(messageId: string): Promise<Thread | null>
  getThreadByReferences(references: string[]): Promise<Thread | null>
}
```

> **Key requirement:** Threading must be **deterministic** and **idempotent**.

---

## 5. Database Adapter Pattern

Mailien is database-agnostic through the adapter pattern.

### 5.1 Adapter Interface

```ts
interface MailienAdapter {
  // Threads
  createThread(data: CreateThreadData): Promise<Thread>
  getThread(threadId: string): Promise<ThreadWithMessages | null>
  getThreads(mailboxId: string, options?: PaginationOptions): Promise<Thread[]>
  
  // Messages
  createMessage(data: CreateMessageData): Promise<Message>
  getMessage(messageId: string): Promise<Message | null>
  getMessageByEmailId(emailMessageId: string): Promise<Message | null>
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>
  
  // Mailboxes
  getMailbox(mailboxId: string): Promise<Mailbox | null>
  createMailbox(data: CreateMailboxData): Promise<Mailbox>
}
```

### 5.2 Supported Adapters (V1)

| Adapter | Package | Database |
|---|---|---|
| Prisma | `@mailien/prisma-adapter` | PostgreSQL, MySQL, SQLite |
| Supabase | `@mailien/supabase-adapter` | PostgreSQL (via Supabase) |

### 5.3 Custom Adapter Support

Developers can create custom adapters:

```ts
const customAdapter: MailienAdapter = {
  createThread: async (data) => { /* ... */ },
  getThread: async (id) => { /* ... */ },
  // ...
}

const mailien = createMailien({
  apiKey: "re_...",
  adapter: customAdapter,
})
```

---

## 6. Webhook Integration (`@mailien/next`)

### 6.1 Webhook Handler

```ts
// app/api/webhooks/email/route.ts
import { mailienWebhookHandler } from "@mailien/next"
import { mailien } from "@/lib/mailien"

export const POST = mailienWebhookHandler(mailien)
```

### 6.2 Handled Events

| Event | Action |
|---|---|
| `email.received` | Parse, thread, store message |
| `email.delivered` | Update message status → delivered |
| `email.opened` | Update message status → opened |
| `email.bounced` | Update message status → bounced |
| `email.complained` | Update message status → complained |

### 6.3 Webhook Security

- Verify Resend webhook signatures
- Idempotent processing (dedup by `Message-ID`)
- Error handling with retry-safe responses

---

## 7. UI Components (`@mailien/ui`)

### 7.1 Design Philosophy

Inspired by **shadcn/ui**:

- Copy-paste components (via CLI)
- Fully customizable
- No forced styling — uses Tailwind
- Headless logic separated into hooks
- Accessible (ARIA compliant)

### 7.2 Component Catalog (V1)

| Component | Description |
|---|---|
| `<Inbox />` | Email list with thread previews |
| `<ThreadView />` | Conversation thread display |
| `<Composer />` | Rich email composition form |
| `<Sidebar />` | Navigation sidebar with mailbox links |
| `<MailboxSwitcher />` | Dropdown to switch between mailboxes |

### 7.3 Installation Model

```bash
npx mailien add inbox
npx mailien add composer
npx mailien add thread-view
```

Components are copied into the developer's project for full ownership.

### 7.4 React Hooks

| Hook | Purpose |
|---|---|
| `useInbox()` | Fetch and paginate inbox threads |
| `useThread()` | Fetch thread with messages |
| `useComposer()` | Manage compose form state and submission |

---

## 8. Email State Machine

Messages flow through a deterministic state machine:

```
   ┌─────────┐
   │ QUEUED  │
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │  SENT   │
   └────┬────┘
        │
   ┌────┴────────────────┐
   │                     │
   ▼                     ▼
┌──────────┐       ┌──────────┐
│DELIVERED │       │ BOUNCED  │
└────┬─────┘       └──────────┘
     │
     ▼
┌──────────┐
│  OPENED  │
└──────────┘
```

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Monorepo | pnpm workspaces + Turborepo |
| Build | tsup (for packages) |
| Framework | Next.js (demo app & @mailien/next) |
| UI | React + Tailwind CSS |
| Database | Prisma / Supabase |
| Email API | Resend |
| Testing | Vitest |
| Linting | ESLint + Prettier |
| Package Publishing | Changesets |
| Blockchain | Stellar SDK (plugin only) |

---

## 10. Plugin System (Experimental)

Mailien supports an optional **plugin system** for extending core functionality without coupling.

### 10.1 Plugin Interface

```ts
interface MailienPlugin {
  name: string
  version: string
  onSend?: (params: SendParams) => Promise<SendParams>  // Intercept outbound
  onReceive?: (message: Message) => Promise<void>        // Process inbound
  onStatusChange?: (id: string, status: MessageStatus) => Promise<void>
}
```

### 10.2 Current Plugins

| Plugin | Package | Status | Description |
|---|---|---|---|
| Stellar Payments | `@mailien/stellar` | Experimental | Payment-aware emails via Stellar blockchain |

See [Fintech Plugin Spec](FINTECH_PLUGIN.md) for full details.
