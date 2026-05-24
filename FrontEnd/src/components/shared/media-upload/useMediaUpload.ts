import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from '@/context/LanguageContext';
import { MediaType } from './mediaUploadTypes';
import { validateFile } from './mediaUploadUtils';

export function useMediaUpload(initialTab: MediaType = 'document') {
  const toast = useToast();
  const { language, t } = useTranslation();

  // Tab State
  const [activeTab, setActiveTab] = useState<MediaType>(initialTab);

  // Metadata Form States
  const [docTitle, setDocTitle] = useState('');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<any>('BIOLOGY');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf');
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private');
  const [generateSummary, setGenerateSummary] = useState(true);
  const [createFlashcards, setCreateFlashcards] = useState(true);

  // Permission (for Shared Workspace files)
  const [permission, setPermission] = useState<'viewer' | 'commenter' | 'editor'>('viewer');

  // File states
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  // Upload status states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recording states
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [recorderSupported, setRecorderSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Check MediaRecorder support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
      setRecorderSupported(supported);
    }
  }, []);

  // Timer interval hook
  useEffect(() => {
    if (isTimerRunning && recordingStatus === 'recording') {
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, recordingStatus]);

  // Object URL cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Progress Bar Simulation for Document upload
  useEffect(() => {
    if (activeTab !== 'document' || !uploadedDocument || uploadComplete) return;

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5 > 100 ? 100 : prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [uploadedDocument, uploadComplete, activeTab]);

  // Progress Bar Simulation for Audio and Video uploads
  useEffect(() => {
    if (activeTab === 'document' || !uploadedFile || uploadComplete || activeTab === 'recording') return;

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 6 > 100 ? 100 : prev + Math.floor(Math.random() * 18) + 6;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [uploadedFile, uploadComplete, activeTab]);

  const resetForm = () => {
    setDocTitle('');
    setDescription('');
    setSelectedTags([]);
  };

  const clearAllState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadedDocument(null);
    setUploadedFile(null);
    setPreviewUrl(null);
    setFileName('');
    setFileSize('');
    setUploadProgress(0);
    setUploadComplete(false);
    setIsDragOver(false);
    setIsProcessing(false);
    setRecordingStatus('idle');
    setRecordingTimer(0);
    setIsTimerRunning(false);
    resetForm();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  // MediaRecorder handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);

        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const recordingName = `Recording_${timestamp.substring(0, 10)}`;
        const recFile = new File([audioBlob], `${recordingName}.webm`, { type: 'audio/webm' });
        setUploadedFile(recFile);
        setFileName(`${recordingName}.webm`);
        setFileSize(`${(audioBlob.size / (1024 * 1024)).toFixed(1)} MB`);
        setDocTitle(recordingName.replace('_', ' '));
        setRecordingStatus('stopped');
        setUploadComplete(true);
        setUploadProgress(100);
        toast.success(t.upload.recordingCompleted || 'Recording completed');
      };

      mediaRecorder.start();
      setRecordingStatus('recording');
      setRecordingTimer(0);
      setIsTimerRunning(true);
      toast.success(t.upload.recordingStarted || 'Recording started');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error(t.sharedFiles.microphonePermissionDenied || t.upload.permissionDenied || 'Microphone permission denied');
      } else {
        toast.error(t.upload.unsupportedFormat || 'Unsupported recording configuration');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
      setIsTimerRunning(false);
      toast.success(t.upload.recordingPaused || 'Recording paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('recording');
      setIsTimerRunning(true);
      toast.success(t.upload.recordingResumed || 'Recording resumed');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      setIsTimerRunning(false);
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const deleteRecording = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
    setRecordingTimer(0);
    setIsTimerRunning(false);
    setRecordingStatus('idle');
    setUploadProgress(0);
    setUploadComplete(false);
    resetForm();
    toast.success(t.upload.recordingDeleted || 'Recording deleted');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validation = validateFile(file, activeTab, language);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    setUploadProgress(0);
    setUploadComplete(false);

    const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ');
    setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    setDescription('');
    setSelectedTags(['Notes']);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    if (activeTab === 'document') {
      setUploadedDocument(file);
      if (validation.detectedType) {
        setFileType(validation.detectedType);
      }
    } else {
      setUploadedFile(file);
      if (activeTab === 'video') {
        toast.success(t.upload.videoUploaded || 'Video uploaded successfully');
      } else if (activeTab === 'audio') {
        toast.success(t.upload.audioUploaded || 'Audio uploaded successfully');
      }
    }
  };

  return {
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
    setFileType,
    visibility,
    setVisibility,
    generateSummary,
    setGenerateSummary,
    createFlashcards,
    setCreateFlashcards,
    permission,
    setPermission,
    uploadedDocument,
    setUploadedDocument,
    uploadedFile,
    setUploadedFile,
    previewUrl,
    setPreviewUrl,
    fileName,
    fileSize,
    uploadProgress,
    setUploadProgress,
    uploadComplete,
    setUploadComplete,
    isDragOver,
    isProcessing,
    setIsProcessing,
    recordingStatus,
    recordingTimer,
    isTimerRunning,
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
    processSelectedFile,
    resetForm,
    clearAllState,
    language,
    t
  };
}
