# 🚀 Getting Started with Mailien

Get a fully working email inbox in your Next.js app in under 15 minutes.

---

## Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- A [Resend](https://resend.com) account with an API key

---

## 1. Install Packages

```bash
# Core engine + your preferred adapter + Next.js integration
pnpm add @mailien/core @mailien/prisma-adapter @mailien/next @mailien/ui
```

**Using Supabase instead?**
```bash
pnpm add @mailien/core @mailien/supabase-adapter @mailien/next @mailien/ui
```

---

## 2. Database Setup

### Option A: Prisma

Create a `prisma/schema.prisma` using the schema from `@mailien/prisma-adapter`:

```bash
# Copy the schema
cp node_modules/@mailien/prisma-adapter/prisma/schema.prisma prisma/

# Generate client and push schema
npx prisma generate
npx prisma db push
```

### Option B: Supabase

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy the contents of:
-- node_modules/@mailien/supabase-adapter/sql/schema.sql
```

This creates all tables, indexes, RLS policies, and triggers.

---

## 3. Create the Engine

```ts
// lib/mailien.ts
import { createMailien } from '@mailien/core'
import { prismaAdapter } from '@mailien/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: prismaAdapter(prisma),
  defaultFrom: 'hi@yourapp.com',
})
```

**For Supabase:**
```ts
import { createClient } from '@supabase/supabase-js'
import { supabaseAdapter } from '@mailien/supabase-adapter'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const mailien = createMailien({
  apiKey: process.env.RESEND_API_KEY!,
  adapter: supabaseAdapter(supabase),
})
```

---

## 4. Set Up the Webhook

```ts
// app/api/webhook/route.ts
import { createWebhookHandler } from '@mailien/next'
import { mailien } from '@/lib/mailien'

export const POST = createWebhookHandler(mailien)
```

Then configure the webhook URL in your [Resend dashboard](https://resend.com/webhooks):
```
https://yourapp.com/api/webhook
```

---

## 5. Build the Inbox UI

```tsx
// app/page.tsx
'use client'

import { useInbox, useThread, InboxList, ThreadView, Composer } from '@mailien/ui'
import { useState } from 'react'

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const inbox = useInbox('your-mailbox-id', async (mailboxId, opts) => {
    const res = await fetch(`/api/threads?mailboxId=${mailboxId}`)
    return res.json()
  })

  const thread = useThread(selectedId, async (id) => {
    const res = await fetch(`/api/threads/${id}`)
    return res.json()
  })

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <InboxList
        threads={inbox.threads}
        isLoading={inbox.isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      {selectedId && (
        <ThreadView
          thread={thread.thread}
          isLoading={thread.isLoading}
        />
      )}
    </div>
  )
}
```

---

## 6. Send Your First Email

```ts
await mailien.send({
  to: 'user@example.com',
  subject: 'Welcome to our platform!',
  html: '<h1>Welcome!</h1><p>Thanks for signing up.</p>',
})
```

---

## Environment Variables

| Variable | Required | Description |
|:---------|:---------|:------------|
| `RESEND_API_KEY` | ✅ | From [resend.com/api-keys](https://resend.com/api-keys) |
| `DATABASE_URL` | ✅ (Prisma) | Your database connection string |
| `SUPABASE_URL` | ✅ (Supabase) | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ (Supabase) | Your Supabase service role key |

---

## Next Steps

- Read the [API Reference](./API_REFERENCE.md) for all available methods
- Explore the [Architecture](./ARCHITECTURE.md) to understand threading logic
- Check out the [Demo App](../apps/demo) for a complete working example
