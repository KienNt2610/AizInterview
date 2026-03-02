import { cn } from '../../utils/cn';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0C10] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#66FCF1] text-[#0B0C10] hover:bg-[#45A29E] focus:ring-[#66FCF1] shadow-lg glow-primary-hover font-semibold',
    secondary: 'bg-[#1F2833] text-[#C5C6C7] hover:bg-[#45A29E] hover:text-white focus:ring-[#66FCF1] border border-[#1F2833] hover:border-[#66FCF1]',
    outline: 'border-2 border-[#66FCF1] text-[#66FCF1] hover:bg-[#66FCF1] hover:text-[#0B0C10] focus:ring-[#66FCF1] glow-border',
    ghost: 'text-[#C5C6C7] hover:text-[#66FCF1] hover:bg-[#1F2833] focus:ring-[#66FCF1]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-lg',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={!!disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
