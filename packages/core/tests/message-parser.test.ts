// ──────────────────────────────────────────────
// @mailien/core — Message Parser Tests
// ──────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { parseInboundEmail } from '../src/message-parser'

describe('parseInboundEmail', () => {
    it('should parse a basic inbound email payload', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com',
            subject: 'Hello World',
            html: '<p>Hello Bob!</p>',
            text: 'Hello Bob!',
            headers: {
                'message-id': '<abc123@example.com>',
            },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.messageId).toBe('<abc123@example.com>')
        expect(parsed.from).toBe('alice@example.com')
        expect(parsed.to).toEqual(['bob@example.com'])
        expect(parsed.subject).toBe('Hello World')
        expect(parsed.bodyHtml).toBe('<p>Hello Bob!</p>')
        expect(parsed.bodyText).toBe('Hello Bob!')
    })

    it('should handle array-format recipients', () => {
        const payload = {
            from: 'alice@example.com',
            to: ['bob@example.com', 'charlie@example.com'],
            cc: ['dave@example.com'],
            subject: 'Group email',
            headers: { 'message-id': '<msg1@test>' },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.to).toEqual(['bob@example.com', 'charlie@example.com'])
        expect(parsed.cc).toEqual(['dave@example.com'])
    })

    it('should handle comma-separated recipients', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com, charlie@example.com',
            subject: 'Test',
            headers: { 'message-id': '<msg2@test>' },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.to).toEqual(['bob@example.com', 'charlie@example.com'])
    })

    it('should extract In-Reply-To and References headers', () => {
        const payload = {
            from: 'bob@example.com',
            to: 'alice@example.com',
            subject: 'Re: Hello',
            headers: {
                'message-id': '<reply1@test>',
                'in-reply-to': '<original@test>',
                'references': '<original@test> <msg2@test>',
            },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.inReplyTo).toBe('<original@test>')
        expect(parsed.references).toEqual(['<original@test>', '<msg2@test>'])
    })

    it('should default subject to "(No Subject)" when missing', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com',
            headers: { 'message-id': '<msg3@test>' },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.subject).toBe('(No Subject)')
    })

    it('should wrap bare message IDs in angle brackets', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com',
            subject: 'Test',
            headers: { 'message-id': 'bare-id@test' },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.messageId).toBe('<bare-id@test>')
    })

    it('should generate a fallback message ID when none provided', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com',
            subject: 'No headers',
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.messageId).toMatch(/^<generated-\d+@mailien>$/)
    })

    it('should parse date from payload', () => {
        const payload = {
            from: 'alice@example.com',
            to: 'bob@example.com',
            subject: 'Test',
            date: '2024-06-15T10:00:00Z',
            headers: { 'message-id': '<dated@test>' },
        }

        const parsed = parseInboundEmail(payload)

        expect(parsed.date).toBeInstanceOf(Date)
        expect(parsed.date?.toISOString()).toBe('2024-06-15T10:00:00.000Z')
    })
})
