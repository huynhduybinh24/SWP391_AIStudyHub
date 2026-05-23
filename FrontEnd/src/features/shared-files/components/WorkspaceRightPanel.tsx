import React, { useState } from 'react'
import { Sparkles, FileText, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SharedFile } from './SharedFilesTable'

export interface CommentItem {
  id: string
  user: string
  text: string
  time: string
  avatarBg: string
}

interface WorkspaceRightPanelProps {
  file: SharedFile | null
  comments: CommentItem[]
  onAddComment: (text: string) => void
  onRegenerateSummary: () => void
  isRegenerating: boolean
  onOpenFullSummary: () => void
  onGenerateQuiz: () => void
  onAskAI: () => void
}

export function WorkspaceRightPanel({
  file,
  comments,
  onAddComment,
  onRegenerateSummary,
  isRegenerating,
  onOpenFullSummary,
  onGenerateQuiz,
  onAskAI
}: WorkspaceRightPanelProps) {
  const [commentInput, setCommentInput] = useState('')

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || !file) return
    onAddComment(commentInput.trim())
    setCommentInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (commentInput.trim() && file) {
        onAddComment(commentInput.trim())
        setCommentInput('')
      }
    }
  }

  // Render empty state if no file is selected
  if (!file) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xs h-full flex flex-col items-center justify-center text-center select-none min-h-[480px]">
        <FileText className="size-10 text-slate-300 dark:text-slate-700 mb-3 stroke-[1.5]" />
        <h4 className="text-sm font-extrabold text-slate-750 dark:text-slate-350">No document selected</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Select a file from the workspace list to view summaries and activities.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 shadow-sm space-y-6 text-left select-none">
      
      {/* 1. Preview Container Box */}
      <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-400 dark:text-slate-600 border border-slate-200/40 dark:border-slate-850 shadow-inner">
        <FileText className="size-8 stroke-[1.5] mb-2 text-slate-350 dark:text-slate-700" />
        <span className="text-[10px] font-black tracking-widest uppercase select-none">
          PREVIEW NOT AVAILABLE
        </span>
      </div>

      {/* 2. File Title Info */}
      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight break-words">
          {file.name}
        </h3>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          Shared with 3 people &bull; {file.size}
        </p>
      </div>

      {/* 3. AI Quick Summary Card */}
      <div className="bg-blue-50/20 dark:bg-slate-850/30 border border-blue-100/30 dark:border-slate-800 rounded-2xl p-4.5 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Sparkles className="size-4 animate-pulse shrink-0" />
            <span className="text-[9px] font-black tracking-wider uppercase">AI QUICK SUMMARY</span>
          </div>
          <button
            type="button"
            onClick={onRegenerateSummary}
            disabled={isRegenerating}
            className="text-[9px] font-black tracking-wider uppercase text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-350 cursor-pointer disabled:opacity-50"
          >
            {isRegenerating ? 'REGENERATING...' : 'REGENERATE'}
          </button>
        </div>

        {isRegenerating ? (
          <div className="space-y-2 py-2">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse w-full" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse w-5/6" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse w-4/6" />
          </div>
        ) : (
          <p className="text-xs text-slate-655 dark:text-slate-300 leading-relaxed font-semibold text-justify">
            {file.summary || (file.name.includes('Biology')
              ? 'This document covers the fundamental principles of cellular biology, ATP production, and DNA replication stages. Key focus on Mitochondria and Krebs cycle.'
              : file.description || 'This file provides critical guidelines and data updates for team sync meetings. Details can be expanded via the full summary AI tool.')}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1.5 select-none">
          {file.tags.map(t => (
            <span
              key={t}
              className="text-[9px] font-black bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-850 px-2 py-0.5 rounded-md"
            >
              #{t.replace('#', '')}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Quick AI Actions Panel */}
      <div className="space-y-2.5">
        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
          QUICK AI ACTIONS
        </span>
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenFullSummary}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-slate-400 shrink-0" />
              <span>Full Summary</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onGenerateQuiz}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-400 shrink-0" />
              <span>Generate Quiz</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onAskAI}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-350 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-blue-500 shrink-0" />
              <span>Ask AI anything...</span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Recent Activity Comments list */}
      <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
          RECENT ACTIVITY
        </span>

        <div className="space-y-4 max-h-[140px] overflow-y-auto scrollbar-none pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 text-xs">
              <span className={cn("size-7 rounded-full text-white font-bold flex items-center justify-center shrink-0", comment.avatarBg)}>
                {comment.user.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 leading-none">
                  <span className="font-extrabold text-slate-800 dark:text-slate-205">{comment.user}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">{comment.time}</span>
                </div>
                <p className="text-slate-550 dark:text-slate-400 font-semibold mt-1 text-justify">
                  "{comment.text}"
                </p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-[10px] text-slate-400 font-semibold italic text-center py-2">
              No recent comments.
            </div>
          )}
        </div>
      </div>

      {/* 6. Comment Form Input Box */}
      <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center border-t border-slate-100 dark:border-slate-800/85 pt-4 shrink-0">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Add a comment"
          className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/10 px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-405 dark:placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!commentInput.trim()}
          className="size-9 bg-blue-600 hover:bg-blue-750 disabled:opacity-40 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          aria-label="Submit comment"
        >
          <Send className="size-4" />
        </button>
      </form>

    </div>
  )
}

export default WorkspaceRightPanel
