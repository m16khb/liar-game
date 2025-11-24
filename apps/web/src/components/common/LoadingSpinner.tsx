// 공통 로딩 스피너 컴포넌트
// 전체 페이지 로딩 또는 인라인 로딩에서 사용

interface LoadingSpinnerProps {
  message?: string
  fullPage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-4',
  lg: 'w-16 h-16 border-4',
}

export default function LoadingSpinner({
  message,
  fullPage = true,
  size = 'md',
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center">
      <div
        className={`${sizeClasses[size]} border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4`}
      />
      {message && (
        <p className="text-gray-500 text-base">
          {message}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return spinner
}
