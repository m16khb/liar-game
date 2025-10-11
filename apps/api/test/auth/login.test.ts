import { expect } from 'chai';
import { LoginService } from '../../src/auth/login.service';

describe('로그인', () => {
  it('로그인 실패: 아이디 미입력', () => {
    const service = new LoginService();
    expect(() => service.login('', 'password')).to.throw('아이디 필수');
  });
  // 다른 4개의 실패 테스트 추가
});

describe('Rate Limiting', () => {
  it('로그인 5회 초과 시 429 응답', async () => {
    const service = new LoginService();
    for (let i = 0; i < 5; i++) {
      await service.login('test@test.com', 'password');
    }
    expect(() => service.login('test@test.com', 'password')).to.throw('Too Many Requests');
  });

  it('회원가입 3회 초과 시 429 응답', async () => {
    const service = new RegisterService();
    for (let i = 0; i < 3; i++) {
      await service.register(`test${i}@test.com`, 'password');
    }
    expect(() => service.register('test@test.com', 'password')).to.throw('Too Many Requests');
  });

  it('60초 후 카운터 리셋', async () => {
    const service = new LoginService();
    for (let i = 0; i < 5; i++) {
      await service.login('test@test.com', 'password');
    }
    await new Promise(resolve => setTimeout(resolve, 61000)); // 61초 대기
    expect(() => service.login('test@test.com', 'password')).to.not.throw();
  });

  it('IP별 독립적 Rate Limit', async () => {
    const service1 = new LoginService({ ip: '192.168.0.1' });
    const service2 = new LoginService({ ip: '192.168.0.2' });
    for (let i = 0; i < 5; i++) {
      await service1.login('test@test.com', 'password');
    }
    expect(() => service2.login('test@test.com', 'password')).to.not.throw();
  });
});
