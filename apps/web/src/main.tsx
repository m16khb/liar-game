// React 19 애플리케이션 진입점
// 한국어 주석으로 비즈니스 로직 설명
// React Compiler 자동 최적화 활성화

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// React 19의 createRoot API 사용 + React Compiler 최적화
// 임시로 StrictMode 비활성화 (테스트용)
ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  //   <App />
  // </React.StrictMode>,
  <App />
)
