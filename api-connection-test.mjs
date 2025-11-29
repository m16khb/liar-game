/**
 * 라이어 게임 API 연결 테스트
 *
 * 테스트 항목:
 * 1. 페이지 로드 및 API 호출 확인
 * 2. 네트워크 요청 모니터링
 * 3. 콘솔 에러 수집
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

const TEST_URL = 'http://localhost:3001';
const EXPECTED_API_URL = 'http://localhost:4000';

async function runAPIConnectionTest() {
  console.log('='.repeat(80));
  console.log('라이어 게임 API 연결 테스트 시작');
  console.log('='.repeat(80));
  console.log();

  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // 테스트 결과 수집
  const testResults = {
    pageLoadSuccess: false,
    apiRequests: [],
    consoleMessages: [],
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    corsErrors: [],
    apiUrlCorrect: false,
    fetchErrorsFound: false
  };

  // 콘솔 메시지 수집
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    testResults.consoleMessages.push({
      type,
      text,
      timestamp: new Date().toISOString()
    });

    if (type === 'error') {
      testResults.consoleErrors.push(text);

      // CORS 에러 감지
      if (text.toLowerCase().includes('cors')) {
        testResults.corsErrors.push(text);
      }

      // Failed to fetch 에러 감지
      if (text.toLowerCase().includes('failed to fetch')) {
        testResults.fetchErrorsFound = true;
      }
    }

    if (type === 'warning') {
      testResults.consoleWarnings.push(text);
    }

    const typeUpper = type.toUpperCase();
    console.log('[CONSOLE ' + typeUpper + '] ' + text);
  });

  // 네트워크 요청 모니터링
  page.on('request', request => {
    const url = request.url();
    const method = request.method();

    // API 요청만 수집
    if (url.includes('/api/')) {
      const requestInfo = {
        method,
        url,
        timestamp: new Date().toISOString()
      };

      testResults.apiRequests.push(requestInfo);

      console.log('[네트워크 요청] ' + method + ' ' + url);

      // API URL 확인
      if (url.startsWith(EXPECTED_API_URL)) {
        testResults.apiUrlCorrect = true;
      }
    }
  });

  // 네트워크 응답 모니터링
  page.on('response', async response => {
    const url = response.url();

    if (url.includes('/api/')) {
      const status = response.status();
      console.log('[네트워크 응답] ' + status + ' ' + url);

      // 응답 본문 확인 (가능한 경우)
      try {
        const body = await response.text();
        console.log('[응답 본문] ' + body.substring(0, 200));
      } catch (e) {
        console.log('[응답 본문] 읽을 수 없음');
      }
    }
  });

  // 네트워크 에러 감지
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();

    if (url.includes('/api/')) {
      const errorInfo = {
        url,
        errorText: failure?.errorText || 'Unknown error',
        timestamp: new Date().toISOString()
      };

      testResults.networkErrors.push(errorInfo);
      console.log('[네트워크 에러] ' + url + ' - ' + errorInfo.errorText);
    }
  });

  try {
    console.log('\n1. 페이지 로딩 중...');
    console.log('   URL: ' + TEST_URL);

    await page.goto(TEST_URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    testResults.pageLoadSuccess = true;
    console.log('   ✓ 페이지 로드 성공\n');

    // 추가 대기 (API 호출이 지연될 수 있음)
    console.log('2. API 호출 대기 중 (5초)...');
    await setTimeout(5000);

    console.log('   ✓ 대기 완료\n');

    // 스크린샷 저장
    const screenshotPath = '/Users/m16khb/Workspace/liar-game/e2e-screenshots/api-test-result.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log('3. 스크린샷 저장: ' + screenshotPath + '\n');

  } catch (error) {
    console.error('페이지 로드 실패:', error.message);
  }

  // 테스트 결과 출력
  console.log('\n' + '='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));

  console.log('\n✓ 페이지 로드: ' + (testResults.pageLoadSuccess ? '성공' : '실패'));
  console.log('✓ API 요청 수: ' + testResults.apiRequests.length);
  console.log('✓ API URL 정확성: ' + (testResults.apiUrlCorrect ? 'localhost:4000 사용 중 ✓' : 'localhost:4000 사용 안함 ✗'));
  console.log('✓ CORS 에러: ' + testResults.corsErrors.length + '개');
  console.log('✓ "Failed to fetch" 에러: ' + (testResults.fetchErrorsFound ? '발견됨 ✗' : '없음 ✓'));
  console.log('✓ 콘솔 에러: ' + testResults.consoleErrors.length + '개');
  console.log('✓ 콘솔 경고: ' + testResults.consoleWarnings.length + '개');
  console.log('✓ 네트워크 에러: ' + testResults.networkErrors.length + '개');

  // 상세 정보 출력
  if (testResults.apiRequests.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('API 요청 목록:');
    console.log('-'.repeat(80));
    testResults.apiRequests.forEach((req, idx) => {
      console.log((idx + 1) + '. [' + req.method + '] ' + req.url);
    });
  }

  if (testResults.corsErrors.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('CORS 에러:');
    console.log('-'.repeat(80));
    testResults.corsErrors.forEach((err, idx) => {
      console.log((idx + 1) + '. ' + err);
    });
  }

  if (testResults.consoleErrors.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('콘솔 에러 전체 목록:');
    console.log('-'.repeat(80));
    testResults.consoleErrors.forEach((err, idx) => {
      console.log((idx + 1) + '. ' + err);
    });
  }

  if (testResults.networkErrors.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('네트워크 에러:');
    console.log('-'.repeat(80));
    testResults.networkErrors.forEach((err, idx) => {
      console.log((idx + 1) + '. ' + err.url + ' - ' + err.errorText);
    });
  }

  // 전체 콘솔 로그
  console.log('\n' + '-'.repeat(80));
  console.log('전체 콘솔 로그:');
  console.log('-'.repeat(80));
  testResults.consoleMessages.forEach((msg, idx) => {
    console.log((idx + 1) + '. [' + msg.type + '] ' + msg.text);
  });

  console.log('\n' + '='.repeat(80));
  console.log('테스트 종료');
  console.log('='.repeat(80));

  await browser.close();

  return testResults;
}

// 테스트 실행
runAPIConnectionTest()
  .then(results => {
    console.log('\n테스트 완료');
    process.exit(0);
  })
  .catch(error => {
    console.error('테스트 실행 중 에러:', error);
    process.exit(1);
  });
