import React from 'react'

interface NotificationProps {
  type: 'success' | 'warning' | 'info' | 'error'
  message: string
  isVisible: boolean
  duration?: number
  onClose?: () => void
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  duration = 3000,
  onClose
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          borderColor: 'border-arcade-green',
          bgColor: 'bg-arcade-green/20',
          textColor: 'text-arcade-green',
          icon: '✓'
        }
      case 'warning':
        return {
          borderColor: 'border-arcade-yellow',
          bgColor: 'bg-arcade-yellow/20',
          textColor: 'text-arcade-yellow',
          icon: '⚠'
        }
      case 'error':
        return {
          borderColor: 'border-arcade-pink',
          bgColor: 'bg-arcade-pink/20',
          textColor: 'text-arcade-pink',
          icon: '✕'
        }
      default:
        return {
          borderColor: 'border-arcade-cyan',
          bgColor: 'bg-arcade-cyan/20',
          textColor: 'text-arcade-cyan',
          icon: 'i'
        }
    }
  }

  const styles = getStyles()

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className={`fixed top-5 right-5 p-4 ${styles.bgColor} border-3 ${styles.borderColor} ${styles.textColor} font-retro text-retro-base flex items-center gap-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] z-[1000] min-w-[200px] max-w-[400px]`}
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <span className="font-pixel text-pixel-base">{styles.icon}</span>
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-auto bg-transparent border-none ${styles.textColor} cursor-pointer font-pixel text-pixel-base p-0 leading-none opacity-70 hover:opacity-100 transition-opacity`}
          >
            ✕
          </button>
        )}
      </div>
    </>
  )
}