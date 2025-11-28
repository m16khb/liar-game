import React, { useState, useRef, useEffect } from 'react';
import { GamePlayState } from '@/hooks/useGamePlay';

interface DiscussionPhaseProps {
  gameState: GamePlayState;
  userId: number;
  userNickname: string;
  userRole: 'LIAR' | 'CIVILIAN' | null;
  remainingTime: number;
  progress: number;
  formatTime: (seconds: number) => string;
  isCurrentTurn: boolean;
  onSpeech: (content: string) => void;
}

/**
 * 토론 단계 컴포넌트
 * 플레이어들이 발언하고 라이어를 찾는 단계입니다
 */
export function DiscussionPhase({
  gameState,
  userId,
  userNickname,
  userRole,
  remainingTime,
  progress,
  formatTime,
  isCurrentTurn,
  onSpeech,
}: DiscussionPhaseProps) {
  const [speechContent, setSpeechContent] = useState('');
  const speechInputRef = useRef<HTMLTextAreaElement>(null);
  const speechListRef = useRef<HTMLDivElement>(null);

  /**
   * 발언 제출
   */
  const handleSubmitSpeech = () => {
    if (!speechContent.trim()) return;

    onSpeech(speechContent);
    setSpeechContent('');

    if (speechInputRef.current) {
      speechInputRef.current.focus();
    }
  };

  /**
   * 현재 턴 플레이어 찾기
   */
  const currentTurnPlayer = gameState.players.find((p) => p.id === gameState.currentTurn);

  /**
   * 다음 턴 플레이어 찾기
   */
  const currentTurnIndex = gameState.turnOrder.indexOf(gameState.currentTurn || -1);
  const nextTurnIndex = (currentTurnIndex + 1) % gameState.turnOrder.length;
  const nextTurnPlayerId = gameState.turnOrder[nextTurnIndex];
  const nextTurnPlayer = gameState.players.find((p) => p.id === nextTurnPlayerId);

  /**
   * 발언 목록 자동 스크롤
   */
  useEffect(() => {
    if (speechListRef.current) {
      speechListRef.current.scrollTop = speechListRef.current.scrollHeight;
    }
  }, [gameState.speeches]);

  return (
    <div className="max-w-7xl mx-auto p-6 flex gap-6 h-full">
      {/* 왼쪽: 발언 목록 */}
      <div className="flex-1 flex flex-col">
        <h2 className="text-xl font-bold mb-4">토론</h2>

        {/* 현재 턴 정보 */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-yellow-500">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-gray-400">현재 발언 중</p>
              <p className="text-lg font-bold">
                {currentTurnPlayer?.nickname}
                {currentTurnPlayer?.status === 'DISCONNECTED' && (
                  <span className="ml-2 text-red-400 text-sm">(연결 끊김)</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">남은 시간</p>
              <p className="text-2xl font-bold text-yellow-500">
                {formatTime(remainingTime)}
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 발언 목록 */}
        <div
          ref={speechListRef}
          className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto mb-4 border border-gray-700"
        >
          {gameState.speeches.length === 0 ? (
            <p className="text-gray-400 text-center py-8">아직 발언이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {gameState.speeches.map((speech, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-blue-400">{speech.nickname}</p>
                    <p className="text-xs text-gray-500">
                      {speech.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="text-gray-200">{speech.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 발언 입력 영역 */}
        {isCurrentTurn && (
          <div className="space-y-2">
            <textarea
              ref={speechInputRef}
              value={speechContent}
              onChange={(e) => setSpeechContent(e.target.value)}
              placeholder="발언을 입력하세요 (최대 200자)"
              maxLength={200}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none h-20"
            />
            <button
              onClick={handleSubmitSpeech}
              disabled={!speechContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              발언 제출
            </button>
          </div>
        )}
        {!isCurrentTurn && (
          <div className="bg-gray-700 p-3 rounded-lg text-center text-gray-400">
            {currentTurnPlayer?.id === userId ? '당신의 차례입니다' : '다른 플레이어의 발언을 들어보세요'}
          </div>
        )}
      </div>

      {/* 오른쪽: 플레이어 정보 */}
      <div className="w-64 flex flex-col gap-6">
        {/* 다음 턴 예정 */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 mb-2">다음 발언 예정</p>
          <p className="text-lg font-bold">{nextTurnPlayer?.nickname}</p>
        </div>

        {/* 플레이어 목록 */}
        <div>
          <h3 className="text-lg font-bold mb-3">플레이어</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg border transition-colors ${
                  player.id === gameState.currentTurn
                    ? 'bg-yellow-900 border-yellow-500'
                    : player.status === 'DISCONNECTED'
                      ? 'bg-gray-700 border-gray-600 opacity-50'
                      : 'bg-gray-700 border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold">{player.nickname}</p>
                  {player.id === userId && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">나</span>
                  )}
                </div>
                {player.status === 'DISCONNECTED' && (
                  <p className="text-xs text-red-400 mt-1">연결 끊김</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
