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
  BarChart2,
  AlertTriangle,
  Archive,
  Trash,
  Zap
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useState, useRef, useMemo, useEffect } from 'react'
import { useTheme } from '@/features/settings/components/ThemeProvider'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

const formatFileTime = (time: string) => time;

const INITIAL_UPLOADS = [
  {
    id: '1',
    name: 'Advanced_Calculus_Ch4.pdf',
    sizeBytes: 2.4 * 1024 * 1024,
    time: 'Just now',
    type: 'pdf',
    icon: FileText,
    iconColor: 'text-[#ef4444]',
    bgColor: 'bg-[#fee2e2] dark:bg-[#fee2e2]/10',
  },
  {
    id: '2',
    name: 'History_Midterm_Notes.docx',
    sizeBytes: 1.1 * 1024 * 1024,
    time: '2 hours ago',
    type: 'doc',
    icon: FileText,
    iconColor: 'text-[#3b82f6]',
    bgColor: 'bg-[#dbeafe] dark:bg-[#dbeafe]/10',
  },
  {
    id: '3',
    name: 'Lab_Results_Dataset.xlsx',
    sizeBytes: 4.8 * 1024 * 1024,
    time: 'Yesterday',
    type: 'xls',
    icon: FileSpreadsheet,
    iconColor: 'text-[#22c55e]',
    bgColor: 'bg-[#dcfce7] dark:bg-[#dcfce7]/10',
  },
]

const SHARED_FILES_GB = 1.2;

