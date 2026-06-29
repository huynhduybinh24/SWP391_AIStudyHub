import { MediaType } from './mediaUploadTypes';

export const formatTime = (secs: number): string => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: 'pdf' | 'word' | 'image' | 'text' | 'slides';
}

export const validateFile = (file: File, activeTab: MediaType, language: string = 'en'): FileValidationResult => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (activeTab === 'document') {
    const allowed = ['pdf'];
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: language === 'vi' ? 'Hệ thống chỉ hỗ trợ tệp tin PDF!' : 'Only PDF files are supported!'
      };
    }
    if (file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: language === 'vi' ? 'Dung lượng tài liệu học tập vượt quá 50MB!' : 'Document size exceeds 50MB'
      };
    }

    let detectedType: 'pdf' | 'word' | 'image' | 'text' | 'slides' = 'pdf';
    if (ext === 'pdf') detectedType = 'pdf';
    else if (ext === 'docx' || ext === 'doc') detectedType = 'word';
    else if (ext === 'txt') detectedType = 'text';
    else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') detectedType = 'image';
    else if (ext === 'pptx' || ext === 'ppt') detectedType = 'slides';

    return { valid: true, detectedType };
  }

  if (activeTab === 'video') {
    const allowed = ['mp4', 'mov', 'webm'];
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: language === 'vi' ? 'Định dạng video không hỗ trợ!' : 'Unsupported video format'
      };
    }
    if (file.size > 500 * 1024 * 1024) {
      return {
        valid: false,
        error: language === 'vi' ? 'Dung lượng video vượt quá 500MB!' : 'Video size exceeds 500MB'
      };
    }
    return { valid: true };
  }

  if (activeTab === 'audio') {
    const allowed = ['mp3', 'wav', 'm4a', 'webm'];
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: language === 'vi' ? 'Định dạng âm thanh không hỗ trợ!' : 'Unsupported audio format'
      };
    }
    if (file.size > 100 * 1024 * 1024) {
      return {
        valid: false,
        error: language === 'vi' ? 'Dung lượng âm thanh vượt quá 100MB!' : 'Audio size exceeds 100MB'
      };
    }
    return { valid: true };
  }

  return { valid: true };
};
