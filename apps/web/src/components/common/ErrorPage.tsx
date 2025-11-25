// 공통 에러 페이지 컴포넌트 - Retro Arcade Theme
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
    <div className="min-h-screen bg-arcade-black px-4 py-12 flex items-center justify-center relative">
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

      {/* Error Card */}
      <div className="w-full max-w-md text-center relative z-10">
        <div className="bg-arcade-dark border-4 border-arcade-pink p-8 relative shadow-[0_0_60px_rgba(255,42,109,0.4)]">
          {/* 장식 */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl text-arcade-yellow animate-bounce">⚠️</span>

          {/* Error Icon */}
          <div className="text-6xl mb-6 animate-pulse">
            💀
          </div>

          {/* Title */}
          <h2 className="font-pixel text-pixel-lg text-arcade-pink mb-4 animate-blink"
              style={{ textShadow: '2px 2px 0 #ff6b35' }}>
            ERROR!
          </h2>

          {/* Subtitle */}
          <h3 className="font-pixel text-pixel-xs text-arcade-yellow mb-6">
            {title.toUpperCase()}
          </h3>

          {/* Message */}
          <p className="font-retro text-retro-base text-arcade-cyan mb-8 leading-relaxed">
            {message}
          </p>

          {/* Button */}
          <button
            onClick={onButtonClick}
            className="font-pixel text-pixel-xs px-8 py-4 bg-arcade-cyan text-arcade-black border-4 border-white hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(5,217,232,0.5)] transition-all cursor-pointer w-full"
          >
            {buttonText.toUpperCase()}
          </button>
        </div>

        {/* Bottom message */}
        <p className="font-pixel text-[10px] text-arcade-yellow/50 mt-6 animate-blink">
          GAME OVER
        </p>
      </div>
    </div>
  )
}
