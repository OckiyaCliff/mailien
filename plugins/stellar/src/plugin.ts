// ──────────────────────────────────────────────
// @mailien/stellar — Plugin Factory
// ──────────────────────────────────────────────
// Creates a MailienPlugin that hooks into the
// email lifecycle to enable payment-aware emails.
// ──────────────────────────────────────────────

import type { MailienPlugin, SendParams, Message } from '@mailien/core'
import type { StellarPluginConfig, StellarSendParams } from './types.js'
import { FederationResolver } from './federation.js'
import { buildPaymentTransaction } from './payment.js'

/**
 * Create the Stellar fintech plugin for Mailien.
 *
 * @example
 * ```ts
 * import { stellarPlugin } from "@mailien/stellar"
 *
 * const mailien = createMailien({
 *   apiKey: process.env.RESEND_API_KEY!,
 *   adapter: prismaAdapter(prisma),
 *   plugins: [
 *     stellarPlugin({
 *       network: "testnet",
 *       walletResolver: async (email) => lookupWallet(email),
 *     })
 *   ]
 * })
 * ```
 */
export function stellarPlugin(config: StellarPluginConfig): MailienPlugin {
    const federation = new FederationResolver(config)

    return {
        name: '@mailien/stellar',
        version: '0.0.1',

        /**
         * Hook: Before sending an email.
         * If the send params include a `payment` field,
         * resolve the Stellar addresses and attach metadata.
         */
        async onSend(params: SendParams): Promise<SendParams> {
            const extended = params as SendParams & StellarSendParams

            if (!extended.payment) {
                return params // No payment attached, pass through
            }

            const senderEmail = params.from || 'unknown@mailien.dev'
            const recipientEmail = Array.isArray(params.to) ? params.to[0] : params.to

            console.log(`[mailien/stellar] Processing payment of ${extended.payment.amount} ${extended.payment.asset} to ${recipientEmail}`)

            const result = await buildPaymentTransaction(
                extended.payment,
                senderEmail,
                config,
                federation,
            )

            if (!result.success) {
                console.warn(`[mailien/stellar] Payment resolution failed: ${result.error}`)
                // Don't block the email — payment is advisory
            }

            // Inject payment metadata into email headers
            const paymentHeaders: Record<string, string> = {
                'X-Mailien-Payment': 'true',
                'X-Mailien-Payment-Amount': extended.payment.amount,
                'X-Mailien-Payment-Asset': extended.payment.asset,
                'X-Mailien-Payment-Status': result.success ? 'resolved' : 'failed',
            }

            if (result.senderPublicKey) {
                paymentHeaders['X-Mailien-Payment-Sender'] = result.senderPublicKey
            }
            if (result.recipientPublicKey) {
                paymentHeaders['X-Mailien-Payment-Recipient'] = result.recipientPublicKey
            }
            if (result.txHash) {
                paymentHeaders['X-Mailien-Payment-TxHash'] = result.txHash
            }

            return {
                ...params,
                headers: {
                    ...params.headers,
                    ...paymentHeaders,
                },
            }
        },

        /**
         * Hook: On receiving an email.
         * Check for payment headers and log them.
         */
        async onReceive(message: Message): Promise<void> {
            if (message.headers?.['X-Mailien-Payment'] === 'true') {
                console.log(`[mailien/stellar] Received payment-aware email:`, {
                    messageId: message.id,
                    amount: message.headers['X-Mailien-Payment-Amount'],
                    asset: message.headers['X-Mailien-Payment-Asset'],
                    status: message.headers['X-Mailien-Payment-Status'],
                    txHash: message.headers['X-Mailien-Payment-TxHash'],
                })
            }
        },
    }
}
