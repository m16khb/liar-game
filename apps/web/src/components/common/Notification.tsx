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
          backgroundColor: '#ecfdf5',
          borderColor: '#10b981',
          color: '#065f46',
          icon: '✅'
        }
      case 'warning':
        return {
          backgroundColor: '#fffbeb',
          borderColor: '#f59e0b',
          color: '#92400e',
          icon: '⚠️'
        }
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          color: '#991b1b',
          icon: '❌'
        }
      default:
        return {
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          color: '#1e40af',
          icon: 'ℹ️'
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        backgroundColor: styles.backgroundColor,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '8px',
        color: styles.color,
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        animation: 'slideInRight 0.3s ease-out',
        minWidth: '200px',
        maxWidth: '400px'
      }}
    >
      <span style={{ fontSize: '16px' }}>{styles.icon}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            backgroundColor: 'transparent',
            border: 'none',
            color: styles.color,
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0',
            lineHeight: '1',
            opacity: 0.7
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0.7'
          }}
        >
          ×
        </button>
      )}

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
    </div>
  )
}