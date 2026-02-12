// ──────────────────────────────────────────────
// @mailien/ui — Hooks: useInbox
// ──────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'
import type { Thread, PaginatedResult, MailienEngine } from '@mailien/core'

interface UseInboxOptions {
    engine: MailienEngine
    mailboxId: string
    limit?: number
    autoRefreshMs?: number
}

interface UseInboxReturn {
    threads: Thread[]
    isLoading: boolean
    error: Error | null
    hasMore: boolean
    loadMore: () => Promise<void>
    refresh: () => Promise<void>
}

export function useInbox(options: UseInboxOptions): UseInboxReturn {
    const { engine, mailboxId, limit = 20, autoRefreshMs } = options

    const [threads, setThreads] = useState<Thread[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [cursor, setCursor] = useState<string | undefined>()
    const [hasMore, setHasMore] = useState(false)

    const fetchInbox = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const result: PaginatedResult<Thread> = await engine.getInbox(mailboxId, { limit })

            setThreads(result.data)
            setCursor(result.nextCursor)
            setHasMore(result.hasMore)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch inbox'))
        } finally {
            setIsLoading(false)
        }
    }, [engine, mailboxId, limit])

    const loadMore = useCallback(async () => {
        if (!hasMore || !cursor) return

        try {
            const result = await engine.getInbox(mailboxId, { limit, cursor })

            setThreads((prev) => [...prev, ...result.data])
            setCursor(result.nextCursor)
            setHasMore(result.hasMore)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more'))
        }
    }, [engine, mailboxId, limit, cursor, hasMore])

    const refresh = useCallback(async () => {
        await fetchInbox()
    }, [fetchInbox])

    useEffect(() => {
        fetchInbox()
    }, [fetchInbox])

    // Auto-refresh
    useEffect(() => {
        if (!autoRefreshMs) return
        const interval = setInterval(fetchInbox, autoRefreshMs)
        return () => clearInterval(interval)
    }, [autoRefreshMs, fetchInbox])

    return { threads, isLoading, error, hasMore, loadMore, refresh }
}
