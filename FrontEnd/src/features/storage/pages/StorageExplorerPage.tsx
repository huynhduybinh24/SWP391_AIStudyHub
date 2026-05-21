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
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

const INITIAL_FOLDERS = [
  { id: '1', name: 'Physics 101', items: '12 Items', size: '1.2 GB', color: '#2563eb', bgColor: '#dbeafe', category: 'Study' },
  { id: '2', name: 'Advanced Calculus', items: '45 Items', size: '3.4 GB', color: '#0d9488', bgColor: '#ccfbf1', category: 'Study' },
  { id: '3', name: 'Study Group S23', items: '8 Items', size: '450 MB', color: '#8b5cf6', bgColor: '#ede9fe', category: 'Study' },
  { id: '4', name: 'Archived Notes', items: '102 Items', size: '5.1 GB', color: '#475569', bgColor: '#f1f5f9', category: 'Archived' },
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
  const [folders, setFolders] = useState(INITIAL_FOLDERS)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [folderFilter, setFolderFilter] = useState('All Folders')
  const [typeFilter, setTypeFilter] = useState('All Types')
  
  const [showFolderDropdown, setShowFolderDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

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
      items: '0 Items',
      size: '0 MB',
      color: '#64748b',
      bgColor: '#f1f5f9',
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

  const chartData = [
    { name: 'Documents', value: 45, color: '#2563eb' },
    { name: 'Images', value: 20.5, color: '#0d9488' },
    { name: 'Other', value: 9.5, color: '#cbd5e1' },
    { name: 'Remaining', value: 25, color: '#e5eeff' },
  ]

  const folderOptions = ['All Folders', 'Study', 'Archived', 'New']
  const typeOptions = ['All Types', 'PDF', 'DOCX', 'Image', 'ZIP']

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header Area */}
      <div>
        <Link 
          to="/dashboard/storage" 
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Cloud Storage
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-foreground leading-tight">Storage Explorer</h1>
            <p className="text-muted mt-2 text-sm">
              Browse and organize all cloud-stored study files.
            </p>
          </div>
          <Button onClick={handleCreateFolder} variant="secondary" className="gap-2 bg-white h-10 px-4">
            <FolderPlus className="size-4" />
            New Folder
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
                placeholder="Find in Explorer..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none" ref={folderDropdownRef}>
                <button 
                  onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                  className="w-full sm:w-auto flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white text-sm font-medium hover:bg-slate-50 justify-between whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="size-4 text-muted" />
                    {folderFilter}
                  </div>
                  <ChevronDown className="size-4 text-muted" />
                </button>
                {showFolderDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border z-10 py-1">
                    {folderOptions.map(opt => (
                      <button
                        key={opt}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between text-foreground"
                        onClick={() => { setFolderFilter(opt); setShowFolderDropdown(false) }}
                      >
                        {opt}
                        {folderFilter === opt && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1 sm:flex-none" ref={typeDropdownRef}>
                <button 
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full sm:w-auto flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white text-sm font-medium hover:bg-slate-50 justify-between whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <FileIcon className="size-4 text-muted" />
                    {typeFilter}
                  </div>
                  <ChevronDown className="size-4 text-muted" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border z-10 py-1">
                    {typeOptions.map(opt => (
                      <button
                        key={opt}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between text-foreground"
                        onClick={() => { setTypeFilter(opt); setShowTypeDropdown(false) }}
                      >
                        {opt}
                        {typeFilter === opt && <Check className="size-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center h-10 rounded-lg border border-border bg-white p-1">
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
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Folders {filteredFolders.length}</h2>
            {filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm border border-dashed rounded-lg bg-white/50">
                No folders found.
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer border-border group">
                    <CardContent className="p-4 flex flex-col h-[120px] justify-between">
                      <div className="flex justify-between items-start">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center" 
                          style={{ backgroundColor: folder.bgColor }}
                        >
                          <Folder className="size-5" style={{ color: folder.color }} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete folder"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-foreground truncate">{folder.name}</h3>
                        <div className="flex items-center justify-between mt-1 text-xs text-muted font-medium">
                          <span>{folder.items}</span>
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
                  <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer border-border group">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                          style={{ backgroundColor: folder.bgColor }}
                        >
                          <Folder className="size-5" style={{ color: folder.color }} fill="currentColor" fillOpacity={0.2} />
                        </div>
                        <h3 className="font-semibold text-[15px] text-foreground truncate max-w-[200px] sm:max-w-[300px]">{folder.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="hidden sm:flex items-center gap-8 text-sm text-muted font-medium w-[150px] justify-between">
                          <span>{folder.items}</span>
                          <span>{folder.size}</span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete folder"
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
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Files Displaying {filteredFiles.length}</h2>
            {filteredFiles.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm border border-dashed rounded-lg bg-white/50">
                No files found.
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="p-3 flex flex-col hover:shadow-md transition-shadow cursor-pointer border-border group">
                    <div className="aspect-[4/3] rounded-lg bg-[#f8fafc] border border-slate-100 flex items-center justify-center relative mb-3 overflow-hidden">
                      <file.icon className="size-12 text-[#93c5fd]" strokeWidth={1.5} />
                      {file.aiSummarized && (
                        <div className="absolute bottom-2 left-2 bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-teal-100 shadow-sm">
                          <Sparkles className="size-3" />
                          AI SUMMARIZED
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="absolute top-2 right-2 text-muted hover:text-red-500 p-1.5 bg-white shadow-sm border border-slate-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete file"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="px-1 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-[13px] text-foreground line-clamp-2 leading-snug" title={file.name}>{file.name}</h3>
                      <p className="text-[11px] text-muted mt-1.5">{file.modified}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="p-3 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer border-border group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f8fafc] border border-slate-100 flex items-center justify-center shrink-0">
                        <file.icon className="size-5 text-[#93c5fd]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[14px] text-foreground truncate max-w-[200px] sm:max-w-[400px]" title={file.name}>{file.name}</h3>
                        <p className="text-[11px] text-muted mt-0.5">{file.modified}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                      {file.aiSummarized && (
                        <div className="hidden sm:flex bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-1 rounded items-center gap-1 border border-teal-100">
                          <Sparkles className="size-3" />
                          AI SUMMARIZED
                        </div>
                      )}
                      <button 
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="text-muted hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete file"
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
        <Card className="w-full lg:w-[320px] shrink-0 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Cloud className="size-5 text-primary" />
              <h2 className="font-semibold text-foreground">Storage Status</h2>
            </div>
            
            <div className="w-[180px] h-[180px] relative mx-auto">
              <ResponsiveContainer width="100%" height="100%">
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
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-foreground">75%</span>
                <span className="text-xs text-muted font-medium mt-1">Used</span>
              </div>
            </div>

            <div className="text-center mt-6 mb-8">
              <h3 className="font-bold text-foreground text-[15px]">75 GB of 100 GB</h3>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></div>
                  <span className="text-foreground font-medium">Documents</span>
                </div>
                <span className="text-muted font-medium">45.0 GB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0d9488]"></div>
                  <span className="text-foreground font-medium">Images</span>
                </div>
                <span className="text-muted font-medium">20.5 GB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1]"></div>
                  <span className="text-foreground font-medium">Other</span>
                </div>
                <span className="text-muted font-medium">9.5 GB</span>
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-lg p-4 text-center border border-slate-100">
              <h4 className="font-bold text-sm text-foreground">Need more space?</h4>
              <p className="text-[11px] text-muted mt-1.5 mb-4 leading-relaxed">
                Upgrade to Pro for 1TB of storage and advanced AI tools.
              </p>
              <Button 
                onClick={() => setIsPlanModalOpen(true)}
                variant="secondary" 
                className="w-full bg-white text-primary border border-primary/20 hover:bg-primary/5 h-9 text-sm transition-colors"
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)}
        title="Upgrade to Pro"
        description="Choose the right plan to expand your storage and AI capabilities."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Card className="border-border flex flex-col shadow-none">
            <CardContent className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-lg mb-2 text-foreground">Basic</h3>
              <div className="text-3xl font-bold mb-4 text-foreground">$0<span className="text-sm font-normal text-muted">/mo</span></div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="size-4 text-emerald-500"/> 100 GB Storage</li>
                <li className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 className="size-4 text-emerald-500"/> Basic AI Tools</li>
                <li className="flex items-center gap-2 text-sm text-muted opacity-50"><CheckCircle2 className="size-4 text-slate-300"/> Priority Support</li>
              </ul>
              <Button variant="secondary" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600" onClick={() => setIsPlanModalOpen(false)}>Current Plan</Button>
            </CardContent>
          </Card>

          <Card className="border-primary bg-primary/[0.03] flex flex-col relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-primary">Pro</h3>
                <Zap className="size-4 text-primary fill-primary/20" />
              </div>
              <div className="text-3xl font-bold mb-4 text-foreground">$9.99<span className="text-sm font-normal text-muted">/mo</span></div>
              <ul className="space-y-3 mb-6 flex-1">
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary"/> 1 TB Storage</li>
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary"/> Advanced AI Summarization</li>
                <li className="flex items-center gap-2 text-sm text-foreground font-medium"><CheckCircle2 className="size-4 text-primary"/> Priority Support</li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => setIsPlanModalOpen(false)}>Upgrade Now</Button>
            </CardContent>
          </Card>
        </div>
      </Modal>
    </div>
  )
}
