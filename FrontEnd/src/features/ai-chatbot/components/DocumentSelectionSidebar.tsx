import {
  BookOpen, Search, CheckSquare, Square, Filter, FileText,
  Loader2, FolderOpen, History, MessageSquare, Plus, ChevronRight,
  ShieldCheck, AlertCircle, Trash2, Pin, PinOff
} from 'lucide-react'
import { DocumentResponse } from '@/services/documentService'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { AiChatSessionResponse } from '@/services/aiService'
import { cn } from '@/lib/utils'

interface DocumentSelectionSidebarProps {
  documents: DocumentResponse[]
  isLoadingDocs: boolean
  isErrorDocs: boolean
  sessions?: AiChatSessionResponse[]
  onSelectSession?: (sessionId: number) => void
  onDeleteSession?: (sessionId: number) => void
  onTogglePinSession?: (sessionId: number) => void
  onClearAllSessions?: () => void
  onNewChat?: () => void
}

export function DocumentSelectionSidebar({
  documents,
  isLoadingDocs,
  isErrorDocs,
  sessions = [],
  onSelectSession,
  onDeleteSession,
  onTogglePinSession,
  onClearAllSessions,
  onNewChat,
}: DocumentSelectionSidebarProps) {
  const {
    selectedDocumentIds,
    toggleDocumentId,
    selectAllDocuments,
    clearSelectedDocuments,
    searchQuery,
    setSearchQuery,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    sourceFilter,
    setSourceFilter,
    activeSessionId,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useAiWorkspaceStore()

  // Extract unique subjects
  const subjects = useMemo(() => {
    const set = new Set<string>()
    documents.forEach((d) => {
      if (d.subject) set.add(d.subject)
    })
    return ['ALL', ...Array.from(set)]
  }, [documents])

  // Filtered documents by search, subject, and source filter
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.originalFileName && doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchSubject =
        selectedSubjectFilter === 'ALL' || doc.subject === selectedSubjectFilter

      let matchSource = true
      if (sourceFilter === 'MY_DOCS') {
        matchSource = doc.isPublic !== true
      } else if (sourceFilter === 'WORKSPACE') {
        matchSource = doc.isPublic === true
      }

      return matchSearch && matchSubject && matchSource
    })
  }, [documents, searchQuery, selectedSubjectFilter, sourceFilter])

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Only consider ready documents for batch selecting
  const readyFilteredDocuments = useMemo(() => {
    return filteredDocuments.filter((d) => d.status === 'READY' || (d as any).isReady !== false)
  }, [filteredDocuments])

  const allFilteredSelected =
    readyFilteredDocuments.length > 0 &&
    readyFilteredDocuments.every((d) => selectedDocumentIds.includes(d.id))

  const handleToggleAll = () => {
    if (allFilteredSelected) {
      clearSelectedDocuments()
    } else {
      selectAllDocuments(readyFilteredDocuments.map((d) => d.id))
    }
  }

  return (
    <aside
      id="document-selection-sidebar"
      className={cn(
        'w-80 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden select-none shrink-0 transition-all z-20',
        !isSidebarOpen && 'hidden md:hidden'
      )}
    >
      {/* ── Top Header ── */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
            <BookOpen className="size-4" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
              Tài liệu nguồn
            </h2>
            <span id="selected-doc-counter" className="text-[10px] text-slate-400 font-medium block mt-1">
              {selectedDocumentIds.length > 0 ? '1 / 1 đã chọn' : '0 / 1 đã chọn'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onNewChat && (
            <button
              id="new-chat-btn"
              onClick={onNewChat}
              className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 transition-colors cursor-pointer"
              title="Cuộc trò chuyện mới"
            >
              <Plus className="size-4" />
            </button>
          )}
          <button
            id="close-sidebar-btn"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng thanh chọn"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Source Filter Tabs ── */}
      <div className="px-3 pt-3 flex items-center gap-1 border-b border-slate-100 dark:border-slate-800/60 pb-2">
        {(['ALL', 'MY_DOCS', 'WORKSPACE'] as const).map((filter) => (
          <button
            key={filter}
            id={`source-filter-${filter.toLowerCase()}`}
            onClick={() => setSourceFilter(filter)}
            className={cn(
              'flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center',
              sourceFilter === filter
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {filter === 'ALL' ? 'Tất cả' : filter === 'MY_DOCS' ? 'Của tôi' : 'Chung'}
          </button>
        ))}
      </div>

      {/* ── Search & Subject Filter Controls ── */}
      <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-2.5 bg-white dark:bg-slate-900">
        <div className="relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="doc-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tài liệu..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 rounded-xl outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 transition-colors"
          />
        </div>

        {subjects.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="size-3 text-slate-400 shrink-0" />
            {subjects.map((subj) => (
              <button
                key={subj}
                id={`subject-filter-${subj}`}
                onClick={() => setSelectedSubjectFilter(subj)}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer',
                  selectedSubjectFilter === subj
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                )}
              >
                {subj === 'ALL' ? 'Tất cả chủ đề' : subj}
              </button>
            ))}
          </div>
        )}

        {/* Selection Bar Actions */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <BookOpen className="size-3 text-blue-600" />
            <span>Chọn 1 tài liệu để hỏi AI</span>
          </span>
        </div>
      </div>

      {/* ── Documents List Area ── */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
        {isLoadingDocs ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="size-6 text-blue-600 animate-spin mb-2" />
            <span className="text-xs font-medium">Đang tải danh sách tài liệu...</span>
          </div>
        ) : isErrorDocs ? (
          <div className="flex flex-col items-center justify-center py-10 text-rose-500 px-4 text-center">
            <AlertCircle className="size-6 mb-2" />
            <span className="text-xs font-bold">Không thể tải tài liệu</span>
            <span className="text-[11px] text-slate-400 mt-1">Vui lòng kiểm tra lại kết nối mạng.</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FolderOpen className="size-8 text-slate-300 dark:text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Không tìm thấy tài liệu
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Hãy tải lên tài liệu mới tại mục Quản lý tài liệu.
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isSelected = selectedDocumentIds.includes(doc.id)
            const isReady = doc.status === 'READY' || (doc as any).isReady !== false
            
            return (
              <div
                key={doc.id}
                id={`doc-item-${doc.id}`}
                onClick={() => {
                  if (isReady) toggleDocumentId(doc.id)
                }}
                className={cn(
                  'group flex items-start gap-3 p-3 rounded-2xl border transition-all text-left',
                  !isReady
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200/50'
                    : isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/60 shadow-xs cursor-pointer'
                    : 'bg-white dark:bg-slate-850 border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                )}
              >
                <input
                  type="radio"
                  id={`doc-radio-${doc.id}`}
                  checked={isSelected}
                  disabled={!isReady}
                  onChange={() => {}}
                  className="size-4 accent-blue-600 rounded-full mt-0.5 pointer-events-none"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                      {doc.subject || doc.fileType || 'DOCUMENT'}
                    </span>
                    <span className="text-[9.5px] text-slate-400 font-mono">
                      {formatFileSize(doc.fileSize)}
                    </span>
                    {isReady ? (
                      <span className="flex items-center gap-1 text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold ml-auto">
                        <ShieldCheck className="size-3" />
                        Sẵn sàng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold ml-auto">
                        <Loader2 className="size-3 animate-spin" />
                        Đang xử lý
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Sessions Drawer Section ── */}
      {sessions && sessions.length > 0 && (
        <div className="border-t border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/50 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <div className="flex items-center gap-1.5">
              <History className="size-3.5 text-slate-400" />
              <span>Lịch sử hội thoại ({sessions.length})</span>
            </div>
            {onClearAllSessions && (
              <button
                onClick={onClearAllSessions}
                className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline font-semibold cursor-pointer transition-colors"
                title="Xóa tất cả lịch sử hội thoại"
              >
                Xóa tất cả
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => onSelectSession?.(sess.id)}
                className={cn(
                  'group flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer w-full',
                  activeSessionId === sess.id
                    ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : sess.isPinned
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
                <span className="truncate flex-1">{sess.title || `Hội thoại #${sess.id}`}</span>
                
                {onTogglePinSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTogglePinSession(sess.id)
                    }}
                    className={cn(
                      'p-1 rounded-lg transition-colors cursor-pointer',
                      sess.isPinned
                        ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-955/40 opacity-0 group-hover:opacity-100'
                    )}
                    title={sess.isPinned ? 'Bỏ ghim cuộc trò chuyện' : 'Ghim cuộc trò chuyện'}
                  >
                    {sess.isPinned ? <Pin className="size-3.5 fill-amber-500 text-amber-600" /> : <Pin className="size-3.5" />}
                  </button>
                )}

                {onDeleteSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteSession(sess.id)
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/40 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Xóa cuộc trò chuyện này"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
                {!sess.isPinned && <ChevronRight className="size-3 text-slate-400 shrink-0 group-hover:hidden" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
