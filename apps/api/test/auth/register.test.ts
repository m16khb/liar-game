import { expect } from 'chai';
import { RegisterService } from '../../src/auth/register.service';

describe('회원가입', () => {
  it('회원가입 실패: 이메일 형식 오류', () => {
    const service = new RegisterService();
    expect(() => service.register('invalidEmail', 'password')).to.throw('잘못된 이메일 형식');
  });
  // 다른 4개의 실패 테스트 추가
});
