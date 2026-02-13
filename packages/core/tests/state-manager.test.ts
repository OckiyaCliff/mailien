// ──────────────────────────────────────────────
// @mailien/core — State Manager Tests
// ──────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StateManager } from '../src/state-manager'
import { MessageDirection, MessageStatus } from '../src/types'
import type { MailienAdapter, Message } from '../src/types'

// ─── Helper ──────────────────────────────────

function createMessage(overrides: Partial<Message> = {}): Message {
    return {
        id: 'msg-1',
        threadId: 'thread-1',
        emailMessageId: '<msg-1@test>',
        from: 'alice@test.com',
        to: ['bob@test.com'],
        subject: 'Test',
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.QUEUED,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }
}

function createMockAdapter(message: Message | null = null): MailienAdapter {
    return {
        createThread: vi.fn(),
        getThread: vi.fn(),
        getThreads: vi.fn(),
        updateThread: vi.fn(),
        createMessage: vi.fn(),
        getMessage: vi.fn(async () => message),
        getMessageByEmailId: vi.fn(),
        updateMessageStatus: vi.fn(async () => { }),
        getMailbox: vi.fn(),
        getMailboxByEmail: vi.fn(),
        createMailbox: vi.fn(),
    }
}

describe('StateManager', () => {
    describe('transition', () => {
        it('should transition queued → sent', async () => {
            const msg = createMessage({ status: MessageStatus.QUEUED })
            const adapter = createMockAdapter(msg)
            const manager = new StateManager(adapter)

            const result = await manager.transition('msg-1', MessageStatus.SENT)

            expect(result).toBe(true)
            expect(adapter.updateMessageStatus).toHaveBeenCalledWith('msg-1', MessageStatus.SENT)
        })

        it('should transition sent → delivered', async () => {
            const msg = createMessage({ status: MessageStatus.SENT })
            const adapter = createMockAdapter(msg)
            const manager = new StateManager(adapter)

            const result = await manager.transition('msg-1', MessageStatus.DELIVERED)

            expect(result).toBe(true)
            expect(adapter.updateMessageStatus).toHaveBeenCalledWith('msg-1', MessageStatus.DELIVERED)
        })

        it('should transition delivered → opened', async () => {
            const msg = createMessage({ status: MessageStatus.DELIVERED })
            const adapter = createMockAdapter(msg)
            const manager = new StateManager(adapter)

            const result = await manager.transition('msg-1', MessageStatus.OPENED)

            expect(result).toBe(true)
        })

        it('should reject invalid transition queued → delivered', async () => {
            const msg = createMessage({ status: MessageStatus.QUEUED })
            const adapter = createMockAdapter(msg)
            const manager = new StateManager(adapter)

            const result = await manager.transition('msg-1', MessageStatus.DELIVERED)

            expect(result).toBe(false)
            expect(adapter.updateMessageStatus).not.toHaveBeenCalled()
        })

        it('should reject transition from terminal state', async () => {
            const msg = createMessage({ status: MessageStatus.BOUNCED })
            const adapter = createMockAdapter(msg)
            const manager = new StateManager(adapter)

            const result = await manager.transition('msg-1', MessageStatus.DELIVERED)

            expect(result).toBe(false)
        })

        it('should return false for non-existent message', async () => {
            const adapter = createMockAdapter(null)
            const manager = new StateManager(adapter)

            const result = await manager.transition('non-existent', MessageStatus.SENT)

            expect(result).toBe(false)
        })

        it('should fire onStatusChange hook on valid transition', async () => {
            const msg = createMessage({ status: MessageStatus.QUEUED })
            const adapter = createMockAdapter(msg)
            const hook = vi.fn()
            const manager = new StateManager(adapter, { onStatusChange: hook })

            await manager.transition('msg-1', MessageStatus.SENT)

            expect(hook).toHaveBeenCalledWith('msg-1', MessageStatus.SENT)
        })

        it('should fire plugin onStatusChange on valid transition', async () => {
            const msg = createMessage({ status: MessageStatus.QUEUED })
            const adapter = createMockAdapter(msg)
            const pluginHook = vi.fn()
            const manager = new StateManager(adapter, undefined, [
                { name: 'test-plugin', version: '1.0.0', onStatusChange: pluginHook },
            ])

            await manager.transition('msg-1', MessageStatus.SENT)

            expect(pluginHook).toHaveBeenCalledWith('msg-1', MessageStatus.SENT)
        })
    })

    describe('isValidTransition', () => {
        const adapter = createMockAdapter()
        const manager = new StateManager(adapter)

        it('should validate queued → sent', () => {
            expect(manager.isValidTransition(MessageStatus.QUEUED, MessageStatus.SENT)).toBe(true)
        })

        it('should validate queued → failed', () => {
            expect(manager.isValidTransition(MessageStatus.QUEUED, MessageStatus.FAILED)).toBe(true)
        })

        it('should reject sent → queued (backward)', () => {
            expect(manager.isValidTransition(MessageStatus.SENT, MessageStatus.QUEUED)).toBe(false)
        })

        it('should reject opened → anything (terminal)', () => {
            expect(manager.isValidTransition(MessageStatus.OPENED, MessageStatus.DELIVERED)).toBe(false)
        })
    })

    describe('eventToStatus', () => {
        it('should map email.sent to SENT', () => {
            expect(StateManager.eventToStatus('email.sent')).toBe(MessageStatus.SENT)
        })

        it('should map email.delivered to DELIVERED', () => {
            expect(StateManager.eventToStatus('email.delivered')).toBe(MessageStatus.DELIVERED)
        })

        it('should map email.bounced to BOUNCED', () => {
            expect(StateManager.eventToStatus('email.bounced')).toBe(MessageStatus.BOUNCED)
        })

        it('should return null for unknown events', () => {
            expect(StateManager.eventToStatus('email.unknown')).toBeNull()
        })
    })
})
