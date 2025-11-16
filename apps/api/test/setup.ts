/**
 * Test setup file
 */

// 가상 환경 변수 설정
process.env.NODE_ENV = 'test';

// 전역 테스트 설정
global.console = {
  ...console,
  // 테스트 중에는 일부 로깅을 줄임
  log: jest.fn(),
  warn: jest.fn(),
  error: console.error, // 에러 로깅은 유지
};

// 에러 핸들링
process.on('unhandledRejection', (reason) => {
  throw new Error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
