// ──────────────────────────────────────────────
// @mailien/core — Thread Engine
// ──────────────────────────────────────────────
// Deterministic, idempotent thread resolution.
// Uses RFC 2822 headers (Message-ID, In-Reply-To,
// References) with subject-matching fallback.
// ──────────────────────────────────────────────

import type { MailienAdapter, ParsedEmail, Thread } from './types.js'

export class ThreadEngine {
    constructor(private adapter: MailienAdapter) { }

    /**
     * Find or create a thread for the given parsed email.
     *
     * Resolution order:
     * 1. Match by `In-Reply-To` header
     * 2. Match by `References` header chain
     * 3. Subject-based fallback (Re: / Fwd: stripping)
     * 4. Create new thread
     */
    async findOrCreateThread(email: ParsedEmail, mailboxId: string): Promise<Thread> {
        // 1. Try to find by In-Reply-To
        if (email.inReplyTo) {
            const existing = await this.findThreadByEmailMessageId(email.inReplyTo)
            if (existing) return existing
        }

        // 2. Try to find by References chain (walk newest → oldest)
        if (email.references && email.references.length > 0) {
            for (const ref of [...email.references].reverse()) {
                const existing = await this.findThreadByEmailMessageId(ref)
                if (existing) return existing
            }
        }

        // 3. Subject-based fallback — only for Re: / Fwd: prefixed subjects
        const normalizedSubject = this.normalizeSubject(email.subject)
        if (normalizedSubject !== email.subject) {
            // This is a reply/forward — try to match by subject
            const threads = await this.adapter.getThreads(mailboxId, { limit: 50 })
            const match = threads.data.find(
                (t) => this.normalizeSubject(t.subject) === normalizedSubject,
            )
            if (match) return match
        }

        // 4. Create a new thread
        return this.adapter.createThread({
            mailboxId,
            subject: email.subject,
        })
    }

    /**
     * Find a thread by looking up a message's emailMessageId,
     * then getting its parent thread.
     */
    private async findThreadByEmailMessageId(emailMessageId: string): Promise<Thread | null> {
        const message = await this.adapter.getMessageByEmailId(emailMessageId)
        if (!message) return null
        const thread = await this.adapter.getThread(message.threadId)
        return thread ?? null
    }

    /**
     * Strip Re:, Fwd:, Fw: prefixes and normalize whitespace.
     */
    normalizeSubject(subject: string): string {
        return subject
            .replace(/^(re|fwd?|fw)\s*:\s*/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
    }
}
