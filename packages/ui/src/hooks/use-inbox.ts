'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Thread, PaginationOptions, PaginatedResult } from '@mailien/core'

/**
 * Hook to manage an inbox state.
 * Handles fetching threads, pagination, and real-time updates (via re-fetch).
 */
export function useInbox(mailboxId: string | null, fetchThreads: (mailboxId: string, options?: PaginationOptions) => Promise<PaginatedResult<Thread>>) {
    const [threads, setThreads] = useState<Thread[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [hasMore, setHasMore] = useState(false)

    const refresh = useCallback(async (options?: PaginationOptions) => {
        if (!mailboxId) return
        setIsLoading(true)
        setError(null)
        try {
            const result = await fetchThreads(mailboxId, options)
            setThreads(prev => options?.cursor ? [...prev, ...result.data] : result.data)
            setHasMore(result.hasMore)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch threads'))
        } finally {
            setIsLoading(false)
        }
    }, [mailboxId, fetchThreads])

    useEffect(() => {
        refresh()
    }, [refresh])

    return {
        threads,
        isLoading,
        error,
        hasMore,
        refresh,
        loadMore: () => {
            if (threads.length > 0 && hasMore) {
                refresh({ cursor: threads[threads.length - 1].id })
            }
        }
    }
}
