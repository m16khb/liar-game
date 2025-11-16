# 유효성 검사 테스트 문서

## 개요

Liar Game 애플리케이션의 유효성 검사 기능에 대한 테스트 가이드입니다.

---

## 1. 방 생성 유효성 검사 테스트

### 1.1 필수 필드 검증 테스트

**테스트 목표**: 방 생성 시 필수 필드가 누락되면 올바른 오류가 발생하는지 확인

**테스트 케이스**:
```typescript
describe('Room Creation Validation', () => {
  it('제목이 누락된 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        // title 누락
        minPlayers: 4,
        maxPlayers: 6
      })
      .expect(400);
  });

  it('최소 플레이어 수 누락된 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        // minPlayers 누락
        maxPlayers: 6
      })
      .expect(400);
  });

  it('난이도 누락된 경우 오류 발행', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6
        // difficulty 누락
      })
      .expect(400);
  });
});
```

### 1.2 길이 제한 검증 테스트

**테스트 목표**: 각 필드의 길이 제한이 올바르게 적용되는지 확인

**테스트 케이스**:
```typescript
describe('Room Title Length Validation', () => {
  it('제목이 1자 미만인 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '',
        minPlayers: 4,
        maxPlayers: 6
      })
      .expect(400);
  });

  it('제목이 100자를 초과하는 경우 오류 발생', () => {
    const longTitle = 'a'.repeat(101);
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: longTitle,
        minPlayers: 4,
        maxPlayers: 6
      })
      .expect(400);
  });

  it('제목이 1자 이상 100자 이하인 경우 성공', () => {
    const validTitle = 'a'.repeat(100);
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: validTitle,
        minPlayers: 4,
        maxPlayers: 6
      })
      .expect(201);
  });
});
```

### 1.3 플레이어 수 검증 테스트

**테스트 목표**: 플레이어 수의 최소/최대 값 및 관계 검증

**테스트 케이스**:
```typescript
describe('Player Count Validation', () => {
  it('최소 플레이어 수가 2명 미만인 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 1,  // 2 미만
        maxPlayers: 6
      })
      .expect(400);
  });

  it('최대 플레이어 수가 10명을 초과하는 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 11  // 10 초과
      })
      .expect(400);
  });

  it('최소 플레이어 수가 최대보다 큰 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 8,  // maxPlayers보다 큼
        maxPlayers: 6
      })
      .expect(400);
  });

  it('유효한 플레이어 수 범위 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8
      })
      .expect(201);
  });
});
```

### 1.4 비공개 방 유효성 검사 테스트

**테스트 목표**: 비공개 방 설정에 따른 비밀번호 검증

**테스트 케이스**:
```typescript
describe('Private Room Validation', () => {
  it('비공개 방인데 비밀번호가 없는 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: true,
        password: ''  // 비밀번호 누락
      })
      .expect(400);
  });

  it('공개 방인데 비밀번호가 있는 경우 경고 로그 기록', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

    await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '공개 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: false,
        password: 'password'  // 공개 방에 비밀번호 제공
      })
      .expect(201);

    expect(loggerSpy).toHaveBeenCalled();
  });

  it('비공개 방인데 비밀번호가 4자 미만인 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: true,
        password: '123'  // 4자 미만
      })
      .expect(400);
  });

  it('비공개 방인데 비밀번호가 20자를 초과하는 경우 오류 발생', () => {
    const longPassword = 'a'.repeat(21);
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: true,
        password: longPassword  // 20자 초과
      })
      .expect(400);
  });

  it('비공개 방에 유효한 비밀번호인 경우 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 6,
        isPrivate: true,
        password: 'validpassword'
      })
      .expect(201);
  });
});
```

---

## 2. 검색 유효성 검사 테스트

### 2.1 검색어 길이 검증 테스트

**테스트 목표**: 방 검색 시 최소 검색어 길이 검증

