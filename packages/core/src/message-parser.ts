// ──────────────────────────────────────────────
// @mailien/core — Message Parser
// ──────────────────────────────────────────────
// Extracts structured data from raw webhook
// payloads into a normalized ParsedEmail shape.
// ──────────────────────────────────────────────

import type { ParsedEmail } from './types.js'

/**
 * Parse a raw Resend inbound email webhook payload
 * into a normalized ParsedEmail object.
 */
export function parseInboundEmail(data: Record<string, unknown>): ParsedEmail {
    const headers = (data.headers as Record<string, string>) ?? {}

    const messageId = extractMessageId(data, headers)
    const from = extractString(data, 'from')
    const to = extractStringArray(data, 'to')
    const cc = extractStringArray(data, 'cc')
    const subject = extractString(data, 'subject') || '(No Subject)'

    const bodyHtml = extractString(data, 'html') || extractString(data, 'body')
    const bodyText = extractString(data, 'text')

    const inReplyTo = headers['in-reply-to'] || headers['In-Reply-To'] || undefined
    const referencesRaw = headers['references'] || headers['References'] || ''
    const references = referencesRaw
        .split(/\s+/)
        .map((r) => r.trim())
        .filter(Boolean)

    const dateStr = extractString(data, 'date') || extractString(data, 'created_at')
    const date = dateStr ? new Date(dateStr) : undefined

    return {
        messageId,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        subject,
        bodyHtml: bodyHtml || undefined,
        bodyText: bodyText || undefined,
        inReplyTo,
        references: references.length > 0 ? references : undefined,
        date,
        headers,
    }
}

/**
 * Extract the canonical Message-ID from payload or headers.
 */
function extractMessageId(data: Record<string, unknown>, headers: Record<string, string>): string {
    const fromHeaders = headers['message-id'] || headers['Message-ID'] || headers['Message-Id']
    if (fromHeaders) return cleanMessageId(fromHeaders)

    const fromData = extractString(data, 'message_id') || extractString(data, 'messageId')
    if (fromData) return cleanMessageId(fromData)

    // Fallback: generate a deterministic ID
    return `<generated-${Date.now()}@mailien>`
}

/**
 * Ensure Message-ID is wrapped in angle brackets.
 */
function cleanMessageId(id: string): string {
    const trimmed = id.trim()
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) return trimmed
    return `<${trimmed}>`
}

/**
 * Safely extract a string value from an object.
 */
function extractString(data: Record<string, unknown>, key: string): string {
    const val = data[key]
    if (typeof val === 'string') return val
    return ''
}

/**
 * Extract a string or array-of-strings from an object,
 * always returning an array.
 */
function extractStringArray(data: Record<string, unknown>, key: string): string[] {
    const val = data[key]
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean)
    if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string')
    return []
}
