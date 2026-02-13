// ──────────────────────────────────────────────
// @mailien/stellar — Federation Resolver
// ──────────────────────────────────────────────
// Maps email addresses to Stellar public keys
// using a developer-provided resolver function.
// ──────────────────────────────────────────────

import type { StellarPluginConfig } from './types.js'

/**
 * Resolve a Stellar address from an email.
 * Wraps the user-provided walletResolver with validation and caching.
 */
export class FederationResolver {
    private cache = new Map<string, string>()

    constructor(private config: StellarPluginConfig) { }

    /**
     * Resolve an email to a Stellar public key.
     * Results are cached for the lifetime of the resolver.
     */
    async resolve(email: string): Promise<string | null> {
        const normalized = email.toLowerCase().trim()

        // Check cache first
        if (this.cache.has(normalized)) {
            return this.cache.get(normalized)!
        }

        try {
            const publicKey = await this.config.walletResolver(normalized)

            if (publicKey) {
                // Basic validation: Stellar public keys start with 'G' and are 56 chars
                if (!publicKey.startsWith('G') || publicKey.length !== 56) {
                    console.warn(`[mailien/stellar] Invalid public key for ${normalized}: ${publicKey}`)
                    return null
                }
                this.cache.set(normalized, publicKey)
            }

            return publicKey
        } catch (error) {
            console.error(`[mailien/stellar] Federation resolution failed for ${normalized}:`, error)
            return null
        }
    }

    /** Clear the resolution cache. */
    clearCache(): void {
        this.cache.clear()
    }
}
