import React from 'react';
import { FileCheck, Video, Music, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaType } from './mediaUploadTypes';

interface MediaUploadTabsProps {
  activeTab: MediaType;
  onTabChange: (tab: MediaType) => void;
  labels: {
    document: string;
    video: string;
    audio: string;
    record: string;
  };
}

export function MediaUploadTabs({ activeTab, onTabChange, labels }: MediaUploadTabsProps) {
  const tabs = [
    { key: 'document' as MediaType, label: labels.document, icon: <FileCheck className="h-4 w-4" /> },
    { key: 'video' as MediaType, label: labels.video, icon: <Video className="h-4 w-4" /> },
    { key: 'audio' as MediaType, label: labels.audio, icon: <Music className="h-4 w-4" /> },
    { key: 'recording' as MediaType, label: labels.record, icon: <Mic className="h-4 w-4" /> }
  ];

  return (
    <div className="flex items-center gap-2 border-b border-[#EAF1FB] dark:border-slate-805 overflow-x-auto scrollbar-none pb-2 select-none">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-all cursor-pointer shrink-0 border",
              isSelected
                ? "bg-[#2563eb] border-[#2563eb] text-white"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default MediaUploadTabs;
