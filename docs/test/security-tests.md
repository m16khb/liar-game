# 보안 테스트 문서

## 개요

Liar Game 애플리케이션의 보안 기능에 대한 테스트 가이드입니다.

---

## 1. 입력값 정제 테스트 (SanitizeUtil Tests)

### 1.1 HTML Injection 방지 테스트

**테스트 목표**: XSS 공격을 방지하기 위해 위험한 HTML 태그가 제거되는지 확인

**테스트 케이스**:
```typescript
describe('SanitizeUtil.sanitizeHtml', () => {
  it('스크립트 태그를 제거해야 함', () => {
    const input = '<script>alert("xss")</script>안녕하세요';
    const result = SanitizeUtil.sanitizeHtml(input);
    expect(result).toBe('안녕하세요');
  });

  it('iframe 태그를 제거해야 함', () => {
    const input = '<iframe src="malicious.com"></iframe>';
    const result = SanitizeUtil.sanitizeHtml(input);
    expect(result).toBe('');
  });

  it('이벤트 핸들러를 제거해야 함', () => {
    const input = '<div onclick="alert(1)">클릭</div>';
    const result = SanitizeUtil.sanitizeHtml(input);
    expect(result).toBe('클릭');
  });

  it('javascript: URL을 제거해야 함', () => {
    const input = '<a href="javascript:alert(1)">링크</a>';
    const result = SanitizeUtil.sanitizeHtml(input);
    expect(result).toBe('<a >링크</a>');
  });
});
```

### 1.2 SQL Injection 방지 테스트

**테스트 목표**: SQL Injection 공격을 방지하기 위해 위험한 SQL 패턴이 제거되는지 확인

**테스트 케이스**:
```typescript
describe('SanitizeUtil.sanitizeSql', () => {
  it('SQL 주석을 제거해야 함', () => {
    const input = "admin -- ' OR '1'='1";
    const result = SanitizeUtil.sanitizeSql(input);
    expect(result).toBe("admin  OR '1'='1");
  });

  it('SQL 명령어를 제거해야 함', () => {
    const input = "SELECT * FROM users WHERE id = 1";
    const result = SanitizeUtil.sanitizeSql(input);
    expect(result).toBe("  * FROM users WHERE id = 1");
  });

  it('세미콜론을 제거해야 함', () => {
    const input = "DROP TABLE users; SELECT * FROM admin";
    const result = SanitizeUtil.sanitizeSql(input);
    expect(result).toBe("DROP TABLE users SELECT * FROM admin");
  });
});
```

### 1.3 방 제목 정제 테스트

**테스트 목표**: 방 제목의 길이와 형식을 검증하며 위험한 입력을 필터링

**테스트 케이스**:
```typescript
describe('SanitizeUtil.sanitizeRoomTitle', () => {
  it('100자 이내로 잘려야 함', () => {
    const longTitle = 'a'.repeat(150);
    const result = SanitizeUtil.sanitizeRoomTitle(longTitle);
    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('HTML 태그가 제거되어야 함', () => {
    const input = '<script>alert(1)</script>방 제목';
    const result = SanitizeUtil.sanitizeRoomTitle(input);
    expect(result).toBe('방 제목');
  });

  it('유효한 제목은 그대로 유지', () => {
    const input = '안녕하세요! 방에 오신 것을 환영합니다.';
    const result = SanitizeUtil.sanitizeRoomTitle(input);
    expect(result).toBe(input);
  });
});
```

### 1.4 비밀번호 복잡도 검증 테스트

**테스트 목표**: 비밀번호의 최소 길이와 위험한 문자를 검증

**테스트 케이스**:
```typescript
describe('SanitizeUtil.validatePasswordStrength', () => {
  it('4자 이상 비밀번호는 유효', () => {
    const result = SanitizeUtil.validatePasswordStrength('1234');
    expect(result.isValid).toBe(true);
  });

  it('3자 비밀번호는 유효하지 않음', () => {
    const result = SanitizeUtil.validatePasswordStrength('123');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('비밀번호는 최소 4자 이상이어야 합니다.');
  });

  it('20자 초과 비밀번호는 유효하지 않음', () => {
    const result = SanitizeUtil.validatePasswordStrength('a'.repeat(25));
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('비밀번호는 최대 20자 이하여야 합니다.');
  });

  it('스크립트 태그가 포함된 비밀번호는 유효하지 않음', () => {
    const result = SanitizeUtil.validatePasswordStrength('<script>alert(1)</script>');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.');
  });
});
```

---

## 2. 인증 및 권한 테스트

### 2.1 JWT 인증 테스트

**테스트 목표**: JWT 토큰 검증이 올바르게 작동하는지 확인