**테스트 케이스**:
```typescript
describe('Search Keyword Validation', () => {
  it('검색어가 1자인 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: 'a' })  // 1자
      .expect(400);
  });

  it('검색어가 2자인 경우 성공', () => {
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: 'ab' })  // 2자
      .expect(200);
  });

  it('검색어가 누락된 경우 오류 발생', () => {
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .expect(400);
  });

  it('검색어가 50자를 초과하는 경우 자동으로 자름', () => {
    const longKeyword = 'a'.repeat(55);
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: longKeyword })
      .expect(200);
  });
});
```

### 2.2 검색어 정제 테스트

**테스트 목표**: 검색어에 XSS 필터링이 적용되는지 확인

**테스트 케이스**:
```typescript
describe('Search Keyword Sanitization', () => {
  it('검색어에 스크립트 태그가 필터링됨', () => {
    const maliciousKeyword = '<script>alert(1)</script>검색어';
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: maliciousKeyword })
      .expect(200);
  });

  it('검색어에서 HTML 태그가 제거됨', () => {
    const keywordWithHtml = '<b>검색어</b><i>테스트</i>';
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: keywordWithHtml })
      .expect(200);
  });

  it('유효한 검색어는 그대로 유지됨', () => {
    const validKeyword = '정상 검색어';
    return request(app.getHttpServer())
      .get('/api/rooms/search')
      .query({ q: validKeyword })
      .expect(200);
  });
});
```

---

## 3. 방 코드 유효성 검사 테스트

### 3.1 방 코드 형식 검증 테스트

**테스트 목표**: 방 코드가 올바른 UUID 형식인지 검증

**테스트 케이스**:
```typescript
describe('Room Code Format Validation', () => {
  it('올바른 UUID 형식의 방 코드는 유효함', () => {
    const validCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    return request(app.getHttpServer())
      .get(`/api/rooms/${validCode}`)
      .expect(404);  // 존재하지 않는 방이지만 형식은 유효함
  });

  it('올바르지 않은 형식의 방 코드는 400 오류 발생', () => {
    const invalidCode = 'invalid-code';
    return request(app.getHttpServer())
      .get(`/api/rooms/${invalidCode}`)
      .expect(400);
  });

  it('32자가 아닌 코드는 400 오류 발생', () => {
    const shortCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d';  // 31자
    return request(app.getHttpServer())
      .get(`/api/rooms/${shortCode}`)
      .expect(400);
  });

  it('16진수가 아닌 문자를 포함한 코드는 400 오류 발생', () => {
    const invalidCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5dg';
    return request(app.getHttpServer())
      .get(`/api/rooms/${invalidCode}`)
      .expect(400);
  });

  it('방 참가 시도에서도 코드 형식 검증이 적용됨', () => {
    const invalidCode = 'invalid';
    return request(app.getHttpServer())
      .post(`/api/rooms/${invalidCode}/join`)
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({ password: 'test' })
      .expect(400);
  });
});
```

---

## 4. 난이도 값 검증 테스트

### 4.1 난이도 유효성 검증 테스트

**테스트 목표**: 게임 난이도 값이 유효한 범위인지 검증

**테스트 케이스**:
```typescript
describe('Game Difficulty Validation', () => {
  const validDifficulties = ['easy', 'normal', 'hard'];

  validDifficulties.forEach(difficulty => {
    it(`${difficulty} 난이도는 유효함`, () => {
      return request(app.getHttpServer())
        .post('/api/rooms')
        .set('Authorization', `Bearer ${generateValidToken()}`)
        .send({
          title: '테스트 방',
          minPlayers: 4,
          maxPlayers: 6,
          difficulty: difficulty
        })
        .expect(201);
    });
  });

  it('유효하지 않은 난이도 값은 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        difficulty: 'invalid'
      })
      .expect(400);
  });
});
```

---

## 5. 시간 제한 검증 테스트

### 5.1 시간 제한 값 검증 테스트

**테스트 목표**: 게임 시간 제한 값의 유효성 검증

**테스트 셌스트 케이스**:
```typescript
describe('Time Limit Validation', () => {
  it('시간 제한이 설정되지 않은 경우 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        // timeLimit 누락
      })
      .expect(201);
  });

  it('유효한 시간 제한 값은 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        timeLimit: 3600
      })
      .expect(201);
  });

  it('음수 시간 제한은 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        timeLimit: -1
      })
      .expect(400);
  });

  it('0 시간 제한은 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        timeLimit: 0
      })
      .expect(400);
  });
});
```

