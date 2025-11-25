import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'host' | 'me' | 'ready' | 'waiting' | 'playing' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  host: 'bg-arcade-yellow text-arcade-black',
  me: 'bg-arcade-pink text-white',
  ready: 'bg-arcade-green text-arcade-black',
  waiting: 'bg-arcade-blue text-arcade-cyan',
  playing: 'bg-arcade-orange text-white',
  default: 'bg-arcade-dark text-arcade-cyan border border-arcade-cyan',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', pulse = true, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          font-pixel text-pixel-xs uppercase
          px-2 py-1
          inline-block
          ${variantStyles[variant]}
          ${pulse ? 'animate-pulse-badge' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
