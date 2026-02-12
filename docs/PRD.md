# MAILIEN — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** February 12, 2026  
**Status:** Draft  
**License:** MIT (Open Source)

---

## 1. Product Overview

### Product Name

**Mailien**

### Tagline

> Build production-ready email systems in minutes, powered by Resend.

### Vision

To become the open infrastructure layer for building custom email dashboards, team inboxes, and communication platforms — abstracting the complexity of email systems into composable, developer-first primitives.

### Mission

Mailien enables developers to transform Resend into a fully functional email system — including inboxes, threading, and UI — with minimal setup and maximum flexibility.

### What Mailien Is

| ✅ Mailien IS | ❌ Mailien IS NOT |
|---|---|
| An email infrastructure toolkit | An email provider |
| A headless email engine + UI kit | A Gmail replacement |
| Open-source developer tooling | A marketing email tool |
| Composable primitives for building email UIs | A monolithic SaaS product |

---

## 2. Problem Statement

While Resend provides reliable email sending and receiving APIs, building a **complete email system** still requires significant engineering effort.

Developers must manually implement:

- Webhook handling and verification
- Inbound email parsing
- Threading via `Message-ID`, `In-Reply-To`, `References`
- Database modeling for messages and threads
- Email status tracking (sent → delivered → opened → bounced)
- Attachment handling
- UI development (inbox, compose, thread view)
- Pagination and performance tuning

**This leads to:**

- Repeated engineering effort across projects
- Inconsistent threading logic
- Infrastructure complexity
- Increased time to ship

> There is no open-source infrastructure layer that transforms Resend into a Gmail-like system out of the box. **Mailien solves this.**

---

## 3. Target Audience

### Primary

| Audience | Use Case |
|---|---|
| SaaS founders | Embed email into their product |
| CRM builders | Customer communication layer |
| Support desk builders | Ticket/email inbox systems |
| Indie hackers | Quick email-powered MVPs |
| Agencies | White-label email dashboards |
| Internal tool teams | Internal communication systems |

### Secondary

- Enterprises building internal inbox systems
- Dev-tool creators integrating email dashboards

---

## 4. Product Model

Mailien follows **Option 3: Headless Email Engine + UI Kit** — the highest-value model.

```
┌─────────────────────────────────────────┐
│           Developer Application          │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  @mailien/ui │  │  Custom App Code │  │
│  └──────┬──────┘  └────────┬─────────┘  │
│         │                  │            │
│  ┌──────┴──────────────────┴─────────┐  │
│  │         @mailien/core             │  │
│  │   (Headless Email Engine)         │  │
│  └──────┬───────────────┬────────────┘  │
│         │               │               │
│  ┌──────┴──────┐ ┌──────┴────────────┐  │
│  │ DB Adapter  │ │  @mailien/next    │  │
│  │ (Prisma /   │ │  (Webhook routes) │  │
│  │  Supabase)  │ │                   │  │
│  └─────────────┘ └──────┬────────────┘  │
│                         │               │
└─────────────────────────┼───────────────┘
                          │
                   ┌──────┴──────┐
                   │  Resend API  │
                   └─────────────┘
```

Developers can use:

- **Backend only** — headless engine for custom UIs
- **UI only** — pre-built components with their own backend
- **Both** — full-stack email system out of the box

---

## 5. V1 Feature Scope

> **Principle:** Be ruthless. Ship a sharp MVP. No feature creep.

### ✅ V1 Includes

| Feature | Description |
|---|---|
| **Send email** | Via Resend API through Mailien engine |
| **Receive email** | Via webhook handler |
| **Thread engine** | Automatic threading via email headers |
| **Message persistence** | Store messages through DB adapter |
| **Inbox UI** | Composable inbox component |
| **Compose UI** | Email composition component |
| **Thread view UI** | Conversation thread display |
| **Webhook handler** | Framework-ready webhook route |
| **Status tracking** | sent → delivered → opened → bounced |

### ❌ V1 Does NOT Include

- AI features
- Analytics dashboard
- Spam filters
- Labels/tags
- Team/multi-user support
- Full-text search
- Bulk actions
- Fintech/payments (developed as separate experimental plugin)

---

## 6. V2+ Expansion Targets

These are **planned expansions**, not "nice-to-haves."

### V2 — Advanced Inbox
- Full-text search
- Labels & tagging
- Filters (unread, starred, etc.)
- Bulk actions

### V3 — Multi-Mailbox & Teams
- Multiple mailboxes per project
- Role-based permissions
- Organization support
- Shared inboxes

### V4 — Analytics
- Open rates & reply rates
- Bounce tracking
- Response time metrics
- Dashboard widgets

### V5 — AI Layer
- Smart categorization
- Suggested replies
- Spam scoring
- Auto-routing

### Experimental — Fintech Plugin (`@mailien/stellar`)
- Payment-aware emails (money as attachment)
- Stellar blockchain settlement
- Non-custodial wallet mapping (email → Stellar address)
- Payment request/send flows
- Transaction UI components
- See [Fintech Plugin Spec](FINTECH_PLUGIN.md) for details

### Future — SaaS Layer (Optional)
- Hosted Mailien
- Managed threading engine
- Enterprise add-ons

---

## 7. Developer Setup Flow (Target DX)

```
1. npm install @mailien/core @mailien/next @mailien/prisma-adapter
2. Add RESEND_API_KEY to .env
3. Add webhook route (one-liner)
4. Run DB migration (npx prisma migrate)
5. Render <Inbox /> component
```

> **Goal:** Working inbox in under 15 minutes.

---

## 8. Security Requirements

| Requirement | Details |
|---|---|
| Webhook verification | Verify Resend webhook signatures |
| API key protection | Never expose keys client-side |
| Content sanitization | Sanitize all inbound HTML content |
| Attachment validation | Validate file types and sizes |
| Idempotency | Protect against duplicate webhook events |

---

## 9. Performance Requirements

| Metric | Target |
|---|---|
| Webhook response time | < 500ms |
| Thread pagination | Cursor-based, efficient |
| Message loading | Lazy-loaded, virtualized |
| DB queries | Properly indexed |
| UI updates | Optimistic rendering |

---

## 10. Open Source Strategy

### License
MIT

### Repository Must Include
- Clear README with quick-start guide
- Architecture diagrams
- Working example app
- Demo screenshots/recordings
- Contributing guide
- Public roadmap

### Community Strategy
- Encourage community adapters (Drizzle, MongoDB, etc.)
- Encourage UI themes and variants
- Encourage framework integrations (Remix, SvelteKit, etc.)

### Future Monetization (Open Core Model)
| Free (OSS) | Paid (Enterprise) |
|---|---|
| Core engine | Advanced analytics |
| Basic UI components | Multi-tenant org management |
| Prisma/Supabase adapters | Enterprise RBAC |
| Webhook handler | AI automation |
| Threading engine | Hosted dashboard |
| Stellar plugin (experimental) | Managed payment processing |

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| GitHub stars | 1,000+ |
| Projects using Mailien | 100+ |
| Contributors | 10+ |
| Community adapters | 3+ |
| Avg setup time | < 15 minutes |

---

## 12. Long-Term Vision

Mailien evolves into a **composable communication + value infrastructure layer.**

```
Email (V1) → Payments (Plugin) → SMS → Push → In-app Messaging → AI Automation
```

Email remains the foundation. Payments (via Stellar) extend emails into value-aware communication. Each capability is additive and opt-in.

---

## 13. Positioning Statement

> **Mailien** is the infrastructure layer that turns Resend into a full email system. The fastest way to build a production-ready email dashboard powered by Resend.
