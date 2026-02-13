// ──────────────────────────────────────────────
// @mailien/stellar — Type Definitions
// ──────────────────────────────────────────────

/**
 * Configuration for the Stellar plugin.
 */
export interface StellarPluginConfig {
    /** Stellar network: 'testnet' or 'public' */
    network: 'testnet' | 'public'

    /**
     * Resolve a Stellar public key from an email address.
     * This is YOUR responsibility — Mailien is non-custodial.
     */
    walletResolver: (email: string) => Promise<string | null>

    /** Optional: Default asset for payments (defaults to XLM) */
    defaultAsset?: PaymentAsset
}

/**
 * Supported payment assets.
 */
export type PaymentAsset = 'XLM' | 'USDC'

/**
 * A payment instruction embedded in an email.
 */
export interface PaymentInstruction {
    /** Recipient email address */
    to: string
    /** Payment amount as a string (e.g., "50.00") */
    amount: string
    /** Asset type */
    asset: PaymentAsset
    /** Optional memo for the transaction */
    memo?: string
}

/**
 * Result of a processed payment.
 */
export interface PaymentResult {
    /** Whether the payment was successful */
    success: boolean
    /** Stellar transaction hash */
    txHash?: string
    /** Resolved sender public key */
    senderPublicKey?: string
    /** Resolved recipient public key */
    recipientPublicKey?: string
    /** Error message if failed */
    error?: string
}

/**
 * Extended send params that include payment data.
 */
export interface StellarSendParams {
    payment?: PaymentInstruction
}
