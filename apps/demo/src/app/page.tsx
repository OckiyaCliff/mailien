'use client'

import React, { useState, useTransition } from 'react'
import { InboxList, ThreadView, Composer, useInbox, useThread } from '@mailien/ui'
import { Search, Plus, Settings, LogOut, Mail, Inbox, Bell, Star } from 'lucide-react'

// Note: In a real app, these would be Server Actions or API calls.
// For the demo, we'll mock the fetching logic that would call `mailien`.
async function fetchThreads(mailboxId: string, options?: any) {
  const res = await fetch(`/api/threads?mailboxId=${mailboxId}${options?.cursor ? `&cursor=${options.cursor}` : ''}`)
  return res.json()
}

async function fetchThreadMessages(threadId: string) {
  const res = await fetch(`/api/threads/${threadId}`)
  return res.json()
}

export default function InboxPage() {
  const [activeMailboxId, setActiveMailboxId] = useState('demo-mailbox')
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  const { threads, isLoading: isInboxLoading } = useInbox(activeMailboxId, fetchThreads)
  const { thread, isLoading: isThreadLoading } = useThread(activeThreadId, fetchThreadMessages)

  const activeThread = threads.find(t => t.id === activeThreadId)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-1 ring-white/20">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Mailien</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <button className="flex w-full items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/5">
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
            <span className="ml-auto rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">12</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
            <Bell className="h-4 w-4" />
            <span>Sent</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white">
            <Star className="h-4 w-4" />
            <span>Starred</span>
          </button>
        </nav>

        <div className="mt-auto border-t border-zinc-900 p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 ring-2 ring-zinc-900" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Demo User</span>
              <span className="text-[10px] text-zinc-500">demo@mailien.dev</span>
            </div>
            <button className="ml-auto text-zinc-500 hover:text-zinc-300">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Thread List */}
      <main className="flex w-96 flex-col border-r border-zinc-800/50 bg-zinc-950/20">
        <div className="flex flex-col gap-4 px-4 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Messages</h2>
            <button
              onClick={() => setIsComposerOpen(true)}
              className="rounded-full bg-white p-1.5 text-black transition-transform hover:scale-110 active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="group relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-zinc-600 transition-colors group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2 pl-10 pr-4 text-xs text-zinc-200 outline-none transition-all focus:border-blue-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <InboxList
            threads={threads}
            activeThreadId={activeThreadId || undefined}
            onThreadClick={(t) => setActiveThreadId(t.id)}
            isLoading={isInboxLoading}
          />
        </div>
      </main>

      {/* Thread Content */}
      <section className="flex flex-1 flex-col overflow-hidden bg-zinc-900/10">
        {activeThreadId && thread ? (
          <ThreadView
            thread={thread}
            onReply={() => setIsComposerOpen(true)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-900/50 text-zinc-700 ring-1 ring-zinc-800">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300">Select a message to read</h3>
            <p className="mt-1 text-sm text-zinc-500">Nothing selected yet. Click on an email to view the thread.</p>
          </div>
        )}
      </section>

      {/* Composer */}
      <Composer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onSend={(data) => {
          console.log("Sending email:", data)
          setIsComposerOpen(false)
        }}
      />
    </div>
  )
}
