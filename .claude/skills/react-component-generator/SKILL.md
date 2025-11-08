---
name: react-component-generator
description: React 및 TypeScript로 재사용 가능한 컴포넌트 생성. UI 컴포넌트, 폼 컴포넌트, 게임 인터페이스, 히어로 섹션 등 라이어 게임 프론트엔드용 컴포넌트 설계 시 사용합니다.
---

# React 컴포넌트 생성기

## 지침

React 18+와 TypeScript를 사용한 재사용 가능한 컴포넌트 생성:

1. **컴포넌트 요구사항 분석**: 필요한 Props, 상태, 기능 식별
2. **타입 안전성 확보**: TypeScript 인터페이스 및 타입 정의
3. **Tailwind CSS 스타일링**: 반응형 디자인 및 일관된 스타일
4. **접근성 고려**: ARIA 속성 및 키보드 내비게이션
5. **테스트 코드 작성**: Vitest 기반 단위 테스트
6. **스토리북 문서화**: 컴포넌트 사용 예시 및 props 문서

## 컴포넌트 템플릿

### 로그인 폼 컴포넌트
```typescript
// components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginFormData } from '@/types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSocialLogin?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  showSocialLogin = true
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(formData.email, formData.password);
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          aria-describedby="email-error"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

### 히어로 섹션 컴포넌트
```typescript
// components/sections/HeroSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

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
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
          {subtitle}
        </p>
        <Button
          onClick={onCtaClick}
          size="lg"
          className="text-lg px-8 py-4"
        >
          {ctaText}
        </Button>
      </motion.div>
    </section>
  );
};
```

### 게임 카드 컴포넌트
```typescript
// components/game/GameCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types/game';

interface GameCardProps {
  player: Player;
  isRevealed?: boolean;
  isSelectable?: boolean;
  onSelect?: (playerId: string) => void;
  showRole?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  player,
  isRevealed = false,
  isSelectable = false,
  onSelect,
  showRole = false
}) => {
  const cardVariants = {
    hidden: {
      opacity: 0,
      rotateY: -180,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        type: "spring"
      }
    },
    hover: {
      scale: isSelectable ? 1.05 : 1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => isSelectable && onSelect?.(player.id)}
      className={`
        relative w-32 h-44 rounded-lg shadow-lg cursor-pointer
        ${isSelectable ? 'hover:shadow-xl' : ''}
        ${isRevealed ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'}
      `}
      style={{ perspective: "1000px" }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
          <span className="text-2xl font-bold">
            {player.nickname.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-center">
          {player.nickname}
        </h3>
        {(isRevealed || showRole) && (
          <span className="text-xs mt-2 px-2 py-1 bg-white/20 rounded">
            {player.role}
          </span>
        )}
      </div>
    </motion.div>
  );
};
```

## 핵심 패턴

- **TypeScript 우선**: 모든 Props에 명확한 타입 정의
- **컴포지션 over 상속**: 작은 컴포넌트 조합으로 복잡한 UI 구성
- **조건부 렌더링**: 로딩, 에러, 빈 상태 처리
- **이벤트 핸들러**: 적절한 타입의 이벤트 처리
- **반응형 디자인**: Tailwind CSS 반응형 클래스 활용
- **접근성**: semantic HTML, ARIA 속성, 키보드 내비게이션
- **애니메이션**: Framer Motion을 통한 부드러운 상태 변화
- **성능 최적화**: React.memo, useMemo, useCallback 적절한 사용

## 생성 파일 구조

```
src/components/[ComponentName]/
├── index.ts              # 재내보내
├── ComponentName.tsx     # 메인 컴포넌트
├── ComponentName.test.tsx # Vitest 테스트
├── ComponentName.stories.tsx # Storybook 스토리
└── types.ts             # 컴포넌트 전용 타입
```