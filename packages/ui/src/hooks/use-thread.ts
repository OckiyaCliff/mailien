// ──────────────────────────────────────────────
// @mailien/ui — Hooks: useThread
// ──────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import type { ThreadWithMessages, MailienEngine } from '@mailien/core'

interface UseThreadOptions {
    engine: MailienEngine
    threadId: string | null
}

interface UseThreadReturn {
    thread: ThreadWithMessages | null
    isLoading: boolean
    error: Error | null
    refresh: () => Promise<void>
}

export function useThread(options: UseThreadOptions): UseThreadReturn {
    const { engine, threadId } = options

    const [thread, setThread] = useState<ThreadWithMessages | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchThread = useCallback(async () => {
        if (!threadId) {
            setThread(null)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const result = await engine.getThread(threadId)
            setThread(result)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch thread'))
        } finally {
            setIsLoading(false)
        }
    }, [engine, threadId])

    const refresh = useCallback(async () => {
        await fetchThread()
    }, [fetchThread])

    useEffect(() => {
        fetchThread()
    }, [fetchThread])

    return { thread, isLoading, error, refresh }
}
