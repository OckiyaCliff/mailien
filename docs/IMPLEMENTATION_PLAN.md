# MAILIEN — Implementation Plan & Roadmap

**Version:** 1.0  
**Date:** February 12, 2026

---

## Overview

This document outlines the phased implementation plan for building Mailien from zero to a published open-source package. Each phase has clear deliverables, estimated timelines, and success criteria.

---

## Phase 1 — Foundation & Demo App (Weeks 1–3)

> **Goal:** Build a fully functional email dashboard using Resend. Not a library yet — just prove the concept works.

### 1.1 Monorepo Setup

**Deliverables:**
- Initialize pnpm workspace + Turborepo
- Configure shared TypeScript config
- Configure ESLint + Prettier
- Set up Vitest for testing
- Set up Changesets for versioning

**Key Files:**
```
mailien/
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── package.json
└── .eslintrc.js
```

### 1.2 Demo App (Next.js)

**Deliverables:**
- Next.js 14+ app with App Router
- Prisma setup with PostgreSQL
- Database schema (Mailbox, Thread, Message, Attachment)
- Resend integration for sending emails
- Webhook route for receiving emails
- Basic threading logic
- Inbox page, thread view page, compose page

**This is the "build for yourself" phase.**

### 1.3 Success Criteria

- [ ] Can send an email through the demo app
- [ ] Can receive an email via webhook
- [ ] Received emails are correctly threaded
- [ ] Inbox displays threads sorted by recency
- [ ] Thread view shows conversation in order
- [ ] Compose form sends email and creates thread

---

## Phase 2 — Extract Core Engine (Weeks 4–5)

> **Goal:** Extract the headless engine from the demo app into `@mailien/core`.

### 2.1 Core Package

**Extract into `packages/core/`:**

| Module | Source |
|---|---|
| `engine.ts` | `createMailien()` factory |
| `thread-engine.ts` | Thread creation and linking logic |
| `message-parser.ts` | Email header parsing |
| `state-manager.ts` | Message status tracking |
| `types.ts` | All shared TypeScript interfaces/types |

### 2.2 Adapter Interface

**Define `MailienAdapter` interface:**

```ts
interface MailienAdapter {
  createThread(data: CreateThreadData): Promise<Thread>
  createMessage(data: CreateMessageData): Promise<Message>
  getThread(threadId: string): Promise<ThreadWithMessages | null>
  getThreads(mailboxId: string, options?: PaginationOptions): Promise<Thread[]>
  getMessageByEmailId(emailMessageId: string): Promise<Message | null>
  updateMessageStatus(messageId: string, status: MessageStatus): Promise<void>
  getMailbox(mailboxId: string): Promise<Mailbox | null>
  createMailbox(data: CreateMailboxData): Promise<Mailbox>
}
```

### 2.3 Prisma Adapter

**Create `packages/adapters/prisma/`:**
- Implement `MailienAdapter` using Prisma Client
- Include default Prisma schema
- Migration helpers

### 2.4 Refactor Demo App

- Demo app now uses `@mailien/core` + `@mailien/prisma-adapter`
- All direct Resend/DB calls replaced with engine calls

### 2.5 Success Criteria

- [ ] Core package has zero framework dependencies
- [ ] Demo app works identically after refactor
- [ ] Adapter is cleanly swappable
- [ ] All tests pass

---

## Phase 3 — Framework Integration & UI Components (Weeks 6–8)

> **Goal:** Create the Next.js integration package and extract reusable UI components.

### 3.1 Next.js Package (`@mailien/next`)

**Deliverables:**

```ts
// One-liner webhook route
export const POST = mailienWebhookHandler(mailien)
```

- Webhook handler with signature verification
- Idempotent event processing
- Status update handlers
- Error handling with proper HTTP responses

### 3.2 UI Components (`@mailien/ui`)

**Extract from demo app:**

| Component | Description |
|---|---|
| `<Inbox />` | Thread list with previews, unread indicators |
| `<ThreadView />` | Message list within a thread |
| `<Composer />` | Rich compose form with to/cc/bcc/subject/body |
| `<Sidebar />` | Navigation with mailbox list |
| `<MailboxSwitcher />` | Dropdown for switching mailboxes |

**React Hooks:**

| Hook | Purpose |
|---|---|
| `useInbox()` | Fetch, paginate, refresh inbox |
| `useThread()` | Fetch thread data |
| `useComposer()` | Manage compose state and send |

### 3.3 CLI Tool

```bash
npx mailien add inbox
npx mailien add composer
```

- Copies component source files into developer's project
- Injects required dependencies
- shadcn-style DX

### 3.4 Success Criteria

- [ ] Webhook handler processes all Resend event types
- [ ] UI components render correctly with sample data
- [ ] Components are fully customizable via props and className
- [ ] CLI successfully copies components into a fresh project
- [ ] Hooks connect to core engine properly

---

## Phase 4 — Supabase Adapter & Polish (Weeks 9–10)

