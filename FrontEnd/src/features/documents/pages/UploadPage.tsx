import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { documentService } from '@/services/documentService';

const mapMimeOrExtensionToType = (fileType: string, fileName: string): 'pdf' | 'word' | 'image' | 'text' | 'slides' => {
  const nameLower = fileName.toLowerCase()
  if (nameLower.endsWith('.pdf')) return 'pdf'
  if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) return 'word'
  if (nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) return 'slides'
  if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) return 'image'
  if (nameLower.endsWith('.txt')) return 'text'
  return 'text'
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const mapBackendDocToItem = (doc: any): DocumentItem => {
  return {
    id: String(doc.id),
    title: doc.title,
    fileName: doc.fileName || doc.originalFileName || 'Untitled',
    uploadedAt: doc.createdAt ? `Uploaded ${new Date(doc.createdAt).toLocaleDateString('vi-VN')}` : 'Uploaded Just Now',
    uploadedDateObj: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    size: doc.fileSize ? formatBytes(doc.fileSize) : '0 Bytes',
    sizeKb: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0,
    subject: (doc.subject || 'GENERAL') as any,
    status: 'ANALYZED',
    type: mapMimeOrExtensionToType(doc.fileType, doc.fileName || doc.originalFileName || ''),
    essential: doc.tags?.includes('Lecture') || doc.tags?.includes('Midterm')
  }
}

import { Sparkles, Folder, FileCheck, AlertCircle, Video as VideoIcon, Music, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/context/LanguageContext';
import { motion } from 'framer-motion';

import { useMediaUpload } from '@/components/shared/media-upload/useMediaUpload';
import { logActivity } from '@/services/activityLogService';
import { MediaUploadTabs } from '@/components/shared/media-upload/MediaUploadTabs';
import { MediaDropzone } from '@/components/shared/media-upload/MediaDropzone';
import { VideoPreview } from '@/components/shared/media-upload/VideoPreview';
import { AudioPreview } from '@/components/shared/media-upload/AudioPreview';
import { AudioRecorder } from '@/components/shared/media-upload/AudioRecorder';
import { MediaMetadataForm } from '@/components/shared/media-upload/MediaMetadataForm';
import { MediaPreviewModal } from '@/components/shared/media-upload/MediaPreviewModal';
import { RecentUploadsList } from '@/components/shared/media-upload/RecentUploadsList';
import { UploadedMedia } from '@/components/shared/media-upload/mediaUploadTypes';
import { cn } from '@/lib/utils';

interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  uploadedAt: string;
  uploadedDateObj: Date;
  size: string;
  sizeKb: number;
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL';
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED';
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides';
  essential?: boolean;
}

const INITIAL_DOCUMENTS: DocumentItem[] = []; const UNUSED_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-design-patterns',
    title: 'Design Patterns',
    fileName: 'Design_Patterns_Java_Guide.pdf',
    uploadedAt: 'Uploaded 2 hours ago',
    uploadedDateObj: new Date(),
    size: '3.8 MB',
    sizeKb: 3890,
    subject: 'COMPSCI',
    status: 'ANALYZED',
    type: 'pdf'
  },
  {
    id: 'doc-agile',
    title: 'Agile Methodologies',
    fileName: 'Agile_Scrum_Kanban_DeepDive.docx',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'GENERAL',
    status: 'ANALYZED',
    type: 'word',
    essential: true
  }
];

