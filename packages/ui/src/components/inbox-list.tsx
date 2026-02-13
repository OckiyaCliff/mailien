'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThreadItem } from './thread-item'
import { Inbox, Loader2 } from 'lucide-react'
import type { Thread } from '@mailien/core'

interface InboxListProps {
    threads: Thread[]
    activeThreadId?: string
    onThreadClick?: (thread: Thread) => void
    isLoading?: boolean
    emptyMessage?: string
}

export function InboxList({
    threads,
    activeThreadId,
    onThreadClick,
    isLoading,
    emptyMessage = "Your inbox is empty"
}: InboxListProps) {
    if (isLoading && threads.length === 0) {
        return (
            <div className="flex h-40 w-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (threads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                <div className="rounded-full bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
                    <Inbox className="h-6 w-6 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col overflow-y-auto">
            <AnimatePresence initial={false}>
                {threads.map((thread) => (
                    <motion.div
                        key={thread.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ThreadItem
                            thread={thread}
                            isActive={thread.id === activeThreadId}
                            onClick={() => onThreadClick?.(thread)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
