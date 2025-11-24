import React from 'react'

interface ProgressBarProps {
  value: number
  max: number
  type: 'success' | 'warning' | 'info' | 'error'
  size?: 'small' | 'medium' | 'large'
  showPercentage?: boolean
  animated?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  type,
  size = 'medium',
  showPercentage = false,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { height: 4, fontSize: '12px' }
      case 'medium':
        return { height: 6, fontSize: '13px' }
      case 'large':
        return { height: 8, fontSize: '14px' }
      default:
        return { height: 6, fontSize: '13px' }
    }
  }

  const getColorStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#ecfdf5',
          fillColor: '#10b981',
          fillGradient: 'linear-gradient(90deg, #10b981, #059669)'
        }
      case 'warning':
        return {
          backgroundColor: '#fffbeb',
          fillColor: '#f59e0b',
          fillGradient: 'linear-gradient(90deg, #f59e0b, #d97706)'
        }
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          fillColor: '#ef4444',
          fillGradient: 'linear-gradient(90deg, #ef4444, #dc2626)'
        }
      default:
        return {
          backgroundColor: '#eff6ff',
          fillColor: '#3b82f6',
          fillGradient: 'linear-gradient(90deg, #3b82f6, #2563eb)'
        }
    }
  }

  const sizeStyles = getSizeStyles()
  const colorStyles = getColorStyles()

  return (
    <div style={{ width: '100%' }}>
      {showPercentage && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: sizeStyles.fontSize,
          color: '#6b7280'
        }}>
          <span>진행률</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div style={{
        width: '100%',
        height: sizeStyles.height,
        backgroundColor: colorStyles.backgroundColor,
        borderRadius: sizeStyles.height / 2,
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: colorStyles.fillGradient,
          borderRadius: sizeStyles.height / 2,
          transition: animated ? 'width 0.3s ease-out' : 'none',
          boxShadow: percentage > 0 ? `0 0 10px ${colorStyles.fillColor}40` : 'none'
        }} />
      </div>
    </div>
  )
}