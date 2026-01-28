import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Component for displaying AI transcript in the center of the screen
 * 
 * @param {Object} props
 * @param {string} props.transcript - The transcript text to display
 * @param {'idle' | 'speaking' | 'done'} props.speechState - Current AI speech state
 * @param {boolean} props.isStreaming - Whether transcript is currently streaming
 * @param {'question' | 'feedback'} props.mode - Display mode: question or feedback
 */
const AiTranscriptCenter = ({ transcript, speechState, isStreaming, mode = 'question' }) => {
  const isSpeaking = speechState === 'speaking';
  const isDone = speechState === 'done';
  const hasContent = transcript && transcript.length > 0;
  const isFeedback = mode === 'feedback';

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-4xl">
        {/* AI Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-[#66FCF1] text-sm font-medium glow-text">
              {isFeedback ? 'AI đang đưa ra phản hồi...' : 'AI đang nói...'}
            </span>
          </div>
        )}

        {/* Feedback Header */}
        {isFeedback && isDone && hasContent && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#45A29E]/20 border border-[#45A29E]/30 text-[#66FCF1] text-sm font-medium glow-border">
              <span>Phản hồi từ AI</span>
            </div>
          </div>
        )}

        {/* Transcript Container */}
        <div
          className={cn(
            'glass-strong rounded-2xl p-8 sm:p-12 transition-all duration-500',
            isSpeaking && 'glow-border',
            isDone && 'border-[#45A29E]/30'
          )}
        >
          {hasContent ? (
            <div className="space-y-6">
              <p className="text-xl sm:text-2xl leading-relaxed text-white font-light">
                {transcript}
                {isStreaming && (
                  <span className="inline-block w-0.5 h-6 bg-[#66FCF1] ml-1 animate-pulse align-middle"></span>
                )}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-[#66FCF1]/50 animate-spin mx-auto mb-4" />
              <p className="text-[#C5C6C7] text-lg">Đang chờ câu hỏi từ AI...</p>
            </div>
          )}
        </div>

        {/* User Turn Indicator (only for question mode) */}
        {isDone && hasContent && !isFeedback && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#45A29E]/20 border border-[#45A29E]/30 text-[#66FCF1] text-sm font-medium glow-border">
              <span>Đến lượt bạn trả lời</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiTranscriptCenter;
