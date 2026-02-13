'use client'

import { useState, useCallback } from 'react'
import type { SendParams, SendResult } from '@mailien/core'

export interface ComposerState {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    html: string
    text?: string
    threadId?: string
}

const initialState: ComposerState = {
    to: [],
    subject: '',
    html: '',
}

/**
 * Hook to manage the email composer state.
 */
export function useComposer(sendEmail: (params: SendParams) => Promise<SendResult>) {
    const [state, setState] = useState<ComposerState>(initialState)
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const setField = useCallback(<K extends keyof ComposerState>(field: K, value: ComposerState[K]) => {
        setState(prev => ({ ...prev, [field]: value }))
    }, [])

    const send = useCallback(async () => {
        setIsSending(true)
        setError(null)
        try {
            const result = await sendEmail(state as SendParams)
            setState(initialState)
            return result
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to send email'))
            throw err
        } finally {
            setIsSending(false)
        }
    }, [state, sendEmail])

    return {
        ...state,
        setField,
        send,
        isSending,
        error,
        reset: () => setState(initialState)
    }
}