const getFileExtensionInfo = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return { icon: FileText, iconColor: 'text-[#ef4444]', bgColor: 'bg-[#fee2e2] dark:bg-[#fee2e2]/10' };
  if (['doc', 'docx'].includes(ext || '')) return { icon: FileText, iconColor: 'text-[#3b82f6]', bgColor: 'bg-[#dbeafe] dark:bg-[#dbeafe]/10' };
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return { icon: FileSpreadsheet, iconColor: 'text-[#22c55e]', bgColor: 'bg-[#dcfce7] dark:bg-[#dcfce7]/10' };
  return { icon: FileIcon, iconColor: 'text-[#64748b]', bgColor: 'bg-[#f1f5f9] dark:bg-slate-800' };
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function CloudStoragePage() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  
  const TOTAL_STORAGE_GB = user?.plan === 'pro' 
    ? env.PRO_STORAGE_LIMIT 
    : user?.plan === 'institutional' 
      ? 1000 
      : env.FREE_STORAGE_LIMIT;

  const [uploads, setUploads] = useState(INITIAL_UPLOADS)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [baseUsedStorage, setBaseUsedStorage] = useState(!user || user.plan === 'free' ? 2.4 : 12.4)
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [trashSize, setTrashSize] = useState(!user || user.plan === 'free' ? 0.3 : 1.2)
  const [tempSize, setTempSize] = useState(!user || user.plan === 'free' ? 0.1 : 0.6)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const recentUploadsSizeGB = useMemo(() => {
    const totalBytes = uploads.reduce((acc, curr) => acc + curr.sizeBytes, 0)
    return totalBytes / (1024 * 1024 * 1024)
  }, [uploads])

  const totalUsedGB = (baseUsedStorage + recentUploadsSizeGB).toFixed(1)
  const remainingGB = (TOTAL_STORAGE_GB - parseFloat(totalUsedGB)).toFixed(1)
  const usedPercentage = Math.round((parseFloat(totalUsedGB) / TOTAL_STORAGE_GB) * 100)

  const chartData = [
    { name: 'Used', value: usedPercentage, color: '#2563eb' },
    { name: 'Remaining', value: 100 - usedPercentage, color: isDark ? '#1e293b' : '#e5eeff' },
  ]

  const subjects = [
    { name: 'Computer Science', size: `${(baseUsedStorage * 0.6 + recentUploadsSizeGB).toFixed(1)} GB`, progress: (baseUsedStorage * 0.6 / TOTAL_STORAGE_GB) * 100 + Math.round(recentUploadsSizeGB), color: '#2563eb' },
    { name: 'Mathematics', size: `${(baseUsedStorage * 0.3).toFixed(1)} GB`, progress: (baseUsedStorage * 0.3 / TOTAL_STORAGE_GB) * 100, color: '#8b5cf6' },
    { name: 'Literature', size: `${(baseUsedStorage * 0.1).toFixed(1)} GB`, progress: (baseUsedStorage * 0.1 / TOTAL_STORAGE_GB) * 100, color: '#0f766e' },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newUploadSizeGB = file.size / (1024 * 1024 * 1024);
      
      if (parseFloat(totalUsedGB) + newUploadSizeGB > TOTAL_STORAGE_GB) {
        toast.error(`Storage limit exceeded. Upgrade to Pro for ${env.PRO_STORAGE_LIMIT}GB storage.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
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
          <h1 className="text-3xl font-bold text-foreground">{t.cloudStorage.title}</h1>
          <p className="text-muted mt-2 text-sm">
            {t.cloudStorage.subtitle}
          </p>
          {/* Active Plan Badge */}
          <div className="mt-3.5 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.common.currentAccountPackage || 'Current account package:'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold leading-none shadow-xs border ${
              user?.plan === 'pro' 
                ? 'bg-blue-50 text-blue-600 border-blue-200/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30' 
                : user?.plan === 'institutional'
                  ? 'bg-purple-50 text-purple-600 border-purple-200/50 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30'
                  : 'bg-slate-105 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700'
            }`}>
              <span className={`size-1.5 rounded-full ${
                user?.plan === 'pro' 
                  ? 'bg-blue-500' 
                  : user?.plan === 'institutional'
                    ? 'bg-purple-500'
                    : 'bg-slate-400'
              }`} />
              {user?.plan === 'pro' 
                ? (t.common.proPlan || 'Pro Plan') 
                : user?.plan === 'institutional'
                  ? (t.common.institutionalPlan || 'Institutional Plan')
                  : (t.common.freePlan || 'Free Plan')
              }
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard/storage/cleanup" className="block">
            <Button variant="secondary" className="h-[52px] px-4 justify-start text-left font-medium text-sm text-foreground w-full">
              <Eraser className="size-4 text-muted-foreground mr-1" />
              <div className="leading-tight">
                {t.cloudStorage.cleanUp}
              </div>
            </Button>
          </Link>
          <Link to="/dashboard/storage/explorer" className="block">
            <Button variant="secondary" className="h-[52px] px-4 justify-start text-left font-medium text-sm text-foreground w-full">
              <FolderSearch className="size-4 text-muted-foreground mr-1" />
              <div className="leading-tight">
                {t.cloudStorage.explorer}
              </div>
            </Button>
          </Link>
          <Link to="/dashboard/storage/analytics" className="block">
            <Button variant="secondary" className="h-[52px] px-4 justify-start text-left font-medium text-sm text-foreground w-full">
              <BarChart2 className="size-4 text-muted-foreground mr-1" />
              <div className="leading-tight">
                {t.cloudStorage.analytics}
              </div>
            </Button>
          </Link>
          <Button onClick={handleUploadClick} variant="primary" className="h-[52px] px-4 justify-start text-left font-medium text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white border-none shadow-sm">
            <Upload className="size-4 mr-1" />
            <div className="leading-tight">
              {t.cloudStorage.uploadFile}
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
              {t.cloudStorage.totalStorage}
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{TOTAL_STORAGE_GB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FileText className="size-4 text-[#8b5cf6]" />
              {t.cloudStorage.usedStorage}
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{totalUsedGB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <Cloud className="size-4 text-[#0ea5e9]" />
              {t.cloudStorage.remaining}
            </div>
            <div className="text-[28px] font-bold text-foreground mt-2 leading-none">{remainingGB} GB</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-muted text-xs font-semibold">
              <FolderOpen className="size-4 text-[#2563eb]" />
              {t.cloudStorage.sharedFiles}
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
            <h2 className="font-bold text-foreground text-[15px]">{t.cloudStorage.recentUploads}</h2>
            <Link to="/dashboard/storage/explorer" className="text-primary text-sm font-medium hover:underline">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="flex flex-col">
            {uploads.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">
                {t.cloudStorage.noRecentUploads}
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
                      {formatSize(file.sizeBytes)} • {formatFileTime(file.time)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t.common.delete}
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
              {isMounted && (
                <ResponsiveContainer width="100%" height={160}>
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
              )}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-4xl font-bold text-foreground">{usedPercentage}%</span>
              </div>
            </div>
            
            <h3 className="font-bold text-foreground text-[15px] mt-4">
              {t.cloudStorage.usedOfText(totalUsedGB, TOTAL_STORAGE_GB)}
            </h3>
            <p className="text-muted text-xs mt-1.5 mb-6 max-w-[200px]">
              {t.cloudStorage.approachingLimit}
            </p>
            
            <Button onClick={() => setIsManageModalOpen(true)} variant="secondary" className="w-full text-[#2563eb] bg-[#f0f4ff] border-none hover:bg-[#e0e8ff] dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-400">
              {t.cloudStorage.manageStorage}
            </Button>
          </Card>

          {/* Storage by Subject Card */}
          <Card>
            <div className="p-5 border-b border-border">
              <h2 className="font-bold text-foreground text-[15px]">{t.cloudStorage.storageBySubject}</h2>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {subjects.map((subject) => (
                <div key={subject.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-body">{subject.name}</span>
                    <span className="text-muted">{subject.size}</span>
                  </div>
                  <div className="w-full bg-[#f1f3f5] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
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

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title={t.cloudStorage.manageStorage}
        description={t.cloudStorage.manageStorageDesc}
      >
        <div className="flex flex-col gap-4 mt-2">
          {trashSize === 0 && tempSize === 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center justify-center font-medium border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
              {t.cloudStorage.optimized}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30 rounded-lg p-4 shadow-sm text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="size-4" />
                {t.cloudStorage.recommendations}
              </div>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mb-4">
                {t.cloudStorage.freeUpText((trashSize + tempSize).toFixed(1))}
              </p>
              
              <div className="flex flex-col gap-3">
                {trashSize > 0 && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md border border-amber-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg">
                        <Trash className="size-4 text-amber-700 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[14px] text-foreground">{t.cloudStorage.emptyTrash}</h4>
                        <p className="text-xs text-muted">{t.cloudStorage.freeUpAmount(trashSize.toFixed(1))}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setBaseUsedStorage(prev => prev - trashSize);
                        setTrashSize(0);
                      }}
                      variant="secondary" 
                      className="text-danger hover:bg-danger/10 h-8 text-xs font-semibold px-3"
                    >
                      {t.cloudStorage.emptyBtn}
                    </Button>
                  </div>
                )}

                {tempSize > 0 && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md border border-amber-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg">
                        <Archive className="size-4 text-amber-700 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[14px] text-foreground">{t.cloudStorage.clearTemp}</h4>
                        <p className="text-xs text-muted">{t.cloudStorage.freeUpAmount(tempSize.toFixed(1))}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => {
                        setBaseUsedStorage(prev => prev - tempSize);
                        setTempSize(0);
                      }}
                      variant="secondary" 
                      className="text-primary hover:bg-primary/10 h-8 text-xs font-semibold px-3"
                    >
                      {t.cloudStorage.clearBtn}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-lg p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between mt-2 shadow-sm">
            <div>
              <h4 className="font-bold text-[14px] text-foreground">{t.cloudStorage.needMoreSpace}</h4>
              <p className="text-[12px] text-muted mt-0.5">{t.cloudStorage.upgradeProDesc}</p>
            </div>
            <Link to="/dashboard/upgrade" onClick={() => setIsManageModalOpen(false)}>
              <Button className="bg-[#3155F6] hover:bg-[#2563eb] text-white gap-1.5 h-9 text-sm px-4">
                <Zap className="size-3.5" fill="currentColor" />
                {t.cloudStorage.upgradeBtn}
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
