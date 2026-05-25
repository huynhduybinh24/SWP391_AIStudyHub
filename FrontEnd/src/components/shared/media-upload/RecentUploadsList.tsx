import React from 'react';
import { Video, Music, FileText, Eye, Download, Edit2, Trash2 } from 'lucide-react';
import { UploadedMedia } from './mediaUploadTypes';

interface RecentUploadsListProps {
  items: UploadedMedia[];
  onPreview: (item: UploadedMedia) => void;
  onDownload: (item: UploadedMedia) => void;
  onRename: (item: UploadedMedia) => void;
  onDelete: (item: UploadedMedia) => void;
  labels: {
    title: string;
    type: string;
    size: string;
    uploaded: string;
    actions: string;
    preview: string;
    download: string;
    rename: string;
    delete: string;
    noUploads: string;
  };
}

export function RecentUploadsList({
  items,
  onPreview,
  onDownload,
  onRename,
  onDelete,
  labels
}: RecentUploadsListProps) {
  return (
    <div className="overflow-x-auto select-none">
      {items.length === 0 ? (
        <div className="text-center py-8 text-[#8B98A5] dark:text-slate-500 font-semibold text-sm">
          {labels.noUploads}
        </div>
      ) : (
        <table className="w-full border-collapse text-left text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-[#EAF1FB] dark:border-slate-800 text-xs font-bold text-[#5F6E80] dark:text-slate-400">
              <th className="pb-3 pr-4">{labels.title}</th>
              <th className="pb-3 px-4">{labels.type}</th>
              <th className="pb-3 px-4">{labels.size}</th>
              <th className="pb-3 px-4">{labels.uploaded}</th>
              <th className="pb-3 pl-4 text-right">{labels.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAF1FB] dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="text-[#0B1A30] dark:text-slate-205">
                <td className="py-4 pr-4 font-bold max-w-[200px] truncate" title={item.title}>
                  <div className="flex items-center gap-2">
                    {item.type === 'video' ? (
                      <Video className="h-4 w-4 text-indigo-500 shrink-0" />
                    ) : item.type === 'audio' || item.type === 'recording' ? (
                      <Music className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                </td>
                <td className="py-4 px-4 font-semibold capitalize">{item.type}</td>
                <td className="py-4 px-4 text-[#5F6E80] dark:text-slate-400 font-semibold">
                  {item.fileSize > 0 ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A'}
                </td>
                <td className="py-4 px-4 text-[#5F6E80] dark:text-slate-400 font-medium">
                  {item.uploadedAt}
                </td>
                <td className="py-4 pl-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onPreview(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563eb] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={labels.preview}
                      aria-label={labels.preview}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={labels.download}
                      aria-label={labels.download}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRename(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={labels.rename}
                      aria-label={labels.rename}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors cursor-pointer"
                      title={labels.delete}
                      aria-label={labels.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecentUploadsList;
