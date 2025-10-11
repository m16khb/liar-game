// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
const path = require('path');
const { config } = require('dotenv');

// 프로젝트 루트의 .env 파일 로드
config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@liar-game/types', '@liar-game/ui', '@liar-game/constants'],

  // WebSocket을 위한 Custom Server 필요 (Vercel 불가)
  output: 'standalone',

  // 성능 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 프로젝트 루트 .env의 환경변수를 Next.js에 전달
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },

  // Next.js 15: 개발 모드에서 외부 origin 허용 (ngrok, tunneling)
  experimental: {
    allowedDevOrigins: ['postorbital-rosio-fulgorous.ngrok-free.dev'],
  },
};

module.exports = nextConfig;
