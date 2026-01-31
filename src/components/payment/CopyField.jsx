import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';

const CopyField = ({ label, value, className }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast('Đã sao chép vào clipboard', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast('Không thể sao chép', { type: 'error' });
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-[#C5C6C7]">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-4 py-2.5 bg-[#0B0C10] border border-[#1F2833] rounded-lg text-white font-mono text-sm break-all">
          {value}
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={handleCopy}
          className="shrink-0"
          title={copied ? 'Đã sao chép' : 'Sao chép'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CopyField;
