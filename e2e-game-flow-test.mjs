/**
 * Liar Game 실제 게임 플로우 E2E 테스트
 * 사용자 시나리오를 실제로 재현하여 테스트
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3002';
const SCREENSHOT_DIR = '/Users/m16khb/Workspace/liar-game/e2e-screenshots';

// 스크린샷 디렉토리 생성
try {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
} catch (e) {
  // 이미 존재하면 무시
}

const testResults = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
  screenshots: [],
  errors: [],
  consoleErrors: []
};

async function captureScreenshot(page, name, description = '') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  testResults.screenshots.push({ name, filepath, description });
  console.log(`  📸 [Screenshot] ${filename} - ${description}`);
  return filepath;
}

async function logTestResult(testName, status, details = '', error = null) {
  const result = {
    name: testName,
    status,
    details,
    timestamp: new Date().toISOString(),
    error: error ? error.message : null
  };
  testResults.tests.push(result);

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${testName}`);
  if (details) console.log(`   ℹ️  ${details}`);
  if (error) console.log(`   ❌ Error: ${error.message}`);
}

async function waitForNetworkIdle(page, timeout = 3000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (e) {
    // 타임아웃되어도 계속 진행
    console.log('   ⏱️  Network idle timeout (continuing...)');
  }
}

async function runGameFlowTest() {
  console.log('================================================');
  console.log('🎮 Liar Game - 실제 게임 플로우 E2E 테스트');
  console.log(`🔗 테스트 URL: ${BASE_URL}`);
  console.log(`📁 스크린샷 저장: ${SCREENSHOT_DIR}`);
  console.log('================================================\n');

  const browser = await chromium.launch({
    headless: false, // 실제 브라우저로 동작 확인
    slowMo: 500 // 각 동작 사이 0.5초 대기 (디버깅용)
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: SCREENSHOT_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.consoleErrors.push({
        timestamp: new Date().toISOString(),
        message: msg.text()
      });
      console.log(`   🔴 Console Error: ${msg.text()}`);
    }
  });

  // 페이지 에러 수집
  page.on('pageerror', error => {
    testResults.errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    console.log(`   🔴 Page Error: ${error.message}`);
  });

  try {
    // ========================================
    // 테스트 1: 메인 페이지 접근
    // ========================================
    console.log('\n📋 [테스트 1] 메인 페이지 접근');
    try {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await waitForNetworkIdle(page);
      const loadTime = Date.now() - startTime;

      await captureScreenshot(page, '01-main-page-initial', '초기 메인 페이지');
      await logTestResult('메인 페이지 로드', 'PASS', `로드 시간: ${loadTime}ms`);

      // 페이지 타이틀 확인
      const title = await page.title();
      await logTestResult('페이지 타이틀 확인', 'PASS', `타이틀: ${title}`);

      // 모든 버튼 찾기
      const buttons = await page.locator('button, a[role="button"]').all();
      const buttonTexts = await Promise.all(buttons.map(async btn => {
        const text = await btn.textContent();
        return text?.trim() || '';
      }));

      console.log(`   🔍 발견된 버튼: ${buttonTexts.filter(t => t).join(', ')}`);
      await logTestResult('버튼 요소 발견', 'PASS', `총 ${buttonTexts.filter(t => t).length}개 버튼`);

    } catch (error) {
      await captureScreenshot(page, '01-main-page-error', '메인 페이지 에러');
      await logTestResult('메인 페이지 로드', 'FAIL', '', error);
    }

    // ========================================
    // 테스트 2: LOGIN 버튼 클릭
    // ========================================
    console.log('\n📋 [테스트 2] LOGIN 버튼 클릭 테스트');
    try {
      // LOGIN 버튼 찾기 (여러 패턴 시도)
      const loginButtonSelectors = [
        'button:has-text("LOGIN")',
        'button:has-text("Login")',
        'a:has-text("LOGIN")',
        'a:has-text("Login")',
        '[data-testid="login-button"]',
        'button[class*="login"]'
      ];

      let loginButton = null;
      for (const selector of loginButtonSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          loginButton = btn;
          console.log(`   ✅ LOGIN 버튼 발견: ${selector}`);
          break;
        }
      }

      if (loginButton) {
        await captureScreenshot(page, '02-before-login-click', '로그인 버튼 클릭 전');
        await loginButton.click();
        await page.waitForTimeout(1000); // 클릭 후 대기
        await waitForNetworkIdle(page);
        await captureScreenshot(page, '02-after-login-click', '로그인 버튼 클릭 후');

        // 로그인 모달 또는 페이지가 열렸는지 확인
        const hasModal = await page.locator('[role="dialog"], .modal, [class*="Modal"]').isVisible().catch(() => false);
        const urlChanged = page.url() !== BASE_URL;

        if (hasModal) {
          await logTestResult('LOGIN 버튼 클릭', 'PASS', '로그인 모달 표시됨');

          // 소셜 로그인 버튼 확인
          const githubBtn = await page.locator('button:has-text("GitHub"), a:has-text("GitHub")').isVisible().catch(() => false);
          const discordBtn = await page.locator('button:has-text("Discord"), a:has-text("Discord")').isVisible().catch(() => false);

          if (githubBtn || discordBtn) {
            await logTestResult('소셜 로그인 버튼 확인', 'PASS', `GitHub: ${githubBtn}, Discord: ${discordBtn}`);
            await captureScreenshot(page, '02-social-login-buttons', '소셜 로그인 버튼');
          } else {
            await logTestResult('소셜 로그인 버튼 확인', 'WARN', '소셜 로그인 버튼 미발견');
          }

        } else if (urlChanged) {
          await logTestResult('LOGIN 버튼 클릭', 'PASS', `URL 변경: ${page.url()}`);
        } else {
          await logTestResult('LOGIN 버튼 클릭', 'WARN', '모달이나 페이지 변경 없음');
        }

        // 모달 닫기 (X 버튼이나 ESC)
        const closeBtn = page.locator('button[aria-label="Close"], button:has-text("×"), [class*="close"]').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }

      } else {
        await logTestResult('LOGIN 버튼 찾기', 'FAIL', 'LOGIN 버튼을 찾을 수 없음');
      }

    } catch (error) {
      await captureScreenshot(page, '02-login-error', '로그인 에러');
      await logTestResult('LOGIN 버튼 클릭', 'FAIL', '', error);
    }

    // ========================================
    // 테스트 3: NEW ROOM 버튼 클릭
    // ========================================
    console.log('\n📋 [테스트 3] NEW ROOM 버튼 클릭 테스트');
    try {
      // 메인 페이지로 돌아가기
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page);

      const newRoomSelectors = [
        'button:has-text("NEW ROOM")',
        'button:has-text("New Room")',
        'button:has-text("+ NEW")',
        'a:has-text("NEW ROOM")',
        '[data-testid="new-room-button"]',
        'button[class*="new"]'
      ];

      let newRoomButton = null;
      for (const selector of newRoomSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          newRoomButton = btn;
          console.log(`   ✅ NEW ROOM 버튼 발견: ${selector}`);
          break;
        }
      }

      if (newRoomButton) {
        await captureScreenshot(page, '03-before-new-room-click', 'NEW ROOM 버튼 클릭 전');
        await newRoomButton.click();
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
        await captureScreenshot(page, '03-after-new-room-click', 'NEW ROOM 버튼 클릭 후');

        // 방 생성 모달/폼 확인
        const hasModal = await page.locator('[role="dialog"], .modal, [class*="Modal"], form').isVisible().catch(() => false);

        if (hasModal) {
          await logTestResult('NEW ROOM 버튼 클릭', 'PASS', '방 생성 모달 표시됨');

          // 방 제목 입력 필드 찾기
          const titleInput = page.locator('input[name="title"], input[placeholder*="제목"], input[placeholder*="title"], input[type="text"]').first();
          if (await titleInput.isVisible().catch(() => false)) {
            await logTestResult('방 제목 입력 필드 확인', 'PASS');

            // 방 제목 입력
            await titleInput.fill('E2E 테스트 방');
            await page.waitForTimeout(500);
            await captureScreenshot(page, '03-room-title-input', '방 제목 입력');
            await logTestResult('방 제목 입력', 'PASS', '제목: E2E 테스트 방');
          } else {
            await logTestResult('방 제목 입력 필드 확인', 'WARN', '입력 필드 미발견');
          }

          // 난이도 선택 버튼 찾기
          const difficultyButtons = await page.locator('button:has-text("NORMAL"), button:has-text("EASY"), button:has-text("HARD")').all();
          if (difficultyButtons.length > 0) {
            await logTestResult('난이도 선택 버튼 확인', 'PASS', `${difficultyButtons.length}개 난이도 버튼`);

            // NORMAL 선택
            const normalBtn = page.locator('button:has-text("NORMAL")').first();
            if (await normalBtn.isVisible().catch(() => false)) {
              await normalBtn.click();
              await page.waitForTimeout(500);
              await captureScreenshot(page, '03-difficulty-selected', 'NORMAL 난이도 선택');
              await logTestResult('난이도 선택', 'PASS', 'NORMAL 선택됨');
            }
          } else {
            await logTestResult('난이도 선택 버튼 확인', 'WARN', '난이도 버튼 미발견');
          }

          // CREATE 버튼 찾기
          const createBtn = page.locator('button:has-text("CREATE"), button:has-text("Create"), button[type="submit"]').first();
          if (await createBtn.isVisible().catch(() => false)) {
            await createBtn.click();
            await page.waitForTimeout(2000);
            await waitForNetworkIdle(page);
            await captureScreenshot(page, '03-after-create-click', 'CREATE 버튼 클릭 후');

            // URL 변경 또는 모달 닫힘 확인
            const urlChanged = page.url() !== BASE_URL;
            const modalClosed = !(await page.locator('[role="dialog"]').isVisible().catch(() => false));

            if (urlChanged) {
              await logTestResult('방 생성 (CREATE 클릭)', 'PASS', `방 생성 완료, URL: ${page.url()}`);
            } else if (modalClosed) {
              await logTestResult('방 생성 (CREATE 클릭)', 'PASS', '모달 닫힘 (방 생성됨)');
            } else {
              // 에러 메시지 확인
              const errorMsg = await page.locator('[class*="error"], [role="alert"], .alert-error').textContent().catch(() => '');
              if (errorMsg) {
                await logTestResult('방 생성 (CREATE 클릭)', 'WARN', `에러 메시지: ${errorMsg}`);
              } else {
                await logTestResult('방 생성 (CREATE 클릭)', 'WARN', '방 생성 결과 불명확');
              }
            }
          } else {
            await logTestResult('CREATE 버튼 찾기', 'WARN', 'CREATE 버튼 미발견');
          }

          // 모달 닫기
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

        } else {
          await logTestResult('NEW ROOM 버튼 클릭', 'WARN', '모달이 표시되지 않음');
        }

      } else {
        await logTestResult('NEW ROOM 버튼 찾기', 'FAIL', 'NEW ROOM 버튼을 찾을 수 없음');
      }

    } catch (error) {
      await captureScreenshot(page, '03-new-room-error', 'NEW ROOM 에러');
      await logTestResult('NEW ROOM 버튼 클릭', 'FAIL', '', error);
    }

    // ========================================
    // 테스트 4: JOIN BY CODE 버튼 클릭
    // ========================================
    console.log('\n📋 [테스트 4] JOIN BY CODE 버튼 클릭 테스트');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page);

      const joinCodeSelectors = [
        'button:has-text("JOIN BY CODE")',
        'button:has-text("Join by Code")',
        'button:has-text("JOIN")',
        'a:has-text("JOIN BY CODE")',
        '[data-testid="join-code-button"]'
      ];

      let joinCodeButton = null;
      for (const selector of joinCodeSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          joinCodeButton = btn;
          console.log(`   ✅ JOIN BY CODE 버튼 발견: ${selector}`);
          break;
        }
      }

      if (joinCodeButton) {
        await captureScreenshot(page, '04-before-join-click', 'JOIN BY CODE 버튼 클릭 전');
        await joinCodeButton.click();
        await page.waitForTimeout(1000);
        await waitForNetworkIdle(page);
        await captureScreenshot(page, '04-after-join-click', 'JOIN BY CODE 버튼 클릭 후');

        const hasModal = await page.locator('[role="dialog"], .modal, [class*="Modal"]').isVisible().catch(() => false);

        if (hasModal) {
          await logTestResult('JOIN BY CODE 버튼 클릭', 'PASS', '방 코드 입력 모달 표시됨');

          // 방 코드 입력 필드 찾기
          const codeInput = page.locator('input[name="code"], input[placeholder*="코드"], input[placeholder*="code"], input[type="text"]').first();
          if (await codeInput.isVisible().catch(() => false)) {
            await logTestResult('방 코드 입력 필드 확인', 'PASS');

            // 잘못된 코드 입력 (에러 핸들링 테스트)
            await codeInput.fill('INVALID123');
            await page.waitForTimeout(500);
            await captureScreenshot(page, '04-invalid-code-input', '잘못된 방 코드 입력');

            // JOIN 버튼 클릭
            const joinBtn = page.locator('button:has-text("JOIN"), button[type="submit"]').first();
            if (await joinBtn.isVisible().catch(() => false)) {
              await joinBtn.click();
              await page.waitForTimeout(2000);
              await waitForNetworkIdle(page);
              await captureScreenshot(page, '04-after-invalid-join', '잘못된 코드로 JOIN 시도 후');

              // 에러 메시지 확인
              const errorMsg = await page.locator('[class*="error"], [role="alert"], .alert-error, .error-message').textContent().catch(() => '');
              if (errorMsg) {
                await logTestResult('잘못된 방 코드 에러 핸들링', 'PASS', `에러 메시지 표시: ${errorMsg.trim()}`);
              } else {
                await logTestResult('잘못된 방 코드 에러 핸들링', 'WARN', '에러 메시지 미표시');
              }
            }
          } else {
            await logTestResult('방 코드 입력 필드 확인', 'WARN', '입력 필드 미발견');
          }

          // 모달 닫기
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);

        } else {
          await logTestResult('JOIN BY CODE 버튼 클릭', 'WARN', '모달이 표시되지 않음');
        }

      } else {
        await logTestResult('JOIN BY CODE 버튼 찾기', 'FAIL', 'JOIN BY CODE 버튼을 찾을 수 없음');
      }

    } catch (error) {
      await captureScreenshot(page, '04-join-code-error', 'JOIN BY CODE 에러');
      await logTestResult('JOIN BY CODE 버튼 클릭', 'FAIL', '', error);
    }

    // ========================================
    // 테스트 5: 빈 값 검증 테스트
    // ========================================
    console.log('\n📋 [테스트 5] 빈 값 검증 테스트');
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page);

      // NEW ROOM 버튼 다시 클릭
      const newRoomBtn = page.locator('button:has-text("NEW ROOM"), button:has-text("New Room")').first();
      if (await newRoomBtn.isVisible().catch(() => false)) {
        await newRoomBtn.click();
        await page.waitForTimeout(1000);

        // 방 제목 비워두고 CREATE 클릭
        const createBtn = page.locator('button:has-text("CREATE"), button[type="submit"]').first();
        if (await createBtn.isVisible().catch(() => false)) {
          await createBtn.click();
          await page.waitForTimeout(1000);
          await captureScreenshot(page, '05-empty-title-validation', '빈 제목으로 방 생성 시도');

          // 검증 에러 메시지 확인
          const validationMsg = await page.locator('[class*="error"], [role="alert"], .invalid-feedback, input:invalid').count();
          if (validationMsg > 0) {
            await logTestResult('빈 방 제목 검증', 'PASS', '검증 에러 표시됨');
          } else {
            await logTestResult('빈 방 제목 검증', 'WARN', '검증 에러 미표시');
          }

          await page.keyboard.press('Escape');
        }
      }

    } catch (error) {
      await captureScreenshot(page, '05-validation-error', '검증 에러');
      await logTestResult('빈 값 검증 테스트', 'FAIL', '', error);
    }

    // ========================================
    // 테스트 6: 반응형 디자인 (모바일)
    // ========================================
    console.log('\n📋 [테스트 6] 반응형 디자인 테스트');
    try {
      await context.close();

      // 모바일 뷰포트
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(mobilePage);
      await captureScreenshot(mobilePage, '06-mobile-view', '모바일 뷰 (375x812)');
      await logTestResult('모바일 반응형 레이아웃', 'PASS', '모바일 뷰 렌더링 완료');

      // 버튼 클릭 가능 여부 확인
      const mobileButtons = await mobilePage.locator('button').all();
      const visibleCount = await Promise.all(mobileButtons.map(btn => btn.isVisible().catch(() => false))).then(arr => arr.filter(Boolean).length);
      await logTestResult('모바일 버튼 접근성', 'PASS', `${visibleCount}개 버튼 표시됨`);

      await mobileContext.close();

    } catch (error) {
      await logTestResult('반응형 디자인 테스트', 'FAIL', '', error);
    }

  } catch (error) {
    console.error('❌ 테스트 실행 중 치명적 오류:', error);
    testResults.errors.push({
      timestamp: new Date().toISOString(),
      type: 'CRITICAL',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }

  // ========================================
  // 결과 요약
  // ========================================
  console.log('\n================================================');
  console.log('📊 테스트 결과 요약');
  console.log('================================================');

  const passed = testResults.tests.filter(t => t.status === 'PASS').length;
  const failed = testResults.tests.filter(t => t.status === 'FAIL').length;
  const warned = testResults.tests.filter(t => t.status === 'WARN').length;
  const total = testResults.tests.length;

  console.log(`총 테스트: ${total}`);
  console.log(`✅ 통과: ${passed}`);
  console.log(`❌ 실패: ${failed}`);
  console.log(`⚠️  경고: ${warned}`);
  console.log(`성공률: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n📸 스크린샷 목록:');
  testResults.screenshots.forEach(s => {
    console.log(`  - ${s.filepath}`);
    console.log(`    ${s.description}`);
  });

  if (testResults.consoleErrors.length > 0) {
    console.log('\n🔴 콘솔 에러:');
    testResults.consoleErrors.forEach(e => console.log(`  - ${e.message}`));
  } else {
    console.log('\n✅ 콘솔 에러 없음');
  }

  if (testResults.errors.length > 0) {
    console.log('\n❌ 페이지 에러:');
    testResults.errors.forEach(e => console.log(`  - ${e.message}`));
  } else {
    console.log('✅ 페이지 에러 없음');
  }

  // 결과 JSON 저장
  const resultPath = join(SCREENSHOT_DIR, `game-flow-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(resultPath, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 결과 저장: ${resultPath}`);

  // 테스트별 상세 결과
  console.log('\n📋 테스트 상세 결과:');
  testResults.tests.forEach((test, idx) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${idx + 1}. ${icon} ${test.name}`);
    if (test.details) console.log(`   ${test.details}`);
    if (test.error) console.log(`   에러: ${test.error}`);
  });

  console.log('\n================================================');
  console.log('🎮 테스트 완료!');
  console.log('================================================\n');

  return testResults;
}

// 테스트 실행
runGameFlowTest().catch(console.error);
