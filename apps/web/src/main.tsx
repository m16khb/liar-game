// React 18 애플리케이션 진입점
// 한국어 주석으로 비즈니스 로직 설명

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// React 18의 createRoot API 사용
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)