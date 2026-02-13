import { createWebhookHandler } from '@mailien/next'
import { mailien } from '@/lib/mailien'

/**
 * Handle incoming webhooks from Resend.
 * This is the reactive core that updates the inbox in real-time.
 */
export const POST = createWebhookHandler(mailien, {
    signingSecret: process.env.MAILIEN_SECRET,
})
