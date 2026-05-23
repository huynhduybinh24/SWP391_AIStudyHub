import { useState, useRef, useEffect } from 'react'
import { Search, Grid, List, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceFilterBarProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  fileTypeFilter: string
  onFileTypeChange: (val: string) => void
  sortOrder: string
  onSortOrderChange: (val: string) => void
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
}

export function WorkspaceFilterBar({
  searchQuery,
  onSearchChange,
  fileTypeFilter,
  onFileTypeChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange
}: WorkspaceFilterBarProps) {
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  
  const typeRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const types = ['All', 'PDF', 'DOCX', 'XLSX', 'Folder']
  const sorts = [
    { label: 'Recent', value: 'recent' },
    { label: 'Oldest', value: 'oldest' }
  ]

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 pb-4 select-none">
      
      {/* Smart search input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Smart filter files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Smart filter files"
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
        />
      </div>

      {/* Filter Dropdowns & View toggles */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* File Type Filter */}
        <div className="relative" ref={typeRef}>
          <button
            type="button"
            onClick={() => setIsTypeOpen(!isTypeOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Type: {fileTypeFilter}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          
          {isTypeOpen && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    onFileTypeChange(t)
                    setIsTypeOpen(false)
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer",
                    fileTypeFilter === t ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {t === 'All' ? 'All Types' : t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="relative" ref={sortRef}>
          <button
            type="button"
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Sort: {sorts.find(s => s.value === sortOrder)?.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          
          {isSortOpen && (
            <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-30 animate-fade-in text-left">
              {sorts.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    onSortOrderChange(s.value)
                    setIsSortOpen(false)
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer",
                    sortOrder === s.value ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

        {/* Layout Mode Selector Toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={cn(
              'rounded-lg p-1.5 transition-all duration-200 cursor-pointer',
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            )}
            title="List View"
            aria-label="List View"
          >
            <List className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'rounded-lg p-1.5 transition-all duration-200 cursor-pointer',
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            )}
            title="Grid View"
            aria-label="Grid View"
          >
            <Grid className="h-4.5 w-4.5" />
          </button>
        </div>

      </div>
    </div>
  )
}

export default WorkspaceFilterBar
