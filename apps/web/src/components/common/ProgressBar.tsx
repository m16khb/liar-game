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

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return { height: 'h-1', fontSize: 'text-pixel-xs' }
      case 'medium':
        return { height: 'h-2', fontSize: 'text-pixel-sm' }
      case 'large':
        return { height: 'h-3', fontSize: 'text-pixel-base' }
      default:
        return { height: 'h-2', fontSize: 'text-pixel-sm' }
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-arcade-black',
          borderColor: 'border-arcade-green',
          fillColor: 'bg-arcade-green',
          textColor: 'text-arcade-green'
        }
      case 'warning':
        return {
          bgColor: 'bg-arcade-black',
          borderColor: 'border-arcade-yellow',
          fillColor: 'bg-arcade-yellow',
          textColor: 'text-arcade-yellow'
        }
      case 'error':
        return {
          bgColor: 'bg-arcade-black',
          borderColor: 'border-arcade-pink',
          fillColor: 'bg-arcade-pink',
          textColor: 'text-arcade-pink'
        }
      default:
        return {
          bgColor: 'bg-arcade-black',
          borderColor: 'border-arcade-cyan',
          fillColor: 'bg-arcade-cyan',
          textColor: 'text-arcade-cyan'
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const colorClasses = getColorClasses()

  return (
    <div className="w-full">
      {showPercentage && (
        <div className={`flex justify-between mb-1 font-pixel ${sizeClasses.fontSize} ${colorClasses.textColor}`}>
          <span>진행률</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full ${sizeClasses.height} ${colorClasses.bgColor} border-2 ${colorClasses.borderColor} overflow-hidden relative`}>
        <div
          className={`${sizeClasses.height} ${colorClasses.fillColor} ${animated ? 'transition-all duration-300' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-flicker" />
        </div>
      </div>
    </div>
  )
}