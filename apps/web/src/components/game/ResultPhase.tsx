import React, { useState, useEffect } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  liarNickname: string;
  keyword: string;
  category: string;
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
 * 결과 화면 컴포넌트 - Retro Arcade Theme
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
   * 게임 결과 처리 (임시 데이터)
   * TODO: 실제 WebSocket 이벤트로 대체
   */
  useEffect(() => {
    // 임시 결과 데이터 (실제로는 WebSocket으로 받아옴)
    const mockResult: GameResult = {
      winner: Math.random() > 0.5 ? 'CIVILIAN' : 'LIAR',
      liarId: gameState.players[0]?.id || 0,
      liarNickname: gameState.players[0]?.nickname || 'Unknown',
      keyword: gameState.keyword?.word || '사과',
      category: gameState.keyword?.category || '과일',
      voteResults: gameState.players.map((p, idx) => ({
        targetId: p.id,
        nickname: p.nickname,
        voteCount: Math.floor(Math.random() * gameState.players.length),
      })),
      scoreUpdates: gameState.players.map((p) => ({
        userId: p.id,
        nickname: p.nickname,
        previousScore: 100,
        scoreChange: Math.floor(Math.random() * 20) - 5,
        newScore: 100 + Math.floor(Math.random() * 20) - 5,
        reason: Math.random() > 0.5 ? 'CIVILIAN_WIN' : 'LIAR_WIN',
      })),
      liarKeywordCorrect: Math.random() > 0.5,
    };

    // 실제 구현 시:
    // socket.on('game-ended', (event: GameEndedEvent) => {
    //   setGameResult(event);
    // });

    setGameResult(mockResult);

    // 점수 애니메이션 시작
    setTimeout(() => setShowScoreAnimation(true), 500);
  }, [gameState]);

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
    return (
      <div className="min-h-screen bg-arcade-black flex items-center justify-center">
        <div className="text-center">
          <div className="font-pixel text-pixel-base text-arcade-cyan animate-blink mb-4">
            ▼ LOADING RESULTS ▼
          </div>
          <div className="font-retro text-retro-lg text-arcade-yellow">결과 집계 중...</div>
        </div>
      </div>
    );
  }

  const isCivilianWin = gameResult.winner === 'CIVILIAN';
  const isLiar = userRole === 'LIAR';
  const didUserWin =
    (isCivilianWin && !isLiar) || (!isCivilianWin && isLiar);

  // 투표 결과를 득표수 기준으로 정렬
  const sortedVoteResults = [...gameResult.voteResults].sort(
    (a, b) => b.voteCount - a.voteCount
  );
  const mostVotedPlayer = sortedVoteResults[0];

  return (
    <div className="min-h-screen bg-arcade-black text-white">
      {/* CRT Scanline Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#00ff41 1px, transparent 1px), linear-gradient(90deg, #00ff41 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 min-h-screen relative z-10 py-8">
        {/* 승패 결과 */}
        <div
          className={`p-8 md:p-12 border-4 text-center animate-float shadow-[0_0_50px_rgba(0,255,65,0.5)] ${
            isCivilianWin
              ? 'bg-arcade-purple/30 border-arcade-cyan'
              : 'bg-arcade-dark/50 border-arcade-pink'
          }`}
        >
          <p className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-yellow mb-4">
            GAME OVER
          </p>
          <p
            className={`font-pixel text-pixel-lg md:text-pixel-xl mb-4 ${
              isCivilianWin ? 'text-arcade-cyan' : 'text-arcade-pink'
            }`}
          >
            {isCivilianWin ? '시민 승리!' : '라이어 승리!'}
          </p>
          <p className="font-retro text-retro-lg md:text-retro-xl text-white">
            {isCivilianWin
              ? '라이어를 성공적으로 찾아냈습니다'
              : gameResult.liarKeywordCorrect
                ? '라이어가 키워드를 맞췄습니다'
                : '라이어를 찾지 못했습니다'}
          </p>
          {didUserWin && (
            <div className="mt-6 inline-block bg-arcade-green text-arcade-black font-pixel text-pixel-sm px-6 py-3 border-4 border-white animate-pulse-badge">
              ★ YOU WIN! ★
            </div>
          )}
        </div>

        {/* 역할 공개 및 키워드 공개 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 라이어 공개 */}
          <div className="bg-arcade-dark border-4 border-arcade-pink p-6 md:p-8 shadow-[0_0_30px_rgba(255,42,109,0.4)]">
            <p className="font-pixel text-pixel-xs text-arcade-pink mb-4">THE LIAR</p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-arcade-pink border-4 border-white flex items-center justify-center">
                <span className="font-pixel text-pixel-lg text-white">
                  {gameResult.liarNickname.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="font-retro text-retro-xl md:text-[32px] text-arcade-pink">
                {gameResult.liarNickname}
              </p>
            </div>
          </div>

          {/* 키워드 공개 */}
          <div className="bg-arcade-dark border-4 border-arcade-yellow p-6 md:p-8 shadow-[0_0_30px_rgba(249,240,2,0.4)]">
            <p className="font-pixel text-pixel-xs text-arcade-yellow mb-4">KEYWORD</p>
            <div className="text-center">
              <p className="font-retro text-retro-base text-arcade-cyan mb-2">
                {gameResult.category}
              </p>
              <p className="font-pixel text-pixel-base md:text-pixel-lg text-arcade-yellow">
                {gameResult.keyword}
              </p>
            </div>
          </div>
        </div>

        {/* 투표 결과 */}
        <div className="bg-arcade-dark border-4 border-arcade-purple p-6 md:p-8 shadow-[0_0_30px_rgba(22,33,62,0.4)]">
          <p className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-cyan mb-6">
            VOTE RESULTS
          </p>
          <div className="space-y-3">
            {sortedVoteResults.map((result, index) => {
              const isLiarTarget = result.targetId === gameResult.liarId;
              const isMostVoted = result.targetId === mostVotedPlayer.targetId;
              const maxVotes = Math.max(...gameResult.voteResults.map((r) => r.voteCount));
              const percentage = maxVotes > 0 ? (result.voteCount / maxVotes) * 100 : 0;

              return (
                <div
                  key={result.targetId}
                  className={`p-4 border-2 flex justify-between items-center transition-all ${
                    isLiarTarget
                      ? 'bg-arcade-pink/20 border-arcade-pink shadow-[0_0_20px_rgba(255,42,109,0.4)]'
                      : 'bg-arcade-purple/20 border-arcade-purple'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isMostVoted && (
                      <span className="font-pixel text-pixel-xs text-arcade-yellow">
                        ▶
                      </span>
                    )}
                    <p
                      className={`font-retro text-retro-lg ${
                        isLiarTarget ? 'text-arcade-pink' : 'text-white'
                      }`}
                    >
                      {result.nickname}
                    </p>
                    {isLiarTarget && (
                      <span className="font-pixel text-pixel-xs bg-arcade-pink text-white px-2 py-1">
                        LIAR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 md:w-48 bg-arcade-black border-2 border-arcade-cyan h-4 relative overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isLiarTarget ? 'bg-arcade-pink' : 'bg-arcade-cyan'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="font-pixel text-pixel-sm text-arcade-yellow w-12 text-right">
                      {result.voteCount}표
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 점수 업데이트 */}
        <div className="bg-arcade-dark border-4 border-arcade-green p-6 md:p-8 shadow-[0_0_30px_rgba(0,255,65,0.4)]">
          <p className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-green mb-6">
            SCORE UPDATE
          </p>
          <div className="space-y-3">
            {gameResult.scoreUpdates.map((update, index) => {
              const isCurrentUser = update.userId === userId;

              return (
                <div
                  key={update.userId}
                  className={`p-4 border-2 transition-all duration-500 ${
                    showScoreAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  } ${
                    isCurrentUser
                      ? 'bg-arcade-yellow/10 border-arcade-yellow shadow-[0_0_20px_rgba(249,240,2,0.3)]'
                      : 'bg-arcade-purple/10 border-arcade-purple'
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <p
                        className={`font-retro text-retro-lg ${
                          isCurrentUser ? 'text-arcade-yellow' : 'text-white'
                        }`}
                      >
                        {update.nickname}
                      </p>
                      {isCurrentUser && (
                        <span className="font-pixel text-pixel-xs bg-arcade-yellow text-arcade-black px-2 py-1">
                          ME
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-pixel text-pixel-xs text-arcade-cyan mb-1">
                          BEFORE
                        </p>
                        <p className="font-retro text-retro-lg text-white">
                          {update.previousScore}
                        </p>
                      </div>
                      <div className="text-arcade-cyan text-2xl">→</div>
                      <div className="text-center">
                        <p className="font-pixel text-pixel-xs text-arcade-green mb-1">AFTER</p>
                        <p className="font-retro text-retro-lg text-arcade-green">
                          {update.newScore}
                        </p>
                      </div>
                      <div
                        className={`font-pixel text-pixel-sm px-4 py-2 border-2 ${
                          update.scoreChange > 0
                            ? 'bg-arcade-green/20 border-arcade-green text-arcade-green'
                            : update.scoreChange < 0
                              ? 'bg-arcade-pink/20 border-arcade-pink text-arcade-pink'
                              : 'bg-arcade-purple/20 border-arcade-purple text-arcade-cyan'
                        }`}
                      >
                        {update.scoreChange > 0 ? '+' : ''}
                        {update.scoreChange}
                      </div>
                    </div>
                  </div>
                  <p className="font-retro text-retro-sm text-arcade-cyan/50 mt-2">
                    {update.reason === 'CIVILIAN_WIN'
                      ? '시민 승리 보너스'
                      : update.reason === 'LIAR_WIN'
                        ? '라이어 승리 보너스'
                        : '키워드 정답 보너스'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 자동 복귀 알림 */}
        <div className="bg-arcade-dark border-4 border-arcade-cyan p-6 md:p-8 text-center shadow-[0_0_40px_rgba(5,217,232,0.4)]">
          <p className="font-pixel text-pixel-sm text-arcade-cyan mb-4 animate-blink">
            AUTO RETURN IN {remainingAutoReturnTime}s
          </p>
          <p className="font-retro text-retro-lg text-white mb-6">
            {remainingAutoReturnTime}초 후 방 대기실로 돌아갑니다
          </p>
          <button
            onClick={onGameEnd}
            className="font-pixel text-pixel-sm py-4 px-8 border-4 border-white bg-arcade-cyan text-arcade-black
              cursor-pointer hover:translate-y-[-4px] hover:shadow-[0_8px_40px_rgba(5,217,232,0.7)] transition-all"
          >
            지금 돌아가기
          </button>
        </div>
      </div>

      {/* Bottom Prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-green text-center animate-blink z-50">
        GAME COMPLETE
        <br />▼ ▼ ▼
      </div>
    </div>
  );
}
