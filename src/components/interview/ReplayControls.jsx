import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

/**
 * Component for replaying recorded audio
 * 
 * @param {Object} props
 * @param {string | null} props.audioUrl - Object URL of the recorded audio
 * @param {boolean} props.disabled - Whether controls are disabled
 * @param {Function} props.onClear - Callback when user wants to clear/re-record
 */
const ReplayControls = ({ audioUrl, disabled = false, onClear }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1F2833]/50 rounded-xl border border-[#66FCF1]/20">
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={togglePlay}
        disabled={disabled}
        className={cn(
          'w-12 h-12 p-0 border-[#66FCF1]/30',
          isPlaying && 'bg-[#66FCF1]/10'
        )}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-[#66FCF1]" />
        ) : (
          <Play className="w-5 h-5 text-[#66FCF1]" />
        )}
      </Button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs font-mono text-[#C5C6C7] min-w-[3rem]">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 h-2 bg-[#1F2833] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#66FCF1] to-[#45A29E] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono text-[#C5C6C7] min-w-[3rem]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Clear/Re-record Button (optional) */}
      {onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={disabled}
          className="text-[#C5C6C7] hover:text-[#66FCF1] text-sm"
        >
          Xóa
        </Button>
      )}
    </div>
  );
};

export default ReplayControls;
