import React, { useState } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface VotingPhaseProps {
  gameState: GamePlayState;
  userId: number;
  remainingTime: number;
  progress: number;
  formatTime: (seconds: number) => string;
  onVote: (targetUserId: number) => void;
}

/**
 * 투표 단계 컴포넌트 - Retro Arcade Theme
 * 플레이어들이 라이어를 투표하는 단계입니다
 */
export function VotingPhase({
  gameState,
  userId,
  remainingTime,
  progress,
  formatTime,
  onVote,
}: VotingPhaseProps) {
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  /**
   * 투표 제출
   */
  const handleSubmitVote = () => {
    if (!selectedVoteTarget) return;

    onVote(selectedVoteTarget);
    setHasVoted(true);
  };

  // 자신을 제외한 투표 가능한 플레이어들
  const votablePlayers = gameState.players.filter(
    (p) => p.id !== userId && p.status !== 'DISCONNECTED'
  );

  // 투표 진행 상황 계산
  const votedCount = gameState.votes?.filter((v) => v.voteStatus === 'VOTED').length ?? 0;
  const totalPlayers = gameState.players.filter((p) => p.status !== 'DISCONNECTED').length;

  // 선택된 플레이어 정보
  const selectedPlayer = votablePlayers.find((p) => p.id === selectedVoteTarget);

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
            'linear-gradient(#ff2a6d 1px, transparent 1px), linear-gradient(90deg, #ff2a6d 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 min-h-screen relative z-10">
        {/* 헤더: 투표 정보 */}
        <div className="bg-arcade-dark border-4 border-arcade-pink p-6 md:p-8 shadow-[0_0_40px_rgba(255,42,109,0.4)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="text-center md:text-left">
              <p className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-pink mb-2">
                VOTING PHASE
              </p>
              <h2 className="font-pixel text-pixel-base md:text-pixel-lg text-white">
                라이어를 찾아라!
              </h2>
            </div>
            <div className="text-center">
              <p className="font-pixel text-pixel-xs text-arcade-pink mb-1">TIME LEFT</p>
              <p className="font-pixel text-pixel-xl md:text-[24px] text-arcade-pink animate-pulse">
                {formatTime(remainingTime)}
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="w-full bg-arcade-black border-2 border-arcade-pink h-4 md:h-5 relative overflow-hidden mb-6">
            <div
              className="bg-arcade-pink h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-flicker" />
            </div>
          </div>

          {/* 투표 진행 상황 */}
          <div className="text-center">
            <p className="font-retro text-retro-lg md:text-retro-xl">
              <span className="text-arcade-green">{votedCount}</span>
              <span className="text-arcade-cyan"> / </span>
              <span className="text-arcade-yellow">{totalPlayers}</span>
              <span className="text-white"> 명 투표 완료</span>
            </p>
          </div>
        </div>

        {/* 투표 상태 안내 */}
        {!hasVoted && (
          <div className="bg-arcade-purple border-4 border-arcade-cyan p-6 shadow-[0_0_30px_rgba(5,217,232,0.3)] animate-pulse">
            <p className="font-pixel text-pixel-sm text-center text-arcade-cyan">
              ▼ 라이어로 의심되는 플레이어를 선택하세요 ▼
            </p>
          </div>
        )}

        {/* 플레이어 선택 그리드 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {votablePlayers.map((player) => {
              const isSelected = selectedVoteTarget === player.id;

              return (
                <button
                  key={player.id}
                  onClick={() => {
                    if (!hasVoted) {
                      setSelectedVoteTarget(player.id);
                    }
                  }}
                  disabled={hasVoted}
                  className={`group relative p-6 border-4 transition-all duration-200 ${
                    isSelected
                      ? 'bg-arcade-pink/20 border-arcade-pink scale-105 shadow-[0_0_30px_rgba(255,42,109,0.6)]'
                      : hasVoted
                        ? 'bg-arcade-dark border-arcade-purple/30 opacity-50 cursor-not-allowed'
                        : 'bg-arcade-dark border-arcade-cyan hover:border-arcade-pink hover:bg-arcade-purple/20 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,42,109,0.4)] cursor-pointer'
                  }`}
                >
                  {/* 선택 표시 */}
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-arcade-pink border-2 border-white w-8 h-8 flex items-center justify-center animate-pulse-badge">
                      <span className="font-pixel text-pixel-xs text-white">✓</span>
                    </div>
                  )}

                  {/* 플레이어 정보 */}
                  <div className="text-center">
                    {/* 아바타 (닉네임 첫 글자) */}
                    <div
                      className={`w-20 h-20 mx-auto mb-4 border-4 flex items-center justify-center ${
                        isSelected
                          ? 'bg-arcade-pink border-white'
                          : 'bg-arcade-purple border-arcade-cyan group-hover:border-arcade-pink'
                      }`}
                    >
                      <span className="font-pixel text-pixel-lg text-white">
                        {player.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* 닉네임 */}
                    <p
                      className={`font-retro text-retro-lg mb-2 truncate ${
                        isSelected ? 'text-arcade-pink' : 'text-white'
                      }`}
                    >
                      {player.nickname}
                    </p>

                    {/* 투표 지시 */}
                    {!hasVoted && (
                      <p className="font-pixel text-pixel-xs text-arcade-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                        CLICK TO VOTE
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 투표 버튼 */}
        <div className="sticky bottom-0 bg-arcade-black/90 backdrop-blur-sm py-4 border-t-4 border-arcade-cyan">
          {!hasVoted ? (
            <div className="space-y-4">
              {/* 선택된 플레이어 정보 */}
              {selectedVoteTarget && selectedPlayer && (
                <div className="bg-arcade-dark border-2 border-arcade-pink p-4 text-center">
                  <p className="font-pixel text-pixel-xs text-arcade-cyan mb-2">
                    SELECTED TARGET
                  </p>
                  <p className="font-retro text-retro-lg text-arcade-pink">
                    {selectedPlayer.nickname}
                  </p>
                </div>
              )}

              {/* 투표 제출 버튼 */}
              <button
                onClick={handleSubmitVote}
                disabled={!selectedVoteTarget}
                className="w-full font-pixel text-pixel-sm md:text-pixel-base py-4 md:py-5 border-4 border-white transition-all
                  enabled:bg-arcade-pink enabled:text-white enabled:cursor-pointer
                  enabled:hover:translate-y-[-4px] enabled:hover:shadow-[0_8px_40px_rgba(255,42,109,0.7)]
                  disabled:bg-arcade-dark disabled:text-arcade-cyan/30 disabled:border-arcade-cyan/30
                  disabled:cursor-not-allowed"
              >
                {selectedVoteTarget
                  ? `${selectedPlayer?.nickname}에게 투표하기`
                  : '플레이어를 선택하세요'}
              </button>
            </div>
          ) : (
            <div className="bg-arcade-green border-4 border-white text-arcade-black font-pixel text-pixel-sm md:text-pixel-base py-4 md:py-5 text-center shadow-[0_0_40px_rgba(0,255,65,0.6)]">
              <p className="mb-2">✓ 투표가 완료되었습니다</p>
              <p className="font-retro text-retro-base">다른 플레이어의 투표를 기다리는 중...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-pink text-center animate-blink z-50">
        VOTE NOW
        <br />▼ ▼ ▼
      </div>
    </div>
  );
}
