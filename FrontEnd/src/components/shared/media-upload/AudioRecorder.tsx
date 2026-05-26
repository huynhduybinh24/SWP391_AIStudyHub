import { useRef, useState } from 'react';
import { Mic, Play, Pause, Trash2, Save, Square } from 'lucide-react';
import { formatTime } from './mediaUploadUtils';

interface AudioRecorderProps {
  recordingStatus: 'idle' | 'recording' | 'paused' | 'stopped';
  recordingTimer: number;
  recorderSupported: boolean;
  previewUrl: string | null;
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  deleteRecording: () => void;
  onSave?: () => void;
  // Labels for i18n
  startLabel: string;
  pauseLabel: string;
  resumeLabel: string;
  stopLabel: string;
  deleteLabel: string;
  saveLabel: string;
  readyLabel: string;
  unsupportedLabel: string;
}

export function AudioRecorder({
  recordingStatus,
  recordingTimer,
  recorderSupported,
  previewUrl,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  deleteRecording,
  onSave,
  startLabel,
  pauseLabel,
  resumeLabel,
  stopLabel,
  deleteLabel,
  saveLabel,
  readyLabel,
  unsupportedLabel
}: AudioRecorderProps) {
  const playbackRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayback = () => {
    if (!playbackRef.current) return;
    if (isPlaying) {
      playbackRef.current.pause();
    } else {
      playbackRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const getStatusText = () => {
    if (recordingStatus === 'recording') return 'Recording...';
    if (recordingStatus === 'paused') return 'Recording paused';
    if (recordingStatus === 'stopped') return 'Recording completed';
    return readyLabel;
  };

  return (
    <div className="space-y-4">
      {recordingStatus === 'idle' && (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-[#F4F7FF]/35 dark:bg-slate-950/20 border border-[#EAF1FB] dark:border-slate-800 rounded-2xl p-6 min-h-[190px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-slate-800 text-[#2563eb] mb-3.5 animate-pulse">
            <Mic className="h-6 w-6 stroke-[1.8]" />
          </div>
          <h3 className="text-lg font-extrabold text-[#0B1A30] dark:text-slate-100">
            {readyLabel}
          </h3>
          {!recorderSupported ? (
            <p className="text-xs font-semibold text-rose-500 mt-2">
              {unsupportedLabel}
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold text-[#8B98A5] mt-1">
                Ready to record
              </p>
              <button
                type="button"
                onClick={startRecording}
                className="mt-5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer flex items-center gap-2"
                aria-label={startLabel}
              >
                <Mic className="h-4 w-4" />
                {startLabel}
              </button>
            </>
          )}
        </div>
      )}

      {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-[#F4F7FF]/35 dark:bg-slate-950/20 border border-[#EAF1FB] dark:border-slate-800 rounded-2xl p-6 min-h-[190px] select-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-400 mb-3.5 animate-ping">
            <Mic className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-black text-[#0B1A30] dark:text-slate-100" aria-live="polite">
            {formatTime(recordingTimer)}
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 capitalize animate-pulse" aria-live="polite">
            {getStatusText()}
          </p>
          <div className="flex items-center gap-3 mt-6">
            {recordingStatus === 'recording' ? (
              <button
                type="button"
                onClick={pauseRecording}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
                aria-label={pauseLabel}
              >
                <Pause className="h-3.5 w-3.5" />
                {pauseLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={resumeRecording}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
                aria-label={resumeLabel}
              >
                <Play className="h-3.5 w-3.5" />
                {resumeLabel}
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5"
              aria-label={stopLabel}
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              {stopLabel}
            </button>
          </div>
        </div>
      )}

      {recordingStatus === 'stopped' && previewUrl && (
        <div className="space-y-4 animate-fade-in">
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-[#EAF1FB] dark:border-slate-800">
            <div className="text-xs font-bold text-[#5F6E80] dark:text-slate-400 mb-2">Recording Playback</div>
            <div className="flex items-center gap-4">
              <audio
                ref={playbackRef}
                controls
                src={previewUrl}
                className="w-full"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              {/* Playback triggers play on hover or click */}
              <button
                type="button"
                onClick={handlePlayback}
                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors focus:outline-none shrink-0"
                aria-label={isPlaying ? "Pause" : "Playback"}
              >
                {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={deleteRecording}
              className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
              aria-label={deleteLabel}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteLabel}
            </button>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
                aria-label={saveLabel}
              >
                <Save className="h-3.5 w-3.5" />
                {saveLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
