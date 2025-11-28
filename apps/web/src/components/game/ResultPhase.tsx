import React, { useState, useEffect } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  liarNickname: string;
  keyword: string;
  voteResults: Array<{
    targetId: number;
    nickname: string;
    voteCount: number;
  }>;
  scoreUpdates: Array<{
    userId: number;
    nickname: string;
    previousScore: number;
    scoreChange: number;
    newScore: number;
    reason: 'CIVILIAN_WIN' | 'LIAR_WIN' | 'KEYWORD_CORRECT';
  }>;
  liarKeywordCorrect?: boolean;
}

interface ResultPhaseProps {
  gameState: GamePlayState;
  userId: number;
  userRole: 'LIAR' | 'CIVILIAN' | null;
  onGameEnd?: () => void;
}

/**
 * 결과 화면 컴포넌트
 * 게임 결과 및 점수 업데이트를 표시합니다
 */
export function ResultPhase({
  gameState,
  userId,
  userRole,
  onGameEnd,
}: ResultPhaseProps) {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [remainingAutoReturnTime, setRemainingAutoReturnTime] = useState(10);

  /**
   * 게임 결과 처리
   */
  useEffect(() => {
    // TODO: WebSocket 이벤트 리스너 설정
    // socket.on('game-ended', (event: GameEndedEvent) => {
    //   setGameResult({
    //     winner: event.winner,
    //     liarId: event.liarId,
    //     liarNickname: event.liarNickname,
    //     keyword: event.keyword,
    //     voteResults: event.voteResults,
    //     scoreUpdates: event.scoreUpdates,
    //     liarKeywordCorrect: event.liarKeywordCorrect,
    //   });
    // });

    // 점수 애니메이션 시작
    setTimeout(() => setShowScoreAnimation(true), 500);
  }, []);

  /**
   * 10초 후 자동으로 방 대기실로 복귀
   */
  useEffect(() => {
    if (!gameResult) return;

    const timer = setInterval(() => {
      setRemainingAutoReturnTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onGameEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameResult, onGameEnd]);

  if (!gameResult) {
    return <div className="flex justify-center items-center h-full">결과 로드 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* 승패 결과 */}
      <div
        className={`p-8 rounded-lg border-4 text-center ${
          gameResult.winner === 'CIVILIAN'
            ? 'bg-blue-900 border-blue-500'
            : 'bg-red-900 border-red-500'
        }`}
      >
        <p className="text-3xl font-bold mb-2">
          {gameResult.winner === 'CIVILIAN' ? '시민 승리!' : '라이어 승리!'}
        </p>
        <p className="text-lg text-gray-300">
          {gameResult.winner === 'CIVILIAN'
            ? '라이어를 성공적으로 지목했습니다'
            : '라이어가 발견되지 않았습니다'}
        </p>
      </div>

      {/* 역할 공개 및 키워드 공개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-red-500">
          <p className="text-sm text-gray-400 mb-2">라이어</p>
          <p className="text-2xl font-bold text-red-400">{gameResult.liarNickname}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-yellow-500">
          <p className="text-sm text-gray-400 mb-2">정답 키워드</p>
          <p className="text-2xl font-bold text-yellow-400">{gameResult.keyword}</p>
        </div>
      </div>

      {/* 투표 결과 */}
      <div>
        <h3 className="text-xl font-bold mb-4">투표 결과</h3>
        <div className="space-y-2">
          {gameResult.voteResults.map((result, index) => (
            <div
              key={result.targetId}
              className={`p-4 rounded-lg border flex justify-between items-center ${
                result.targetId === gameResult.liarId
                  ? 'bg-red-900 border-red-500'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <p className="font-semibold">{result.nickname}</p>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      result.targetId === gameResult.liarId ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.max((result.voteCount / gameResult.voteResults.length) * 100, 5)}%`,
                    }}
                  />
                </div>
                <p className="font-bold w-12 text-right">{result.voteCount}표</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 점수 업데이트 */}
      <div>
        <h3 className="text-xl font-bold mb-4">점수 업데이트</h3>
        <div className="space-y-3">
          {gameResult.scoreUpdates.map((update) => (
            <div
              key={update.userId}
              className={`p-4 rounded-lg border transition-all ${
                showScoreAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{
                borderColor: update.userId === userId ? '#3b82f6' : '#4b5563',
                backgroundColor: update.userId === userId ? '#1e3a8a' : '#374151',
              }}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold">{update.nickname}</p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm text-gray-400">이전 점수</p>
                    <p className="font-bold">{update.previousScore}</p>
                  </div>
                  <div className="text-xl">→</div>
                  <div>
                    <p className="text-sm text-gray-400">새 점수</p>
                    <p className="font-bold text-green-400">{update.newScore}</p>
                  </div>
                  <div
                    className={`text-lg font-bold px-3 py-1 rounded ${
                      update.scoreChange > 0
                        ? 'bg-green-900 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {update.scoreChange > 0 ? '+' : ''}{update.scoreChange}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {update.reason === 'CIVILIAN_WIN'
                  ? '시민 승리'
                  : update.reason === 'LIAR_WIN'
                    ? '라이어 승리'
                    : '키워드 정답'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 자동 복귀 알림 */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
        <p className="text-gray-400">
          {remainingAutoReturnTime}초 후 방 대기실로 돌아갑니다
        </p>
        <button
          onClick={onGameEnd}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          지금 돌아가기
        </button>
      </div>
    </div>
  );
}
