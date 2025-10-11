import { expect } from 'chai';
import { GuestAuthService } from '../../src/auth/guest.service';

describe('게스트 인증', () => {
  it('게스트 토큰 생성 실패: 파라미터 누락', () => {
    const service = new GuestAuthService();
    expect(() => service.createGuestToken(null)).to.throw('파라미터 필수');
  });
  // 다른 5개의 실패 테스트 추가
});
