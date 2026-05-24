import React, { useRef } from 'react';
import { CloudUpload, Video, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaType } from './mediaUploadTypes';

interface MediaDropzoneProps {
  activeTab: MediaType;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  browseLabel: string;
  dragDropLabel: string;
  supportLabel: string;
  allowedExtensions: string;
}

export function MediaDropzone({
  activeTab,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  browseLabel,
  dragDropLabel,
  supportLabel,
  allowedExtensions
}: MediaDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getIcon = () => {
    switch (activeTab) {
      case 'video':
        return <Video className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />;
      case 'audio':
        return <Music className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />;
      default:
        return <CloudUpload className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />;
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-8 px-6 text-center min-h-[190px] transition-all duration-300 cursor-pointer",
        isDragOver
          ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
          : "border-[#C3D2FF] bg-[#F4F7FF]/35 dark:bg-slate-950/20 hover:bg-[#F4F7FF]/55"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        accept={allowedExtensions}
        className="hidden"
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5">
        {getIcon()}
      </div>
      <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
        {dragDropLabel}
      </h3>
      <p className="text-xs font-semibold text-[#8B98A5] mt-1">
        {supportLabel}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="mt-5 rounded-xl border border-[#D5E1F2] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
      >
        {browseLabel}
      </button>
    </div>
  );
}

export default MediaDropzone;
