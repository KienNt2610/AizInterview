import { cn } from '../../utils/cn';

const Input = ({ className, type = 'text', ...props }) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-[#1F2833] bg-[#1F2833] px-4 py-2 text-sm text-white',
        'placeholder:text-[#C5C6C7]/50 focus:outline-none focus:ring-2 focus:ring-[#66FCF1] focus:border-[#66FCF1]',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
        'hover:border-[#66FCF1]/50',
        className
      )}
      {...props}
    />
  );
};

export default Input;
