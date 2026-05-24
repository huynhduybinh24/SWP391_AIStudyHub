export type MediaType = 'document' | 'video' | 'audio' | 'recording';
export type UploadType = MediaType;

export interface UploadedMedia {
  id: string;
  title: string;
  type: MediaType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  duration?: string;
  uploadedAt: string;
  description?: string;
  tags: string[];
}

export interface SharedMediaFile {
  id: string;
  title: string;
  name: string;
  type: MediaType;
  mimeType: string;
  size: number;
  sizeLabel: string;
  url: string;
  duration?: number;
  uploadedAt: string;
  sharedBy: string;
  permission: 'viewer' | 'commenter' | 'editor';
  description?: string;
  tags: string[];
}
