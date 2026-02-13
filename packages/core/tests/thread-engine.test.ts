// ──────────────────────────────────────────────
// @mailien/core — Thread Engine Tests
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThreadEngine } from '../src/thread-engine'
import type { MailienAdapter, Thread, Message, ParsedEmail } from '../src/types'
import { MessageDirection, MessageStatus } from '../src/types'

// ─── Mock Adapter ────────────────────────────

function createMockAdapter(): MailienAdapter {
    return {
        createThread: vi.fn(async (data) => ({
            id: 'thread-new',
            mailboxId: data.mailboxId,
            subject: data.subject,
            lastMessageAt: new Date(),
            messageCount: 0,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        })),
        getThread: vi.fn(async () => null),
        getThreads: vi.fn(async () => ({ data: [], hasMore: false })),
        updateThread: vi.fn(async (id, data) => ({
            id,
            mailboxId: 'mbx-1',
            subject: 'Test',
            lastMessageAt: new Date(),
            messageCount: 1,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        })),
        createMessage: vi.fn(async () => ({} as Message)),
        getMessage: vi.fn(async () => null),
        getMessageByEmailId: vi.fn(async () => null),
        updateMessageStatus: vi.fn(async () => { }),
        getMailbox: vi.fn(async () => null),
        getMailboxByEmail: vi.fn(async () => null),
        createMailbox: vi.fn(async () => ({
            id: 'mbx-1',
            email: 'test@example.com',
            name: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
        })),
    }
}

// ─── Tests ───────────────────────────────────

describe('ThreadEngine', () => {
    let adapter: MailienAdapter
    let engine: ThreadEngine

    beforeEach(() => {
        adapter = createMockAdapter()
        engine = new ThreadEngine(adapter)
    })

    describe('findOrCreateThread', () => {
        it('should create a new thread for a fresh email', async () => {
            const email: ParsedEmail = {
                messageId: '<msg-1@example.com>',
                from: 'alice@example.com',
                to: ['bob@example.com'],
                subject: 'Hello World',
            }

            const thread = await engine.findOrCreateThread(email, 'mbx-1')

            expect(thread.id).toBe('thread-new')
            expect(adapter.createThread).toHaveBeenCalledWith({
                mailboxId: 'mbx-1',
                subject: 'Hello World',
            })
        })

        it('should find an existing thread via In-Reply-To', async () => {
            const existingThread: Thread = {
                id: 'thread-existing',
                mailboxId: 'mbx-1',
                subject: 'Hello World',
                lastMessageAt: new Date(),
                messageCount: 1,
                isRead: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            // When looking up the In-Reply-To message, return a message in the existing thread
            vi.mocked(adapter.getMessageByEmailId).mockResolvedValueOnce({
                id: 'msg-original',
                threadId: 'thread-existing',
                emailMessageId: '<msg-1@example.com>',
                from: 'alice@example.com',
                to: ['bob@example.com'],
                subject: 'Hello World',
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.SENT,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            vi.mocked(adapter.getThread).mockResolvedValueOnce({
                ...existingThread,
                messages: [],
            })

            const email: ParsedEmail = {
                messageId: '<msg-2@example.com>',
                from: 'bob@example.com',
                to: ['alice@example.com'],
                subject: 'Re: Hello World',
                inReplyTo: '<msg-1@example.com>',
            }

            const thread = await engine.findOrCreateThread(email, 'mbx-1')

            expect(thread.id).toBe('thread-existing')
            expect(adapter.createThread).not.toHaveBeenCalled()
        })

        it('should find an existing thread via References chain', async () => {
            const existingThread: Thread = {
                id: 'thread-ref',
                mailboxId: 'mbx-1',
                subject: 'Discussion',
                lastMessageAt: new Date(),
                messageCount: 3,
                isRead: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            // In-Reply-To doesn't match anything
            vi.mocked(adapter.getMessageByEmailId)
                .mockResolvedValueOnce(null) // In-Reply-To miss
                .mockResolvedValueOnce(null) // First ref miss
                .mockResolvedValueOnce({
                    // Second ref hits
                    id: 'msg-root',
                    threadId: 'thread-ref',
                    emailMessageId: '<msg-root@example.com>',
                    from: 'alice@example.com',
                    to: ['bob@example.com'],
                    subject: 'Discussion',
                    direction: MessageDirection.OUTBOUND,
                    status: MessageStatus.DELIVERED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })

            vi.mocked(adapter.getThread).mockResolvedValueOnce({
                ...existingThread,
                messages: [],
            })

            const email: ParsedEmail = {
                messageId: '<msg-4@example.com>',
                from: 'charlie@example.com',
                to: ['alice@example.com'],
                subject: 'Re: Re: Discussion',
                inReplyTo: '<msg-3@example.com>',
                references: ['<msg-root@example.com>', '<msg-2@example.com>'],
            }

            const thread = await engine.findOrCreateThread(email, 'mbx-1')

            expect(thread.id).toBe('thread-ref')
        })

        it('should fall back to subject matching for replies', async () => {
            const existingThread: Thread = {
                id: 'thread-subj',
                mailboxId: 'mbx-1',
                subject: 'Weekly Standup',
                lastMessageAt: new Date(),
                messageCount: 1,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            vi.mocked(adapter.getThreads).mockResolvedValueOnce({
                data: [existingThread],
                hasMore: false,
            })

            const email: ParsedEmail = {
                messageId: '<msg-5@example.com>',
                from: 'alice@example.com',
                to: ['team@example.com'],
                subject: 'Re: Weekly Standup',
                // No In-Reply-To or References
            }

            const thread = await engine.findOrCreateThread(email, 'mbx-1')

            expect(thread.id).toBe('thread-subj')
        })
    })

    describe('normalizeSubject', () => {
        it('should strip Re: prefix', () => {
            expect(engine.normalizeSubject('Re: Hello')).toBe('Hello')
        })

        it('should strip Fwd: prefix', () => {
            expect(engine.normalizeSubject('Fwd: Hello')).toBe('Hello')
        })

        it('should strip Fw: prefix', () => {
            expect(engine.normalizeSubject('Fw: Hello')).toBe('Hello')
        })

        it('should handle multiple prefixes', () => {
            expect(engine.normalizeSubject('Re: Re: Hello')).toBe('Re: Hello')
        })

        it('should normalize whitespace', () => {
            expect(engine.normalizeSubject('Re:   Hello   World')).toBe('Hello World')
        })

        it('should leave clean subjects unchanged', () => {
            expect(engine.normalizeSubject('Hello World')).toBe('Hello World')
        })

        it('should be case-insensitive', () => {
            expect(engine.normalizeSubject('RE: Hello')).toBe('Hello')
            expect(engine.normalizeSubject('re: Hello')).toBe('Hello')
        })
    })
})
