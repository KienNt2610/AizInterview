import { Loader2 } from 'lucide-react';

/**
 * Full-screen loading overlay for answer processing
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether to show the overlay
 * @param {string} props.message - Loading message (default: "Đang xử lý câu trả lời...")
 */
const FullScreenLoading = ({ isVisible, message = 'Đang xử lý câu trả lời...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C10]/95 backdrop-blur-sm">
      <div className="text-center space-y-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-[#66FCF1] animate-spin mx-auto glow-primary" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-[#66FCF1]/20 rounded-full mx-auto"></div>
        </div>
        <p className="text-xl text-[#C5C6C7] font-medium glow-text">
          {message}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-[#66FCF1] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoading;
