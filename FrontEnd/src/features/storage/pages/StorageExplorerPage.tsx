import {
  ArrowLeft,
  FolderPlus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  Folder,
  Cloud,
  FileText,
  FileImage,
  FileIcon,
  Sparkles,
  Trash2,
  Check,
  CheckCircle2,
  Zap
} from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { useTranslation } from '@/context/LanguageContext'
import { storageService, type StorageUsage } from '@/services/storageService'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { formatStorageSize, calculateStorageUsage } from '@/utils/storageFormat'

const INITIAL_FOLDERS = [
  { id: '1', name: 'Physics 101', itemsCount: 12, size: '1.2 GB', color: '#2563eb', bgColor: '#dbeafe', category: 'Study' },
  { id: '2', name: 'Advanced Calculus', itemsCount: 45, size: '3.4 GB', color: '#0d9488', bgColor: '#ccfbf1', category: 'Study' },
  { id: '3', name: 'Study Group S23', itemsCount: 8, size: '450 MB', color: '#8b5cf6', bgColor: '#ede9fe', category: 'Study' },
  { id: '4', name: 'Archived Notes', itemsCount: 102, size: '5.1 GB', color: '#475569', bgColor: '#f1f5f9', category: 'Archived' },
]

const INITIAL_FILES = [
  {
    id: '1',
    name: 'Chapter_4_Quantum_Mechanics.pdf',
    modified: 'Modified 2 hours ago',
    icon: FileText,
    type: 'PDF',
    aiSummarized: true,
  },
  {
    id: '2',
    name: 'Draft_Final_Essay_History.docx',
    modified: 'Modified Yesterday',
    icon: FileText,
    type: 'DOCX',
  },
  {
    id: '3',
    name: 'Whiteboard_Lecture_3.jpg',
    modified: 'Modified Oct 12',
    icon: FileImage,
    type: 'Image',
  },
  {
    id: '4',
    name: 'Calculus_Formula_Sheet.pdf',
    modified: 'Modified Oct 10',
    icon: FileText,
    type: 'PDF',
  },
  {
    id: '5',
    name: 'Group_Project_Notes.docx',
    modified: 'Modified Oct 8',
    icon: FileText,
    type: 'DOCX',
  },
  {
    id: '6',
    name: 'Physics_Diagram.png',
    modified: 'Modified Oct 5',
    icon: FileImage,
    type: 'Image',
  },
]

