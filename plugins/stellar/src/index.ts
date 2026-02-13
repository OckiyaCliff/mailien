// ──────────────────────────────────────────────
// @mailien/stellar — Public API
// ──────────────────────────────────────────────

export { stellarPlugin } from './plugin.js'
export { FederationResolver } from './federation.js'
export { buildPaymentTransaction } from './payment.js'

export type {
    StellarPluginConfig,
    StellarSendParams,
    PaymentInstruction,
    PaymentResult,
    PaymentAsset,
} from './types.js'
