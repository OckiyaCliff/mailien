'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star, MoreHorizontal, Reply, Archive, Trash2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '../lib/utils'
import { MessageDirection, MessageStatus } from '@mailien/core'
import type { ThreadWithMessages, Message } from '@mailien/core'

interface ThreadViewProps {
    thread: ThreadWithMessages
    onReply?: () => void
    onArchive?: () => void
    onDelete?: () => void
}

export function ThreadView({ thread, onReply, onArchive, onDelete }: ThreadViewProps) {
    return (
        <div className="flex flex-1 flex-col bg-zinc-950">
            {/* Thread Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950/50 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-zinc-100">{thread.subject}</h2>
                    <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2 py-0.5 ring-1 ring-zinc-800">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-medium text-zinc-400 capitalize">Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                        <Star className="h-4 w-4" />
                    </button>
                    <button onClick={onArchive} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                        <Archive className="h-4 w-4" />
                    </button>
                    <button onClick={onDelete} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="h-4 w-px bg-zinc-800 mx-1" />
                    <button className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="mx-auto max-w-3xl space-y-12">
                    {thread.messages.map((message, idx) => (
                        <MessageItem key={message.id} message={message} isLast={idx === thread.messages.length - 1} />
                    ))}
                </div>
            </div>

            {/* Quick Reply Bar */}
            <div className="border-t border-zinc-800/50 p-6">
                <div
                    onClick={onReply}
                    className="group flex cursor-text items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                >
                    <span className="text-sm text-zinc-500">Reply to {thread.messages[thread.messages.length - 1]?.from}...</span>
                    <div className="rounded-md bg-white/5 p-1 transition-colors group-hover:bg-white/10">
                        <Reply className="h-4 w-4 text-zinc-400" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function MessageItem({ message, isLast }: { message: Message; isLast?: boolean }) {
    const isOutbound = message.direction === MessageDirection.OUTBOUND

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col gap-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-lg ring-1 ring-white/5">
                        <span className="text-xs font-medium text-zinc-300">
                            {message.from ? message.from.charAt(0).toUpperCase() : '?'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-200">{message.from}</span>
                        <span className="text-[10px] text-zinc-500">
                            to {Array.isArray(message.to) ? message.to.join(', ') : message.to}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500">
                        {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                    </span>
                    {isOutbound && (
                        <div className="flex items-center gap-1">
                            {message.status === MessageStatus.OPENED ? (
                                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            ) : (
                                <CheckCircle2 className="h-3 w-3 text-zinc-600" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className={cn(
                "prose prose-invert max-w-none text-sm leading-relaxed text-zinc-300",
                "selection:bg-blue-500/30"
            )}>
                {message.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
                ) : (
                    <p className="whitespace-pre-wrap">{message.bodyText}</p>
                )}
            </div>

            {!isLast && <div className="absolute -bottom-6 left-4 top-10 w-px bg-zinc-800/50" />}
        </motion.div>
    )
}
