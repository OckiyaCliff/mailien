'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Paperclip, MoreHorizontal, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '../lib/utils'

interface ComposerProps {
    isOpen: boolean
    onClose: () => void
    onSend: (data: { to: string; subject: string; body: string }) => void
    defaultTo?: string
    defaultSubject?: string
}

export function Composer({ isOpen, onClose, onSend, defaultTo = "", defaultSubject = "" }: ComposerProps) {
    const [isMaximized, setIsMaximized] = React.useState(false)
    const [to, setTo] = React.useState(defaultTo)
    const [subject, setSubject] = React.useState(defaultSubject)
    const [body, setBody] = React.useState("")

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    className={cn(
                        "fixed bottom-0 right-8 z-50 flex flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-white/5",
                        isMaximized ? "inset-4 right-4 h-auto w-auto" : "h-[600px] w-[540px]"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between bg-zinc-900/50 px-4 py-3 backdrop-blur-md">
                        <span className="text-xs font-semibold text-zinc-400">New Message</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            >
                                {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                            </button>
                            <button
                                onClick={onClose}
                                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="flex flex-col border-b border-zinc-800/50">
                        <div className="flex items-center gap-3 px-4 py-2 text-sm">
                            <span className="w-12 text-zinc-500">To</span>
                            <input
                                type="text"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="flex-1 bg-transparent py-1.5 text-zinc-200 outline-none placeholder:text-zinc-700"
                                placeholder="recipients@example.com"
                            />
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 text-sm border-t border-zinc-800/30">
                            <span className="w-12 text-zinc-500">Subject</span>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="flex-1 bg-transparent py-1.5 text-zinc-200 outline-none placeholder:text-zinc-700"
                                placeholder="Subject line"
                            />
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 p-4">
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="h-full w-full resize-none bg-transparent text-sm text-zinc-300 outline-none placeholder:text-zinc-800"
                            placeholder="Write your message..."
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-zinc-800/50 bg-zinc-900/20 px-4 py-4">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onSend({ to, subject, body })}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <span>Send</span>
                                <Send className="h-3.5 w-3.5" />
                            </button>
                            <button className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                                <Paperclip className="h-4 w-4" />
                            </button>
                        </div>

                        <button className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
