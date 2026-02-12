# MAILIEN — Data Model Specification

**Version:** 1.0  
**Date:** February 12, 2026

---

## 1. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Mailbox    │──1:N──│   Thread     │──1:N──│   Message    │
└──────────────┘       └──────────────┘       └──────┬───────┘
                                                     │
                                               ┌─────┴──────┐
                                               │ Attachment  │
                                               └─────────────┘
```

---

## 2. Models

### 2.1 Mailbox

Represents an email address/identity managed by Mailien.

| Field | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `name` | `String` | Display name (e.g., "Support") |
| `email` | `String` (unique) | Email address (e.g., support@company.com) |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

### 2.2 Thread

Groups related messages into a conversation.

| Field | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `mailboxId` | `String` (FK) | Reference to Mailbox |
| `subject` | `String` | Thread subject (from first message) |
| `lastMessageAt` | `DateTime` | Timestamp of most recent message |
| `messageCount` | `Int` | Number of messages in thread |
| `isRead` | `Boolean` | Whether thread has been read |
| `createdAt` | `DateTime` | Creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

**Indexes:** `mailboxId`, `lastMessageAt` (for sorted inbox), `subject`

### 2.3 Message

An individual email message within a thread.

| Field | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `threadId` | `String` (FK) | Reference to Thread |
| `emailMessageId` | `String` (unique) | RFC 2822 `Message-ID` header |
| `inReplyTo` | `String?` | `In-Reply-To` header value |
| `references` | `String[]` | `References` header values |
| `from` | `String` | Sender email address |
| `fromName` | `String?` | Sender display name |
| `to` | `String[]` | Recipient(s) |
| `cc` | `String[]` | CC recipient(s) |
| `bcc` | `String[]` | BCC recipient(s) |
| `subject` | `String` | Message subject |
| `bodyHtml` | `String?` | HTML body content |
| `bodyText` | `String?` | Plain text body content |
| `status` | `MessageStatus` | Current delivery status |
| `direction` | `MessageDirection` | inbound or outbound |
| `sentAt` | `DateTime?` | When the message was sent |
| `receivedAt` | `DateTime?` | When the message was received |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

**Indexes:** `threadId`, `emailMessageId` (unique), `status`

### 2.4 Attachment

Metadata for email attachments.

| Field | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `messageId` | `String` (FK) | Reference to Message |
| `filename` | `String` | Original filename |
| `contentType` | `String` | MIME type |
| `size` | `Int` | File size in bytes |
| `url` | `String?` | Storage URL |
| `createdAt` | `DateTime` | Creation timestamp |

**Indexes:** `messageId`

---

## 3. Enums

### MessageStatus

```ts
enum MessageStatus {
  QUEUED    = "queued"
  SENT      = "sent"
  DELIVERED = "delivered"
  OPENED    = "opened"
  BOUNCED   = "bounced"
  FAILED    = "failed"
  COMPLAINED = "complained"
}
```

### MessageDirection

```ts
enum MessageDirection {
  INBOUND  = "inbound"
  OUTBOUND = "outbound"
}
```

---

## 4. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Mailbox {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  threads   Thread[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("mailboxes")
}

model Thread {
  id            String    @id @default(cuid())
  mailboxId     String
  mailbox       Mailbox   @relation(fields: [mailboxId], references: [id])
  subject       String
  lastMessageAt DateTime  @default(now())
  messageCount  Int       @default(0)
  isRead        Boolean   @default(false)
  messages      Message[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([mailboxId])
  @@index([lastMessageAt])
  @@map("threads")
}

model Message {
  id             String           @id @default(cuid())
  threadId       String
  thread         Thread           @relation(fields: [threadId], references: [id])
  emailMessageId String           @unique
  inReplyTo      String?
  references     String[]
  from           String
  fromName       String?
  to             String[]
  cc             String[]
  bcc            String[]
  subject        String
  bodyHtml       String?
  bodyText       String?
  status         MessageStatus    @default(QUEUED)
  direction      MessageDirection
  attachments    Attachment[]
  sentAt         DateTime?
  receivedAt     DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([threadId])
  @@index([emailMessageId])
  @@index([status])
  @@map("messages")
}

model Attachment {
  id          String   @id @default(cuid())
  messageId   String
  message     Message  @relation(fields: [messageId], references: [id])
  filename    String
  contentType String
  size        Int
  url         String?
  createdAt   DateTime @default(now())

  @@index([messageId])
  @@map("attachments")
}

enum MessageStatus {
  QUEUED
  SENT
  DELIVERED
  OPENED
  BOUNCED
  FAILED
  COMPLAINED
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}
```

---

## 5. Query Patterns

### Get Inbox (Threads sorted by recency)

```sql
SELECT * FROM threads
WHERE mailbox_id = $1
ORDER BY last_message_at DESC
LIMIT $2 OFFSET $3
```

### Get Thread with Messages

```sql
SELECT t.*, m.*
FROM threads t
LEFT JOIN messages m ON m.thread_id = t.id
WHERE t.id = $1
ORDER BY m.created_at ASC
```

### Find Thread by Message-ID Reference

```sql
SELECT t.*
FROM threads t
JOIN messages m ON m.thread_id = t.id
WHERE m.email_message_id = ANY($1)
LIMIT 1
```

### Update Message Status

```sql
UPDATE messages
SET status = $2, updated_at = NOW()
WHERE email_message_id = $1
```

---

## 6. Supabase Schema (Equivalent)

For Supabase adapter, the same schema translates to SQL migrations:

```sql
-- Enums
CREATE TYPE message_status AS ENUM (
  'queued', 'sent', 'delivered', 'opened', 
  'bounced', 'failed', 'complained'
);

CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

-- Tables
CREATE TABLE mailboxes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE threads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mailbox_id TEXT REFERENCES mailboxes(id) NOT NULL,
  subject TEXT NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INT DEFAULT 0,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT REFERENCES threads(id) NOT NULL,
  email_message_id TEXT UNIQUE NOT NULL,
  in_reply_to TEXT,
  "references" TEXT[],
  "from" TEXT NOT NULL,
  from_name TEXT,
  "to" TEXT[] NOT NULL,
  cc TEXT[],
  bcc TEXT[],
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status message_status DEFAULT 'queued',
  direction message_direction NOT NULL,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT REFERENCES messages(id) NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_threads_mailbox ON threads(mailbox_id);
CREATE INDEX idx_threads_last_message ON threads(last_message_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_attachments_message ON attachments(message_id);
```
