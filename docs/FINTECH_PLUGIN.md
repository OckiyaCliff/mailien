# MAILIEN — Fintech Plugin Specification

## `@mailien/stellar` — Experimental Payment Layer

**Version:** 0.1 (Experimental)  
**Date:** February 12, 2026  
**Status:** Brainstorm / Pre-development

> ⚠️ **This is an experimental plugin.** It is intentionally decoupled from Mailien core to avoid entangling email infrastructure with fintech complexity.

---

## 1. Vision

> Merge communication and value transfer into one developer primitive.

Emails already carry identity. Stellar carries value. Mailien Stellar bridges both — enabling developers to build **payment-aware email systems** where money flows as naturally as attachments.

```
Traditional:    Email → Message only
Mailien Stellar: Email → Message + Value
```

---

## 2. Strategic Positioning

| Layer | Product | Status |
|---|---|---|
| Layer 1 | `@mailien/core` — Email engine | Core (V1) |
| Layer 2 | `@mailien/stellar` — Payment plugin | Experimental |
| Layer 3 | Mailien Finance — Hosted fintech product | Long-term vision |

The plugin is **additive**. Mailien core works perfectly without it. Developers opt in.

---

## 3. Core Concept

### Money as an Attachment Type

```
Email Message
    ├── Body (text/html)
    ├── Attachments (files)
    └── Payment Instruction (value)
```

An email can carry a **payment instruction** — an embedded Stellar transaction directive:

```json
{
  "payment": {
    "type": "send",
    "amount": "50.00",
    "asset": "USDC",
    "network": "stellar",
    "memo": "Invoice #1042"
  }
}
```

When the inbox renders this message, it displays:

> 📧 "Here's the payment for last week's work"  
> 💰 **$50.00 USDC attached**  
> [Accept] [Decline]

---

## 4. Design Principles

| Principle | Detail |
|---|---|
| **Non-custodial** | Mailien never holds funds. Users bring their own Stellar wallets. |
| **Opt-in only** | Plugin is entirely optional. Zero impact on core email functionality. |
| **Developer-managed** | Developers control wallet integration, KYC, and compliance for their use case. |
| **Crypto-only (V1)** | No fiat on/off ramps. Avoids money transmitter regulations. |
| **Transparent** | All transactions are on-chain and verifiable. |

---

## 5. Identity Mapping

### Email Address → Stellar Wallet

```
user@company.com  →  GA7Q...XYZ (Stellar public key)
```

The mapping is stored by the developer's application (not by Mailien):

```ts
interface WalletMapping {
  email: string
  stellarPublicKey: string
  createdAt: Date
}
```

Mailien provides helpers for resolving email-to-wallet, but **never stores private keys**.

### Federation Support

Leverage Stellar's existing [federation protocol](https://developers.stellar.org/docs/learn/encyclopedia/network-configuration/federation):

```
alice@company.com → alice*company.com → GA7Q...XYZ
```

This makes email addresses directly resolvable to Stellar addresses.

---

## 6. Use Cases

| Use Case | Description |
|---|---|
| **Freelance payments** | Client sends payment email → freelancer receives USDC |
| **Invoice settlement** | "Pay this invoice" button inside email thread |
| **Cross-border transfers** | Send money globally via email, settled on Stellar |
| **B2B payments** | Business mailbox with embedded payment workflows |
| **Payment requests** | "Request $100" email → recipient clicks Pay |
| **Escrow** | Payment held until conditions met (future) |
| **AI agent payments** | Autonomous agents transacting via email (future) |

---

## 7. Architecture

```
┌──────────────────────────────────────────────┐
│              Developer Application            │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │          @mailien/core               │    │
│  │     (Email Engine — unchanged)       │    │
│  └──────────────┬───────────────────────┘    │
│                 │                            │
│  ┌──────────────┴───────────────────────┐    │
│  │        @mailien/stellar              │    │
│  │                                      │    │
│  │  ┌────────────┐ ┌─────────────────┐  │    │
│  │  │ Payment    │ │ Wallet          │  │    │
│  │  │ Detector   │ │ Resolver        │  │    │
│  │  └────────────┘ └─────────────────┘  │    │
│  │  ┌────────────┐ ┌─────────────────┐  │    │
│  │  │ Transaction│ │ Payment UI      │  │    │
│  │  │ Builder    │ │ Components      │  │    │
│  │  └────────────┘ └─────────────────┘  │    │
│  └──────────────┬───────────────────────┘    │
│                 │                            │
└─────────────────┼────────────────────────────┘
                  │
           ┌──────┴──────┐
           │   Stellar   │
           │   Network   │
           └─────────────┘
```

### Internal Modules

| Module | Responsibility |
|---|---|
| `payment-detector.ts` | Detect payment instructions in email metadata |
| `wallet-resolver.ts` | Resolve email → Stellar wallet via federation or DB |
| `transaction-builder.ts` | Construct Stellar transactions |
| `payment-types.ts` | TypeScript types for payment primitives |

---

## 8. Developer API

### 8.1 Plugin Registration

