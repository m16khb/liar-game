// Jest setup file for module resolution
import 'ts-jest-resolver';

jest.mock('@/common/utils/sanitize.util', () => ({
  SanitizeUtil: {
    sanitize: jest.fn((value: string) => value ? value.trim().substring(0, 500) : ''),
    sanitizeHtml: jest.fn((value: string) => value ? value.replace(/<[^>]*>/g, '') : ''),
    sanitizeJavascript: jest.fn((value: string) => value ? value.replace(/javascript:/gi, '') : ''),
    sanitizeSql: jest.fn((value: string) => value ? value.replace(/['"\;\\n\\r\\t]/g, '') : ''),
    sanitizeRoomTitle: jest.fn((value: string) => value ? value.trim().substring(0, 100) : ''),
    sanitizeRoomDescription: jest.fn((value: string) => value ? value.trim().substring(0, 500) : ''),
  }
}));
