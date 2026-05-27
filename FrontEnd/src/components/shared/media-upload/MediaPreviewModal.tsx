import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { UploadedMedia } from './mediaUploadTypes';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: UploadedMedia | null;
}

export function MediaPreviewModal({ isOpen, onClose, media }: MediaPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Simple focus trap: focus the close button on open
      const focusable = modalRef.current?.querySelectorAll('button, video, audio');
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-[640px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-left"
        role="dialog"
        aria-modal="true"
        aria-label="Media Preview Modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate pr-4 max-w-[500px]">
            {media.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="w-full flex justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 border border-slate-100 dark:border-slate-850">
          {media.type === 'video' ? (
            <video
              controls
              src={media.url}
              className="w-full max-h-[360px] rounded-xl"
              autoPlay
              aria-label="Video player"
            />
          ) : (
            <audio
              controls
              src={media.url}
              className="w-full py-4 px-2"
              autoPlay
              aria-label="Audio player"
            />
          )}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md"
            aria-label="Close preview details"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPreviewModal;
