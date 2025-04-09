import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function GradientButton({
  href,
  onClick,
  children,
  className,
  type = 'button',
  disabled = false,
  ariaLabel,
  size = 'md',
  variant = 'primary',
  icon,
  iconPosition = 'left',
}: GradientButtonProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-6 py-2.5 text-sm',
    md: 'px-8 py-3.5',
    lg: 'px-10 py-4 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'from-[#1A1B40] to-[#2D2F67] group-hover:from-[#1A1B40] group-hover:to-[#c4b087]',
    secondary: 'from-[#2D2F67] to-[#1A1B40] group-hover:from-[#2D2F67] group-hover:to-[#c4b087]',
    accent: 'from-[#c4b087] to-[#1A1B40] group-hover:from-[#c4b087] group-hover:to-[#1A1B40]',
  };

  // Common button styling
  const buttonStyles = cn(
    'group inline-flex items-center justify-center text-white rounded-md shadow-lg transition-all duration-300 font-medium relative overflow-hidden',
    sizeClasses[size],
    disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]',
    className
  );

  // Motion animation properties
  const motionProps = {
    whileHover: disabled ? {} : { 
      boxShadow: "0 15px 30px rgba(26, 27, 64, 0.2)"
    },
    whileTap: disabled ? {} : { scale: 0.98 },
  };

  // Render as button or link based on props
  if (href) {
    return (
      <motion.a 
        href={href}
        className={buttonStyles}
        aria-label={ariaLabel}
        {...motionProps}
      >
        {/* Gradient background */}
        <span className={`absolute inset-0 w-full h-full bg-gradient-to-r ${variantClasses[variant]} transition-colors duration-500 ease-out`}></span>
        
        {/* Content */}
        <span className="relative flex items-center gap-2 z-10">
          {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
        </span>
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonStyles}
      aria-label={ariaLabel}
      {...motionProps}
    >
      {/* Gradient background */}
      <span className={`absolute inset-0 w-full h-full bg-gradient-to-r ${variantClasses[variant]} transition-colors duration-500 ease-out`}></span>
      
      {/* Content */}
      <span className="relative flex items-center gap-2 z-10">
        {icon && iconPosition === 'left' && <span className="flex items-center">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span className="flex items-center">{icon}</span>}
      </span>
    </motion.button>
  );
}