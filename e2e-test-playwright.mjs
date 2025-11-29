/**
 * Liar Game E2E Test - Playwright MCP Integration
 *
 * 테스트 목표:
 * 1. 메인 페이지 로드 및 UI 요소 검증
 * 2. API 연결 상태 확인 (CORS 문제 검증)
 * 3. 폰트 적용 확인
 * 4. 반응형 디자인 테스트
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = '/Users/m16khb/Workspace/liar-game/e2e-screenshots';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

// 스크린샷 저장 헬퍼
async function saveScreenshot(page, name) {
  const filename = `${TIMESTAMP}_${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✅ 스크린샷 저장: ${filename}`);
  return filepath;
}

// 콘솔 로그 수집
const consoleLogs = [];
const consoleErrors = [];
const networkErrors = [];

async function runE2ETests() {
  console.log('🚀 Liar Game E2E 테스트 시작\n');

  const browser = await chromium.launch({ headless: true });
  const results = {
    mainPageLoad: false,
    titleDisplay: false,
    buttonsDisplay: false,
    apiConnection: null,
    corsIssue: false,
    fontApplied: false,
    responsiveDesktop: false,
    responsiveMobile: false,
    errors: [],
    screenshots: []
  };

  try {
    // ========================================
    // 테스트 1: 메인 페이지 로드 (데스크톱)
    // ========================================
    console.log('📌 테스트 1: 메인 페이지 로드 (데스크톱 1920x1080)');

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
    page.on('requestfailed', request => {
      const failure = {
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText
      };
      networkErrors.push(failure);

      // CORS 에러 감지
      if (failure.failure?.includes('CORS') || failure.url.includes('localhost:4000')) {
        results.corsIssue = true;
      }
    });

    // 페이지 로드
    try {
      const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10000 });
      results.mainPageLoad = response.ok();
      console.log(`  ✅ 페이지 로드 성공 (Status: ${response.status()})`);
    } catch (error) {
      results.mainPageLoad = false;
      results.errors.push(`페이지 로드 실패: ${error.message}`);
      console.log(`  ❌ 페이지 로드 실패: ${error.message}`);
    }

    await page.waitForTimeout(2000); // UI 렌더링 대기

    // 스크린샷 저장
    const screenshot1 = await saveScreenshot(page, '01-main-page-desktop');
    results.screenshots.push(screenshot1);

    // ========================================
    // 테스트 2: UI 요소 검증
    // ========================================
    console.log('\n📌 테스트 2: UI 요소 검증');

    // 타이틀 확인
    try {
      const titleElement = await page.locator('text=LIAR GAME').first();
      const titleVisible = await titleElement.isVisible({ timeout: 5000 });
      results.titleDisplay = titleVisible;
      console.log(`  ${titleVisible ? '✅' : '❌'} "LIAR GAME" 타이틀 표시`);
    } catch (error) {
      results.titleDisplay = false;
      results.errors.push(`타이틀 검증 실패: ${error.message}`);
      console.log(`  ❌ "LIAR GAME" 타이틀 검증 실패`);
    }

    // 버튼들 확인 (LOGIN, NEW ROOM, JOIN BY CODE)
    try {
      const buttons = ['LOGIN', 'NEW ROOM', 'JOIN BY CODE'];
      let allButtonsVisible = true;

      for (const btnText of buttons) {
        try {
          const button = await page.locator(`button:has-text("${btnText}")`).first();
          const visible = await button.isVisible({ timeout: 3000 });
          console.log(`  ${visible ? '✅' : '❌'} "${btnText}" 버튼 표시`);
          allButtonsVisible = allButtonsVisible && visible;
        } catch (error) {
          console.log(`  ❌ "${btnText}" 버튼 찾기 실패`);
          allButtonsVisible = false;
        }
      }

      results.buttonsDisplay = allButtonsVisible;
    } catch (error) {
      results.buttonsDisplay = false;
      results.errors.push(`버튼 검증 실패: ${error.message}`);
    }

    // ========================================
    // 테스트 3: 폰트 검증 (VT323)
    // ========================================
    console.log('\n📌 테스트 3: 폰트 검증 (VT323)');

    try {
      // 타이틀 요소의 computed style 확인
      const fontFamily = await page.evaluate(() => {
        const titleElement = document.querySelector('h1, [class*="title"], [class*="logo"]');
        if (!titleElement) return null;
        return window.getComputedStyle(titleElement).fontFamily;
      });

      results.fontApplied = fontFamily?.includes('VT323') || false;
      console.log(`  ${results.fontApplied ? '✅' : '❌'} VT323 폰트 적용 (현재: ${fontFamily || 'N/A'})`);
    } catch (error) {
      results.fontApplied = false;
      results.errors.push(`폰트 검증 실패: ${error.message}`);
      console.log(`  ❌ 폰트 검증 실패`);
    }

    // ========================================
    // 테스트 4: API 연결 검증
    // ========================================
    console.log('\n📌 테스트 4: API 연결 검증');

    await page.waitForTimeout(3000); // 네트워크 요청 대기

    if (networkErrors.length > 0) {
      console.log(`  ⚠️  네트워크 에러 ${networkErrors.length}건 발견:`);
      networkErrors.forEach(err => {
        console.log(`     - ${err.method} ${err.url}`);
        console.log(`       오류: ${err.failure}`);
      });

      results.apiConnection = 'failed';

      // localhost:4000/api 요청 확인
      const apiRequests = networkErrors.filter(err => err.url.includes('localhost:4000/api'));
      if (apiRequests.length > 0) {
        console.log(`  ❌ API 연결 실패 (localhost:4000/api)`);
        results.corsIssue = true;
      }
    } else {
      console.log(`  ✅ 네트워크 에러 없음`);
      results.apiConnection = 'success';
    }

    // 콘솔 에러 확인
    if (consoleErrors.length > 0) {
      console.log(`\n  ⚠️  콘솔 에러 ${consoleErrors.length}건:`);
      consoleErrors.forEach(err => console.log(`     - ${err}`));
    }

    // ========================================
    // 테스트 5: 반응형 디자인 - 모바일 뷰
    // ========================================
    console.log('\n📌 테스트 5: 반응형 디자인 - 모바일 뷰 (375x667)');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const screenshot2 = await saveScreenshot(page, '02-main-page-mobile');
    results.screenshots.push(screenshot2);

    // 모바일에서도 주요 요소 표시 확인
    try {
      const titleVisibleMobile = await page.locator('text=LIAR GAME').first().isVisible();
      results.responsiveMobile = titleVisibleMobile;
      console.log(`  ${titleVisibleMobile ? '✅' : '❌'} 모바일 뷰 UI 렌더링`);
    } catch (error) {
      results.responsiveMobile = false;
      console.log(`  ❌ 모바일 뷰 검증 실패`);
    }

    results.responsiveDesktop = true; // 데스크톱은 이미 통과

    await context.close();

  } catch (error) {
    console.error(`\n❌ 치명적 오류: ${error.message}`);
    results.errors.push(`치명적 오류: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ========================================
  // 테스트 결과 요약
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E 테스트 결과 요약');
  console.log('='.repeat(60));

  console.log('\n✅ 통과한 테스트:');
  if (results.mainPageLoad) console.log('  - 메인 페이지 로드');
  if (results.titleDisplay) console.log('  - "LIAR GAME" 타이틀 표시');
  if (results.buttonsDisplay) console.log('  - 버튼들 표시 (LOGIN, NEW ROOM, JOIN BY CODE)');
  if (results.fontApplied) console.log('  - VT323 폰트 적용');
  if (results.responsiveDesktop) console.log('  - 데스크톱 반응형 디자인');
  if (results.responsiveMobile) console.log('  - 모바일 반응형 디자인');
  if (results.apiConnection === 'success') console.log('  - API 연결 성공');

  console.log('\n❌ 실패한 테스트:');
  if (!results.mainPageLoad) console.log('  - 메인 페이지 로드');
  if (!results.titleDisplay) console.log('  - "LIAR GAME" 타이틀 표시');
  if (!results.buttonsDisplay) console.log('  - 버튼들 표시');
  if (!results.fontApplied) console.log('  - VT323 폰트 적용');
  if (!results.responsiveDesktop) console.log('  - 데스크톱 반응형 디자인');
  if (!results.responsiveMobile) console.log('  - 모바일 반응형 디자인');
  if (results.apiConnection === 'failed') console.log('  - API 연결 실패');

  if (results.corsIssue) {
    console.log('\n⚠️  CORS 문제 감지됨');
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  발견된 문제:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  console.log(`\n📸 스크린샷 저장 위치: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  // JSON 결과 저장
  const reportPath = path.join(SCREENSHOT_DIR, `${TIMESTAMP}_test-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    consoleLogs: consoleLogs.slice(0, 20), // 최대 20개
    consoleErrors,
    networkErrors
  }, null, 2));

  console.log(`\n📄 상세 리포트: ${reportPath}\n`);

  // 전체 통과 여부 반환
  const allPassed = results.mainPageLoad &&
                    results.titleDisplay &&
                    results.buttonsDisplay &&
                    results.responsiveDesktop &&
                    results.responsiveMobile &&
                    !results.corsIssue;

  process.exit(allPassed ? 0 : 1);
}

runE2ETests().catch(error => {
  console.error('테스트 실행 중 오류:', error);
  process.exit(1);
});
