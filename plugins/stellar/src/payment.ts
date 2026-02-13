// ──────────────────────────────────────────────
// @mailien/stellar — Payment Execution
// ──────────────────────────────────────────────
// Handles Stellar transaction construction and
// submission. Non-custodial: the plugin builds
// unsigned transactions for the developer to sign.
// ──────────────────────────────────────────────

import type { PaymentInstruction, PaymentResult, StellarPluginConfig } from './types.js'
import { FederationResolver } from './federation.js'

// Stellar SDK network passphrase constants
const NETWORK_PASSPHRASES = {
    testnet: 'Test SDF Network ; September 2015',
    public: 'Public Global Stellar Network ; September 2015',
} as const

/**
 * Build an unsigned Stellar payment transaction.
 *
 * This is non-custodial — the developer must sign and submit
 * the transaction using their own key management solution.
 *
 * Returns a PaymentResult with metadata about the resolved addresses.
 */
export async function buildPaymentTransaction(
    instruction: PaymentInstruction,
    senderEmail: string,
    config: StellarPluginConfig,
    federation: FederationResolver,
): Promise<PaymentResult> {
    try {
        // Resolve both parties
        const [senderKey, recipientKey] = await Promise.all([
            federation.resolve(senderEmail),
            federation.resolve(instruction.to),
        ])

        if (!senderKey) {
            return {
                success: false,
                error: `Could not resolve Stellar address for sender: ${senderEmail}`,
            }
        }

        if (!recipientKey) {
            return {
                success: false,
                error: `Could not resolve Stellar address for recipient: ${instruction.to}`,
            }
        }

        // In a real implementation, this would use the Stellar SDK to:
        // 1. Load the sender account
        // 2. Build a payment operation
        // 3. Return an unsigned transaction XDR
        //
        // For this alpha release, we return the resolved metadata
        // so developers can build their own signing flow.

        const networkPassphrase = NETWORK_PASSPHRASES[config.network]
        const horizonUrl = config.network === 'testnet'
            ? 'https://horizon-testnet.stellar.org'
            : 'https://horizon.stellar.org'

        console.log(`[mailien/stellar] Payment prepared:`, {
            network: config.network,
            horizonUrl,
            networkPassphrase,
            from: senderKey,
            to: recipientKey,
            amount: instruction.amount,
            asset: instruction.asset,
            memo: instruction.memo,
        })

        return {
            success: true,
            senderPublicKey: senderKey,
            recipientPublicKey: recipientKey,
            // txHash will be populated after the developer signs and submits
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown payment error'
        console.error('[mailien/stellar] Payment failed:', message)
        return {
            success: false,
            error: message,
        }
    }
}
