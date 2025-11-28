import React, { useState } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface VotingPhaseProps {
  gameState: GamePlayState;
  userId: number;
  remainingTime: number;
  progress: number;
  formatTime: (seconds: number) => string;
}

/**
 * 투표 단계 컴포넌트
 * 플레이어들이 라이어를 투표하는 단계입니다
 */
export function VotingPhase({
  gameState,
  userId,
  remainingTime,
  progress,
  formatTime,
}: VotingPhaseProps) {
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  /**
   * 투표 제출
   */
  const handleSubmitVote = () => {
    if (!selectedVoteTarget) return;

    // TODO: WebSocket 이벤트 전송
    // socket.emit('submit-vote', { targetUserId: selectedVoteTarget });

    setHasVoted(true);
  };

  // 자신을 제외한 투표 가능한 플레이어들
  const votablePlayers = gameState.players.filter((p) => p.id !== userId);

  // 투표 진행 상황 계산
  const votedCount = gameState.votes?.filter((v) => v.voteStatus === 'VOTED').length ?? 0;
  const votingProgress = (votedCount / gameState.players.length) * 100;

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6 h-full">
      {/* 헤더: 투표 정보 */}
      <div className="bg-gray-800 p-6 rounded-lg border border-red-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">투표 시간입니다!</h2>
          <div className="text-right">
            <p className="text-xs text-gray-400">남은 시간</p>
            <p className="text-3xl font-bold text-red-500">{formatTime(remainingTime)}</p>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
          <div
            className="bg-red-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 투표 진행 상황 */}
        <div className="text-center">
          <p className="text-lg font-semibold">
            <span className="text-green-400">{votedCount}</span>
            <span className="text-gray-400">/{gameState.players.length} 명 투표 완료</span>
          </p>
        </div>
      </div>

      {/* 플레이어 선택 그리드 */}
      <div>
        <p className="text-xl font-bold mb-4">라이어를 지목하세요</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {votablePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                if (!hasVoted) {
                  setSelectedVoteTarget(player.id);
                }
              }}
              disabled={hasVoted}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedVoteTarget === player.id
                  ? 'border-red-500 bg-red-900 scale-105'
                  : hasVoted
                    ? 'border-gray-600 bg-gray-700 opacity-50'
                    : 'border-gray-600 bg-gray-700 hover:border-red-500 hover:bg-gray-600'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-lg">{player.nickname}</p>
                {player.status === 'DISCONNECTED' && (
                  <p className="text-xs text-red-400 mt-1">연결 끊김</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 투표 버튼 */}
      {!hasVoted ? (
        <button
          onClick={handleSubmitVote}
          disabled={!selectedVoteTarget}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {selectedVoteTarget ? `${votablePlayers.find((p) => p.id === selectedVoteTarget)?.nickname}에게 투표` : '플레이어를 선택하세요'}
        </button>
      ) : (
        <div className="bg-green-900 border border-green-500 text-green-300 font-semibold py-3 rounded-lg text-center">
          투표가 완료되었습니다
        </div>
      )}
    </div>
  );
}