**테스트 케이스**:
```typescript
describe('RoomController Authentication', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [RoomService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('유효한 JWT 토큰으로 방 생성 성공', () => {
    const token = generateValidToken();
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '테스트 방', minPlayers: 4, maxPlayers: 6 })
      .expect(201);
  });

  it('유효하지 않은 토큰으로 방 생성 실패', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', 'Bearer invalid-token')
      .send({ title: '테스트 방', minPlayers: 4, maxPlayers: 6 })
      .expect(401);
  });

  it('토큰 없이 방 생성 실패', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .send({ title: '테스트 방', minPlayers: 4, maxPlayers: 6 })
      .expect(401);
  });
});
```

### 2.2 역할 기반 접근 제어 테스트

**테스트 목표**: 사용자 역할에 따른 접근 제어가 올바르게 작동하는지 확인

**테스트 케이스**:
```typescript
describe('RoomController Authorization', () => {
  it('USER 역할로 방 생성 성공', () => {
    const token = generateUserToken();
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '유저 방', minPlayers: 4, maxPlayers: 6 })
      .expect(201);
  });

  it('GUEST 역할로 방 생성 실패', () => {
    const token = generateGuestToken();
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '게스트 방', minPlayers: 4, maxPlayers: 6 })
      .expect(403);
  });
});
```

---

## 3. 방 참가 테스트 (Join Endpoint)

### 3.1 방 참가 기본 테스트

**테스트 목표**: 방 참가 기능의 정상 작동을 확인

**테스트 케이스**:
```typescript
describe('RoomController.joinRoom', () => {
  it('유효한 코드로 방 참가 성공', async () => {
    // 방 생성
    const room = await createTestRoom();
    const token = generateValidToken();

    // 방 참가
    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('존재하지 않는 방 코드로 참가 실패', () => {
    const token = generateValidToken();
    return request(app.getHttpServer())
      .post('/api/rooms/nonexistent/join')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('가득 찬 방은 참가 불가', async () => {
    // 최대 인원 수로 방 생성
    const room = await createFullRoom();
    const token = generateValidToken();

    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('이미 시작된 방은 참가 불가', async () => {
    // 시작된 방 생성
    const room = await createStartedRoom();
    const token = generateValidToken();

    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
```

### 3.2 비공개 방 참가 테스트

**테스트 목표**: 비공개 방의 비밀번호 검증 기능 테스트

**테스트 케이스**:
```typescript
describe('Private Room Join', () => {
  it('올바른 비밀번호로 비공개 방 참가 성공', async () => {
    // 비공개 방 생성
    const room = await createPrivateRoom('correct-password');
    const token = generateValidToken();

    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'correct-password' })
      .expect(200);
  });

  it('잘못된 비밀번호로 비공개 방 참가 실패', async () => {
    const room = await createPrivateRoom('correct-password');
    const token = generateValidToken();

    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'wrong-password' })
      .expect(400);
  });

  it('비밀번호 없이 비공개 방 참가 실패', async () => {
    const room = await createPrivateRoom('correct-password');
    const token = generateValidToken();

    return request(app.getHttpServer())
      .post(`/api/rooms/${room.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
```

---

## 4. 방 코드 형식 테스트

### 4.1 방 코드 검증 테스트

**테스트 목표**: 방 코드가 올바른 UUID 형식인지 검증

**테스트 케이스**:
```typescript
describe('Room Code Validation', () => {
  it('유효한 UUID 형식의 방 코드는 검증 통과', () => {
    const validCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    const result = SanitizeUtil.validateRoomCode(validCode);
    expect(result).toBe(true);
  });

  it('32자리가 아닌 코드는 검증 실패', () => {
    const invalidCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d';
    const result = SanitizeUtil.validateRoomCode(invalidCode);
    expect(result).toBe(false);
  });

  it('16진수가 아닌 문자를 포함한 코드는 검증 실패', () => {
    const invalidCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5dz';
    const result = SanitizeUtil.validateRoomCode(invalidCode);
    expect(result).toBe(false);
  });

  it('빈 문자열은 검증 실패', () => {
    const result = SanitizeUtil.validateRoomCode('');
    expect(result).toBe(false);
  });
});
```

---

## 5. 통합 보안 테스트

### 5.1 전체 흐름 테스트

**테스트 목표**: 인증 → 방 생성 → 참가 → 검색 전체 흐름의 보안 검증

**테스트 케이스**:
```typescript
describe('Full Security Flow', () => {
  it('전체 사용자 흐름에서 보안 검증 통과', async () => {
    // 1. 인증 및 방 생성
    const token = generateValidToken();
    const roomResponse = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '보안 테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: false
      })
      .expect(201);

    // 2. 방 목록에서 방 확인
    const listResponse = await request(app.getHttpServer())
      .get('/api/rooms')
      .expect(200);

    const createdRoom = listResponse.body.find((r: any) => r.id === roomResponse.body.id);
    expect(createdRoom).toBeDefined();

    // 3. 방 참가
    await request(app.getHttpServer())
      .post(`/api/rooms/${createdRoom.code}/join`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // 4. 방 상태 확인 (인원 증가 확인)
    const updatedRoom = await request(app.getHttpServer())
      .get(`/api/rooms/${createdRoom.code}`)
      .expect(200);

    expect(updatedRoom.body.currentPlayers).toBe(1);
  });
});
```

---

## 6. 부하 테스트

### 6.1 동시 요청 테스트

**테스트 목표**: 여러 사용자가 동시에 방 생성 및 참가 시 보안 기능 유지 확인

**테스트 케이스**:
```typescript
describe('Concurrent Security Tests', () => {
  it('동시 방 생성에서 중복 방 코드 생성 방지', async () => {
    const promises = [];
    const token = generateValidToken();

    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/rooms')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `동시 테스트 방 ${i}`,
            minPlayers: 4,
            maxPlayers: 8,
            isPrivate: false
          })
      );
    }

    const responses = await Promise.all(promises);

    // 모든 응답이 성공해야 함
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });

    // 중복 방 코드가 없는지 확인
    const roomCodes = responses.map(r => r.body.code);
    const uniqueCodes = new Set(roomCodes);
    expect(uniqueCodes.size).toBe(roomCodes.length);
  });
});
```

---

## 7. 테스트 실행 방법

### 7.1 단위 테스트 실행

```bash
# 보안 유틸리티 테스트
npm test apps/api/src/common/utils/sanitize.util.ts

