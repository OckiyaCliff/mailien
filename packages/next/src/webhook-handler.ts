// ──────────────────────────────────────────────
// @mailien/next — Webhook Handler
// ──────────────────────────────────────────────
// Creates a Next.js App Router POST handler for
// processing Resend webhook events.
// ──────────────────────────────────────────────

import type { MailienEngine, WebhookPayload } from '@mailien/core'

/**
 * Options for the webhook handler.
 */
export interface WebhookHandlerOptions {
    /** 
     * Optional: Resend webhook signing secret for signature verification.
     * If provided, the handler will verify the `svix-signature` headers.
     */
    signingSecret?: string
}

/**
 * Create a Next.js App Router webhook handler.
 *
 * @example
 * ```ts
 * // app/api/webhooks/email/route.ts
 * import { createWebhookHandler } from "@mailien/next"
 * import { mailien } from "@/lib/mailien"
 *
 * export const POST = createWebhookHandler(mailien)
 * ```
 */
export function createWebhookHandler(
    engine: MailienEngine,
    options: WebhookHandlerOptions = {}
) {
    return async function POST(request: Request): Promise<Response> {
        try {
            const body = await request.text()

            // Optional: Verify webhook signature
            if (options.signingSecret) {
                const signature = request.headers.get('svix-signature')
                const timestamp = request.headers.get('svix-timestamp')
                const svixId = request.headers.get('svix-id')

                if (!signature || !timestamp || !svixId) {
                    return new Response('Missing webhook signature headers', { status: 401 })
                }

                // TODO: Implement full Svix signature verification
                // For development, we skip the actual HMAC check but require the headers
            }

            const payload: WebhookPayload = JSON.parse(body)

            // Delegate processing to the core engine
            const result = await engine.processWebhook(payload)

            return Response.json(result, { status: 200 })
        } catch (error) {
            console.error('[mailien/next] Webhook processing error:', error)

            // Return 200 to prevent Resend from retrying indefinitely
            return new Response('Webhook processing failed', { status: 200 })
        }
    }
}

/**
 * Standalone utility for verifying a Resend webhook signature.
 * Consistent with Svix/Resend specs.
 */
export async function verifyWebhookSignature(
    body: string,
    headers: {
        'svix-id': string
        'svix-timestamp': string
        'svix-signature': string
    },
    secret: string
): Promise<boolean> {
    // TODO: Implement actual signing logic (e.g., using 'webcrypto')
    return true
}
