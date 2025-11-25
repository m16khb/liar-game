import { HTMLAttributes, forwardRef } from 'react';

type CardVariant = 'default' | 'room' | 'player' | 'modal';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  isActive?: boolean;
  hasDecoration?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-arcade-dark
    border-4 border-arcade-cyan
    p-6
    shadow-arcade-card
  `,
  room: `
    bg-arcade-dark
    border-3 border-arcade-blue
    p-5
    transition-all duration-150
    cursor-pointer
    hover:border-arcade-cyan
    hover:translate-y-[-4px]
    hover:shadow-[0_0_25px_rgba(5,217,232,0.3)]
    relative
  `,
  player: `
    bg-arcade-dark
    border-3 border-arcade-blue
    p-4
    transition-all duration-100
    cursor-pointer
    relative
    hover:translate-x-2
    hover:border-arcade-cyan
    hover:shadow-[0_0_15px_rgba(5,217,232,0.3)]
  `,
  modal: `
    bg-arcade-dark
    border-4 border-arcade-pink
    p-8
    shadow-[0_0_60px_rgba(255,42,109,0.4)]
  `,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      isActive = false,
      hasDecoration = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${isActive ? 'border-arcade-cyan' : ''}
          ${hasDecoration ? 'arcade-header-decoration' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Room Card에서 사용할 Play Arrow
export const RoomCardArrow = () => (
  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-arcade-cyan opacity-0 group-hover:opacity-100 transition-opacity">
    ▶
  </span>
);
