import React, { useState, useEffect } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface LiarGuessPhaseProps {
  gameState: GamePlayState;
  userId: number;
  userRole: 'LIAR' | 'CIVILIAN' | null;
  onGuessKeyword: (keyword: string) => void;
}

/**
 * 라이어 키워드 맞추기 단계 컴포넌트
 * 라이어가 지목되었을 때 키워드를 맞출 기회를 제공합니다
 */
export function LiarGuessPhase({
  gameState,
  userId,
  userRole,
  onGuessKeyword,
}: LiarGuessPhaseProps) {
  const [guessInput, setGuessInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(gameState.liarGuess?.timeLimit ?? 30);
  const [submitted, setSubmitted] = useState(false);

  const isLiar = userRole === 'LIAR';
  const liarGuess = gameState.liarGuess;

  // 타이머
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSubmit = () => {
    if (!guessInput.trim() || submitted) return;
    setSubmitted(true);
    onGuessKeyword(guessInput.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <p className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-pink mb-2">
            LIAR CAUGHT!
          </p>
          <h2 className="font-pixel text-pixel-base md:text-pixel-lg text-white">
            라이어가 지목되었습니다
          </h2>
          <p className="font-retro text-retro-base text-arcade-yellow mt-4">
            라이어에게 키워드를 맞출 기회가 주어집니다
          </p>
        </div>

        {/* 타이머 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-arcade-dark border-4 border-arcade-pink px-8 py-4 rounded-lg">
            <p className="font-pixel text-pixel-xs text-arcade-cyan mb-1">남은 시간</p>
            <p className={`font-pixel text-pixel-lg ${timeLeft <= 10 ? 'text-arcade-pink animate-blink' : 'text-white'}`}>
              {timeLeft}초
            </p>
          </div>
        </div>

        {/* 카테고리 표시 */}
        <div className="bg-arcade-dark border-4 border-arcade-purple p-6 rounded-lg mb-8">
          <p className="font-pixel text-pixel-xs text-arcade-cyan mb-2 text-center">CATEGORY</p>
          <p className="font-retro text-retro-xl text-arcade-green text-center">
            {liarGuess?.category ?? '???'}
          </p>
        </div>

        {isLiar ? (
          // 라이어인 경우 - 키워드 입력
          <div className="bg-arcade-dark border-4 border-arcade-cyan p-6 rounded-lg">
            <p className="font-pixel text-pixel-sm text-arcade-cyan mb-4 text-center">
              당신이 라이어입니다! 키워드를 맞춰보세요
            </p>

            {!submitted ? (
              <>
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="키워드를 입력하세요..."
                  className="w-full bg-arcade-black border-2 border-arcade-purple text-white font-retro text-retro-lg p-4 rounded-lg mb-4 focus:outline-none focus:border-arcade-cyan"
                  disabled={timeLeft <= 0}
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={!guessInput.trim() || timeLeft <= 0}
                  className="w-full bg-arcade-pink hover:bg-arcade-pink/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-pixel text-pixel-sm py-4 rounded-lg transition-colors"
                >
                  {timeLeft <= 0 ? '시간 초과!' : '키워드 제출'}
                </button>
              </>
            ) : (
              <div className="text-center">
                <p className="font-retro text-retro-lg text-arcade-yellow">
                  제출 완료! 결과를 기다리는 중...
                </p>
              </div>
            )}
          </div>
        ) : (
          // 시민인 경우 - 대기
          <div className="bg-arcade-dark border-4 border-arcade-green p-6 rounded-lg text-center">
            <p className="font-pixel text-pixel-sm text-arcade-green mb-4">
              라이어가 키워드를 맞추는 중입니다...
            </p>
            <div className="w-16 h-16 mx-auto border-4 border-arcade-cyan animate-spin rounded-full border-t-transparent" />
            <p className="font-retro text-retro-base text-arcade-yellow mt-4">
              라이어가 키워드를 맞추면 역전할 수 있습니다!
            </p>
          </div>
        )}

        {/* 설명 */}
        <div className="mt-8 text-center">
          <p className="font-retro text-retro-sm text-gray-400">
            라이어가 키워드를 맞추면 라이어 승리!<br />
            틀리거나 시간이 초과되면 시민 승리!
          </p>
        </div>
      </div>
    </div>
  );
}
