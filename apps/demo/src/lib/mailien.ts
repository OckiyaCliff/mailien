import { createMailien } from '@mailien/core'
import { prismaAdapter } from '@mailien/prisma-adapter'
import { prisma } from './prisma'

/**
 * Shared Mailien engine instance for the demo app.
 * Configured with the Prisma adapter and Resend API key.
 */
export const mailien = createMailien({
    apiKey: process.env.RESEND_API_KEY || 're_dummy_key_for_build',
    adapter: prismaAdapter(prisma as any), // Cast because of minor SQLite schema differences handled in adapter
    debug: true,
    defaultFrom: 'demo@mailien.dev',
})
