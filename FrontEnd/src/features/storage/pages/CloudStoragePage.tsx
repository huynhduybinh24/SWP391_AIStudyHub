import {
  Cloud,
  FileText,
  FolderSearch,
  HardDrive,
  Upload,
  FolderOpen,
  FileSpreadsheet,
  Eraser,
  Trash2,
  FileIcon,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useState, useRef, useMemo } from 'react'

const INITIAL_UPLOADS = [
  {
    id: '1',
    name: 'Advanced_Calculus_Ch4.pdf',
    sizeBytes: 2.4 * 1024 * 1024,
    time: 'Just now',
    type: 'pdf',
    icon: FileText,
    iconColor: 'text-[#ef4444]',
    bgColor: 'bg-[#fee2e2]',
  },
  {
    id: '2',
    name: 'History_Midterm_Notes.docx',
    sizeBytes: 1.1 * 1024 * 1024,
    time: '2 hours ago',
    type: 'doc',
    icon: FileText,
    iconColor: 'text-[#3b82f6]',
    bgColor: 'bg-[#dbeafe]',
  },
  {
    id: '3',
    name: 'Lab_Results_Dataset.xlsx',
    sizeBytes: 4.8 * 1024 * 1024,
    time: 'Yesterday',
    type: 'xls',
    icon: FileSpreadsheet,
    iconColor: 'text-[#22c55e]',
    bgColor: 'bg-[#dcfce7]',
  },
]

const BASE_USED_STORAGE_GB = 74.992; // Baseline used storage (75GB - 8.3MB)
const TOTAL_STORAGE_GB = 100;
const SHARED_FILES_GB = 1.2;

const getFileExtensionInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return { icon: FileText, iconColor: 'text-[#ef4444]', bgColor: 'bg-[#fee2e2]' };
  if (['doc', 'docx'].includes(ext || '')) return { icon: FileText, iconColor: 'text-[#3b82f6]', bgColor: 'bg-[#dbeafe]' };
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return { icon: FileSpreadsheet, iconColor: 'text-[#22c55e]', bgColor: 'bg-[#dcfce7]' };
  return { icon: FileIcon, iconColor: 'text-[#64748b]', bgColor: 'bg-[#f1f5f9]' };
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function CloudStoragePage() {
  const [uploads, setUploads] = useState(INITIAL_UPLOADS)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentUploadsSizeGB = useMemo(() => {
    const totalBytes = uploads.reduce((acc, curr) => acc + curr.sizeBytes, 0)
    return totalBytes / (1024 * 1024 * 1024)
  }, [uploads])

  const totalUsedGB = (BASE_USED_STORAGE_GB + recentUploadsSizeGB).toFixed(1)
  const remainingGB = (TOTAL_STORAGE_GB - parseFloat(totalUsedGB)).toFixed(1)
  const usedPercentage = Math.round((parseFloat(totalUsedGB) / TOTAL_STORAGE_GB) * 100)

  const chartData = [
    { name: 'Used', value: usedPercentage, color: '#2563eb' },
    { name: 'Remaining', value: 100 - usedPercentage, color: '#e5eeff' },
  ]

  const subjects = [
    { name: 'Computer Science', size: `${(45 + recentUploadsSizeGB).toFixed(1)} GB`, progress: 45 + Math.round(recentUploadsSizeGB), color: '#2563eb' },
    { name: 'Mathematics', size: '15 GB', progress: 15, color: '#8b5cf6' },
    { name: 'Literature', size: '8 GB', progress: 8, color: '#0f766e' },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const { icon, iconColor, bgColor } = getFileExtensionInfo(file.name);
      
      const newUpload = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        sizeBytes: file.size,
        time: 'Just now',
        type: file.name.split('.').pop() || '',
        icon,
        iconColor,
        bgColor
      };
      
      setUploads(prev => [newUpload, ...prev]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleDelete = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  }

  const handleCleanUp = () => {
    setUploads([]);
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cloud Storage</h1>
          <p className="text-muted mt-2 text-sm">
            Manage your study files and storage space in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCleanUp} variant="secondary" className="h-[52px] px-4 justify-start text-left font-medium text-sm text-foreground">
            <Eraser className="size-4 text-muted-foreground mr-1" />
            <div className="leading-tight">
              Clean Up<br />Storage
            </div>
          </Button>
          <Link to="/dashboard/storage/explorer" className="block">
            <Button variant="secondary" className="h-[52px] px-4 justify-start text-left font-medium text-sm text-foreground w-full">
              <FolderSearch className="size-4 text-muted-foreground mr-1" />
              <div className="leading-tight">
                Storage<br />Explorer
              </div>
            </Button>
          </Link>
          <Button onClick={handleUploadClick} variant="primary" className="h-[52px] px-4 justify-start text-left font-medium text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none shadow-sm">
            <Upload className="size-4 mr-1" />
            <div className="leading-tight">
              Upload<br />File
            </div>
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <HardDrive className="size-4 text-primary" />
              Total Storage
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{TOTAL_STORAGE_GB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FileText className="size-4 text-[#8b5cf6]" />
              Used Storage
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{totalUsedGB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <Cloud className="size-4 text-[#0ea5e9]" />
              Remaining
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{remainingGB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FolderOpen className="size-4 text-[#2563eb]" />
              Shared Files
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{SHARED_FILES_GB} GB</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Uploads */}
        <Card className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold text-foreground text-[15px]">Recent Uploads</h2>
            <button className="text-primary text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="flex flex-col">
            {uploads.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">
                No recent uploads.
              </div>
            ) : (
              uploads.map((file, i) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 p-5 group ${
                    i !== uploads.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${file.bgColor}`}>
                    <file.icon className={`size-6 ${file.iconColor}`} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium text-foreground text-[15px]">
                      {file.name}
                    </span>
                    <span className="text-muted text-xs mt-0.5">
                      {formatSize(file.sizeBytes)} • {file.time}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete file"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column - Usage and Subjects */}
        <div className="flex flex-col gap-6">
          {/* Usage Circle Chart Card */}
          <Card className="flex flex-col items-center text-center p-6 pb-8">
            <div className="w-[160px] h-[160px] relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={62}
                    outerRadius={80}
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
                <span className="text-4xl font-bold text-foreground">{usedPercentage}%</span>
              </div>
            </div>
            
            <h3 className="font-bold text-foreground text-[15px] mt-4">
              {totalUsedGB} GB of {TOTAL_STORAGE_GB} GB used
            </h3>
            <p className="text-muted text-xs mt-1.5 mb-6 max-w-[200px]">
              You're approaching your limit.
            </p>
            
            <Button variant="secondary" className="w-full text-[#2563eb] bg-[#f0f4ff] border-none hover:bg-[#e0e8ff]">
              Manage Storage
            </Button>
          </Card>

          {/* Storage by Subject Card */}
          <Card>
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground text-[15px]">Storage by Subject</h2>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {subjects.map((subject) => (
                <div key={subject.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-body">{subject.name}</span>
                    <span className="text-muted">{subject.size}</span>
                  </div>
                  <div className="w-full bg-[#f1f3f5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        width: `${subject.progress}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