export function UploadPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { language, t: tRaw } = useTranslation();
  const t = tRaw as any;
  const context = useOutletContext<any>();
  const setDocuments = context?.setDocuments;

  const {
    activeTab,
    setActiveTab,
    docTitle,
    setDocTitle,
    selectedSubjectKey,
    setSelectedSubjectKey,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    fileType,
    visibility,
    setVisibility,
    generateSummary,
    setGenerateSummary,
    createFlashcards,
    setCreateFlashcards,
    uploadedDocument,
    uploadedFile,
    previewUrl,
    fileName,
    uploadProgress,
    uploadComplete,
    isDragOver,
    isProcessing,
    setIsProcessing,
    recordingStatus,
    recordingTimer,
    recorderSupported,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    deleteRecording,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    clearAllState
  } = useMediaUpload('document');

  // Recent Uploads State
  const [recentUploads, setRecentUploads] = useState<UploadedMedia[]>([]);

  // Modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalMedia, setPreviewModalMedia] = useState<UploadedMedia | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameModalMedia, setRenameModalMedia] = useState<UploadedMedia | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmMedia, setDeleteConfirmMedia] = useState<UploadedMedia | null>(null);

  // Load recent uploads from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_study_hub_recent_media_uploads');
    if (saved) {
      try {
        setRecentUploads(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent media uploads:', e);
      }
    }
  }, []);

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedDocument) {
      toast.error(language === 'en' ? 'Please attach a study document first!' : 'Vui lòng đính kèm tài liệu học tập trước!');
      return;
    }

    const finalTitle = docTitle.trim();
    if (!finalTitle) {
      toast.error('Document title is required');
      return;
    }

    setIsProcessing(true);

    try {
      const user = useAuthStore.getState().user;
      const userId = Number(user?.id || 1);

      const response = await documentService.uploadDocument(
        uploadedDocument,
        finalTitle,
        description,
        selectedSubjectKey,
        visibility.toUpperCase(),
        userId,
        selectedTags
      );

      const newDoc = mapBackendDocToItem(response);

      if (setDocuments) {
        setDocuments((prev: any) => [newDoc, ...prev]);
      }

      // Log document upload activity
      logActivity({
        eventKey: 'documentUploaded',
        category: 'moderation',
        status: 'success',
        eventTextEn: 'Document uploaded',
        eventTextVi: 'Tải lên tài liệu',
        detailsTextEn: `Uploaded document '${finalTitle}' successfully.`,
        detailsTextVi: `Tải lên thành công tài liệu '${finalTitle}'.`
      });

      toast.success(language === 'en' ? 'Your document has been uploaded and is waiting for admin approval.' : 'Tài liệu của bạn đã được tải lên và đang chờ quản trị viên phê duyệt.');
      setIsProcessing(false);
      navigate(`/dashboard/documents/subject/${selectedSubjectKey.toLowerCase()}`);
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error(language === 'en' ? 'Failed to upload document. Please try again.' : 'Có lỗi xảy ra khi tải lên tài liệu. Vui lòng thử lại!');
      setIsProcessing(false);
    }
  };

  const handleSaveMedia = () => {
    const titleVal = docTitle.trim();
    if (!titleVal) {
      toast.error('Title is required');
      return;
    }

    const finalSize = uploadedFile ? uploadedFile.size : 0;
    const finalMime = uploadedFile ? uploadedFile.type : activeTab === 'recording' ? 'audio/webm' : '';
    const finalFileName = uploadedFile ? uploadedFile.name : `recording-${Date.now()}.webm`;

    const newMedia: UploadedMedia = {
      id: `media-${Date.now()}`,
      title: titleVal,
      type: activeTab,
      fileName: finalFileName,
      fileSize: finalSize,
      mimeType: finalMime,
      url: previewUrl || '',
      uploadedAt: 'Uploaded Just Now',
      description: description.trim(),
      tags: selectedTags
    };

    const updatedUploads = [newMedia, ...recentUploads];
    setRecentUploads(updatedUploads);
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updatedUploads));

    if (activeTab === 'video') {
      toast.success(t.upload.videoSaved || 'Video saved successfully');
    } else if (activeTab === 'audio') {
      toast.success(t.upload.audioSaved || 'Audio saved successfully');
    } else {
      toast.success(t.upload.recordingSaved || 'Recording saved successfully');
    }

    clearAllState();
  };

  // Recent Uploads Actions
  const handlePreviewClick = (item: UploadedMedia) => {
    setPreviewModalMedia(item);
    setPreviewModalOpen(true);
  };

  const handleDownloadClick = (item: UploadedMedia) => {
    try {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('File downloaded successfully');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleRenameClick = (item: UploadedMedia) => {
    setRenameModalMedia(item);
    setRenameTitle(item.title);
    setRenameModalOpen(true);
  };

  const confirmRename = () => {
    if (!renameModalMedia || !renameTitle.trim()) return;
    const updated = recentUploads.map((item) =>
      item.id === renameModalMedia.id ? { ...item, title: renameTitle.trim() } : item
    );
    setRecentUploads(updated);
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updated));
    setRenameModalOpen(false);
    setRenameModalMedia(null);
    toast.success('File renamed successfully');
  };

  const handleDeleteClick = (item: UploadedMedia) => {
    setDeleteConfirmMedia(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteConfirmMedia) return;
    if (deleteConfirmMedia.url && deleteConfirmMedia.url.startsWith('blob:')) {
      URL.revokeObjectURL(deleteConfirmMedia.url);
    }
    const updated = recentUploads.filter((item) => item.id !== deleteConfirmMedia.id);
    setRecentUploads(updated);
    localStorage.setItem('ai_study_hub_recent_media_uploads', JSON.stringify(updated));
    setDeleteConfirmOpen(false);
    setDeleteConfirmMedia(null);
    toast.success('File deleted successfully');
  };

  const isFileAttached =
    (activeTab === 'document' && uploadedDocument) ||
    (activeTab !== 'document' && uploadedFile && activeTab !== 'recording');

  const getDropzoneLabels = () => {
    if (activeTab === 'video') {
      return {
        dragDrop: t.upload.videoDropzone || 'Drag and drop your video here',
        support: t.upload.videoSupport || 'Support for MP4, MOV, WEBM files (Max 500MB)',
        browse: t.upload.browseVideo || 'Browse Video',
        extensions: '.mp4,.mov,.webm'
      };
    }
    if (activeTab === 'audio') {
      return {
        dragDrop: t.upload.audioDropzone || 'Drag and drop your audio file here',
        support: t.upload.audioSupport || 'Support for MP3, WAV, M4A, WEBM files (Max 100MB)',
        browse: t.upload.browseAudio || 'Browse Audio',
        extensions: '.mp3,.wav,.m4a,.webm'
      };
    }
    return {
      dragDrop: t.upload.dragDrop || 'Drag and drop your files here',
      support: t.upload.supportFormat || 'Support for PDF, DOCX, and PPTX files (Max 50MB)',
      browse: t.upload.browse || 'Browse Files',
      extensions: '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.pptx,.ppt'
    };
  };

  const dzLabels = getDropzoneLabels();

  const getPreviewIcon = () => {
    if (activeTab === 'video') return <VideoIcon className="h-6 w-6 text-indigo-500" />;
    if (activeTab === 'audio') return <Music className="h-6 w-6 text-emerald-500" />;
    
    // Document icons
    if (fileType === 'pdf') return <FileCheck className="h-6 w-6 text-rose-500" />;
    if (fileType === 'word') return <FileCheck className="h-6 w-6 text-blue-500" />;
    if (fileType === 'text') return <FileCheck className="h-6 w-6 text-emerald-500" />;
    if (fileType === 'image') return <FileCheck className="h-6 w-6 text-sky-500" />;
    return <FileCheck className="h-6 w-6 text-amber-500" />;
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in max-w-[680px] mx-auto pt-2 px-4 md:px-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
          Upload Workspace
        </h1>
        <p className="text-xs md:text-sm font-medium text-[#5F6E80] dark:text-slate-400">
          Upload documents, media, or record voice lectures. AI generates smart summaries & cards instantly.
        </p>
      </div>

      {/* Tabs */}
      <MediaUploadTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          clearAllState();
          setActiveTab(tab);
        }}
        labels={{
          document: t.upload.title || 'Document',
          video: t.upload.uploadVideo || 'Video',
          audio: t.upload.uploadAudio || 'Audio',
          record: t.upload.recordAudio || 'Record'
        }}
      />

      {/* Form Card */}
      <form onSubmit={activeTab === 'document' ? handleDocumentSubmit : (e) => e.preventDefault()} className="space-y-5">
        <div className="bg-white dark:bg-slate-900 rounded-[22px] border border-[#EAF1FB] dark:border-slate-800 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
          
          {/* Dropzone */}
          {activeTab !== 'recording' && !isFileAttached && (
            <MediaDropzone
              activeTab={activeTab}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelect={handleFileChange}
              browseLabel={dzLabels.browse}
              dragDropLabel={dzLabels.dragDrop}
              supportLabel={dzLabels.support}
              allowedExtensions={dzLabels.extensions}
            />
          )}

          {/* Live Recording */}
          {activeTab === 'recording' && (
            <AudioRecorder
              recordingStatus={recordingStatus}
              recordingTimer={recordingTimer}
              recorderSupported={recorderSupported}
              previewUrl={previewUrl}
              startRecording={startRecording}
              pauseRecording={pauseRecording}
              resumeRecording={resumeRecording}
              stopRecording={stopRecording}
              deleteRecording={deleteRecording}
              startLabel={t.upload.startRecording || 'Start Recording'}
              pauseLabel={t.upload.pause || 'Pause'}
              resumeLabel={t.upload.resume || 'Resume'}
              stopLabel={t.upload.stop || 'Stop'}
              deleteLabel="Delete Recording"
              saveLabel="Save Recording"
              readyLabel={t.upload.recordAudio || 'Record Audio'}
              unsupportedLabel={t.sharedFiles.recordingNotSupported || 'Audio recording is not supported in this browser'}
            />
          )}

          {/* Upload progress indicator */}
          {activeTab !== 'recording' && isFileAttached && (
            <div className="rounded-xl bg-[#F0F4F9]/60 dark:bg-slate-800/20 p-5 relative overflow-hidden select-none">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                    {getPreviewIcon()}
                  </div>
                  <span className="font-bold text-[#0B1A30] dark:text-slate-200 text-sm truncate pr-8" title={fileName}>
                    {fileName}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-[#2563eb] shrink-0">
                  {uploadProgress}%
                </span>
              </div>

              <div className="w-full bg-[#EAF1FB] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    uploadComplete ? "bg-emerald-500" : "bg-[#2563eb]"
                  )}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={clearAllState}
                className="absolute top-3.5 right-3.5 rounded-full p-1 text-slate-400 hover:bg-slate-200/55 dark:hover:bg-slate-800 hover:text-[#0B1A30] dark:hover:text-white transition-colors focus:outline-none cursor-pointer"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Completed Video preview player */}
          {activeTab === 'video' && uploadComplete && uploadedFile && previewUrl && (
            <VideoPreview
              previewUrl={previewUrl}
              onReplace={clearAllState}
              onRemove={clearAllState}
              replaceLabel="Replace Video"
              removeLabel="Remove Video"
            />
          )}

          {/* Completed Audio preview player */}
          {activeTab === 'audio' && uploadComplete && uploadedFile && previewUrl && (
            <AudioPreview
              previewUrl={previewUrl}
              onReplace={clearAllState}
              onRemove={clearAllState}
              replaceLabel="Replace Audio"
              removeLabel="Remove Audio"
            />
          )}

          {/* Form fields shown only after upload finishes */}
          {uploadComplete && (isFileAttached || activeTab === 'recording') && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-4"
            >
              <MediaMetadataForm
                title={docTitle}
                onTitleChange={setDocTitle}
                subject={selectedSubjectKey}
                onSubjectChange={setSelectedSubjectKey}
                description={description}
                onDescriptionChange={setDescription}
                tags={selectedTags}
                onTagsChange={setSelectedTags}
                mediaType={activeTab}
                isProcessing={isProcessing}
                titleLabel={t.upload.docTitle || 'Title'}
                subjectLabel={t.myDocuments.subject || 'Subject'}
                descriptionLabel={t.upload.description || 'Description'}
                tagsLabel={t.upload.tags || 'Tags'}
              />

              {/* Visibility and AI options - Document Tab specific */}
              {activeTab === 'document' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                        {t.upload.fileType}
                      </label>
                      <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] bg-white px-4 py-3 text-sm text-slate-700 font-semibold select-none dark:bg-slate-800 dark:border-slate-800 dark:text-slate-205">
                        <FileCheck className="h-4.5 w-4.5 text-[#5F6E80] dark:text-slate-400" />
                        <span>{t.upload.autoDetected}: {fileType.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#5F6E80] select-none dark:text-slate-400">
                        {t.upload.visibility}
                      </label>
                      <div className="flex items-center gap-4 h-[46px]">
                        {['private', 'shared', 'public'].map((vis) => (
                          <label key={vis} className="relative flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="radio"
                              name="visibility"
                              value={vis}
                              checked={visibility === vis}
                              onChange={() => setVisibility(vis as any)}
                              disabled={isProcessing}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            />
                            <div className="relative flex items-center justify-center">
                              <div className={cn(
                                "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                                visibility === vis ? "border-[#2563eb] ring-2 ring-blue-55" : "border-slate-300"
                              )} />
                              <div className={cn(
                                "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                                visibility === vis && "scale-100"
                              )} />
                            </div>
                            <span className={cn(
                              "text-sm font-bold transition-colors duration-200 capitalize",
                              visibility === vis ? "text-[#2563eb]" : "text-[#5F6E80]"
                            )}>
                              {t.upload[vis] || vis}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#2563eb] animate-pulse" />
                      <h3 className="text-base font-extrabold text-[#0B1A30] tracking-tight select-none dark:text-slate-100">
                        {t.upload.aiProcessing}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { checked: generateSummary, setChecked: setGenerateSummary, label: t.upload.genSummary || 'Generate Summary' },
                        { checked: createFlashcards, setChecked: setCreateFlashcards, label: t.upload.createFlashcards || 'Create Flashcards' }
                      ].map((item, idx) => (
                        <label
                          key={idx}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white dark:bg-slate-900",
                            item.checked
                              ? "border-blue-100 bg-[#F4F7FF]/30 shadow-xs dark:border-blue-900/30"
                              : "border-slate-200 hover:bg-slate-55/50 dark:border-slate-800"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setChecked(e.target.checked)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            disabled={isProcessing}
                          />
                          <div
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                              item.checked
                                ? "border-[#2563eb] bg-[#2563eb] text-white"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            )}
                          >
                            {item.checked && (
                              <svg
                                className="h-3.5 w-3.5 stroke-[3] stroke-current"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[#0B1A30] dark:text-slate-200">
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={clearAllState}
                  disabled={isProcessing}
                  className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
                >
                  {t.upload.cancel || 'Cancel'}
                </button>
                
                {activeTab === 'document' ? (
                  <button
                    type="submit"
                    disabled={isProcessing || !uploadedDocument}
                    className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 disabled:opacity-50 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t.upload.processing || 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Save Document
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveMedia}
                    className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 text-sm"
                  >
                    <FileCheck className="h-4 w-4" />
                    {activeTab === 'video' ? 'Save Video' : activeTab === 'audio' ? 'Save Audio' : 'Save Recording'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </form>

      {/* MEDIA LIBRARY: RECENT UPLOADS */}
      <div className="bg-white dark:bg-slate-900 border border-[#EAF1FB] dark:border-slate-800 rounded-[22px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.012)] select-none">
        <h2 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 mb-4 flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          {t.upload.recentUploads || 'Recent Uploads'}
        </h2>
        
        <RecentUploadsList
          items={recentUploads}
          onPreview={handlePreviewClick}
          onDownload={handleDownloadClick}
          onRename={handleRenameClick}
          onDelete={handleDeleteClick}
          labels={{
            title: t.upload.docTitle || 'Title',
            type: t.upload.fileType || 'Type',
            size: 'Size',
            uploaded: 'Uploaded',
            actions: 'Actions',
            preview: t.upload.preview || 'Preview',
            download: t.upload.download || 'Download',
            rename: t.upload.rename || 'Rename',
            delete: t.upload.delete || 'Delete',
            noUploads: t.upload.noRecentUploads || 'No recent uploads'
          }}
        />
      </div>

      {/* Preview Modal */}
      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        media={previewModalMedia}
      />

      {/* Rename Modal */}
      {renameModalOpen && renameModalMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setRenameModalOpen(false)} />
          <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.upload.rename || 'Rename File'}
            </h3>
            <div className="space-y-2">
              <label htmlFor="rename-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                {t.upload.docTitle || 'Title'}
              </label>
              <input
                id="rename-input"
                type="text"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenameModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                {t.upload.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmRename}
                disabled={!renameTitle.trim()}
                className="bg-[#2563eb] hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50"
              >
                {t.upload.saveRecording || 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && deleteConfirmMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex gap-3 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.upload.delete || 'Delete'} "{deleteConfirmMedia.title}"?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to permanently remove this media file? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                {t.upload.cancel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
              >
                {t.upload.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UploadPage;