> **Goal:** Add Supabase support and polish for open-source release.

### 4.1 Supabase Adapter

**Create `packages/adapters/supabase/`:**
- Implement `MailienAdapter` using Supabase client
- Include SQL migration files
- RLS policy templates

### 4.2 Documentation

- README with quick-start guide
- API reference docs
- Architecture diagrams
- Screenshots of demo app
- Contributing guide (CONTRIBUTING.md)
- Code of conduct

### 4.3 Demo App Polish

- Responsive design
- Loading states
- Error handling
- Empty states
- Demo-ready screenshots

### 4.4 Success Criteria

- [ ] Supabase adapter passes all adapter tests
- [ ] Demo app runs with both Prisma and Supabase
- [ ] README is clear enough for 15-minute setup
- [ ] All docs are complete and accurate

---

## Phase 5 — Open Source Launch (Week 11)

> **Goal:** Publish packages and launch publicly.

### 5.1 Package Publishing

- Publish to npm:
  - `@mailien/core`
  - `@mailien/next`
  - `@mailien/ui`
  - `@mailien/prisma-adapter`
  - `@mailien/supabase-adapter`
- Semantic versioning via Changesets
- GitHub releases with changelogs

### 5.2 Launch Checklist

- [ ] All packages published to npm
- [ ] GitHub repo is public
- [ ] README has badges (npm version, license, stars)
- [ ] Demo app is deployed (Vercel)
- [ ] Demo video/GIF recorded
- [ ] Launch post written (Dev.to, Twitter/X, Reddit)
- [ ] Product Hunt listing drafted

### 5.3 Community Setup

- Issue templates
- Discussion board enabled
- Roadmap project board
- "Good first issue" labels

---

## Phase 6 — Stellar Plugin (Experimental, Post-Launch)

> **Goal:** Build the experimental `@mailien/stellar` payment plugin. Developed on a separate track — does not block V1.

### 6.1 Core Plugin

- Payment detector (parse payment instructions from email metadata)
- Wallet resolver (email → Stellar address via federation)
- Transaction builder (construct Stellar operations)
- Plugin hook integration with `@mailien/core`

### 6.2 Payment UI Components

- `<PaymentBadge />` — inline payment indicator in inbox
- `<PaymentAction />` — accept/decline payment in thread view
- `<TransactionHistory />` — transaction list component

### 6.3 Success Criteria

- [ ] Can attach XLM payment to outbound email (testnet)
- [ ] Incoming payment instructions displayed in inbox
- [ ] Accept/decline flow works end-to-end on testnet
- [ ] Zero impact on core email functionality when plugin disabled

See [Fintech Plugin Spec](FINTECH_PLUGIN.md) for full architecture.

---

## Implementation Priority Matrix

| Priority | Feature | Complexity | Value |
|---|---|---|---|
| 🔴 P0 | Core engine (send/receive) | High | Critical |
| 🔴 P0 | Thread engine | High | Core differentiator |
| 🔴 P0 | Prisma adapter | Medium | Required for V1 |
| 🔴 P0 | Webhook handler | Medium | Required for V1 |
| 🟡 P1 | Inbox UI component | Medium | High adoption driver |
| 🟡 P1 | Thread view UI | Medium | High adoption driver |
| 🟡 P1 | Composer UI | Medium | High adoption driver |
| 🟢 P2 | Supabase adapter | Medium | Broader audience |
| 🟢 P2 | CLI tool | Medium | Better DX |
| 🔵 P3 | Sidebar / MailboxSwitcher | Low | Nice to have for V1 |
| ⚪ Exp | Stellar payment plugin | High | Experimental — post-V1 |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Resend API changes | High | Pin API version, abstract behind adapter |
| Threading edge cases | Medium | Comprehensive test suite, fallback to subject matching |
| Webhook reliability | Medium | Idempotent processing, retry handling |
| Scope creep | High | Strict V1 feature freeze, reject non-V1 PRs |
| Low adoption | Medium | Focus on DX, documentation, demo quality |
| Fintech complexity | High | Keep as separate plugin, non-custodial only, testnet first |
| Regulatory exposure | High | Crypto-only, no fiat, developer-managed KYC/AML |

---

## Technical Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo tool | Turborepo + pnpm | Industry standard, fast, good DX |
| Build tool (packages) | tsup | Fast, zero-config for TS libraries |
| Test framework | Vitest | Fast, TS-native, compatible with Jest API |
| UI approach | shadcn-style copy-paste | Maximum flexibility, dev preference |
| DB approach | Adapter pattern | Database-agnostic, extensible |
| Package manager | pnpm | Strict deps, workspace support, fast |
| Versioning | Changesets | Standard for monorepo publishing |
| Fintech approach | Experimental plugin | Decoupled from core to avoid entanglement |
| Blockchain | Stellar | Low fees, fast settlement, federation protocol |
| Custody model | Non-custodial | Avoids regulatory burden, users bring wallets |
