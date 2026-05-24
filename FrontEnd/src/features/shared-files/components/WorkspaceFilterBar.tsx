import { useState, useRef, useEffect } from 'react'
import { Search, Grid, List, ChevronDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface WorkspaceFilterBarProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  fileTypeFilter: string
  onFileTypeChange: (val: string) => void
  sortOrder: string
  onSortOrderChange: (val: string) => void
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  peopleFilter: string
  onPeopleFilterChange: (val: string) => void
  lastModifiedFilter: string
  onLastModifiedFilterChange: (val: string) => void
  sourceFilter: string
  onSourceFilterChange: (val: string) => void
}

export function WorkspaceFilterBar({
  searchQuery,
  onSearchChange,
  fileTypeFilter,
  onFileTypeChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  peopleFilter,
  onPeopleFilterChange,
  lastModifiedFilter,
  onLastModifiedFilterChange,
  sourceFilter,
  onSourceFilterChange
}: WorkspaceFilterBarProps) {
  const { t, language } = useTranslation()
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isPeopleOpen, setIsPeopleOpen] = useState(false)
  const [isModifiedOpen, setIsModifiedOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  
  const typeRef = useRef<HTMLDivElement>(null)
  const peopleRef = useRef<HTMLDivElement>(null)
  const modifiedRef = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (typeRef.current && !typeRef.current.contains(target)) setIsTypeOpen(false)
      if (peopleRef.current && !peopleRef.current.contains(target)) setIsPeopleOpen(false)
      if (modifiedRef.current && !modifiedRef.current.contains(target)) setIsModifiedOpen(false)
      if (sourceRef.current && !sourceRef.current.contains(target)) setIsSourceOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Translations for chips labels
  const getTypeText = (val: string) => {
    if (val === 'All') return t.sharedFiles.allTypes || 'All Types'
    if (val === 'pdf') return 'PDF'
    if (val === 'doc') return language === 'vi' ? 'Tài liệu' : (language === 'ja' ? 'ドキュメント' : (language === 'ko' ? '문서' : 'Documents'))
    if (val === 'spreadsheet') return language === 'vi' ? 'Bảng tính' : (language === 'ja' ? 'スプレッドシート' : (language === 'ko' ? '스프레드시트' : 'Spreadsheets'))
    if (val === 'image') return language === 'vi' ? 'Hình ảnh' : (language === 'ja' ? '画像' : (language === 'ko' ? '이미지' : 'Images'))
    if (val === 'video') return 'Video'
    if (val === 'folder') return language === 'vi' ? 'Thư mục' : (language === 'ja' ? 'フォルダ' : (language === 'ko' ? '폴더' : 'Folders'))
    return val
  }

  const getPeopleText = (val: string) => {
    if (val === 'All') return t.sharedFiles.people || 'People'
    return val.split('@')[0]
  }

  const getModifiedText = (val: string) => {
    if (val === 'All') return t.sharedFiles.lastModified || 'Last modified'
    if (val === 'today') return language === 'vi' ? 'Hôm nay' : (language === 'ja' ? '今日' : (language === 'ko' ? '오늘' : 'Today'))
    if (val === 'thisWeek') return language === 'vi' ? 'Tuần này' : (language === 'ja' ? '今週' : (language === 'ko' ? '이번 주' : 'This week'))
    if (val === 'lastWeek') return language === 'vi' ? 'Tuần trước' : (language === 'ja' ? '先週' : (language === 'ko' ? '지난주' : 'Last week'))
    return val
  }

  const getSourceText = (val: string) => {
    if (val === 'All') return t.sharedFiles.source || 'Source'
    if (val === 'sharedWithMe') return language === 'vi' ? 'Chia sẻ với tôi' : (language === 'ja' ? '共有されたファイル' : (language === 'ko' ? '공유받은 파일' : 'Shared with me'))
    if (val === 'ownedByMe') return language === 'vi' ? 'Tôi sở hữu' : (language === 'ja' ? '自分が所有' : (language === 'ko' ? '소유한 파일' : 'Owned by me'))
    return val
  }

  const types = ['All', 'pdf', 'doc', 'spreadsheet', 'image', 'video', 'folder']
  const people = ['All', 'khoigm2005@gmail.com', 'ashleyho@iv.com', 'trancaocamti@tdtu.edu.vn', 'khanh122233@gmail.com']
  const modifiedTimes = [
    { label: language === 'vi' ? 'Bất kỳ lúc nào' : 'Any time', value: 'All' },
    { label: language === 'vi' ? 'Hôm nay' : 'Today', value: 'today' },
    { label: language === 'vi' ? 'Đầu tuần này' : 'This week', value: 'thisWeek' },
    { label: language === 'vi' ? 'Tuần trước' : 'Last week', value: 'lastWeek' }
  ]
  const sources = [
    { label: language === 'vi' ? 'Bất kỳ nguồn nào' : 'Any source', value: 'All' },
    { label: language === 'vi' ? 'Được chia sẻ với tôi' : 'Shared with me', value: 'sharedWithMe' },
    { label: language === 'vi' ? 'Do tôi sở hữu' : 'Owned by me', value: 'ownedByMe' }
  ]

  const chipBaseClass = "flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold select-none cursor-pointer transition-all focus:outline-none"

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between py-3 border-b border-slate-200/60 dark:border-slate-800/80 pb-5 select-none">
      
      {/* Search and Filters side */}
      <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3 min-w-0">
        
        {/* Rounded-full Search bar */}
        <div className="relative w-full sm:w-64 md:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t.sharedFiles.smartFilterPlaceholder || "Smart filter files..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Smart filter files"
            className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2 text-xs text-slate-850 dark:text-slate-200 placeholder:text-slate-400/80 focus:border-blue-500 dark:focus:border-blue-500/80 focus:outline-none focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/10 transition-all shadow-xs"
          />
        </div>

        {/* Dynamic Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          
          {/* 1. Type Dropdown Chip */}
          <div className="relative" ref={typeRef}>
            <button
              type="button"
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className={cn(
                chipBaseClass,
                fileTypeFilter !== 'All'
                  ? "bg-blue-55/10 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span>{getTypeText(fileTypeFilter)}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            
            {isTypeOpen && (
              <div className="absolute left-0 mt-1.5 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
                {types.map((tVal) => (
                  <button
                    key={tVal}
                    type="button"
                    onClick={() => {
                      onFileTypeChange(tVal)
                      setIsTypeOpen(false)
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer",
                      fileTypeFilter === tVal ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {getTypeText(tVal)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. People Dropdown Chip */}
          <div className="relative" ref={peopleRef}>
            <button
              type="button"
              onClick={() => setIsPeopleOpen(!isPeopleOpen)}
              className={cn(
                chipBaseClass,
                peopleFilter !== 'All'
                  ? "bg-blue-55/10 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span>{getPeopleText(peopleFilter)}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            
            {isPeopleOpen && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
                {people.map((pVal) => (
                  <button
                    key={pVal}
                    type="button"
                    onClick={() => {
                      onPeopleFilterChange(pVal)
                      setIsPeopleOpen(false)
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer truncate",
                      peopleFilter === pVal ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                    )}
                    title={pVal}
                  >
                    {pVal === 'All' ? (t.sharedFiles.people || 'People') : pVal}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Last Modified Dropdown Chip */}
          <div className="relative" ref={modifiedRef}>
            <button
              type="button"
              onClick={() => setIsModifiedOpen(!isModifiedOpen)}
              className={cn(
                chipBaseClass,
                lastModifiedFilter !== 'All'
                  ? "bg-blue-55/10 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span>{getModifiedText(lastModifiedFilter)}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            
            {isModifiedOpen && (
              <div className="absolute left-0 mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
                {modifiedTimes.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      onLastModifiedFilterChange(m.value)
                      setIsModifiedOpen(false)
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer",
                      lastModifiedFilter === m.value ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Source Dropdown Chip */}
          <div className="relative" ref={sourceRef}>
            <button
              type="button"
              onClick={() => setIsSourceOpen(!isSourceOpen)}
              className={cn(
                chipBaseClass,
                sourceFilter !== 'All'
                  ? "bg-blue-55/10 border-blue-200 text-blue-600 dark:bg-blue-955/20 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span>{getSourceText(sourceFilter)}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
            
            {isSourceOpen && (
              <div className="absolute left-0 mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
                {sources.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      onSourceFilterChange(s.value)
                      setIsSourceOpen(false)
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-105 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer",
                      sourceFilter === s.value ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Right Toggles side */}
      <div className="flex items-center gap-3.5 self-end lg:self-auto shrink-0">
        
        {/* Google Drive styled view toggle pill */}
        <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={cn(
              'rounded-full p-1.5 transition-all duration-200 cursor-pointer',
              viewMode === 'list'
                ? 'bg-blue-50 text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
            )}
            title={t.sharedFiles.listView}
            aria-label={t.sharedFiles.listView}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'rounded-full p-1.5 transition-all duration-200 cursor-pointer',
              viewMode === 'grid'
                ? 'bg-blue-50 text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
            )}
            title={t.sharedFiles.gridView}
            aria-label={t.sharedFiles.gridView}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>

        {/* Info Icon */}
        <button
          type="button"
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          title="View Details"
          aria-label="View Details"
        >
          <Info className="h-4 w-4" />
        </button>

      </div>

    </div>
  )
}

export default WorkspaceFilterBar
