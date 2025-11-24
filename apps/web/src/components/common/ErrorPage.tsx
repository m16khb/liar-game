// 공통 에러 페이지 컴포넌트
// 잘못된 접근 등의 에러 상황에서 사용

interface ErrorPageProps {
  title?: string
  message: string
  buttonText?: string
  onButtonClick?: () => void
}

export default function ErrorPage({
  title = '잘못된 접근입니다',
  message,
  buttonText = '로그인 페이지로 가기',
  onButtonClick = () => window.location.href = '/',
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-red-600 text-xl font-semibold mb-4">
          {title}
        </h2>
        <p className="text-gray-500 mb-6">
          {message}
        </p>
        <button
          onClick={onButtonClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  )
}