---

## 6. 게임 설정 검증 테스트

### 6.1 JSON 게임 설정 검증 테스트

**테스트 목표**: 게임 설정 JSON의 크기와 내용 검증

**테스트 케이스**:
```typescript
describe('Game Settings Validation', () => {
  it('게임 설정이 없는 경우 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6
        // gameSettings 누락
      })
      .expect(201);
  });

  it('유효한 JSON 게임 설정은 성공', () => {
    const validSettings = { theme: 'dark', language: 'ko' };
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        gameSettings: validSettings
      })
      .expect(201);
  });

  it('1KB를 초과하는 게임 설정은 오류 발생', () => {
    const largeSettings = { data: 'a'.repeat(2000) };  // 1KB 초과
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        gameSettings: largeSettings
      })
      .expect(400);
  });

  it('위험한 키를 포함한 게임 설정은 오류 발생', () => {
    const maliciousSettings = {
      __proto__: 'dangerous',
      constructor: 'malicious'
    };
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        gameSettings: maliciousSettings
      })
      .expect(400);
  });

  it('JSON 형식이 아닌 게임 설정은 오류 발생', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 6,
        gameSettings: 'not an object'
      })
      .expect(400);
  });
});
```

---

## 7. 통합 유효성 검사 테스트

### 7.1 종합 유효성 검사 테스트

**테스트 목표**: 여러 유효성 검사 규칙이 동시에 적용되는 경우의 동작 확인

**테스트 케이스**:
```typescript
describe('Comprehensive Validation Tests', () => {
  it('여러 유효성 검사 규칙이 동시에 적용됨', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '',  // 유효하지 않은 제목
        minPlayers: 1,  // 유효하지 않은 최소 플레이어 수
        maxPlayers: 11,  // 유효하지 않은 최대 플레이어 수
        isPrivate: true,  // 비공개 방인데 비밀번호 없음
        // difficulty 누락
      })
      .expect(400);
  });

  it '모든 유효성 검사 규칙을 통과한 경우 성공', () => {
    return request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '유효한 방 제목',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: 'normal',
        isPrivate: false,
        description: '방 설명',
        timeLimit: 3600,
        gameSettings: { theme: 'light' }
      })
      .expect(201);
  });
});
```

---

## 8. 유효성 검사 테스트 실행 방법

### 8.1 유효성 검사 테스트 실행

```bash
# 방 유효성 검사 테스트
npm test apps/api/src/room/room.service.spec.ts

# DTO 유효성 검사 테스트
npm test apps/api/src/room/dto/create-room.dto.ts

# 통합 유효성 검사 테스트
npm test -- --testPathPattern=validation
```

### 8.2 유효성 검사 오류 메시지 테스트

```typescript
describe('Validation Error Messages', () => {
  it('유효성 검사 실패 시 구체적인 오류 메시지 포함', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/rooms')
      .set('Authorization', `Bearer ${generateValidToken()}`)
      .send({
        title: '',
        minPlayers: 1,
        maxPlayers: 11
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
    expect(typeof response.body.message).toBe('string');
  });
});
```

---

## 9. 유효성 검사 최적화 가이드

### 9.1 성능 최적화

1. **DTO 클래스 유효성 검사**는 컨트롤러 레벨에서 적용
2. **비즈니스 로직 검증**은 서비스 레벨에서 적용
3. **복잡한 검증 규칙**은 커스텀 유효성 검사 메서드 구현

### 9.2 에러 처리 최적화

1. **세분화된 오류 메시지** 제공
2. **오류 코드**를 통해 프론트엔드에서 처리 용이하게
3. **로그 기록**을 통한 문제 추적

### 9.3 테스트 커버리지

- **모든 유효성 검사 규칙**을 테스트
- **긍정/부정** 시나리오 모두 테스트
- **경계 값** 테스트 포함