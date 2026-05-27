import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface VideoPreviewProps {
  previewUrl: string;
  onReplace: () => void;
  onRemove: () => void;
  replaceLabel: string;
  removeLabel: string;
}

export function VideoPreview({
  previewUrl,
  onReplace,
  onRemove,
  replaceLabel,
  removeLabel
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-4">
      <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-2 border border-[#EAF1FB] dark:border-slate-800 relative">
        <video
          ref={videoRef}
          controls
          src={previewUrl}
          className="w-full rounded-xl max-h-[300px]"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        {/* Play/Pause control button to meet requirement 5 */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-16 right-6 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors focus:outline-none"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onReplace}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-4 py-2 cursor-pointer"
        >
          {replaceLabel}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2 cursor-pointer"
        >
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

export default VideoPreview;
