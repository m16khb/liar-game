import { expect } from 'chai';
import { LoginService } from '../../src/auth/login.service';

describe('로그인', () => {
  it('로그인 실패: 아이디 미입력', () => {
    const service = new LoginService();
    expect(() => service.login('', 'password')).to.throw('아이디 필수');
  });
  // 다른 4개의 실패 테스트 추가
});
