// NestJS 프로젝트 ESLint 설정
// SOLID 원칙과 NestJS 모범 사례 적용

module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@liar-game/config/eslint-base',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  rules: {
    // NestJS 관련 규칙
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',

    // 클래스 디자인 규칙 (단일 책임 원칙)
    'max-classes-per-file': ['error', 1],

    // 메서드 길이 제한 (단일 책임 원칙)
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],

    // 서비스/컨트롤러 규칙
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'method',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase'],
      },
    ],

    // 의존성 주입 규칙
    '@typescript-eslint/no-parameter-properties': 'off', // NestJS 의존성 주인 패턴 허용

    // 데코레이터 사용 규칙
    '@typescript-eslint/member-ordering': [
      'error',
      {
        order: [
          'static-field',
          'instance-field',
          'constructor',
          'static-method',
          'instance-method',
        ],
      },
    ],
  },
}