```ts
import { createMailien } from "@mailien/core"
import { stellarPlugin } from "@mailien/stellar"

const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: prismaAdapter(prisma),
  plugins: [
    stellarPlugin({
      network: "testnet",  // "mainnet" | "testnet"
      horizonUrl: "https://horizon-testnet.stellar.org",
      walletResolver: async (email) => {
        // Developer implements wallet lookup
        return db.wallets.findByEmail(email)
      },
    }),
  ],
})
```

### 8.2 Send Email with Payment

```ts
await mailien.send({
  to: "freelancer@example.com",
  subject: "Payment for design work",
  html: "<p>Here's your payment!</p>",
  payment: {
    amount: "50.00",
    asset: "USDC",
    memo: "Invoice #1042",
  },
})
```

### 8.3 Request Payment via Email

```ts
await mailien.send({
  to: "client@example.com",
  subject: "Invoice #1042",
  html: "<p>Please pay the attached invoice.</p>",
  paymentRequest: {
    amount: "500.00",
    asset: "USDC",
    dueDate: "2026-03-01",
    memo: "Q1 Consulting",
  },
})
```

### 8.4 Payment Event Hooks

```ts
stellarPlugin({
  onPaymentSent: async (tx) => {
    console.log(`Sent ${tx.amount} ${tx.asset} to ${tx.to}`)
  },
  onPaymentReceived: async (tx) => {
    console.log(`Received ${tx.amount} ${tx.asset} from ${tx.from}`)
  },
  onPaymentFailed: async (error) => {
    console.log(`Payment failed: ${error.message}`)
  },
})
```

---

## 9. UI Components

### Payment Badge (in Inbox)

```tsx
import { PaymentBadge } from "@mailien/stellar/ui"

// Renders: 💰 $50.00 USDC
<PaymentBadge amount="50.00" asset="USDC" status="pending" />
```

### Payment Action (in Thread View)

```tsx
import { PaymentAction } from "@mailien/stellar/ui"

// Renders: [Accept $50.00] [Decline]
<PaymentAction
  payment={message.payment}
  onAccept={async () => { /* sign & submit tx */ }}
  onDecline={async () => { /* reject */ }}
/>
```

### Transaction History

```tsx
import { TransactionHistory } from "@mailien/stellar/ui"

<TransactionHistory mailboxId="mbx_support" limit={20} />
```

---

## 10. Data Model Extension

### PaymentInstruction (embedded in Message)

| Field | Type | Description |
|---|---|---|
| `id` | `String` | Primary key |
| `messageId` | `String` (FK) | Parent message |
| `type` | `"send" \| "request"` | Payment or request |
| `amount` | `String` | Amount (decimal string) |
| `asset` | `String` | Asset code (USDC, XLM, etc.) |
| `fromWallet` | `String?` | Sender Stellar address |
| `toWallet` | `String?` | Recipient Stellar address |
| `stellarTxHash` | `String?` | On-chain transaction hash |
| `status` | `PaymentStatus` | Current status |
| `memo` | `String?` | Payment memo |
| `createdAt` | `DateTime` | Timestamp |

### PaymentStatus Enum

```ts
enum PaymentStatus {
  PENDING    = "pending"     // Instruction created, not yet executed
  SUBMITTED  = "submitted"   // Transaction submitted to Stellar
  CONFIRMED  = "confirmed"   // Transaction confirmed on-chain
  FAILED     = "failed"      // Transaction failed
  DECLINED   = "declined"    // Recipient declined payment request
  EXPIRED    = "expired"     // Payment request expired
}
```

---

## 11. Security & Compliance

| Concern | Approach |
|---|---|
| **Custody** | Non-custodial. Mailien never holds private keys. |
| **KYC/AML** | Developer's responsibility for their jurisdiction. |
| **Transaction signing** | Client-side only. Private keys never touch the server. |
| **Amount validation** | Validate amounts before transaction construction. |
| **Replay protection** | Stellar sequence numbers prevent replay attacks. |
| **Testnet first** | Default to testnet. Mainnet requires explicit opt-in. |

> [!CAUTION]
> Developers using `@mailien/stellar` in production with real assets must ensure compliance with financial regulations in their jurisdiction. Mailien provides tools, not legal compliance.

---

## 12. Roadmap

| Phase | Milestone | Scope |
|---|---|---|
| **Alpha** | Basic send/receive | XLM transfers, testnet only |
| **Beta** | Asset support | USDC, custom assets, payment requests |
| **RC** | UI components | PaymentBadge, PaymentAction, TransactionHistory |
| **1.0** | Production ready | Mainnet support, federation, documentation |
| **Future** | Advanced features | Escrow, multi-sig, recurring payments |

> [!IMPORTANT]
> The fintech plugin does **not** block Mailien core V1. It is developed on a separate track, after core email functionality is stable.

---

## 13. Competitive Differentiation

| Existing Solution | Limitation |
|---|---|
| PayPal "Send Money" | Centralized, not programmable |
| Stripe invoicing | Not email-native, requires separate integration |
| Crypto wallets | No communication layer |
| Mailien Stellar | Email + payments in one composable primitive |

The unique insight: **email is already universal identity infrastructure.** Adding programmable money to it creates a new category.
