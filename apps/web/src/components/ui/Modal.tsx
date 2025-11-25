import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-arcade-dark
          border-4 border-arcade-pink
          p-6
          w-full ${sizeStyles[size]}
          shadow-[0_0_60px_rgba(255,42,109,0.4)]
          relative
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* 모달 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-pixel text-pixel-sm text-arcade-pink hover:text-arcade-yellow transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 제목 */}
        {title && (
          <h2 className="font-pixel text-pixel-lg text-arcade-yellow mb-6 pr-8">
            {title}
          </h2>
        )}

        {/* 콘텐츠 */}
        {children}
      </div>
    </div>,
    document.body
  );
};

// 모달 액션 버튼 컨테이너
export const ModalActions = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-4 mt-6 justify-end">{children}</div>
);
