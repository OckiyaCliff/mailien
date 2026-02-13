'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Mail, AlertCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns' // I should add date-fns to deps
import { cn } from '../lib/utils'
import { MessageStatus } from '@mailien/core'
import type { Thread } from '@mailien/core'

interface ThreadItemProps {
    thread: Thread
    isActive?: boolean
    onClick?: () => void
}

const statusIcons = {
    [MessageStatus.QUEUED]: <Clock className="h-3 w-3 text-amber-400" />,
    [MessageStatus.SENT]: <Check className="h-3 w-3 text-zinc-400" />,
    [MessageStatus.DELIVERED]: <Check className="h-3 w-3 text-zinc-400" />, // Simple check for delivered
    [MessageStatus.OPENED]: <Check className="h-3 w-3 text-blue-400" />,
    [MessageStatus.BOUNCED]: <AlertCircle className="h-3 w-3 text-red-500" />,
    [MessageStatus.COMPLAINED]: <AlertCircle className="h-3 w-3 text-red-500" />,
    [MessageStatus.FAILED]: <AlertCircle className="h-3 w-3 text-red-500" />,
}

export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
    return (
        <motion.div
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            className={cn(
                "group relative flex cursor-pointer flex-col gap-1 border-b border-zinc-800/50 p-4 transition-all hover:bg-zinc-900/40",
                isActive && "bg-zinc-800/40 shadow-inner",
                !thread.isRead && "bg-blue-900/10"
            )}
            onClick={onClick}
        >
            {!thread.isRead && (
                <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}

            <div className="flex items-center justify-between">
                <span className={cn(
                    "text-sm font-medium transition-colors",
                    thread.isRead ? "text-zinc-400" : "text-zinc-100"
                )}>
                    {thread.subject || "(No Subject)"}
                </span>
                <span className="text-[10px] text-zinc-500">
                    {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex -space-x-1 overflow-hidden">
                    {/* Mock avatars or icons could go here */}
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 border-2 border-zinc-950 text-[10px] text-zinc-300">
                        {thread.mailboxId.charAt(0).toUpperCase()}
                    </div>
                </div>
                <p className="line-clamp-1 text-xs text-zinc-500">
                    {thread.messageCount} messages in conversation
                </p>
            </div>
        </motion.div>
    )
}
