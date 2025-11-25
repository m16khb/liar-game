import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            font-retro text-retro-base
            bg-arcade-dark text-white
            border-3 border-arcade-cyan
            px-4 py-3
            focus:outline-none focus:border-arcade-yellow
            focus:shadow-[0_0_15px_rgba(249,240,2,0.3)]
            transition-all duration-200
            placeholder:text-arcade-cyan/50
            ${fullWidth ? 'w-full' : ''}
            ${error ? 'border-arcade-pink' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="font-retro text-retro-sm text-arcade-pink mt-2">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
