import { expect } from 'chai';
import { RedisSessionService } from '../../src/auth/session.service';

describe('Redis 세션 관리', () => {
  it('세션 만료 확인', () => {
    const service = new RedisSessionService();
    expect(() => service.getSession('expired_session')).to.throw('세션 만료');
  });
  // 다른 4개의 실패 테스트 추가
});
