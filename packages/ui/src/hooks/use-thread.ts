'use client'

import { useState, useCallback, useEffect } from 'react'
import type { ThreadWithMessages } from '@mailien/core'

/**
 * Hook to manage a single thread view.
 */
export function useThread(threadId: string | null, fetchThread: (id: string) => Promise<ThreadWithMessages | null>) {
    const [thread, setThread] = useState<ThreadWithMessages | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const refresh = useCallback(async () => {
        if (!threadId) return
        setIsLoading(true)
        setError(null)
        try {
            const data = await fetchThread(threadId)
            setThread(data)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch thread'))
        } finally {
            setIsLoading(false)
        }
    }, [threadId, fetchThread])

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        thread,
        isLoading,
        error,
        refresh
    }
}
