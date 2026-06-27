import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { documentService, DocumentResponse } from '@/services/documentService';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';

export function UploadHistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { language } = useTranslation();
  const [uploads, setUploads] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUploadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await documentService.getMyUploads();
      // Sort by ID descending (most recent first)
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setUploads(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch upload history:', err);
      toast.error(language === 'en' ? 'Failed to load upload history' : 'Không thể tải lịch sử tải lên');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = (modStatus: string | undefined) => {
    const status = modStatus || 'APPROVED';
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/50">
            <AlertCircle className="h-3.5 w-3.5" />
            {language === 'en' ? 'Pending Review' : 'Đang chờ duyệt'}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400 border border-emerald-200/50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {language === 'en' ? 'Approved' : 'Đã phê duyệt'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-200/50">
            <XCircle className="h-3.5 w-3.5" />
            {language === 'en' ? 'Rejected' : 'Bị từ chối'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-[800px] mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={language === 'en' ? 'Back' : 'Quay lại'}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {language === 'en' ? 'Document Upload History' : 'Lịch sử tải lên tài liệu'}
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            {language === 'en' ? 'Track your uploaded study documents and their admin review statuses' : 'Theo dõi các tài liệu đã tải lên và trạng thái kiểm duyệt của quản trị viên'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#EAF1FB] dark:border-slate-800 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.012)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-semibold">{language === 'en' ? 'Loading upload history...' : 'Đang tải lịch sử tải lên...'}</p>
          </div>
        ) : uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-850 dark:text-slate-600 mb-4">
              <FileText className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-250">
              {language === 'en' ? 'No Upload History Found' : 'Không tìm thấy lịch sử tải lên'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
              {language === 'en' ? "You haven't uploaded any study materials yet. Upload your first document to get started." : 'Bạn chưa tải lên tài liệu học tập nào. Hãy tải lên tài liệu đầu tiên của bạn.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {uploads.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-slate-150 bg-white p-5 hover:border-blue-500/25 dark:border-slate-800 dark:bg-slate-900/60 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-955/40 dark:text-blue-400 border border-blue-100/50">
                      <FileText className="h-5.5 w-5.5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-[15px] font-bold text-slate-800 dark:text-slate-150 leading-snug break-all pr-8">
                        {doc.title || doc.fileName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                        <span className="font-semibold text-slate-500 dark:text-slate-455 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {doc.subject || 'GENERAL'}
                        </span>
                        <span>&bull;</span>
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleString('vi-VN') : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    {getStatusBadge(doc.moderationStatus)}
                    {doc.reviewedAt && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Reviewed: {new Date(doc.reviewedAt).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Card */}
                {doc.moderationStatus === 'REJECTED' && doc.rejectionReason && (
                  <div className="mt-4 rounded-xl bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100/50 p-4 text-xs">
                    <div className="font-bold text-rose-800 dark:text-rose-400 mb-1">
                      {language === 'en' ? 'Rejection Reason:' : 'Lý do từ chối:'}
                    </div>
                    <p className="text-rose-700 dark:text-rose-350 leading-relaxed font-medium">
                      {doc.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadHistoryPage;
