// 공통 로딩 스피너 컴포넌트 - Retro Arcade Theme
// 전체 페이지 로딩 또는 인라인 로딩에서 사용

interface LoadingSpinnerProps {
  message?: string
  fullPage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
}

export default function LoadingSpinner({
  message,
  fullPage = true,
  size = 'md',
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center">
      {/* Arcade Spinner */}
      <div className="relative inline-block mb-6">
        <div className={`${sizeClasses[size]} border-4 border-arcade-dark border-t-arcade-cyan rounded-full animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🎮</span>
        </div>
      </div>

      {/* Loading Message */}
      {message && (
        <p className="text-sm text-arcade-cyan animate-blink" style={{ fontFamily: 'VT323, Galmuri11, monospace' }}>
          {message.toUpperCase()}
        </p>
      )}

      {/* Loading Dots */}
      <div className="flex justify-center gap-2 mt-4">
        <span className="w-2 h-2 bg-arcade-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-arcade-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-arcade-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-arcade-black flex items-center justify-center relative">
        {/* CRT Scanline Effect */}
        <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
             style={{
               background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
             }} />

        {/* Grid Background */}
        <div className="fixed inset-0 pointer-events-none opacity-5"
             style={{
               backgroundImage: 'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }} />

        <div className="relative z-10">
          {spinner}
        </div>
      </div>
    )
  }

  return spinner
}
