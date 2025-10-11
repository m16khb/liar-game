// @TEST:INFRA-001 | SPEC: SPEC-INFRA-001.md
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Docker Compose 인프라 통합', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');
  const envExamplePath = path.join(projectRoot, '.env.example');
  const envPath = path.join(projectRoot, '.env');

  // Docker 설치 여부 확인
  const isDockerAvailable = (): boolean => {
    try {
      execSync('docker --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  // 포트 사용 중 여부 확인
  const isPortInUse = (port: number): boolean => {
    try {
      execSync(`lsof -i :${port}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  // Docker Compose 명령 실행 헬퍼
  const dockerCompose = (command: string, timeout = 60000): string => {
    try {
      return execSync(`docker compose ${command}`, {
        cwd: projectRoot,
        timeout,
        encoding: 'utf8',
      });
    } catch (error: any) {
      throw new Error(`Docker Compose 명령 실패: ${error.message}`);
    }
  };

  beforeAll(() => {
    // Docker 미설치 시 테스트 스킵
    if (!isDockerAvailable()) {
      console.warn('⚠️ Docker가 설치되지 않아 테스트를 건너뜁니다.');
      return;
    }

    // 필수 포트 충돌 확인
    const requiredPorts = [5432, 6379, 80, 9000, 9001];
    const portsInUse = requiredPorts.filter(isPortInUse);
    if (portsInUse.length > 0) {
      console.warn(`⚠️ 포트 충돌: ${portsInUse.join(', ')} - 테스트를 건너뜁니다.`);
      return;
    }

    // .env 파일 생성 (.env.example 복사)
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }
  });

  afterAll(() => {
    // 테스트 후 컨테이너 정리
    if (isDockerAvailable() && fs.existsSync(dockerComposePath)) {
      try {
        dockerCompose('down -v', 30000);
      } catch (error) {
        console.error('컨테이너 정리 실패:', error);
      }
    }
  });

  // REQ-001: Docker Compose로 전체 인프라 관리
  describe('REQ-001: Docker Compose 파일 존재 및 유효성', () => {
    it('docker-compose.yml 파일이 존재해야 한다', () => {
      expect(fs.existsSync(dockerComposePath)).toBe(true);
    });

    it('.env.example 파일이 존재해야 한다', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('.env.example에 필수 환경 변수가 정의되어 있어야 한다', () => {
      if (!isDockerAvailable()) return;

      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      expect(envContent).toContain('POSTGRES_USER');
      expect(envContent).toContain('POSTGRES_PASSWORD');
      expect(envContent).toContain('POSTGRES_DB');
      expect(envContent).toContain('REDIS_PASSWORD');
      expect(envContent).toContain('MINIO_ROOT_USER');
      expect(envContent).toContain('MINIO_ROOT_PASSWORD');
    });
  });

  // REQ-006: docker compose up 시 모든 컨테이너 정상 구동
  describe('REQ-006: Docker Compose 컨테이너 시작', () => {
    it('docker compose up -d 명령이 성공해야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      expect(() => {
        dockerCompose('up -d', 120000); // 첫 실행 시 이미지 다운로드 시간 고려
      }).not.toThrow();
    }, 150000);

    it('모든 서비스가 running 상태여야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      const output = dockerCompose('ps');
      expect(output).toContain('postgres');
      expect(output).toContain('redis');
      expect(output).toContain('nginx');
      expect(output).toContain('minio');
    });
  });

  // REQ-002: PostgreSQL Health Check
  describe('REQ-002: PostgreSQL 컨테이너 검증', () => {
    it('PostgreSQL Health Check가 통과해야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      const output = dockerCompose('exec -T postgres pg_isready -U liaruser');
      expect(output).toContain('accepting connections');
    });
  });

  // REQ-003: Redis Health Check
  describe('REQ-003: Redis 컨테이너 검증', () => {
    it('Redis Health Check가 통과해야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      const output = dockerCompose('exec -T redis redis-cli ping');
      expect(output.trim()).toBe('PONG');
    });
  });

  // REQ-004: Nginx Health Check
  describe('REQ-004: Nginx 리버스 프록시 검증', () => {
    it('Nginx Health Check 엔드포인트가 응답해야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      const output = execSync('curl -f http://localhost/health', { encoding: 'utf8' });
      expect(output).toContain('OK');
    });
  });

  // REQ-005: MinIO Health Check
  describe('REQ-005: MinIO S3 스토리지 검증', () => {
    it('MinIO Health Check가 통과해야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      const output = execSync('curl -f http://localhost:9000/minio/health/live', {
        encoding: 'utf8',
      });
      expect(output).toBeTruthy();
    });
  });

  // REQ-007: 볼륨 데이터 영속성
  describe('REQ-007: 데이터 영속성 검증', () => {
    it('PostgreSQL 재시작 후 데이터가 유지되어야 한다', () => {
      if (!isDockerAvailable()) {
        console.log('Docker 미설치로 테스트 스킵');
        return;
      }

      // 테스트 테이블 생성
      dockerCompose(
        'exec -T postgres psql -U liaruser -d liardb -c "CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY);"'
      );

      // PostgreSQL 재시작
      dockerCompose('restart postgres');

      // 대기 (Health Check)
      execSync('sleep 5');

      // 테이블 존재 확인
      const output = dockerCompose(
        'exec -T postgres psql -U liaruser -d liardb -c "\\dt"'
      );
      expect(output).toContain('test_table');
    }, 60000);
  });

  // CON-003: .gitignore 검증
  describe('CON-003: 비밀번호 관리 검증', () => {
    it('.env 파일이 .gitignore에 포함되어 있어야 한다', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        throw new Error('.gitignore 파일이 존재하지 않습니다');
      }

      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toMatch(/\.env/);
    });

    it('docker/volumes/ 디렉토리가 .gitignore에 포함되어 있어야 한다', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      expect(gitignoreContent).toMatch(/docker\/volumes/);
    });
  });
});
