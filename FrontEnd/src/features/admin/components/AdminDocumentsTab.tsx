import { useState, useMemo, useEffect } from 'react'
import {
  FileText,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  FolderOpen,
  Sparkles,
  ShieldAlert,
  Clock,
  XCircle,
  Download,
  Calendar,
  Percent,
  Globe,
  Upload,
  Cpu,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { adminService, AdminDocument } from '../services/adminService'
import { cn } from '@/lib/utils'

// Types
interface DocumentItem {
  id: string
  title: string
  fileName: string
  type: string
  uploader: string
  uploaderEmail: string
  uploadedAt: string
  size: string
  status: 'pending' | 'approved' | 'reported'
  description?: string
  mockContentLines?: string[]
  reporter?: string
  reportReason?: string
  adminFeedback?: string
}

export function AdminDocumentsTab() {
  const { t, language } = useTranslation()
  const toast = useToast()

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [aiRiskFilter, setAiRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [plagiarismFilter, setPlagiarismFilter] = useState<'all' | 'plagiarized' | 'clean'>('all')
  const [reportFilter, setReportFilter] = useState<'all' | 'reported' | 'high'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_upload' | 'api_sync' | 'partner_portal'>('all')
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'pdf' | 'docx' | 'xlsx' | 'image' | 'pptx' | 'txt'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Sorting states
  const [sortField, setSortField] = useState<'uploadedAt' | 'plagiarismScore' | 'aiConfidenceScore' | 'reportCount'>('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Selection states
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])

  // Modal states
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<AdminDocument | null>(null)
  const [adminFeedback, setAdminFeedback] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

  useEffect(() => {
    if (!deleteDoc) {
      setDeleteReason('')
    }
  }, [deleteDoc])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Analytics stats
  const stats = useMemo(() => {
    const pending = documents.filter((d) => d.status === 'pending').length
    const flagged = documents.filter((d) => d.isFlagged || d.aiStatus === 'flagged').length
    const aiGenerated = documents.filter((d) => d.isAiGenerated).length
    const rejected = documents.filter((d) => d.status === 'rejected').length
    return { pending, flagged, aiGenerated, rejected }
  }, [documents])

  // Filter & Sort logic
  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => {
      // 1. Text Search
      const term = searchTerm.toLowerCase();
      const titleMatch = doc.title.toLowerCase().includes(term);
      const uploaderMatch = 
        doc.ownerName.toLowerCase().includes(term) ||
        doc.ownerEmail.toLowerCase().includes(term);
      const bannedMatch = doc.bannedKeywords
        ? doc.bannedKeywords.some(kw => kw.toLowerCase().includes(term))
        : false;
      const categoryMatch = doc.category.toLowerCase().includes(term);
      const sourceNameMatch = doc.uploadSource.toLowerCase().includes(term);

      const matchesSearch = titleMatch || uploaderMatch || bannedMatch || categoryMatch || sourceNameMatch;

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

      // 3. AI Risk Level Filter
      const matchesAiRisk = aiRiskFilter === 'all' || doc.aiRiskLevel === aiRiskFilter;

      // 4. Plagiarism Score Filter
      let matchesPlag = true;
      if (plagiarismFilter === 'plagiarized') {
        matchesPlag = doc.plagiarismScore >= 30;
      } else if (plagiarismFilter === 'clean') {
        matchesPlag = doc.plagiarismScore < 30;
      }

      // 5. Report Count Filter
      let matchesReport = true;
      if (reportFilter === 'reported') {
        matchesReport = doc.reportCount >= 1;
      } else if (reportFilter === 'high') {
        matchesReport = doc.reportCount >= 5;
      }

      // 6. Source Filter
      const matchesSource = sourceFilter === 'all' || doc.uploadSource === sourceFilter;

      // 7. File Type Filter
      const matchesFileType = fileTypeFilter === 'all' || doc.fileType === fileTypeFilter;

      // 8. Date Filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const docDate = new Date(doc.uploadedAt);
        const latestDocTime = Math.max(...documents.map(d => new Date(d.uploadedAt).getTime()));
        const baseDate = new Date(latestDocTime > 0 ? latestDocTime : Date.now());
        const diffTime = Math.abs(baseDate.getTime() - docDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'today') {
          matchesDate = diffDays <= 1;
        } else if (dateFilter === 'week') {
          matchesDate = diffDays <= 7;
        } else if (dateFilter === 'month') {
          matchesDate = diffDays <= 30;
        }
      }

      return matchesSearch && matchesStatus && matchesAiRisk && matchesPlag && matchesReport && matchesSource && matchesFileType && matchesDate;
    });

    return filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'uploadedAt') {
        const timeA = new Date(valA as string).getTime();
        const timeB = new Date(valB as string).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [documents, searchTerm, statusFilter, aiRiskFilter, plagiarismFilter, reportFilter, sourceFilter, fileTypeFilter, dateFilter, sortField, sortOrder]);

  // Selection handlers
  const isAllSelected = filteredDocuments.length > 0 && selectedDocIds.length === filteredDocuments.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map(d => d.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    try {
      const approved = await adminService.bulkApproveDocuments(selectedDocIds);
      approved.forEach(doc => {
        onUpdateDocument(doc.id, { status: 'approved', aiStatus: doc.aiStatus });
      });
      toast.success(language === 'vi' ? `Đã duyệt thành công ${selectedDocIds.length} tài liệu.` : `Successfully approved ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleBulkReject = async () => {
    try {
      const rejected = await adminService.bulkRejectDocuments(selectedDocIds);
      rejected.forEach(doc => {
        onUpdateDocument(doc.id, { status: 'rejected' });
      });
      toast.success(language === 'vi' ? `Đã từ chối ${selectedDocIds.length} tài liệu.` : `Successfully rejected ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await adminService.bulkDeleteDocuments(selectedDocIds);
      selectedDocIds.forEach(id => {
        onDeleteDocument(id);
      });
      toast.success(language === 'vi' ? `Đã xóa ${selectedDocIds.length} tài liệu.` : `Successfully deleted ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await adminService.exportModerationReport(selectedDocIds);
      toast.success(language === 'vi' ? `Đã tạo báo cáo: ${res.filename}` : `Exported report: ${res.filename}`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  // Moderate Actions
  const handleApprove = (id: string) => {
    onApproveDocument(id)
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'approved' } : null))
    }
    toast.success(t.admin.toastApproveSuccess || 'Document approved')
  };
  
  const handleReject = (id: string) => {
    onRejectDocument(id)
    if (previewDoc && previewDoc.id === id) {
      setPreviewDoc((prev) => (prev ? { ...prev, status: 'rejected' } : null))
    }
    toast.success('Document rejected')
  };

  const handleDeleteConfirm = () => {
    if (!deleteDoc) return
    onDeleteDocument(deleteDoc.id)
    if (previewDoc && previewDoc.id === deleteDoc.id) {
      setPreviewDoc(null)
    }
    
    const msg = language === 'vi'
      ? `Đã xóa tài liệu "${deleteDoc.title}" và gửi phản hồi đến ${deleteDoc.uploaderEmail}: "${deleteReason}"`
      : `Deleted document "${deleteDoc.title}" and sent feedback to ${deleteDoc.uploaderEmail}: "${deleteReason}"`
    toast.success(msg)
    
    setDeleteDoc(null)
    setDeleteReason('')
  }

  return (
    <div className="space-y-6 text-left relative pb-20">
      {/* Header and Title */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-955/50 text-blue-600 dark:text-blue-400">
            <FileText className="size-4 stroke-[2.5]" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight uppercase">
            {language === 'vi' ? 'Kiểm duyệt tài liệu & Tìm kiếm' : 'Document Moderation Search'}
          </h2>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-amber-500/35 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Chờ kiểm duyệt' : 'Pending Reviews'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {stats.pending}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-450 font-extrabold flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                {language === 'vi' ? 'Yêu cầu duyệt' : 'Requires action'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 group-hover:scale-110 transition-transform duration-300">
            <Clock className="size-5 stroke-[2.25]" />
          </div>
        </div>

        {/* Card 2: Flagged */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-rose-500/35 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Tài liệu bị gắn cờ' : 'Flagged Documents'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {stats.flagged}
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-450 font-extrabold">
                {language === 'vi' ? 'Cần kiểm tra' : 'Risk detected'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-500 group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="size-5 stroke-[2.25]" />
          </div>
        </div>

        {/* Card 3: AI Generated */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-purple-500/35 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Tạo bởi AI' : 'AI Generated'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {stats.aiGenerated}
              </span>
              <span className="text-[10px] text-purple-650 dark:text-purple-405 font-extrabold">
                {language === 'vi' ? 'Bản quét AI' : 'AI scanned'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-955/20 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="size-5 stroke-[2.25]" />
          </div>
        </div>

        {/* Card 4: Rejected */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-red-500/35 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
              {language === 'vi' ? 'Bị từ chối' : 'Rejected Today'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                {stats.rejected}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {language === 'vi' ? 'Đã chặn' : 'Blocked content'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:scale-110 transition-transform duration-300">
            <XCircle className="size-5 stroke-[2.25]" />
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-sm">
        {/* First Row: Search input and Date Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-505" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'vi' ? "Tìm kiếm theo tên tài liệu, người đăng, email, từ khóa cấm..." : "Search by title, uploader name/email, banned keywords..."}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350">
              <span className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-wider">{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent border-none focus:outline-none font-bold text-slate-850 dark:text-slate-150 cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                <option value="pending">{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</option>
                <option value="approved">{language === 'vi' ? 'Đã duyệt' : 'Approved'}</option>
                <option value="rejected">{language === 'vi' ? 'Bị từ chối' : 'Rejected'}</option>
              </select>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-350">
              <Calendar className="size-3.5 text-blue-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent border-none focus:outline-none font-bold text-slate-850 dark:text-slate-150 cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Mọi thời gian' : 'All time'}</option>
                <option value="today">{language === 'vi' ? 'Hôm nay' : 'Today'}</option>
                <option value="week">{language === 'vi' ? 'Tuần này' : 'This week'}</option>
                <option value="month">{language === 'vi' ? 'Tháng này' : 'Tháng này'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Second Row: Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          {/* AI Risk Level */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Mức rủi ro AI' : 'AI Risk Level'}</span>
            <select
              value={aiRiskFilter}
              onChange={(e) => setAiRiskFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'vi' ? 'Tất cả rủi ro' : 'All Risk Levels'}</option>
              <option value="low">{language === 'vi' ? 'Thấp' : 'Low'}</option>
              <option value="medium">{language === 'vi' ? 'Trung bình' : 'Medium'}</option>
              <option value="high">{language === 'vi' ? 'Cao' : 'High'}</option>
            </select>
          </div>

          {/* Plagiarism Score */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Đạo văn' : 'Plagiarism'}</span>
            <select
              value={plagiarismFilter}
              onChange={(e) => setPlagiarismFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'vi' ? 'Mọi tỷ lệ' : 'All Scores'}</option>
              <option value="plagiarized">{language === 'vi' ? 'Đạo văn (>= 30%)' : 'Plagiarized (>= 30%)'}</option>
              <option value="clean">{language === 'vi' ? 'Sạch (< 30%)' : 'Clean (< 30%)'}</option>
            </select>
          </div>

          {/* Report Count */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Báo cáo vi phạm' : 'Reports Count'}</span>
            <select
              value={reportFilter}
              onChange={(e) => setReportFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'vi' ? 'Mọi báo cáo' : 'All Reports'}</option>
              <option value="reported">{language === 'vi' ? 'Có báo cáo (>= 1)' : 'Reported (>= 1)'}</option>
              <option value="high">{language === 'vi' ? 'Báo cáo nhiều (>= 5)' : 'High Reports (>= 5)'}</option>
            </select>
          </div>

          {/* Upload Source */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-505 uppercase tracking-widest">{language === 'vi' ? 'Nguồn tải lên' : 'Upload Source'}</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-305 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'vi' ? 'Mọi nguồn' : 'All Sources'}</option>
              <option value="web_upload">{language === 'vi' ? 'Web App Upload' : 'Web Upload'}</option>
              <option value="api_sync">{language === 'vi' ? 'API Sync' : 'API Sync'}</option>
              <option value="partner_portal">{language === 'vi' ? 'Partner Portal' : 'Partner Portal'}</option>
            </select>
          </div>

          {/* File Type */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Định dạng' : 'File Type'}</span>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">{language === 'vi' ? 'Tất cả loại' : 'All Types'}</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word (DOCX)</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="image">{language === 'vi' ? 'Hình ảnh' : 'Image'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Moderation Table */}
      <Card className="rounded-[28px] overflow-hidden shadow-md">
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 select-none bg-slate-50/50 dark:bg-slate-900/50">
                {/* Bulk Select Checkbox Column */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 w-12 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                    />
                  </div>
                </th>

                {/* Sortable Document Name Header */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('uploadedAt')}>
                    <span>{t.admin?.docColName || 'Name'}</span>
                    <ArrowUpDown className={cn("size-3", sortField === 'uploadedAt' ? "text-blue-500" : "text-slate-400")} />
                  </div>
                </th>

                {/* Uploader & Source */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {language === 'vi' ? 'Người đăng & Nguồn' : 'Uploader & Source'}
                </th>

                {/* AI Risk Score & Plagiarism Metrics */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('aiConfidenceScore')}>
                      <span>AI Score</span>
                      <ArrowUpDown className={cn("size-3", sortField === 'aiConfidenceScore' ? "text-blue-500" : "text-slate-400")} />
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('plagiarismScore')}>
                      <span>Plag</span>
                      <ArrowUpDown className={cn("size-3", sortField === 'plagiarismScore' ? "text-blue-500" : "text-slate-400")} />
                    </div>
                  </div>
                </th>

                {/* Reports Header */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('reportCount')}>
                    <span>{language === 'vi' ? 'Báo cáo' : 'Reports'}</span>
                    <ArrowUpDown className={cn("size-3", sortField === 'reportCount' ? "text-blue-500" : "text-slate-400")} />
                  </div>
                </th>

                {/* Status Column */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {t.admin?.docColStatus || 'Status'}
                </th>

                {/* Action Buttons Column */}
                <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                  {t.admin?.docColActions || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-105 dark:divide-slate-800/60">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  const getStatusBadge = () => {
                    switch (doc.status) {
                      case 'approved':
                        return (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t.admin?.statusApproved || 'Approved'}
                          </Badge>
                        )
                      case 'pending':
                        return (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {t.admin?.statusPending || 'Pending'}
                          </Badge>
                        )
                      case 'rejected':
                        return (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                            <AlertTriangle className="size-3 text-rose-500" />
                            Rejected
                          </Badge>
                        )
                    }
                  };
 
                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "hover:bg-slate-50 dark:hover:bg-slate-800/35 even:bg-slate-50/20 dark:even:bg-slate-900/10 transition-all duration-205 group",
                        isSelected && "bg-blue-50/30 dark:bg-blue-955/15"
                      )}
                    >
                      {/* Checkbox Column */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(doc.id)}
                            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                          />
                        </div>
                      </td>

                      {/* Name & Type */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[14px] leading-tight font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[240px]" title={doc.title}>
                              {doc.title}
                            </span>
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-505 dark:text-slate-400 text-[9px] px-1.5 py-0 rounded font-extrabold uppercase select-none shrink-0">
                              {doc.fileType}
                            </Badge>
                            {doc.isFlagged && (
                              <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 text-[9px] px-1.5 py-0 rounded-md font-extrabold uppercase tracking-wide shrink-0 select-none">
                                Flagged
                              </Badge>
                            )}
                            {doc.isAiGenerated && (
                              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-455 border border-purple-500/20 text-[9px] px-1.5 py-0 rounded-md font-extrabold uppercase tracking-wide shrink-0 select-none">
                                AI
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            <span>{doc.sizeMB} MB</span>
                            <span>•</span>
                            <span>{doc.uploadedAt}</span>
                          </div>

                          {/* Banned keywords info */}
                          {(doc.bannedKeywords && doc.bannedKeywords.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {doc.bannedKeywords.map((kw, i) => (
                                <Badge key={i} className="bg-rose-500/10 text-rose-655 dark:text-rose-400 border border-rose-500/10 text-[9px] px-1 py-0 rounded font-semibold tracking-wide lowercase shrink-0">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Uploader & Source */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{doc.ownerName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{doc.ownerEmail}</span>
                          <div className="mt-1 flex items-center gap-1.5">
                            {doc.uploadSource === 'web_upload' && (
                              <Badge className="bg-blue-500/10 text-blue-605 dark:text-blue-450 border border-blue-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                <Upload className="size-2.5" />
                                Web Upload
                              </Badge>
                            )}
                            {doc.uploadSource === 'api_sync' && (
                              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-450 border border-purple-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                <Cpu className="size-2.5" />
                                API Sync
                              </Badge>
                            )}
                            {doc.uploadSource === 'partner_portal' && (
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                <Globe className="size-2.5" />
                                Partner Portal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Risk Score & Plagiarism Metrics */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          {/* Risk Level Badge */}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase select-none">{language === 'vi' ? 'Rủi ro AI:' : 'AI Risk:'}</span>
                            <Badge className={cn(
                              "font-extrabold text-[9px] px-1.5 py-0 rounded-md uppercase tracking-wider select-none",
                              doc.aiRiskLevel === 'high' && "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                              doc.aiRiskLevel === 'medium' && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                              doc.aiRiskLevel === 'low' && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            )}>
                              {doc.aiRiskLevel}
                            </Badge>
                          </div>

                          {/* Progress bar metrics grid */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-bold">
                            {/* AI Probability */}
                            <div className="flex items-center justify-between gap-1 text-purple-650 dark:text-purple-405">
                              <span>AI:</span>
                              <span className="font-extrabold">{doc.aiConfidenceScore}%</span>
                            </div>

                            {/* Plagiarism */}
                            <div className={cn(
                              "flex items-center justify-between gap-1",
                              doc.plagiarismScore >= 30 ? "text-rose-600 dark:text-rose-455" : "text-slate-550 dark:text-slate-400"
                            )}>
                              <span>Plag:</span>
                              <span className="font-extrabold">{doc.plagiarismScore}%</span>
                            </div>

                            {/* Unsafe Content */}
                            <div className={cn(
                              "flex items-center justify-between gap-1",
                              doc.unsafeContentScore >= 20 ? "text-rose-600 dark:text-rose-455" : "text-slate-550 dark:text-slate-400"
                            )}>
                              <span>Unsafe:</span>
                              <span className="font-extrabold">{doc.unsafeContentScore}%</span>
                            </div>

                            {/* Spam */}
                            <div className={cn(
                              "flex items-center justify-between gap-1",
                              doc.spamScore >= 40 ? "text-amber-600 dark:text-amber-500" : "text-slate-550 dark:text-slate-400"
                            )}>
                              <span>Spam:</span>
                              <span className="font-extrabold">{doc.spamScore}%</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Reports */}
                      <td className="p-4 text-xs font-semibold">
                        {doc.reportCount > 0 ? (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1 w-fit rounded-full px-2 py-0.5 font-black">
                            <ShieldAlert className="size-3 shrink-0 text-rose-500" />
                            <span>{doc.reportCount} {language === 'vi' ? 'báo cáo' : 'reports'}</span>
                          </Badge>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-medium">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {getStatusBadge()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          {/* Details/Review Button */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                            title={language === 'vi' ? 'Xem chi tiết & Quét AI' : 'Review Details'}
                          >
                            <Eye className="size-4.5" />
                          </button>

                          {/* Flag toggle button */}
                          <button
                            onClick={() => handleToggleFlag(doc.id, doc.isFlagged)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all cursor-pointer",
                              doc.isFlagged
                                ? "text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100"
                                : "text-slate-455 hover:text-rose-500 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-455"
                            )}
                            title={doc.isFlagged ? 'Remove Flag' : 'Flag Document'}
                          >
                            <AlertTriangle className="size-4.5" />
                          </button>

                          {/* Approve action */}
                          {doc.status !== 'approved' ? (
                            <button
                              onClick={() => handleApprove(doc.id)}
                              className="p-1.5 rounded-lg text-slate-505 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-450 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                              title={t.admin?.actionApprove || 'Approve'}
                            >
                              <CheckCircle className="size-4.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center text-emerald-500" title="Approved">
                              <ShieldCheck className="size-4.5" />
                            </div>
                          )}

                          {/* Reject action */}
                          {doc.status !== 'rejected' && (
                            <button
                              onClick={() => handleReject(doc.id)}
                              className="p-1.5 rounded-lg text-slate-505 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-450 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                              title="Reject"
                            >
                              <XCircle className="size-4.5" />
                            </button>
                          )}

                          {/* Download mock action */}
                          <button
                            onClick={() => toast.success(`Simulating download of "${doc.title}.${doc.fileType}"`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-405 dark:hover:text-blue-450 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                            title="Download File"
                          >
                            <Download className="size-4.5" />
                          </button>

                          {/* Delete action */}
                          <button
                            onClick={() => setDeleteDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-505 dark:hover:text-rose-450 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                            title={t.admin?.actionDelete || 'Delete'}
                          >
                            <Trash2 className="size-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-450 dark:text-slate-655">
                      <FolderOpen className="size-10 stroke-[1.25] mb-2" />
                      <p className="font-extrabold text-sm text-slate-700 dark:text-slate-350">{t.admin?.noDocs || "No documents found"}</p>
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-505 mt-1">{t.admin?.noDocsModeration || "No documents match"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bulk Actions Floating Toolbar */}
      {selectedDocIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 dark:border-slate-205 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-xs font-black font-mono">
            {selectedDocIds.length} {language === 'vi' ? 'tài liệu được chọn' : 'documents selected'}
          </span>
          <div className="h-4 w-[1px] bg-slate-800 dark:bg-slate-200 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleBulkApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10 border-none"
            >
              <CheckCircle className="size-3.5" />
              {language === 'vi' ? 'Duyệt' : 'Approve'}
            </Button>
            <Button
              onClick={handleBulkReject}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 border-none"
            >
              <AlertTriangle className="size-3.5" />
              {language === 'vi' ? 'Từ chối' : 'Reject'}
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10 border-none"
            >
              <Trash2 className="size-3.5" />
              {language === 'vi' ? 'Xóa' : 'Delete'}
            </Button>
            <Button
              onClick={handleExportReport}
              className="bg-blue-650 hover:bg-blue-600 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10 border-none"
            >
              <FileSpreadsheet className="size-3.5" />
              {language === 'vi' ? 'Báo cáo' : 'Export'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSelectedDocIds([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-305 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-700 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer border-none"
            >
              {language === 'vi' ? 'Hủy' : 'Clear'}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State View */}
      {filteredDocuments.length === 0 && (
        <div className="py-20 text-center bg-white/40 dark:bg-slate-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="p-4 rounded-full bg-slate-105 dark:bg-slate-800 text-slate-400 dark:text-slate-505 mb-4">
              <FolderOpen className="size-10 stroke-[1.25]" />
            </div>
            <h3 className="font-extrabold text-base text-slate-850 dark:text-slate-200 leading-tight">
              {language === 'vi' ? 'Không tìm thấy tài liệu phù hợp' : 'No documents matched the moderation criteria.'}
            </h3>
            <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-2 leading-relaxed">
              {language === 'vi' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn để tìm thêm kết quả.' : 'Try adjusting your search query or reset the filters to find matching files.'}
            </p>
            {(searchTerm || statusFilter !== 'all' || aiRiskFilter !== 'all' || plagiarismFilter !== 'all' || reportFilter !== 'all' || sourceFilter !== 'all' || fileTypeFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setAiRiskFilter('all');
                  setPlagiarismFilter('all');
                  setReportFilter('all');
                  setSourceFilter('all');
                  setFileTypeFilter('all');
                  setDateFilter('all');
                }}
                className="mt-5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10 border-none"
              >
                {language === 'vi' ? 'Đặt lại bộ lọc' : 'Reset all filters'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 1. unified DETAILED REVIEW & PREVIEW MODAL */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? `${language === 'vi' ? 'Kiểm duyệt chi tiết:' : 'Review Details:'} ${previewDoc.title}` : ''}
        className="max-w-4xl"
      >
        {previewDoc && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            {/* Left Panel: Content Preview and Metadata */}
            <div className="space-y-5 md:col-span-7">
              {/* Metadata Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-505 font-extrabold uppercase block mb-0.5">{language === 'vi' ? 'Định dạng' : 'Format'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{previewDoc.fileType}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-505 font-extrabold uppercase block mb-0.5">{language === 'vi' ? 'Kích thước' : 'Storage Size'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.sizeMB} MB</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-550 font-extrabold uppercase block mb-0.5">{language === 'vi' ? 'Ngày tải lên' : 'Upload Date'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{previewDoc.uploadedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-505 font-extrabold uppercase block mb-0.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                  <span className="font-bold text-slate-850 dark:text-slate-150">
                    {previewDoc.status === 'approved' && <span className="text-emerald-500 font-extrabold">{t.admin?.statusApproved || 'Approved'}</span>}
                    {previewDoc.status === 'pending' && <span className="text-amber-500 font-extrabold">{t.admin?.statusPending || 'Pending'}</span>}
                    {previewDoc.status === 'rejected' && <span className="text-rose-500 font-extrabold">Rejected</span>}
                  </span>
                </div>
              </div>

              {/* Uploader Card */}
              <div className="bg-slate-55 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850/80 p-4 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-505 font-extrabold uppercase block mb-0.5">{language === 'vi' ? 'Người đăng tải' : 'Uploaded By'}</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-105">{previewDoc.ownerName}</span>
                  <span className="text-slate-405 dark:text-slate-500 font-medium block">{previewDoc.ownerEmail}</span>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {previewDoc.uploadSource === 'web_upload' && <Upload className="size-3 text-blue-500" />}
                  {previewDoc.uploadSource === 'api_sync' && <Cpu className="size-3 text-purple-500" />}
                  {previewDoc.uploadSource === 'partner_portal' && <Globe className="size-3 text-emerald-500" />}
                  <span className="font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300 ml-1 select-none">
                    {previewDoc.uploadSource.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Simulated Content Screen */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="size-3.5 text-blue-550" />
                  {t.admin?.previewContentTitle || 'Content Preview'}
                </h4>
                <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl font-mono text-[11px] overflow-x-auto min-h-[160px] max-h-[250px] border border-slate-850 shadow-inner">
                  <div className="py-1 border-b border-slate-850/60 last:border-0 truncate flex">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4 w-6 shrink-0">01</span>
                    <span>Document Title: {previewDoc.title}</span>
                  </div>
                  <div className="py-1 border-b border-slate-850/60 last:border-0 truncate flex">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4 w-6 shrink-0">02</span>
                    <span>Subject Category: {previewDoc.category}</span>
                  </div>
                  <div className="py-1 border-b border-slate-850/60 last:border-0 truncate flex">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4 w-6 shrink-0">03</span>
                    <span>AI Analysis Log: Confidence {previewDoc.aiConfidenceScore}% | Risk level {previewDoc.aiRiskLevel}</span>
                  </div>
                  <div className="py-1 border-b border-slate-850/60 last:border-0 truncate flex">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4 w-6 shrink-0">04</span>
                    <span>Plagiarism Scan: matches found {previewDoc.plagiarismScore}% match rate</span>
                  </div>
                  <div className="py-1 border-b border-slate-850/60 last:border-0 truncate flex">
                    <span className="text-slate-600 dark:text-slate-550 select-none mr-4 w-6 shrink-0">05</span>
                    <span>System Tag: {previewDoc.isFlagged ? "FLAGGED_FOR_VIOLATION" : "SAFE_DOCUMENT"}</span>
                  </div>
                </div>
              </div>

              {/* Admin feedback field inside preview */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-455 dark:text-slate-500 uppercase tracking-widest block">
                  {language === 'vi' ? 'Ý kiến người kiểm duyệt' : 'Moderator Notes & Feedback'}
                </label>
                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder={language === 'vi' ? "Nhập lý do duyệt, từ chối hoặc hướng dẫn xử lý..." : "Enter reason for moderation decision, flags, or reject notes..."}
                  className="w-full h-20 p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-655 font-medium leading-relaxed resize-none transition-all"
                />
              </div>

              {/* Action Buttons in footer */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPreviewDoc(null);
                    setAdminFeedback('');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-202 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer border-none"
                >
                  {t.common?.close || 'Close'}
                </Button>

                <div className="flex items-center gap-2">
                  {/* Approve */}
                  {previewDoc.status !== 'approved' && (
                    <Button
                      onClick={() => {
                        handleApprove(previewDoc.id);
                        if (adminFeedback) {
                          onUpdateDocument(previewDoc.id, { category: `${previewDoc.category} (${adminFeedback})` });
                        }
                        setPreviewDoc(null);
                        setAdminFeedback('');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                    >
                      <CheckCircle className="size-3.5" />
                      {t.admin?.actionApprove || 'Approve'}
                    </Button>
                  )}

                  {/* Reject */}
                  {previewDoc.status !== 'rejected' && (
                    <Button
                      onClick={() => {
                        handleReject(previewDoc.id);
                        if (adminFeedback) {
                          onUpdateDocument(previewDoc.id, { category: `Rejected: ${adminFeedback}` });
                        }
                        setPreviewDoc(null);
                        setAdminFeedback('');
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                    >
                      <XCircle className="size-3.5" />
                      Reject
                    </Button>
                  )}

                  {/* Delete */}
                  <Button
                    onClick={() => {
                      setDeleteDoc(previewDoc);
                      setPreviewDoc(null);
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
                  >
                    <Trash2 className="size-3.5" />
                    {t.admin?.actionDelete || 'Delete'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel: AI Moderation Scores */}
            <div className="space-y-4 md:col-span-5 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs">
              <h4 className="text-xs font-extrabold text-slate-450 dark:text-slate-505 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                <Cpu className="size-4 text-blue-500" />
                AI Moderation Indicators
              </h4>

              {/* 1. AI Generated Probability */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-purple-550" />
                    AI Probability
                  </span>
                  <span className="font-extrabold font-mono text-purple-600 dark:text-purple-400">{previewDoc.aiConfidenceScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 dark:bg-purple-650 rounded-full transition-all duration-500"
                    style={{ width: `${previewDoc.aiConfidenceScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                  {previewDoc.aiConfidenceScore > 50
                    ? "High confidence of machine-generated text or AI rewriting."
                    : "Low probability of artificial text generation."}
                </p>
              </div>

              {/* 2. Plagiarism Score */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5">
                    <Percent className="size-3 text-amber-500" />
                    Plagiarism Match
                  </span>
                  <span className={cn(
                    "font-extrabold font-mono",
                    previewDoc.plagiarismScore >= 30 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-450"
                  )}>{previewDoc.plagiarismScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      previewDoc.plagiarismScore >= 30 ? "bg-rose-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${previewDoc.plagiarismScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-505 leading-normal">
                  {previewDoc.plagiarismScore >= 30
                    ? "Significant duplication detected with online resources or other student uploads."
                    : "Excellent originality score. Content is unique."}
                </p>
              </div>

              {/* 3. Unsafe Content Probability */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3 text-rose-555" />
                    Unsafe Content Score
                  </span>
                  <span className={cn(
                    "font-extrabold font-mono",
                    previewDoc.unsafeContentScore >= 20 ? "text-rose-600 dark:text-rose-455" : "text-emerald-600 dark:text-emerald-455"
                  )}>{previewDoc.unsafeContentScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      previewDoc.unsafeContentScore >= 20 ? "bg-rose-600" : "bg-emerald-500"
                    )}
                    style={{ width: `${previewDoc.unsafeContentScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-normal">
                  {previewDoc.unsafeContentScore >= 20
                    ? "Triggered content moderation policies. Potential toxic/restricted material."
                    : "No unsafe or restricted contents found."}
                </p>
              </div>

              {/* 4. Spam Rating */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="size-3 text-blue-500" />
                    Spam Confidence
                  </span>
                  <span className="font-extrabold font-mono text-blue-600 dark:text-blue-400">{previewDoc.spamScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-105 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${previewDoc.spamScore}%` }}
                  />
                </div>
              </div>

              {/* Triggered Keywords List */}
              {previewDoc.bannedKeywords && previewDoc.bannedKeywords.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Matched Banned Keywords</span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewDoc.bannedKeywords.map((kw, i) => (
                      <Badge key={i} className="bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase select-none">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Count info */}
              {previewDoc.reportCount > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-xl text-xs space-y-1 text-rose-700 dark:text-rose-400">
                  <div className="flex items-center gap-1.5 font-black text-rose-800 dark:text-rose-350">
                    <ShieldAlert className="size-4 shrink-0 text-rose-500" />
                    <span>Reported Violation ({previewDoc.reportCount} reports)</span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal font-semibold">
                    Multiple users flagged this file as inappropriate, leaking exam content, or violating academic policies.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CONFIRM DELETE DIALOG */}
      <Modal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title={t.admin?.confirmDeleteTitle || 'Delete'}
        className="max-w-md"
      >
        {deleteDoc && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl">
              <AlertTriangle className="size-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm text-rose-955 dark:text-rose-200 leading-tight">
                  {language === 'vi' ? 'Cảnh báo' : 'Warning'}
                </p>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-350/85 leading-relaxed">
                  {t.admin?.confirmDeleteDesc || 'Are you sure you want to delete this document?'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 space-y-1">
              <div className="truncate">
                {language === 'vi' ? 'Tài liệu' : 'Document'}: {deleteDoc.title} ({deleteDoc.fileName})
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {language === 'vi' ? 'Người tải lên' : 'Uploader'}: {deleteDoc.uploader} ({deleteDoc.uploaderEmail})
              </div>
            </div>

            {/* Feedback / Reason for rejection */}
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {language === 'vi' ? 'Lý do từ chối & Phản hồi (Gửi cho người tải lên)' : 'Reason for rejection & Feedback (Sent to uploader)'}
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={
                  language === 'vi' 
                    ? 'Nhập lý do không duyệt (ví dụ: phát hiện đạo văn 70%, tài liệu có vấn đề...)' 
                    : 'Enter rejection reason (e.g., 70% plagiarism detected, invalid document...)'
                }
                className="w-full h-24 p-3.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-650 font-medium leading-relaxed resize-none transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setDeleteDoc(null)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-355 dark:hover:bg-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                {t.common?.cancel || 'Cancel'}
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={!deleteReason.trim()}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
              >
                {t.common?.confirm || 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
