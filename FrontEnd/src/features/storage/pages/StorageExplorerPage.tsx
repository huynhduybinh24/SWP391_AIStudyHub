import {
  ArrowLeft,
  FolderPlus,
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  Folder,
  Cloud,
  FileText,
  FileImage,
  FileIcon,
  Sparkles,
  Trash2,
  Plus
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const INITIAL_FOLDERS = [
  { id: '1', name: 'Physics 101', items: '12 Items', size: '1.2 GB', color: '#2563eb', bgColor: '#dbeafe' },
  { id: '2', name: 'Advanced Calculus', items: '45 Items', size: '3.4 GB', color: '#0d9488', bgColor: '#ccfbf1' },
  { id: '3', name: 'Study Group S23', items: '8 Items', size: '450 MB', color: '#8b5cf6', bgColor: '#ede9fe' },
  { id: '4', name: 'Archived Notes', items: '102 Items', size: '5.1 GB', color: '#475569', bgColor: '#f1f5f9' },
]

const INITIAL_FILES = [
  {
    id: '1',
    name: 'Chapter_7_Quantum_Mechanics.pdf',
    modified: 'Modified 2 hours ago',
    icon: FileText,
    iconColor: '#3b82f6',
    aiSummarized: true,
  },
  {
    id: '2',
    name: 'Draft_Final_Essay_History.docx',
    modified: 'Modified Yesterday',
    icon: FileText,
    iconColor: '#3b82f6',
  },
  {
    id: '3',
    name: 'Whiteboard_Lecture_3.jpg',
    modified: 'Modified Oct 12',
    icon: FileImage,
    iconColor: '#3b82f6',
  },
]

export function StorageExplorerPage() {
  const [folders, setFolders] = useState(INITIAL_FOLDERS)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateFolder = () => {
    const newFolder = {
      id: Math.random().toString(36).substring(7),
      name: 'New Folder',
      items: '0 Items',
      size: '0 MB',
      color: '#64748b',
      bgColor: '#f1f5f9',
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
    if (!searchQuery) return folders
    return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [folders, searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [files, searchQuery])

  const chartData = [
    { name: 'Documents', value: 45, color: '#2563eb' },
    { name: 'Images', value: 20.5, color: '#0d9488' },
    { name: 'Other', value: 9.5, color: '#cbd5e1' },
    { name: 'Remaining', value: 25, color: '#e5eeff' },
  ]

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
            <div className="relative flex-1">
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
              <button className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white text-sm font-medium hover:bg-slate-50 flex-1 sm:flex-none justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="size-4 text-muted" />
                  All Folders
                </div>
                <ChevronDown className="size-4 text-muted" />
              </button>
              <button className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white text-sm font-medium hover:bg-slate-50 flex-1 sm:flex-none justify-between">
                <div className="flex items-center gap-2">
                  <FileIcon className="size-4 text-muted" />
                  All Types
                </div>
                <ChevronDown className="size-4 text-muted" />
              </button>
              <div className="flex items-center h-10 rounded-lg border border-border bg-white p-1">
                <button className="p-1.5 rounded bg-primary/10 text-primary">
                  <LayoutGrid className="size-4" />
                </button>
                <button className="p-1.5 rounded text-muted hover:text-foreground">
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* FOLDERS Section */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Folders {filteredFolders.length}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredFolders.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted text-sm border border-dashed rounded-lg">
                  No folders found.
                </div>
              )}
              {filteredFolders.map((folder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer border-border">
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
          </div>

          {/* RECENT FILES Section */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Recent Files Displaying {filteredFiles.length}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted text-sm border border-dashed rounded-lg">
                  No files found.
                </div>
              )}
              {filteredFiles.map((file) => (
                <Card key={file.id} className="p-3 flex flex-col hover:shadow-md transition-shadow cursor-pointer border-border group">
                  <div className="aspect-[4/3] rounded-lg bg-[#f8fafc] border border-slate-100 flex items-center justify-center relative mb-3">
                    <file.icon className="size-12 text-[#93c5fd]" strokeWidth={1.5} />
                    {file.aiSummarized && (
                      <div className="absolute bottom-2 left-2 bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-teal-100">
                        <Sparkles className="size-3" />
                        AI SUMMARIZED
                      </div>
                    )}
                    <button 
                      onClick={(e) => handleDeleteFile(file.id, e)}
                      className="absolute top-2 right-2 text-muted hover:text-red-500 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete file"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="px-1 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-[13px] text-foreground line-clamp-2 leading-snug">{file.name}</h3>
                    <p className="text-[11px] text-muted mt-1.5">{file.modified}</p>
                  </div>
                </Card>
              ))}
            </div>
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
              <div className="absolute inset-0 flex items-center justify-center flex-col">
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
              <Button variant="secondary" className="w-full bg-white text-primary border border-primary/20 hover:bg-primary/5 h-9 text-sm">
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