# 컨트롤러 인증 테스트
npm test apps/api/src/room/room.controller.spec.ts

# 서비스 테스트
npm test apps/api/src/room/room.service.spec.ts
```

### 7.2 통합 테스트 실행

```bash
# 전체 통합 테스트
npm test -- --testPathPattern=room

# 특정 테스트 파일만 실행
npm test apps/api/src/room/room.security.spec.ts
```

### 7.3 E2E 테스트 실행

```bash
# 전체 E2E 테스트
npm run test:e2e

# 보안 관련 E2E 테스트만 실행
npm run test:e2e -- --grep "security"
```

---

## 8. 테스트 커버리지

### 8.1 최소 커버리지 요구사항

- **보안 유틸리티 클래스**: 95% 커버리지
- **입력값 정제 메서드**: 100% 커버리지
- **인증 가드 테스트**: 90% 커버리지
- **권한 제어 테스트**: 90% 커버리지
- **예외 처리 테스트**: 85% 커버리지

### 8.2 커버리지 보고서 생성

```bash
# 커버리지 리포트 생성
npm run test:cov

# HTML 리포트 확인
open coverage/lcov-report/index.html
```

---

## 9. 테스트 데이터 관리

### 9.1 테스트용 데이터 생성

```typescript
// 테스트용 방 생성 함수
async function createTestRoom() {
  return await request(app.getHttpServer())
    .post('/api/rooms')
    .set('Authorization', `Bearer ${generateValidToken()}`)
    .send({
      title: '테스트 방',
      minPlayers: 4,
      maxPlayers: 6,
      isPrivate: false
    });
}

// 테스트용 비공개 방 생성 함수
async function createPrivateRoom(password: string) {
  return await request(app.getHttpServer())
    .post('/api/rooms')
    .set('Authorization', `Bearer ${generateValidToken()}`)
    .send({
      title: '비공개 테스트 방',
      minPlayers: 4,
      maxPlayers: 6,
      isPrivate: true,
      password: password
    });
}
```

---

## 10. 보안 테스트 모범 사례

### 10.1 테스트 범위

1. **긍정적 테스트**: 정상적인 사용 시나리오
2. **부정적 테스트**: 악의적인 입력 시나리오
3. **경계 테스트**: 최소/최대 값 테스트
4. **인저 테스트**: 값이 유효하지 않은 경우

### 10.2 테스트 주기

- **단위 테스트**: 커밋마다 실행
- **통합 테스트**: CI/CD 파이프라인마다 실행
- **보안 테스트**: 주 1회 전체 실행
- **부하 테스트**: 배포 전 실행

### 10.3 보안 점검리스트

- [ ] 모든 입력값 정제 메서드 테스트 완료
- [ ] 인증/인가 테스트 완료
- [ ] SQL Injection 방지 테스트 완료
- [ ] XSS 방지 테스트 완료
- [ ] 비밀번호 복잡도 검증 테스트 완료
- [ ] 방 코드 형식 검증 테스트 완료
- [ ] 예외 처리 테스트 완료
- [ ] 부하 테스트 완료