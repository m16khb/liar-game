// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
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
};

module.exports = nextConfig;
