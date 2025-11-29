/**
 * Liar Game E2E Test - Production Environment Validation
 *
 * 테스트 목표:
 * 1. 메인 페이지 (http://localhost:3000) 접속 및 UI 검증
 * 2. 로그인 페이지 테스트 및 소셜 로그인 버튼 확인
 * 3. API 연결 검증 (http://localhost:4000/api)
 * 4. CORS 에러 검증
 * 5. 반응형 디자인 테스트 (모바일 375x667, 데스크톱 1920x1080)
 * 6. 인증 없이 접근 가능한 기능 테스트
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:4000/api';
const SCREENSHOT_DIR = '/Users/m16khb/Workspace/liar-game/e2e-screenshots';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// 스크린샷 저장 헬퍼
async function saveScreenshot(page, name, description) {
  const filename = `${TIMESTAMP}_${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 스크린샷 저장: ${filename}`);
  return { filename, filepath, description };
}

// 콘솔 로그 수집
const consoleLogs = [];
const consoleErrors = [];
const networkErrors = [];
const apiRequests = [];

async function runProductionE2ETests() {
  console.log('🚀 Liar Game 실제 환경 E2E 테스트 시작\n');
  console.log(`📍 프론트엔드: ${FRONTEND_URL}`);
  console.log(`📍 백엔드 API: ${API_URL}\n`);

  const browser = await chromium.launch({ headless: false }); // headless: false로 실제 브라우저 확인
  const testResults = [];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // ========================================
    // 테스트 1: 메인 페이지 접속 및 UI 검증 (데스크톱)
    // ========================================
    console.log('━'.repeat(70));
    console.log('📌 테스트 1: 메인 페이지 접속 및 UI 검증 (데스크톱 1920x1080)');
    console.log('━'.repeat(70));

    totalTests++;
    const test1 = {
      name: '메인 페이지',
      status: 'pending',
      findings: [],
      screenshots: []
    };

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // 콘솔 로그 수집
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // 네트워크 요청 모니터링
    page.on('request', request => {
      const url = request.url();
      if (url.includes(API_URL) || url.includes('localhost:4000')) {
        apiRequests.push({
          url,
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    page.on('requestfailed', request => {
      const failure = {
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText
      };
      networkErrors.push(failure);
    });

    // 페이지 로드
    try {
      console.log(`  🌐 접속 시도: ${FRONTEND_URL}`);
      const response = await page.goto(FRONTEND_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      if (response.ok()) {
        console.log(`  ✅ 페이지 로드 성공 (Status: ${response.status()})`);
        test1.findings.push(`페이지 로드 성공 (HTTP ${response.status()})`);
      } else {
        console.log(`  ⚠️  비정상 응답 (Status: ${response.status()})`);
        test1.findings.push(`비정상 HTTP 응답: ${response.status()}`);
      }
    } catch (error) {
      console.log(`  ❌ 페이지 로드 실패: ${error.message}`);
      test1.status = 'failed';
      test1.findings.push(`페이지 로드 실패: ${error.message}`);
      failedTests++;
      testResults.push(test1);
      await context.close();
      return; // 더 이상 테스트 불가능
    }

    await page.waitForTimeout(3000); // UI 렌더링 대기

    // 스크린샷 저장
    const screenshot1 = await saveScreenshot(page, '01-main-page-desktop', '메인 페이지 데스크톱 뷰');
    test1.screenshots.push(screenshot1);

    // UI 요소 검증
    console.log('\n  🔍 UI 요소 검증 중...');

    // 페이지 제목/타이틀 확인
    try {
      const title = await page.title();
      console.log(`  📝 페이지 제목: "${title}"`);
      test1.findings.push(`페이지 제목: ${title}`);

      // "LIAR GAME" 타이틀 검색 (대소문자 무관)
      const titleElement = await page.locator('text=/LIAR GAME/i').first();
      const titleVisible = await titleElement.isVisible({ timeout: 5000 }).catch(() => false);

      if (titleVisible) {
        console.log(`  ✅ "LIAR GAME" 타이틀 표시됨`);
        test1.findings.push('타이틀 표시 확인');
      } else {
        console.log(`  ⚠️  "LIAR GAME" 타이틀 미발견 (다른 타이틀일 수 있음)`);
        test1.findings.push('특정 타이틀 미발견');
      }
    } catch (error) {
      console.log(`  ❌ 타이틀 검증 실패: ${error.message}`);
      test1.findings.push(`타이틀 검증 오류: ${error.message}`);
    }

    // 주요 버튼들 확인
    const buttonsToCheck = ['로그인', '게임 시작', '방 만들기', 'LOGIN', 'NEW ROOM', 'JOIN'];
    let foundButtons = [];

    for (const btnText of buttonsToCheck) {
      const buttonExists = await page.locator(`button:has-text("${btnText}")`).first().isVisible({ timeout: 1000 }).catch(() => false);
      if (buttonExists) {
        foundButtons.push(btnText);
      }
    }

    if (foundButtons.length > 0) {
      console.log(`  ✅ 발견된 버튼: ${foundButtons.join(', ')}`);
      test1.findings.push(`발견된 버튼: ${foundButtons.join(', ')}`);
    } else {
      console.log(`  ⚠️  주요 버튼 미발견 (페이지가 로딩 중이거나 다른 UI 구조)`);
      test1.findings.push('주요 버튼 미발견');
    }

    // 네비게이션 확인
    const navExists = await page.locator('nav').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (navExists) {
      console.log(`  ✅ 네비게이션 바 존재`);
      test1.findings.push('네비게이션 바 확인');
    }

    test1.status = 'success';
    passedTests++;
    testResults.push(test1);

    // ========================================
    // 테스트 2: 로그인 페이지 테스트
    // ========================================
    console.log('\n' + '━'.repeat(70));
    console.log('📌 테스트 2: 로그인 페이지 테스트');
    console.log('━'.repeat(70));

    totalTests++;
    const test2 = {
      name: '로그인 페이지',
      status: 'pending',
      findings: [],
      screenshots: []
    };

    try {
      // 로그인 페이지로 이동 시도 (여러 경로 시도)
      const loginPaths = ['/login', '/auth/login', '/signin', '/auth'];
      let loginPageFound = false;

      for (const path of loginPaths) {
        try {
          console.log(`  🔍 시도: ${FRONTEND_URL}${path}`);
          const response = await page.goto(`${FRONTEND_URL}${path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          if (response.ok()) {
            console.log(`  ✅ 로그인 페이지 발견: ${path}`);
            test2.findings.push(`로그인 페이지 경로: ${path}`);
            loginPageFound = true;

            await page.waitForTimeout(2000);

            // 스크린샷 저장
            const screenshot2 = await saveScreenshot(page, '02-login-page', '로그인 페이지');
            test2.screenshots.push(screenshot2);

            // 소셜 로그인 버튼 확인
            const socialButtons = ['Google', 'Kakao', 'Naver', 'GitHub'];
            let foundSocialButtons = [];

            for (const social of socialButtons) {
              const btnExists = await page.locator(`button:has-text("${social}")`).first().isVisible({ timeout: 1000 }).catch(() => false);
              if (btnExists) {
                foundSocialButtons.push(social);
              }
            }

            if (foundSocialButtons.length > 0) {
              console.log(`  ✅ 소셜 로그인 버튼: ${foundSocialButtons.join(', ')}`);
              test2.findings.push(`소셜 로그인: ${foundSocialButtons.join(', ')}`);
            } else {
              console.log(`  ⚠️  소셜 로그인 버튼 미발견`);
              test2.findings.push('소셜 로그인 버튼 없음');
            }

            // 이메일/비밀번호 입력 폼 확인
            const emailInput = await page.locator('input[type="email"]').first().isVisible({ timeout: 2000 }).catch(() => false);
            const passwordInput = await page.locator('input[type="password"]').first().isVisible({ timeout: 2000 }).catch(() => false);

            if (emailInput && passwordInput) {
              console.log(`  ✅ 이메일/비밀번호 입력 폼 확인`);
              test2.findings.push('이메일/비밀번호 폼 존재');
            } else {
              console.log(`  ⚠️  이메일/비밀번호 폼 미발견`);
              test2.findings.push('이메일/비밀번호 폼 없음 (소셜 로그인만 제공 가능)');
            }

            break;
          }
        } catch (error) {
          // 다음 경로 시도
          continue;
        }
      }

      if (!loginPageFound) {
        console.log(`  ⚠️  로그인 페이지를 찾을 수 없습니다`);
        console.log(`  💡 시도한 경로: ${loginPaths.join(', ')}`);
        test2.findings.push('로그인 페이지 미발견');
        test2.status = 'warning';
      } else {
        test2.status = 'success';
        passedTests++;
      }

    } catch (error) {
      console.log(`  ❌ 로그인 페이지 테스트 실패: ${error.message}`);
      test2.status = 'failed';
      test2.findings.push(`오류: ${error.message}`);
      failedTests++;
    }

    testResults.push(test2);

    // ========================================
    // 테스트 3: 인증 없이 접근 가능한 기능 테스트
    // ========================================
    console.log('\n' + '━'.repeat(70));
    console.log('📌 테스트 3: 인증 없이 접근 가능한 기능 테스트');
    console.log('━'.repeat(70));

    totalTests++;
    const test3 = {
      name: '비인증 접근',
      status: 'pending',
      findings: [],
      screenshots: []
    };

    try {
      // 방 목록 페이지 접근 시도
      const publicPaths = ['/rooms', '/lobby', '/games'];

      for (const path of publicPaths) {
        try {
          console.log(`  🔍 비인증 접근 시도: ${FRONTEND_URL}${path}`);
          const response = await page.goto(`${FRONTEND_URL}${path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          await page.waitForTimeout(2000);

          // 현재 URL 확인 (리다이렉션 여부)
          const currentURL = page.url();

          if (currentURL.includes('/login') || currentURL.includes('/auth')) {
            console.log(`  ✅ 인증 필요 - 로그인 페이지로 리다이렉션됨`);
            test3.findings.push(`${path} → 로그인 페이지 리다이렉션 (정상 동작)`);
          } else if (currentURL.includes(path)) {
            console.log(`  ⚠️  비인증 접근 허용됨 (보안 검토 필요)`);
            test3.findings.push(`${path} → 비인증 접근 허용 (보안 검토 필요)`);
          }

          break; // 첫 번째 유효한 경로만 테스트
        } catch (error) {
          // 다음 경로 시도
          continue;
        }
      }

      test3.status = 'success';
      passedTests++;

    } catch (error) {
      console.log(`  ❌ 비인증 접근 테스트 실패: ${error.message}`);
      test3.status = 'failed';
      test3.findings.push(`오류: ${error.message}`);
      failedTests++;
    }

    testResults.push(test3);

    // ========================================
    // 테스트 4: 반응형 디자인 테스트 - 모바일
    // ========================================
    console.log('\n' + '━'.repeat(70));
    console.log('📌 테스트 4: 반응형 디자인 - 모바일 (375x667)');
    console.log('━'.repeat(70));

    totalTests++;
    const test4 = {
      name: '모바일 반응형',
      status: 'pending',
      findings: [],
      screenshots: []
    };

    try {
      // 메인 페이지로 돌아가기
      await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });

      // 모바일 뷰포트로 변경
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(2000);

      console.log(`  📱 모바일 뷰포트 적용 (375x667)`);

      // 스크린샷 저장
      const screenshot3 = await saveScreenshot(page, '03-main-page-mobile', '메인 페이지 모바일 뷰');
      test4.screenshots.push(screenshot3);

      // 모바일에서 주요 요소 확인
      const mobileUIVisible = await page.locator('body').first().isVisible({ timeout: 5000 });

      if (mobileUIVisible) {
        console.log(`  ✅ 모바일 UI 렌더링 성공`);
        test4.findings.push('모바일 뷰 렌더링 정상');

        // 햄버거 메뉴 확인
        const hamburgerMenu = await page.locator('button[aria-label*="menu"], button[class*="hamburger"]').first().isVisible({ timeout: 2000 }).catch(() => false);
        if (hamburgerMenu) {
          console.log(`  ✅ 햄버거 메뉴 발견`);
          test4.findings.push('햄버거 메뉴 존재');
        }
      }

      test4.status = 'success';
      passedTests++;

    } catch (error) {
      console.log(`  ❌ 모바일 반응형 테스트 실패: ${error.message}`);
      test4.status = 'failed';
      test4.findings.push(`오류: ${error.message}`);
      failedTests++;
    }

    testResults.push(test4);

    // ========================================
    // 테스트 5: API 연결 검증
    // ========================================
    console.log('\n' + '━'.repeat(70));
    console.log('📌 테스트 5: API 연결 검증');
    console.log('━'.repeat(70));

    totalTests++;
    const test5 = {
      name: 'API 연결',
      status: 'pending',
      findings: [],
      screenshots: []
    };

    await page.waitForTimeout(3000); // 네트워크 요청 대기

    if (apiRequests.length > 0) {
      console.log(`  ✅ API 요청 ${apiRequests.length}건 감지`);
      test5.findings.push(`총 ${apiRequests.length}건의 API 요청`);

      apiRequests.slice(0, 5).forEach(req => {
        console.log(`     - ${req.method} ${req.url}`);
        test5.findings.push(`${req.method} ${req.url}`);
      });
    } else {
      console.log(`  ⚠️  API 요청이 감지되지 않음`);
      test5.findings.push('API 요청 없음 (정적 페이지이거나 지연 로딩)');
    }

    if (networkErrors.length > 0) {
      console.log(`\n  ⚠️  네트워크 에러 ${networkErrors.length}건 발견`);
      test5.findings.push(`네트워크 에러 ${networkErrors.length}건`);

      networkErrors.forEach(err => {
        console.log(`     ❌ ${err.method} ${err.url}`);
        console.log(`        오류: ${err.failure}`);
        test5.findings.push(`${err.method} ${err.url} - ${err.failure}`);

        // CORS 에러 감지
        if (err.failure?.toLowerCase().includes('cors') || err.failure?.toLowerCase().includes('access-control')) {
          console.log(`     🚨 CORS 에러 감지!`);
          test5.findings.push('🚨 CORS 에러 발견');
        }
      });

      test5.status = 'warning';
    } else {
      console.log(`  ✅ 네트워크 에러 없음`);
      test5.findings.push('네트워크 에러 없음');
      test5.status = 'success';
      passedTests++;
    }

    // 콘솔 에러 확인
    if (consoleErrors.length > 0) {
      console.log(`\n  ⚠️  브라우저 콘솔 에러 ${consoleErrors.length}건`);
      test5.findings.push(`콘솔 에러 ${consoleErrors.length}건`);
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`     - ${err}`);
      });
    } else {
      console.log(`  ✅ 브라우저 콘솔 에러 없음`);
      test5.findings.push('콘솔 에러 없음');
    }

    testResults.push(test5);

    await context.close();

  } catch (error) {
    console.error(`\n❌ 치명적 오류: ${error.message}`);
    failedTests++;
  } finally {
    await browser.close();
  }

  // ========================================
  // 종합 결과 보고
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 E2E 테스트 결과');
  console.log('='.repeat(70));

  testResults.forEach((test, index) => {
    console.log(`\n### ${index + 1}. ${test.name}`);
    console.log(`- 상태: ${test.status === 'success' ? '✅ 성공' : test.status === 'failed' ? '❌ 실패' : '⚠️ 경고'}`);
    console.log(`- 발견 사항:`);
    test.findings.forEach(finding => {
      console.log(`  - ${finding}`);
    });
    if (test.screenshots.length > 0) {
      console.log(`- 스크린샷:`);
      test.screenshots.forEach(screenshot => {
        console.log(`  - ${screenshot.filename} (${screenshot.description})`);
      });
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('### 종합 결과');
  console.log(`- 총 테스트 항목: ${totalTests}개`);
  console.log(`- 성공: ${passedTests}개`);
  console.log(`- 실패: ${failedTests}개`);
  console.log(`- 경고: ${totalTests - passedTests - failedTests}개`);

  console.log('\n### 주요 발견 사항:');

  const corsErrors = networkErrors.filter(err =>
    err.failure?.toLowerCase().includes('cors') ||
    err.failure?.toLowerCase().includes('access-control')
  );

  if (corsErrors.length > 0) {
    console.log(`  🚨 CORS 에러 ${corsErrors.length}건 발견 - 백엔드 CORS 설정 확인 필요`);
  }

  if (consoleErrors.length > 0) {
    console.log(`  ⚠️  브라우저 콘솔 에러 ${consoleErrors.length}건 - 개발자 도구에서 확인 필요`);
  }

  if (apiRequests.length === 0) {
    console.log(`  💡 API 요청이 감지되지 않음 - 페이지가 정적이거나 지연 로딩 중`);
  }

  console.log(`\n📸 스크린샷 저장 위치: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(70));

  // JSON 결과 저장
  const reportPath = path.join(SCREENSHOT_DIR, `${TIMESTAMP}_production-test-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: totalTests - passedTests - failedTests
    },
    consoleLogs: consoleLogs.slice(0, 30),
    consoleErrors,
    networkErrors,
    apiRequests: apiRequests.slice(0, 20)
  }, null, 2));

  console.log(`\n📄 상세 리포트: ${reportPath}\n`);

  const allPassed = failedTests === 0;
  process.exit(allPassed ? 0 : 1);
}

runProductionE2ETests().catch(error => {
  console.error('❌ 테스트 실행 중 오류:', error);
  process.exit(1);
});
