// ──────────────────────────────────────────────
// @mailien/ui — Hooks: useComposer
// ──────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { MailienEngine, SendParams, SendResult } from '@mailien/core'

interface UseComposerOptions {
    engine: MailienEngine
    threadId?: string
    defaultFrom?: string
}

interface ComposerState {
    to: string
    cc: string
    bcc: string
    subject: string
    body: string
}

interface UseComposerReturn {
    state: ComposerState
    setTo: (value: string) => void
    setCc: (value: string) => void
    setBcc: (value: string) => void
    setSubject: (value: string) => void
    setBody: (value: string) => void
    isSending: boolean
    error: Error | null
    send: () => Promise<SendResult | null>
    reset: () => void
}

const INITIAL_STATE: ComposerState = {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
}

export function useComposer(options: UseComposerOptions): UseComposerReturn {
    const { engine, threadId, defaultFrom } = options

    const [state, setState] = useState<ComposerState>(INITIAL_STATE)
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const setTo = useCallback((value: string) => setState((s) => ({ ...s, to: value })), [])
    const setCc = useCallback((value: string) => setState((s) => ({ ...s, cc: value })), [])
    const setBcc = useCallback((value: string) => setState((s) => ({ ...s, bcc: value })), [])
    const setSubject = useCallback((value: string) => setState((s) => ({ ...s, subject: value })), [])
    const setBody = useCallback((value: string) => setState((s) => ({ ...s, body: value })), [])

    const reset = useCallback(() => {
        setState(INITIAL_STATE)
        setError(null)
    }, [])

    const send = useCallback(async (): Promise<SendResult | null> => {
        if (!state.to || !state.subject) {
            setError(new Error('Recipient and subject are required'))
            return null
        }

        try {
            setIsSending(true)
            setError(null)

            const params: SendParams = {
                to: state.to.split(',').map((s) => s.trim()),
                subject: state.subject,
                html: state.body,
                threadId,
                from: defaultFrom,
            }

            if (state.cc) {
                params.cc = state.cc.split(',').map((s) => s.trim())
            }
            if (state.bcc) {
                params.bcc = state.bcc.split(',').map((s) => s.trim())
            }

            const result = await engine.send(params)
            reset()
            return result
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to send email'))
            return null
        } finally {
            setIsSending(false)
        }
    }, [engine, state, threadId, defaultFrom, reset])

    return {
        state,
        setTo,
        setCc,
        setBcc,
        setSubject,
        setBody,
        isSending,
        error,
        send,
        reset,
    }
}
