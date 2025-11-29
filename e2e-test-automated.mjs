#!/usr/bin/env node

/**
 * 라이어 게임 E2E 자동화 테스트 스크립트
 * Playwright를 사용하여 웹 애플리케이션 테스트
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  baseUrl: 'http://localhost:3002/',
  screenshotDir: '/Users/m16khb/Workspace/liar-game/e2e-screenshots/',
  timestamp: Date.now(),
  timeout: 30000,
};

const testResults = {
  timestamp: config.timestamp,
  testDate: new Date().toISOString(),
  baseUrl: config.baseUrl,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
  },
};

function addTestResult(name, status, details = {}) {
  testResults.tests.push({
    name,
    status,
    timestamp: Date.now(),
    ...details,
  });
  testResults.summary.total++;
  if (status === 'passed') {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
}

async function runTests() {
  console.log('🚀 라이어 게임 E2E 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    // ===== 테스트 1: 메인 페이지 접속 테스트 =====
    console.log('📋 테스트 1: 메인 페이지 접속 테스트');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    try {
      await page.goto(config.baseUrl, {
        waitUntil: 'networkidle',
        timeout: config.timeout
      });

      const screenshotPath = `${config.screenshotDir}test-${config.timestamp}-01-main-page.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      const title = await page.title();
      console.log(`  ✅ 페이지 로드 성공`);
      console.log(`  📄 페이지 타이틀: "${title}"`);
      console.log(`  📸 스크린샷 저장: ${screenshotPath}\n`);

      addTestResult('메인 페이지 접속', 'passed', {
        title,
        screenshot: screenshotPath,
      });
    } catch (error) {
      console.log(`  ❌ 페이지 로드 실패: ${error.message}\n`);
      addTestResult('메인 페이지 접속', 'failed', {
        error: error.message,
      });
      throw error;
    }

    // ===== 테스트 2: UI 요소 확인 =====
    console.log('📋 테스트 2: UI 요소 확인');

    try {
      // 로고/타이틀 확인
      const logo = await page.locator('h1, [class*="logo" i], [class*="title" i]').first();
      const logoExists = await logo.count() > 0;

      if (logoExists) {
        const logoText = await logo.textContent();
        console.log(`  ✅ 로고/타이틀 발견: "${logoText}"`);
      } else {
        console.log(`  ⚠️  로고/타이틀 요소를 찾을 수 없습니다`);
      }

      // 로그인/회원가입 버튼 확인
      const loginButton = await page.locator('button:has-text("로그인"), a:has-text("로그인"), button:has-text("Login"), a:has-text("Login")').first();
      const signupButton = await page.locator('button:has-text("회원가입"), a:has-text("회원가입"), button:has-text("Sign"), a:has-text("Sign")').first();

      const loginExists = await loginButton.count() > 0;
      const signupExists = await signupButton.count() > 0;

      console.log(`  ${loginExists ? '✅' : '⚠️ '} 로그인 버튼: ${loginExists ? '발견' : '미발견'}`);
      console.log(`  ${signupExists ? '✅' : '⚠️ '} 회원가입 버튼: ${signupExists ? '발견' : '미발견'}\n`);

      addTestResult('UI 요소 확인', 'passed', {
        logo: logoExists ? await logo.textContent() : 'not found',
        loginButton: loginExists,
        signupButton: signupExists,
      });
    } catch (error) {
      console.log(`  ❌ UI 요소 확인 실패: ${error.message}\n`);
      addTestResult('UI 요소 확인', 'failed', {
        error: error.message,
      });
    }

    // ===== 테스트 3: 폰트 검증 =====
    console.log('📋 테스트 3: 폰트 검증');

    try {
      // body 요소의 폰트 확인
      const bodyFont = await page.evaluate(() => {
        const body = document.body;
        const computedStyle = window.getComputedStyle(body);
        return computedStyle.fontFamily;
      });

      // 모든 텍스트 요소의 폰트 확인
      const allFonts = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const fonts = new Set();
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.fontFamily) {
            fonts.add(style.fontFamily);
          }
        });
        return Array.from(fonts);
      });

      console.log(`  📝 Body 폰트: ${bodyFont}`);
      console.log(`  📝 페이지에서 사용된 모든 폰트:`);
      allFonts.forEach(font => {
        const isRetro = font.toLowerCase().includes('vt323') ||
                       font.toLowerCase().includes('press start') ||
                       font.toLowerCase().includes('retro');
        const isSystemFont = font.toLowerCase().includes('굴림') ||
                            font.toLowerCase().includes('궁서') ||
                            font.toLowerCase().includes('돋움') ||
                            font.toLowerCase().includes('system');

        if (isRetro) {
          console.log(`    ✅ ${font} (레트로 폰트)`);
        } else if (isSystemFont) {
          console.log(`    ⚠️  ${font} (시스템 폰트 - 개선 권장)`);
        } else {
          console.log(`    ℹ️  ${font}`);
        }
      });

      const hasVT323 = bodyFont.toLowerCase().includes('vt323') ||
                       allFonts.some(f => f.toLowerCase().includes('vt323'));

      console.log(`  ${hasVT323 ? '✅' : '⚠️ '} VT323 폰트 적용: ${hasVT323 ? '확인됨' : '미확인'}\n`);

      const screenshotPath = `${config.screenshotDir}test-${config.timestamp}-04-font-inspection.png`;
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });

      addTestResult('폰트 검증', 'passed', {
        bodyFont,
        allFonts,
        hasVT323,
        screenshot: screenshotPath,
      });
    } catch (error) {
      console.log(`  ❌ 폰트 검증 실패: ${error.message}\n`);
      addTestResult('폰트 검증', 'failed', {
        error: error.message,
      });
    }

    // ===== 테스트 4: 반응형 디자인 테스트 =====
    console.log('📋 테스트 4: 반응형 디자인 테스트');

    try {
      // 모바일 뷰포트 (375x667)
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000); // 레이아웃 안정화 대기

      const mobileScreenshot = `${config.screenshotDir}test-${config.timestamp}-02-mobile-375x667.png`;
      await page.screenshot({
        path: mobileScreenshot,
        fullPage: true
      });
      console.log(`  ✅ 모바일 뷰포트 (375x667) 스크린샷: ${mobileScreenshot}`);

      // 데스크톱 뷰포트 (1920x1080)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000); // 레이아웃 안정화 대기

      const desktopScreenshot = `${config.screenshotDir}test-${config.timestamp}-03-desktop-1920x1080.png`;
      await page.screenshot({
        path: desktopScreenshot,
        fullPage: true
      });
      console.log(`  ✅ 데스크톱 뷰포트 (1920x1080) 스크린샷: ${desktopScreenshot}\n`);

      addTestResult('반응형 디자인', 'passed', {
        mobile: mobileScreenshot,
        desktop: desktopScreenshot,
      });
    } catch (error) {
      console.log(`  ❌ 반응형 디자인 테스트 실패: ${error.message}\n`);
      addTestResult('반응형 디자인', 'failed', {
        error: error.message,
      });
    }

    await context.close();

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
  } finally {
    await browser.close();
  }

  // 결과 저장
  const resultsPath = `${config.screenshotDir}test-results-${config.timestamp}.json`;
  writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));

  console.log('📊 테스트 결과 요약');
  console.log(`  총 테스트: ${testResults.summary.total}`);
  console.log(`  ✅ 통과: ${testResults.summary.passed}`);
  console.log(`  ❌ 실패: ${testResults.summary.failed}`);
  console.log(`  📁 결과 파일: ${resultsPath}\n`);

  if (testResults.summary.failed > 0) {
    console.log('⚠️  일부 테스트가 실패했습니다. 상세 내용을 확인하세요.');
    process.exit(1);
  } else {
    console.log('✨ 모든 테스트가 성공적으로 완료되었습니다!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('💥 치명적 오류:', error);
  process.exit(1);
});
