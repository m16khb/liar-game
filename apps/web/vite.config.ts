// Vite 설정 파일 - React 18 + Compiler 지원
// 빠른 개발 빌드와 최적화된 프로덕션 빌드를 위한 설정

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 루트 .env 파일 로드
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // 환경 변수 설정
    define: {
      __API_URL__: JSON.stringify(env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
    },
  }
})