// @CODE:AUTH-002:UI | SPEC: SPEC-AUTH-002.md
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * @CODE:AUTH-002:UI - JWT 토큰 디버거
 * 웹페이지에 JWT 토큰 정보를 표시합니다 (개발용)
 */

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  username?: string;
  app_metadata?: {
    role?: string;
    provider?: string;
    [key: string]: any;
  };
  user_metadata?: {
    username?: string;
    [key: string]: any;
  };
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export function JwtDebugger() {
  const [payload, setPayload] = useState<JwtPayload | null>(null);
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const debugJwt = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError('세션 조회 실패: ' + error.message);
          return;
        }

        if (!session) {
          setError('로그인되지 않음');
          return;
        }

        const accessToken = session.access_token;
        setToken(accessToken);

        // JWT 디코딩 (payload 부분만)
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        ));

        setPayload(decodedPayload);

      } catch (error) {
        setError('JWT 디코딩 실패: ' + (error as Error).message);
      }
    };

    debugJwt();
  }, []);

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
        <div className="flex items-start">
          <span className="text-red-600 font-bold mr-2">❌</span>
          <div>
            <h3 className="text-red-800 font-semibold">JWT 디버거 오류</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return null;
  }

  const expDate = payload.exp ? new Date(payload.exp * 1000) : null;
  const isExpired = expDate ? new Date() > expDate : false;
  const timeRemaining = expDate ? Math.floor((expDate.getTime() - Date.now()) / 1000 / 60) : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-w-2xl z-50">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🔑</span>
          <h3 className="font-bold text-gray-900">JWT 디버거</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {isExpired ? '만료됨' : '유효함'}
          </span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* 내용 (확장 시에만 표시) */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 max-h-96 overflow-y-auto">
          {/* 핵심 정보 */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔐 핵심 인증 정보</h4>
            <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">사용자 ID:</span>
                <span className="font-mono text-gray-900">{payload.sub || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">이메일:</span>
                <span className="font-mono text-gray-900">{payload.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">역할 (role):</span>
                <span className="font-mono font-bold text-blue-600">
                  {payload.app_metadata?.role || payload.role || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">사용자명:</span>
                <span className="font-mono text-gray-900">
                  {payload.user_metadata?.username || payload.username || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">OAuth 프로바이더:</span>
                <span className="font-mono text-gray-900">
                  {payload.app_metadata?.provider || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* 토큰 유효기간 */}
          {expDate && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">⏰ 토큰 유효기간</h4>
              <div className="bg-gray-50 rounded p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">발급 시각:</span>
                  <span className="font-mono text-gray-900">
                    {payload.iat ? new Date(payload.iat * 1000).toLocaleString('ko-KR') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">만료 시각:</span>
                  <span className="font-mono text-gray-900">
                    {expDate.toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">남은 시간:</span>
                  <span className={`font-mono font-bold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpired ? '만료됨' : `${timeRemaining}분`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* app_metadata */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">📝 app_metadata</h4>
            <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(payload.app_metadata || {}, null, 2)}
            </pre>
          </div>

          {/* user_metadata */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">👤 user_metadata</h4>
            <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(payload.user_metadata || {}, null, 2)}
            </pre>
          </div>

          {/* 원본 토큰 */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">🔗 원본 JWT 토큰</h4>
            <div className="bg-gray-50 rounded p-3 text-xs break-all font-mono text-gray-700">
              {token}
            </div>
            <a
              href={`https://jwt.io/#debugger-io?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs mt-2 inline-block"
            >
              💡 jwt.io에서 디코딩하기 →
            </a>
          </div>

          {/* 전체 Payload */}
          <details className="mb-2">
            <summary className="font-semibold text-gray-900 cursor-pointer hover:text-gray-700">
              📦 전체 JWT Payload (클릭하여 펼치기)
            </summary>
            <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto mt-2">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
