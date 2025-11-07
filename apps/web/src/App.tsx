// React 18 + Compiler 기반 기본 앱 컴포넌트
// 한국어 주석으로 비즈니스 로직 설명

import React from 'react'

/**
 * 메인 애플리케이션 컴포넌트
 * 라이어 게임의 진입점 역할
 */
function App() {
  return (
    <div className="App">
      <header>
        <h1>라이어 게임</h1>
        <p>헌법 기반 최소 구현 프로젝트</p>
      </header>
      <main>
        {/* TODO: 인증 및 게임 기능 구현 */}
        <p>React 18 + TypeScript + Vite 개발 환경 준비 완료</p>
      </main>
    </div>
  )
}

export default App