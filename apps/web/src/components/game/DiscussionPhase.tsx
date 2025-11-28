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
 * 토론 단계 컴포넌트 - Retro Arcade Theme
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
   * Enter 키로 발언 제출 (Shift+Enter는 줄바꿈)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitSpeech();
    }
  };

  /**
   * 현재 턴 플레이어 찾기
   */
  const currentTurnPlayer = gameState.players.find((p) => p.id === gameState.currentTurn);

  /**
   * 다음 턴 플레이어 찾기
   */
  const currentTurnIndex = gameState.turnOrder?.indexOf(gameState.currentTurn || -1) ?? -1;
  const nextTurnIndex = gameState.turnOrder && currentTurnIndex >= 0
    ? (currentTurnIndex + 1) % gameState.turnOrder.length
    : -1;
  const nextTurnPlayerId = gameState.turnOrder?.[nextTurnIndex];
  const nextTurnPlayer = nextTurnPlayerId
    ? gameState.players.find((p) => p.id === nextTurnPlayerId)
    : undefined;

  /**
   * 발언 목록 자동 스크롤
   */
  useEffect(() => {
    if (speechListRef.current) {
      speechListRef.current.scrollTop = speechListRef.current.scrollHeight;
    }
  }, [gameState.speeches]);

  /**
   * 현재 턴이 변경되면 입력창 초기화 및 포커스
   */
  useEffect(() => {
    if (isCurrentTurn && speechInputRef.current) {
      setSpeechContent('');
      speechInputRef.current.focus();
    }
  }, [isCurrentTurn, gameState.currentTurn]);

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
            'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6 h-screen relative z-10">
        {/* 왼쪽: 발언 목록 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 헤더 */}
          <div className="bg-arcade-dark border-4 border-arcade-cyan p-4 md:p-6 mb-4 shadow-[0_0_30px_rgba(5,217,232,0.3)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-pixel-xs md:text-pixel-sm text-arcade-cyan">
                  DISCUSSION
                </span>
                {userRole && (
                  <span
                    className={`font-retro text-retro-base px-3 py-1 border-2 ${
                      userRole === 'LIAR'
                        ? 'border-arcade-pink text-arcade-pink shadow-[0_0_15px_rgba(255,42,109,0.5)]'
                        : 'border-arcade-green text-arcade-green shadow-[0_0_15px_rgba(0,255,65,0.5)]'
                    }`}
                  >
                    {userRole === 'LIAR' ? '라이어' : '시민'}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="font-pixel text-pixel-xs text-arcade-yellow mb-1">TIME</p>
                <p className="font-pixel text-pixel-lg md:text-pixel-xl text-arcade-yellow animate-pulse">
                  {formatTime(remainingTime)}
                </p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full bg-arcade-black border-2 border-arcade-cyan h-4 relative overflow-hidden">
              <div
                className="bg-arcade-cyan h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-flicker" />
              </div>
            </div>

            {/* 현재 턴 플레이어 */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-retro text-retro-sm text-arcade-cyan mb-1">▶ 발언 중</p>
                <p className="font-retro text-retro-lg text-white">
                  {currentTurnPlayer?.nickname}
                  {currentTurnPlayer?.status === 'DISCONNECTED' && (
                    <span className="ml-2 text-arcade-pink text-retro-sm">[연결 끊김]</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-retro text-retro-sm text-arcade-yellow mb-1">▶ 다음 차례</p>
                <p className="font-retro text-retro-base text-arcade-yellow">
                  {nextTurnPlayer?.nickname}
                </p>
              </div>
            </div>
          </div>

          {/* 발언 목록 */}
          <div
            ref={speechListRef}
            className="flex-1 bg-arcade-dark border-4 border-arcade-purple p-4 overflow-y-auto mb-4 shadow-[0_0_20px_rgba(22,33,62,0.5)]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#05d9e8 #1a1a2e',
            }}
          >
            {gameState.speeches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="font-pixel text-pixel-sm text-arcade-cyan animate-blink mb-4">
                  ▼ 발언을 기다리는 중... ▼
                </p>
                <p className="font-retro text-retro-base text-arcade-yellow/50">
                  아직 발언이 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {gameState.speeches.map((speech, index) => {
                  const speaker = gameState.players.find((p) => p.id === speech.userId);
                  const isCurrentUser = speech.userId === userId;
                  const isCurrentSpeaker = speech.userId === gameState.currentTurn;

                  return (
                    <div
                      key={index}
                      className={`border-2 p-3 transition-all ${
                        isCurrentSpeaker
                          ? 'bg-arcade-purple/30 border-arcade-cyan shadow-[0_0_15px_rgba(5,217,232,0.3)]'
                          : isCurrentUser
                            ? 'bg-arcade-dark border-arcade-yellow'
                            : 'bg-arcade-black border-arcade-purple'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-pixel text-pixel-xs text-arcade-cyan">
                            {speech.nickname}
                          </p>
                          {isCurrentUser && (
                            <span className="font-pixel text-pixel-xs text-arcade-yellow border border-arcade-yellow px-2 py-0.5">
                              나
                            </span>
                          )}
                          {isCurrentSpeaker && (
                            <span className="font-pixel text-pixel-xs text-arcade-green animate-pulse">
                              ▶
                            </span>
                          )}
                        </div>
                        <p className="font-retro text-retro-sm text-arcade-cyan/50">
                          {speech.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <p className="font-retro text-retro-base text-white whitespace-pre-wrap break-words">
                        {speech.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 발언 입력 영역 */}
          {isCurrentTurn ? (
            <div className="bg-arcade-dark border-4 border-arcade-green p-4 shadow-[0_0_30px_rgba(0,255,65,0.3)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-retro text-retro-lg text-arcade-green animate-pulse">
                  ▶ 당신의 차례입니다!
                </span>
                <span className="font-retro text-retro-sm text-arcade-yellow">
                  ({speechContent.length}/200)
                </span>
              </div>
              <textarea
                ref={speechInputRef}
                value={speechContent}
                onChange={(e) => setSpeechContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="발언을 입력하세요 (최대 200자, Enter로 전송)"
                maxLength={200}
                className="w-full bg-arcade-black text-white font-retro text-retro-base border-2 border-arcade-green p-3 focus:border-arcade-yellow focus:outline-none resize-none h-24 placeholder:text-arcade-cyan/30"
              />
              <button
                onClick={handleSubmitSpeech}
                disabled={!speechContent.trim()}
                className="w-full mt-3 font-pixel text-pixel-sm py-3 border-4 border-white transition-all
                  bg-arcade-green text-arcade-black enabled:cursor-pointer enabled:hover:translate-y-[-4px]
                  enabled:hover:shadow-[0_8px_30px_rgba(0,255,65,0.6)] disabled:bg-arcade-dark
                  disabled:text-arcade-cyan/30 disabled:border-arcade-cyan/30 disabled:cursor-not-allowed"
              >
                {speechContent.trim() ? 'SEND MESSAGE' : 'TYPE MESSAGE FIRST'}
              </button>
            </div>
          ) : (
            <div className="bg-arcade-dark border-4 border-arcade-cyan/30 p-4 text-center">
              <p className="font-retro text-retro-lg text-arcade-cyan/50">
                {currentTurnPlayer?.id === userId
                  ? '▶ 당신의 차례입니다 ◀'
                  : `${currentTurnPlayer?.nickname}님의 발언을 기다리는 중...`}
              </p>
            </div>
          )}
        </div>

        {/* 오른쪽: 플레이어 정보 (데스크톱에서만) */}
        <div className="hidden lg:flex lg:flex-col gap-4 w-64">
          {/* 키워드 정보 (시민만) */}
          {userRole === 'CIVILIAN' && gameState.keyword && (
            <div className="bg-arcade-dark border-4 border-arcade-yellow p-4 shadow-[0_0_30px_rgba(249,240,2,0.3)]">
              <p className="font-pixel text-pixel-xs text-arcade-yellow mb-3">KEYWORD</p>
              <div className="bg-arcade-black border-2 border-arcade-yellow p-3">
                <p className="font-retro text-retro-sm text-arcade-cyan mb-1">
                  {gameState.keyword.category}
                </p>
                <p className="font-pixel text-pixel-base text-arcade-yellow">
                  {gameState.keyword.word}
                </p>
              </div>
            </div>
          )}

          {/* 라이어 안내 */}
          {userRole === 'LIAR' && (
            <div className="bg-arcade-dark border-4 border-arcade-pink p-4 shadow-[0_0_30px_rgba(255,42,109,0.3)]">
              <p className="font-pixel text-pixel-xs text-arcade-pink mb-3">WARNING</p>
              <p className="font-retro text-retro-base text-white leading-relaxed">
                당신은 라이어입니다! 키워드를 추측하고 들키지 마세요!
              </p>
            </div>
          )}

          {/* 플레이어 목록 */}
          <div className="bg-arcade-dark border-4 border-arcade-purple p-4 shadow-[0_0_20px_rgba(22,33,62,0.5)] flex-1">
            <p className="font-pixel text-pixel-xs text-arcade-cyan mb-4">PLAYERS</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {gameState.players.map((player) => {
                const isCurrentPlayer = player.id === userId;
                const isSpeaking = player.id === gameState.currentTurn;

                return (
                  <div
                    key={player.id}
                    className={`p-3 border-2 transition-all ${
                      isSpeaking
                        ? 'bg-arcade-cyan/20 border-arcade-cyan shadow-[0_0_15px_rgba(5,217,232,0.4)]'
                        : isCurrentPlayer
                          ? 'bg-arcade-yellow/10 border-arcade-yellow'
                          : player.status === 'DISCONNECTED'
                            ? 'bg-arcade-black border-arcade-pink/30 opacity-50'
                            : 'bg-arcade-black border-arcade-purple'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-retro text-retro-base text-white truncate">
                        {isSpeaking && (
                          <span className="text-arcade-green mr-2 animate-pulse">▶</span>
                        )}
                        {player.nickname}
                      </p>
                      {isCurrentPlayer && (
                        <span className="font-pixel text-pixel-xs bg-arcade-yellow text-arcade-black px-2 py-1">
                          ME
                        </span>
                      )}
                    </div>
                    {player.status === 'DISCONNECTED' && (
                      <p className="font-pixel text-pixel-xs text-arcade-pink mt-1">
                        DISCONNECTED
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-yellow text-center animate-blink z-50">
        FIND THE LIAR
        <br />▼ ▼ ▼
      </div>
    </div>
  );
}