export function StorageExplorerPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { t, language } = useTranslation()
  
  const [usage, setUsage] = useState<StorageUsage | null>(null)

  useEffect(() => {
    if (user?.id) {
      storageService.getStorageUsage(Number(user.id))
        .then(data => {
          setUsage(data)
        })
        .catch(err => {
          console.error("Failed to fetch storage usage:", err)
        })
    }
  }, [user?.id])

  const totalMb = getStorageLimitByPlan(user?.plan)
  const totalGb = totalMb / 1024

  const usedMb = usage
    ? usage.storageUsedMb
    : user?.plan === 'pro'
      ? 2457.6
      : (user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')
        ? 8192
        : 8

  const usedGb = usedMb / 1024
  const usageInfo = calculateStorageUsage(usedMb, totalMb)
  const usedPercentage = usageInfo.percentage

  const displayUsedGb = parseFloat(usedGb.toFixed(3))
  const displayTotalGb = parseFloat(totalGb.toFixed(1))
  const [folders, setFolders] = useState(INITIAL_FOLDERS)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [folderFilter, setFolderFilter] = useState('All Folders')
  const [typeFilter, setTypeFilter] = useState('All Types')
  
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const folderDropdownRef = useRef<HTMLDivElement>(null)
  const typeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setShowFolderDropdown(false)
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCreateFolder = () => {
    const newFolder = {
      id: Math.random().toString(36).substring(7),
      name: 'New Folder',
      itemsCount: 0,
      size: '0 MB',
      color: '#64748b',
      bgColor: isDark ? '#334155' : '#f1f5f9',
      category: 'New'
    }
    setFolders([newFolder, ...folders])
  }

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFolders(folders.filter(f => f.id !== id))
  }

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFiles(files.filter(f => f.id !== id))
  }

  const filteredFolders = useMemo(() => {
    let result = folders
    if (folderFilter !== 'All Folders') {
      result = result.filter(f => f.category === folderFilter)
    }
    if (searchQuery) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return result
  }, [folders, searchQuery, folderFilter])

  const filteredFiles = useMemo(() => {
    let result = files
    if (typeFilter !== 'All Types') {
      result = result.filter(f => f.type === typeFilter)
    }
    if (searchQuery) {
      result = result.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return result
  }, [files, searchQuery, typeFilter])

  const chartData = useMemo(() => {
    const pctDoc = Math.round(usedPercentage * 0.6)
    const pctImg = Math.round(usedPercentage * 0.3)
    const pctOther = Math.round(usedPercentage * 0.1)
    const pctRemaining = Math.max(0, 100 - (pctDoc + pctImg + pctOther))
    return [
      { name: 'Documents', value: pctDoc, color: '#2563eb' },
      { name: 'Images', value: pctImg, color: '#0d9488' },
      { name: 'Other', value: pctOther, color: isDark ? '#334155' : '#cbd5e1' },
      { name: 'Remaining', value: pctRemaining, color: isDark ? '#1e293b' : '#e5eeff' },
    ]
  }, [usedPercentage, isDark])

  const folderOptions = ['All Folders', 'Study', 'Archived', 'New']
  const typeOptions = ['All Types', 'PDF', 'DOCX', 'Image', 'ZIP']

  const getFolderFilterLabel = (opt: string) => {
    switch (opt) {
      case 'All Folders': return t.storageExplorer.filterAllFolders
      case 'Study': return t.storageExplorer.filterStudy
      case 'Archived': return t.storageExplorer.filterArchived
      case 'New': return t.storageExplorer.filterNew
      default: return opt
    }
  }

  const getTypeFilterLabel = (opt: string) => {
    switch (opt) {
      case 'All Types': return t.storageExplorer.filterAllTypes
      case 'PDF': return t.storageExplorer.filterPdf
      case 'DOCX': return t.storageExplorer.filterDocx
      case 'Image': return t.storageExplorer.filterImage
      case 'ZIP': return t.storageExplorer.filterZip
      default: return opt
    }
  }

  const getLocalizedModified = (modified: string) => {
    if (modified.includes('2 hours ago')) return t.storageExplorer.modified2h
    if (modified.includes('Yesterday')) return t.storageExplorer.modifiedYesterday
    if (modified.includes('Oct 12')) return t.storageExplorer.modifiedOct12
    if (modified.includes('Oct 10')) return t.storageExplorer.modifiedOct10
    if (modified.includes('Oct 8')) return t.storageExplorer.modifiedOct8
    if (modified.includes('Oct 5')) return t.storageExplorer.modifiedOct5
    return modified
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header Area */}
      <div>
        <Link 
          to="/dashboard/storage" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t.storageExplorer.backToStorage}
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-foreground leading-tight">{t.storageExplorer.title}</h1>
            <p className="text-muted mt-2 text-sm">
              {t.storageExplorer.subtitle}
            </p>
          </div>
          <Button onClick={handleCreateFolder} variant="secondary" className="gap-2 bg-white dark:bg-slate-900 border-border dark:border-slate-800 h-10 px-4 text-foreground">
            <FolderPlus className="size-4" />
            {t.storageExplorer.newFolder}
          </Button>
        </div>
      </div>

      {/* Main Layout: Left Content & Right Panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Content */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
              <input 
                type="text" 
                placeholder={t.storageExplorer.findInExplorer} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white dark:bg-slate-900 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none" ref={folderDropdownRef}>
                <button 
                  onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  className="w-full sm:w-auto flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 justify-between whitespace-nowrap text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="size-4 text-muted" />
                    {getFolderFilterLabel(folderFilter)}
                  </div>
                  <ChevronDown className="size-4 text-muted" />
                </button>
                {showFolderDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-border dark:border-slate-800 z-10 py-1">
                    {folderOptions.map(opt => (
                      <button
                        key={opt}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-foreground"
                        onClick={() => { setFolderFilter(opt); setShowFolderDropdown(false) }}
                      >
                        {getFolderFilterLabel(opt)}
                        {folderFilter === opt && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1 sm:flex-none" ref={typeDropdownRef}>
                <button 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full sm:w-auto flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white dark:bg-slate-900 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 justify-between whitespace-nowrap text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="size-4 text-muted" />
                    {getTypeFilterLabel(typeFilter)}
                  </div>
                  <ChevronDown className="size-4 text-muted" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-border dark:border-slate-800 z-10 py-1">
                    {typeOptions.map(opt => (
                      <button
                        key={opt}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-foreground"
                        onClick={() => { setTypeFilter(opt); setShowTypeDropdown(false) }}
                      >
                        {getTypeFilterLabel(opt)}
                        {typeFilter === opt && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center h-10 rounded-lg border border-border bg-white dark:bg-slate-900 p-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* FOLDERS Section */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{t.storageExplorer.folders(filteredFolders.length)}</h2>
            {filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm border border-dashed rounded-lg bg-white/50 dark:bg-slate-900/50 dark:border-slate-800">
                {t.storageExplorer.noFolders}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer border-border dark:border-slate-800 group">
                    <CardContent className="p-4 flex flex-col h-[120px] justify-between">
                      <div className="flex justify-between items-start">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center" 
                          style={{ backgroundColor: isDark ? `${folder.color}22` : folder.bgColor }}
                        >
                          <Folder className="size-5" style={{ color: folder.color }} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t.storageExplorer.deleteFolder}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-foreground truncate">{folder.name}</h3>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted font-medium">
                          <span>{t.storageExplorer.itemsCount(folder.itemsCount)}</span>
                          <span>{folder.size}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFolders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer border-border dark:border-slate-800 group">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                          style={{ backgroundColor: isDark ? `${folder.color}22` : folder.bgColor }}
                        >
                          <Folder className="size-5" style={{ color: folder.color }} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <h3 className="font-semibold text-[15px] text-foreground truncate max-w-[200px] sm:max-w-[300px]">{folder.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="hidden sm:flex items-center gap-8 text-sm text-muted font-medium w-[150px] justify-between">
                          <span>{t.storageExplorer.itemsCount(folder.itemsCount)}</span>
                          <span>{folder.size}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t.storageExplorer.deleteFolder}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RECENT FILES Section */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{t.storageExplorer.recentFiles(filteredFiles.length)}</h2>
            {filteredFiles.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm border border-dashed rounded-lg bg-white/50 dark:bg-slate-900/50 dark:border-slate-800">
                {t.storageExplorer.noFiles}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card 
                    key={file.id} 
                    onClick={() => navigate('/dashboard/storage/explorer/preview')}
                    className="p-3 flex flex-col hover:shadow-md transition-shadow cursor-pointer border-border dark:border-slate-800 group"
                  >
                    <div className="aspect-[4/3] rounded-lg bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative mb-3 overflow-hidden">
                      <file.icon className="size-12 text-[#93c5fd] dark:text-blue-500" strokeWidth={1.5} />
                      {file.aiSummarized && (
                        <div className="absolute bottom-2 left-2 bg-teal-50 dark:bg-emerald-950/20 text-teal-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-teal-100 dark:border-emerald-900/30 shadow-sm">
                          <Sparkles className="size-3" />
                          {t.storageExplorer.aiSummarized}
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="absolute top-2 right-2 text-muted hover:text-red-500 p-1.5 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.storageExplorer.deleteFile}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="px-1 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-[13px] text-foreground line-clamp-2 leading-snug" title={file.name}>{file.name}</h3>
                      <p className="text-[11px] text-muted mt-1.5">{getLocalizedModified(file.modified)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFiles.map((file) => (
                  <Card 
                    key={file.id} 
                    onClick={() => navigate('/dashboard/storage/explorer/preview')}
                    className="p-3 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer border-border dark:border-slate-800 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f8fafc] dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <file.icon className="size-5 text-[#93c5fd] dark:text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[14px] text-foreground truncate max-w-[200px] sm:max-w-[400px]" title={file.name}>{file.name}</h3>
                        <p className="text-[11px] text-muted mt-0.5">{getLocalizedModified(file.modified)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                      {file.aiSummarized && (
                        <div className="hidden sm:flex bg-teal-50 dark:bg-emerald-950/20 text-teal-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded items-center gap-1 border border-teal-100 dark:border-emerald-900/30">
                          <Sparkles className="size-3" />
                          {t.storageExplorer.aiSummarized}
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t.storageExplorer.deleteFile}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Storage Status */}
        <Card className="w-full lg:w-[320px] shrink-0 border-border dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Cloud className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">{t.storageExplorer.storageStatus}</h2>
            </div>
            
            <div className="w-[180px] h-[180px] relative mx-auto">
              {isMounted && (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={70}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-foreground">{usedPercentage}%</span>
                <span className="text-xs text-muted font-medium mt-1">{t.storageExplorer.used}</span>
              </div>
            </div>

            <div className="text-center mt-6 mb-8">
              <h3 className="font-bold text-foreground text-[15px]">{t.storageExplorer.usedOfText(displayUsedGb, displayTotalGb)}</h3>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></div>
                  <span className="text-foreground font-medium">{t.storageExplorer.documents}</span>
                </div>
                <span className="text-muted font-medium">{formatStorageSize(usedMb * 0.6)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0d9488]"></div>
                  <span className="text-foreground font-medium">{t.storageExplorer.images}</span>
                </div>
                <span className="text-muted font-medium">{formatStorageSize(usedMb * 0.3)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] dark:bg-slate-700"></div>
                  <span className="text-foreground font-medium">{t.storageExplorer.other}</span>
                </div>
                <span className="text-muted font-medium">{formatStorageSize(usedMb * 0.1)}</span>
              </div>
            </div>

            <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-lg p-4 text-center border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-foreground">{t.storageExplorer.needMoreSpace}</h4>
              <p className="text-[11px] text-muted mt-1.5 mb-4 leading-relaxed">
                {t.storageExplorer.upgradeDesc}
              </p>
              <Button 
                onClick={() => setIsPlanModalOpen(true)}
                variant="secondary" 
                className="w-full bg-white dark:bg-slate-950 text-primary dark:text-blue-400 border border-primary/20 dark:border-blue-900/40 hover:bg-primary/5 dark:hover:bg-blue-950/30 h-9 text-sm transition-colors"
              >
                {t.storageExplorer.viewPlans}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)}
        title={t.storageExplorer.upgradeModalTitle}
        description={t.storageExplorer.upgradeModalDesc}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Card className="border-border dark:border-slate-800 flex flex-col shadow-none">
            <CardContent className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-lg mb-2 text-foreground">{t.storageExplorer.basic}</h3>
              <div className="text-3xl font-bold mb-4 text-foreground">{language === 'vi' ? '0đ' : '0 VND'}<span className="text-sm font-normal text-muted">{t.storageExplorer.mo}</span></div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="size-4 text-emerald-500"/> {t.storageExplorer.storageItem(user?.plan === 'pro' ? '50 GB' : '10 GB')}</li>
                <li className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="size-4 text-emerald-500"/> {t.storageExplorer.basicAiTools}</li>
                <li className="flex items-center gap-2 text-sm text-muted opacity-50 dark:text-slate-600"><CheckCircle2 className="size-4 text-slate-300 dark:text-slate-700"/> {t.storageExplorer.prioritySupport}</li>
              </ul>
              <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-none" onClick={() => setIsPlanModalOpen(false)}>{t.storageExplorer.currentPlan}</Button>
            </CardContent>
          </Card>

          <Card className="border-primary dark:border-blue-500 bg-primary/[0.03] dark:bg-blue-950/10 flex flex-col relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">{t.storageExplorer.popular}</div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-primary dark:text-blue-400">{t.storageExplorer.pro}</h3>
                <Zap className="size-4 text-primary fill-primary/20 dark:text-blue-400 dark:fill-blue-400/20" />
              </div>
              <div className="text-3xl font-bold mb-4 text-foreground">{language === 'vi' ? '200.000đ' : '200,000 VND'}<span className="text-sm font-normal text-muted">{t.storageExplorer.mo}</span></div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary dark:text-blue-400"/> {t.storageExplorer.storageItem('1 TB')}</li>
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary dark:text-blue-400"/> {t.storageExplorer.advSummarization}</li>
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary dark:text-blue-400"/> {t.storageExplorer.prioritySupport}</li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => setIsPlanModalOpen(false)}>{t.storageExplorer.upgradeNow}</Button>
            </CardContent>
          </Card>
        </div>
      </Modal>
    </div>
  )
}
