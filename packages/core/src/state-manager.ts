// ──────────────────────────────────────────────
// @mailien/core — State Manager
// ──────────────────────────────────────────────
// Manages deterministic message status transitions
// and emits status change events via hooks/plugins.
// ──────────────────────────────────────────────

import type { MailienAdapter, MailienHooks, MailienPlugin } from './types.js'
import { MessageStatus } from './types.js'

/** Valid forward transitions in the message state machine. */
const STATE_TRANSITIONS: Record<string, MessageStatus[]> = {
    [MessageStatus.QUEUED]: [MessageStatus.SENT, MessageStatus.FAILED],
    [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.BOUNCED],
    [MessageStatus.DELIVERED]: [MessageStatus.OPENED, MessageStatus.COMPLAINED],
    [MessageStatus.OPENED]: [],
    [MessageStatus.BOUNCED]: [],
    [MessageStatus.COMPLAINED]: [],
    [MessageStatus.FAILED]: [],
}

export class StateManager {
    constructor(
        private adapter: MailienAdapter,
        private hooks?: MailienHooks,
        private plugins?: MailienPlugin[],
    ) { }

    /**
     * Transition a message to a new status, if the transition is valid.
     * Returns true if the status was updated.
     */
    async transition(messageId: string, newStatus: MessageStatus): Promise<boolean> {
        const message = await this.adapter.getMessage(messageId)
        if (!message) return false

        const currentStatus = message.status
        const allowedNext = STATE_TRANSITIONS[currentStatus]

        if (!allowedNext || !allowedNext.includes(newStatus)) {
            // Invalid transition — silently ignore (idempotent behavior)
            return false
        }

        await this.adapter.updateMessageStatus(messageId, newStatus)

        // Fire hook
        if (this.hooks?.onStatusChange) {
            await this.hooks.onStatusChange(messageId, newStatus)
        }

        // Fire plugin hooks
        if (this.plugins) {
            for (const plugin of this.plugins) {
                if (plugin.onStatusChange) {
                    await plugin.onStatusChange(messageId, newStatus)
                }
            }
        }

        return true
    }

    /**
     * Check if a transition from current → next is valid.
     */
    isValidTransition(current: MessageStatus, next: MessageStatus): boolean {
        const allowed = STATE_TRANSITIONS[current]
        return !!allowed && allowed.includes(next)
    }

    /**
     * Map a Resend webhook event type to a MessageStatus.
     */
    static eventToStatus(eventType: string): MessageStatus | null {
        const mapping: Record<string, MessageStatus> = {
            'email.sent': MessageStatus.SENT,
            'email.delivered': MessageStatus.DELIVERED,
            'email.opened': MessageStatus.OPENED,
            'email.bounced': MessageStatus.BOUNCED,
            'email.complained': MessageStatus.COMPLAINED,
        }
        return mapping[eventType] ?? null
    }
}
