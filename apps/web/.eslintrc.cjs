// React 프로젝트 ESLint 설정
// SOLID 원칙과 React 모범 사례 적용

module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    '@liar-game/config/eslint-base',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React 관련 규칙
    'react/react-in-jsx-scope': 'off', // React 17+에서는 불필요
    'react/prop-types': 'off', // TypeScript으로 대체
    'react/jsx-uses-react': 'off', // React 17+에서는 불필요

    // React Hooks 규칙
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // 컴포넌트 복잡도 제한 (단일 책임 원칙)
    'react/jsx-max-depth': ['warn', { max: 4 }],

    // 함수 컴포넌트 권장
    'react/prefer-stateless-function': 'warn',

    // Props 타입 검증 강화
    'react/require-default-props': 'off', // TypeScript 기본값 사용
  },
}