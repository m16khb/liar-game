import { expect } from 'chai';
import { JwtService } from '../../src/auth/jwt.service';

describe('JWT 토큰 관리', () => {
  it('토큰 유효성 검증 실패', () => {
    const service = new JwtService();
    expect(() => service.verifyToken('invalid_token')).to.throw('유효하지 않은 토큰');
  });
  // 다른 5개의 실패 테스트 추가
});
