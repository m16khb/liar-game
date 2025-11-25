import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-arcade-green text-arcade-black
    border-4 border-white
    shadow-neon-green
    hover:translate-y-[-4px] hover:shadow-[0_8px_40px_rgba(0,255,65,0.6)]
    active:translate-y-[2px]
  `,
  secondary: `
    bg-arcade-cyan text-white
    border-4 border-white
    shadow-neon-cyan
    hover:translate-y-[-4px] hover:shadow-[0_8px_40px_rgba(5,217,232,0.6)]
    active:translate-y-[2px]
  `,
  danger: `
    bg-arcade-pink text-white
    border-3 border-white
    hover:scale-110 hover:shadow-neon-pink
    active:scale-95
  `,
  ghost: `
    bg-transparent text-arcade-cyan
    border-3 border-arcade-cyan
    hover:bg-arcade-cyan/20 hover:shadow-neon-cyan
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-pixel-xs',
  md: 'px-6 py-3 text-pixel-sm',
  lg: 'px-8 py-4 text-pixel-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      font-pixel uppercase
      cursor-pointer
      transition-all duration-100
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="arcade-spinner w-4 h-4" />
            <span>LOADING...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
