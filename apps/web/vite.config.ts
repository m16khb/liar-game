// Vite 설정 파일 - React 19 + Compiler 지원
// 빠른 개발 빌드와 최적화된 프로덕션 빌드를 위한 설정

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig(({ mode }) => {
  // 루트 .env 파일 로드 (VITE_ 접두사가 있는 변수만)
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')

  console.log('🔧 Loaded environment variables:', {
    SUPABASE_URL: env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
    SITE_URL: env.VITE_SITE_URL
  })

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            'babel-plugin-react-compiler', // React Compiler 추가 (반드시 첫 번째로 위치)
          ],
        },
      }),
    ],
    server: {
      port: 3000,
      host: true,
      allowedHosts: ['dev.m16khb.xyz', 'localhost', '127.0.0.1'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    css: {
      postcss: './postcss.config.cjs',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 환경 변수 설정
    define: {
      __API_URL__: JSON.stringify(env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'),
    },
  }
})