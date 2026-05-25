import React, { useEffect, useRef } from 'react';
import { X, Sparkles, FileText, Video as VideoIcon, Music, FileCheck } from 'lucide-react';
import { useMediaUpload } from '@/components/shared/media-upload/useMediaUpload';
import { MediaUploadTabs } from '@/components/shared/media-upload/MediaUploadTabs';
import { MediaDropzone } from '@/components/shared/media-upload/MediaDropzone';
import { VideoPreview } from '@/components/shared/media-upload/VideoPreview';
import { AudioPreview } from '@/components/shared/media-upload/AudioPreview';
import { AudioRecorder } from '@/components/shared/media-upload/AudioRecorder';
import { MediaMetadataForm } from '@/components/shared/media-upload/MediaMetadataForm';
import { SharedFile } from './SharedFilesTable';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';


interface SharedFilesUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newFile: SharedFile) => void;
}

export function SharedFilesUploadModal({ isOpen, onClose, onSave }: SharedFilesUploadModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
    permission,
    setPermission,
    uploadedDocument,
    uploadedFile,
    previewUrl,
    fileName,
    fileSize,
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
    clearAllState,
    t
  } = useMediaUpload('document');

  // Handle ESC close and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      const focusable = modalRef.current?.querySelectorAll('button, input, select, textarea');
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Clean all states when closed
  useEffect(() => {
    if (!isOpen) {
      clearAllState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'document' && !uploadedDocument) {
      return;
    }
    if (activeTab !== 'document' && !uploadedFile) {
      return;
    }

    const titleVal = docTitle.trim();
    if (!titleVal) {
      return;
    }

    setIsProcessing(true);

    // Simulate short save/processing
    setTimeout(() => {
      const displayPermission =
        permission === 'editor' ? 'Editor' : permission === 'commenter' ? 'Viewer' : 'Viewer';

      const finalType =
        activeTab === 'document'
          ? fileType
          : activeTab === 'video'
          ? 'video'
          : activeTab === 'audio'
          ? 'audio'
          : 'recording';


      const newSharedFile: SharedFile = {
        id: `file-shared-${Date.now()}`,
        name: titleVal + (activeTab === 'document' ? `.${fileType}` : activeTab === 'video' ? '.mp4' : '.mp3'),
        owner: 'Huynh Duy Binh',
        permission: displayPermission,
        dateShared: 'Just now',
        type: finalType,
        size: fileSize || 'N/A',
        description: description.trim() || 'No description provided.',
        tags: selectedTags,
        previewContent: previewUrl || '',
        summary: `AI Workspace Summary: Media file containing lecture slides, references, or recordings related to ${selectedSubjectKey}. Optimized by LumiEdu.`,
        url: previewUrl || ''
      };

      onSave(newSharedFile);
      setIsProcessing(false);
      onClose();
    }, 1000);
  };

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

  const isFileAttached =
    (activeTab === 'document' && uploadedDocument) ||
    (activeTab !== 'document' && uploadedFile && activeTab !== 'recording');

  const getPreviewIcon = () => {
    if (activeTab === 'video') return <VideoIcon className="h-6 w-6 text-indigo-500" />;
    if (activeTab === 'audio') return <Music className="h-6 w-6 text-emerald-500" />;
    
    // Document icons
    if (fileType === 'pdf') return <FileText className="h-6 w-6 text-rose-500" />;
    if (fileType === 'word') return <FileText className="h-6 w-6 text-blue-500" />;
    if (fileType === 'text') return <FileText className="h-6 w-6 text-emerald-500" />;
    if (fileType === 'image') return <FileCheck className="h-6 w-6 text-sky-500" />;
    return <FileText className="h-6 w-6 text-amber-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        ref={modalRef}
        className="relative z-10 w-full max-w-[680px] max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-upload-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-55 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        <div className="space-y-1">
          <h2 id="shared-upload-title" className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.sharedFiles.uploadToSharedFiles || 'Upload to Shared Files'}
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Upload study resources directly to the group folder with customized permissions.
          </p>
        </div>

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

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="space-y-6">
            {/* Dropzones */}
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

            {/* Live Audio Recording */}
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

            {/* Attached file progress card */}
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

            {/* Video preview controls */}
            {activeTab === 'video' && uploadComplete && uploadedFile && previewUrl && (
              <VideoPreview
                previewUrl={previewUrl}
                onReplace={() => {
                  clearAllState();
                  setActiveTab('video');
                }}
                onRemove={clearAllState}
                replaceLabel="Replace Video"
                removeLabel="Remove Video"
              />
            )}

            {/* Audio preview controls */}
            {activeTab === 'audio' && uploadComplete && uploadedFile && previewUrl && (
              <AudioPreview
                previewUrl={previewUrl}
                onReplace={() => {
                  clearAllState();
                  setActiveTab('audio');
                }}
                onRemove={clearAllState}
                replaceLabel="Replace Audio"
                removeLabel="Remove Audio"
              />
            )}

            {/* Metadata inputs, shown only after file upload finishes */}
            {uploadComplete && (isFileAttached || activeTab === 'recording') && (
              <MediaMetadataForm
                title={docTitle}
                onTitleChange={setDocTitle}
                subject={selectedSubjectKey}
                onSubjectChange={setSelectedSubjectKey}
                description={description}
                onDescriptionChange={setDescription}
                tags={selectedTags}
                onTagsChange={setSelectedTags}
                showPermission={true}
                permission={permission}
                onPermissionChange={setPermission}
                mediaType={activeTab}
                isProcessing={isProcessing}
                titleLabel={t.upload.docTitle || 'Title'}
                subjectLabel={t.myDocuments.subject || 'Subject'}
                descriptionLabel={t.upload.description || 'Description'}
                tagsLabel={t.upload.tags || 'Tags'}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
            >
              {t.upload.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isProcessing || !uploadComplete}
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
                  {t.sharedFiles.uploadFiles || 'Upload'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default SharedFilesUploadModal;
