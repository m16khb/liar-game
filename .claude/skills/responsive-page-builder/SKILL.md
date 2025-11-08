---
name: responsive-page-builder
description: 모든 디바이스에서 최적화된 반응형 페이지 생성. 히어로 섹션, 랜딩 페이지, 게임 인터페이스 등 라이어 게임 웹사이트의 모든 페이지 구축 시 사용합니다.
---

# 반응형 페이지 빌더

## 지침

모바일 퍼스트 접근 방식으로 반응형 페이지 생성:

1. **페이지 구조 설계**: 콘텐츠 계층 및 사용자 흐름 정의
2. **모바일 퍼스트 디자인**: 작은 화면부터 시작하여 점진적 확장
3. **Tailwind CSS 활용**: 유틸리티 클래스로 반응형 레이아웃 구현
4. **애니메이션 통합**: Framer Motion으로 부드러운 상호작용
5. **성능 최적화**: 이미지 최적화, 코드 분할, 지연 로딩
6. **접근성 확보**: 모든 사용자를 위한 inclusive design

## 히어로 섹션 페이지

```typescript
// pages/HomePage.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { CTASection } from '@/components/sections/CTASection';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navigation />
      <main>
        <HeroSection
          title="라이어 게임"
          subtitle="친구들과 함께하는 재미있는 심리 게임"
          ctaText="지금 시작하기"
          onCtaClick={() => console.log('CTA clicked')}
          backgroundImage="/images/hero-bg.jpg"
          showParticles={true}
        />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};
```

## 히어로 섹션 컴포넌트

```typescript
// components/sections/HeroSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, PlayIcon } from '@heroicons/react/24/outline';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onCtaClick: () => void;
  backgroundImage?: string;
  showParticles?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  onCtaClick,
  backgroundImage,
  showParticles = false
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 또는 그라데이션 */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          {/* 애니메이션 배경 효과 */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 10
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={onCtaClick}
            size="lg"
            className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
            icon={<ArrowRightIcon className="w-5 h-5 ml-2" />}
          >
            {ctaText}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10"
            icon={<PlayIcon className="w-5 h-5 mr-2" />}
          >
            게임 방법
          </Button>
        </motion.div>

        {/* 스크롤 표시 */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
```

## 피처 섹션

```typescript
// components/sections/FeaturesSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { GameIcon, UsersIcon, ShieldIcon } from '@heroicons/react/24/outline';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <GameIcon className="w-8 h-8" />,
    title: "재미있는 게임 플레이",
    description: "친구들과 함께하는 심리전 게임으로 뇌를 자극하고 즐거운 시간을 보내세요."
  },
  {
    icon: <UsersIcon className="w-8 h-8" />,
    title: "실시간 멀티플레이",
    description: "웹 기반 실시간 통신으로 지구 어디서든 친구들과 함께 게임을 즐길 수 있습니다."
  },
  {
    icon: <ShieldIcon className="w-8 h-8" />,
    title: "안전한 환경",
    description: "완벽한 게임 규칙과 시스템으로 모두가 공정하게 게임을 즐길 수 있습니다."
  }
];

export const FeaturesSection: React.FC = () => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            왜 라이어 게임인가요?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            최고의 게임 경험을 위해 설계된 기능들을 만나보세요
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ y: -10 }}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
```

## 네비게이션 컴포넌트

```typescript
// components/layout/Navigation.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: '홈', href: '/' },
    { name: '게임 방법', href: '/how-to-play' },
    { name: '랭킹', href: '/ranking' },
    user ? { name: '대시보드', href: '/dashboard' } : { name: '로그인', href: '/login' }
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}>
                라이어 게임
              </h1>
            </div>

            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'
                  } transition-colors duration-200 font-medium`}
                >
                  {item.name}
                </a>
              ))}
              {user && (
                <Button size="sm" onClick={() => console.log('Start game')}>
                  게임 시작
                </Button>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`${
                  isScrolled ? 'text-gray-700' : 'text-white'
                } hover:opacity-70 transition-opacity`}
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-white shadow-xl md:hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              {user && (
                <Button className="w-full" onClick={() => console.log('Start game')}>
                  게임 시작
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

## 핵심 패턴

- **모바일 퍼스트**: sm:, md:, lg:, xl: 브레이크포인트 순서
- **유연한 레이아웃**: Flexbox와 Grid를 활용한 적응형 디자인
- **성능 최적화**: Next.js Image, 동적 임포트, 코드 분할
- **부드러운 애니메이션**: Framer Motion을 통한 상태 변화
- **반응형 타이포그래피**: 텍스트 크기의 일관된 스케일링
- **터치 친화적**: 모바일에서 쉽게 탭할 수 있는 버튼 크기
- **가로 스크롤 방지**: 콘텐츠가 화면을 넘지 않도록 설계

## 반응형 브레이크포인트

```css
/* Tailwind CSS 기준 */
sm: 640px   /* 작은 태블릿 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 작은 데스크탑 */
xl: 1280px  /* 데스크탑 */
2xl: 1536px /* 큰 데스크탑 */
```

## 생성 파일 구조

```
src/
├── pages/
│   ├── HomePage.tsx         # 메인 페이지
│   ├── LoginPage.tsx        # 로그인 페이지
│   └── DashboardPage.tsx    # 대시보드 페이지
├── components/
│   ├── sections/
│   │   ├── HeroSection.tsx  # 히어로 섹션
│   │   ├── FeaturesSection.tsx # 피처 섹션
│   │   └── CTASection.tsx   # CTA 섹션
│   ├── layout/
│   │   ├── Navigation.tsx   # 네비게이션
│   │   └── Footer.tsx       # 푸터
│   └── ui/
│       └── Button.tsx       # 기본 버튼 컴포넌트
```