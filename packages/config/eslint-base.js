// ESLint 기본 설정 - SOLID 원칙과 코드 품질 규칙
// 한국어 주석으로 규칙 설명

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'coverage/'],
  rules: {
    // SOLID 원칙 관련 규칙
    '@typescript-eslint/no-unused-vars': 'error', // 불필요한 변수 금지 (단일 책임)
    '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 최소화 (의존성 역전)
    '@typescript-eslint/ban-types': 'error', // 빈 타입 사용 금지 (인터페이스 분리)

    // 코드 품질 규칙
    '@typescript-eslint/explicit-function-return-type': 'warn', // 함수 반환 타입 명시
    '@typescript-eslint/no-floating-promises': 'error', // Promise 처리 강제
    '@typescript-eslint/await-thenable': 'error', // awaitable 체크
    '@typescript-eslint/no-misused-promises': 'error', // Promise 오용 방지

    // 코드 스타일
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // interface 우선
    '@typescript-eslint/consistent-type-imports': 'error', // import type 일관성
    'prefer-const': 'error', // const 우선
    'no-var': 'error', // var 금지

    // 함수 길이 제한 (복잡도 관리)
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

    // 중첩 깊이 제한
    'max-depth': ['warn', 3],

    // 매개변수 개수 제한
    'max-params': ['warn', 5],
  },
}