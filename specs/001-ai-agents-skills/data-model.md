# Data Model: AI 에이전트 및 스킬 시스템 역분석

**작성일**: 2025-11-08
**버전**: 1.0.0
**기반**: 기존 `.claude/agents/` 및 `.claude/skills/` 구현 역분석

## 1. 핵심 개념 정의

### 1.1 ExistingAgent (기존 에이전트)

이미 구현된 6개 전문 분야 AI 에이전트로, 특정 전문 분야의 작업을 처리하고 전문적 분석을 제공

```typescript
interface ExistingAgent {
  id: string;                    // 고유 식별자 (예: "database-architect")
  name: string;                  // 에이전트명
  description: string;           // 에이전트 설명
  expertise: ExpertiseDomain;    // 전문 분야
  model: AIModel;               // 사용 AI 모델
  tools: Tool[];                // 활용 가능한 도구 목록
  systemPrompt: string;         // 시스템 프롬프트
  definitionFormat: DefinitionFormat; // 정의 파일 형식
  capabilities: string[];       // 주요 기능 목록
  reviewChecklist: string[];    // 검토 체크리스트
  outputFormat: OutputFormat;   // 출력 형식
  constitutionCompliance: ConstitutionPrinciple[]; // 준수 헌법 원칙
  location: string;             // 파일 위치
}

enum ExpertiseDomain {
  DATABASE = 'database',
  AUTH_SECURITY = 'auth-security',
  GAME_LOGIC = 'game-logic',
  KUBERNETES = 'kubernetes',
  REACT_FRONTEND = 'react-frontend',
  UI_UX_DESIGN = 'ui-ux-design'
}

enum DefinitionFormat {
  YAML_FRONTMATTER = 'yaml-frontmatter',
  MARKDOWN_HEADER = 'markdown-header'
}

enum AIModel {
  SONNET = 'sonnet',
  OPUS = 'opus',
  HAIKU = 'haiku'
}
```

### 1.2 ExistingSkill (기존 스킬)

이미 구현된 8개 자동화 스킬로, 반복적인 개발 작업을 자동화하고 템플릿 기반 코드 생성

```typescript
interface ExistingSkill {
  id: string;                    // 고유 식별자 (예: "api-endpoint-generator")
  name: string;                  // 스킬명
  description: string;           // 스킬 설명
  category: SkillCategory;       // 스킬 분류
  inputRequirements: InputRequirements; // 입력 요구사항
  outputArtifacts: Artifact[];   // 생성 결과물
  templates: Template[];        // 코드 생성 템플릿
  integration: SkillIntegration; // 프로젝트 통합 정보
  qualityStandards: QualityStandards; // 품질 기준
  location: string;             // 디렉토리 위치
}

enum SkillCategory {
  API_GENERATION = 'api-generation',
  FRONTEND_COMPONENT = 'frontend-component',
  DATABASE_MIGRATION = 'database-migration',
  AUTH_INTEGRATION = 'auth-integration',
  INFRASTRUCTURE = 'infrastructure',
  TESTING = 'testing',
  REAL_TIME_COMMUNICATION = 'real-time-communication',
  RESPONSIVE_DESIGN = 'responsive-design'
}

interface InputRequirements {
  required: string[];           // 필수 입력 파라미터
  optional: string[];           // 선택적 입력 파라미터
  examples: Record<string, any>; // 입력 예시
}

interface Artifact {
  type: ArtifactType;           // 결과물 타입
  path: string;                 // 생성될 파일 경로
  template: string;             // 파일 템플릿
  validation: ValidationRule[]; // 검증 규칙
}

enum ArtifactType {
  CONTROLLER = 'controller',
  SERVICE = 'service',
  DTO = 'dto',
  ENTITY = 'entity',
  COMPONENT = 'component',
  TEST = 'test',
  MIGRATION = 'migration',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation'
}
```

### 1.3 AgentSystemArchitecture (에이전트 시스템 아키텍처)

에이전트 정의 형식, 시스템 프롬프트 구조, 도구 접근 패턴 등 아키텍처 요소 정의

```typescript
interface AgentSystemArchitecture {
  version: string;              // 아키텍처 버전
  definitionFormat: DefinitionFormat; // 표준 정의 형식
  promptStructure: PromptStructure;   // 시스템 프롬프트 구조
  toolAccessPattern: ToolAccessPattern; // 도구 접근 패턴
  qualityAssurance: AgentQualityAssurance; // 품질 보장
  collaborationProtocol: CollaborationProtocol; // 협업 프로토콜
}

interface PromptStructure {
  sections: string[];           // 프롬프트 구성 섹션
  order: number[];              // 섹션 순서
  requirements: string[];       // 필수 포함 요소
  bestPractices: string[];      // 모범 사례
}

interface ToolAccessPattern {
  commonTools: Tool[];          // 공통 도구 세트
  accessMethod: string;         // 도구 접근 방식
  limitations: string[];        // 사용 제한 사항
  securityConstraints: string[]; // 보안 제약 조건
}

interface AgentQualityAssurance {
  reviewProcess: string;        // 검토 프로세스
  outputStandards: OutputStandard[]; // 출력 기준
  validationMethods: string[]; // 검증 방법
  qualityMetrics: QualityMetric[]; // 품질 측정 지표
}
```

### 1.4 SkillSystemArchitecture (스킬 시스템 아키텍처)

스킬 정의 구조, 템플릿 시스템, 코드 생성 패턴 등 아키텍처 요소 정의

```typescript
interface SkillSystemArchitecture {
  version: string;              // 아키텍처 버전
  directoryStructure: DirectoryStructure; // 디렉토리 구조
  definitionFormat: SkillDefinitionFormat; // 정의 형식
  codeGenerationPattern: CodeGenerationPattern; // 코드 생성 패턴
  templateEngine: TemplateEngine; // 템플릿 엔진
  projectIntegration: SkillProjectIntegration; // 프로젝트 통합
}

interface DirectoryStructure {
  pattern: string;              // 디렉토리 패턴
  requiredFiles: string[];      // 필수 파일 목록
  namingConvention: NamingConvention; // 명명 규칙
}

interface CodeGenerationPattern {
  templateEngine: string;       // 템플릿 엔진
  variableSubstitution: string; // 변수 치환 방식
  outputFormatting: string;     // 출력 포맷팅
  validation: ValidationProcess; // 검증 프로세스
}

interface TemplateEngine {
  type: string;                 // 템플릿 엔진 타입
  syntax: string;               // 템플릿 문법
  variables: TemplateVariable[]; // 템플릿 변수
  functions: TemplateFunction[]; // 템플릿 함수
}
```

### 1.5 IntegrationSystem (통합 시스템)

에이전트와 스킬 간의 협업, 통합 메커니즘, 프로젝트 헌법 준수 방식 등 통합 요소 정의

```typescript
interface IntegrationSystem {
  version: string;              // 통합 시스템 버전
  collaborationModel: CollaborationModel; // 협업 모델
  communicationProtocols: CommunicationProtocol[]; // 통신 프로토콜
  workflowPatterns: WorkflowPattern[]; // 워크플로우 패턴
  constitutionIntegration: ConstitutionIntegration; // 헌법 통합
  qualityAssurance: IntegrationQualityAssurance; // 통합 품질 보장
}

interface CollaborationModel {
  agentSelection: AgentSelection; // 에이전트 선택
  skillExecution: SkillExecution; // 스킬 실행
  resultIntegration: ResultIntegration; // 결과 통합
  conflictResolution: ConflictResolution; // 충돌 해결
}

interface CommunicationProtocol {
  type: ProtocolType;           // 프로토콜 타입
  description: string;          // 프로토콜 설명
  format: string;               // 통신 형식
  validation: ValidationRule[]; // 검증 규칙
}

interface WorkflowPattern {
  id: string;                   // 워크플로우 ID
  name: string;                 // 워크플로우명
  description: string;          // 설명
  triggers: WorkflowTrigger[];  // 트리거 조건
  steps: WorkflowStep[];        // 실행 단계
  expectedOutcome: string;      // 예상 결과
}
```

## 2. 관계 정의

### 2.1 ExistingAgent 관계

```typescript
// ExistingAgent 1:N AgentCapability
interface AgentCapability {
  id: string;
  agentId: string;
  capabilityType: CapabilityType;
  description: string;
  examples: string[];
}

// ExistingAgent 1:N ReviewChecklistItem
interface ReviewChecklistItem {
  id: string;
  agentId: string;
  item: string;
  category: CheckCategory;
  priority: Priority;
  validationCriteria: string;
}
```

### 2.2 ExistingSkill 관계

```typescript
// ExistingSkill 1:N Artifact
interface ArtifactGeneration {
  id: string;
  skillId: string;
  artifactType: ArtifactType;
  generationLogic: string;
  dependencies: string[];
}

// ExistingSkill 1:N Template
interface SkillTemplate {
  id: string;
  skillId: string;
  templateName: string;
  content: string;
  variables: TemplateVariable[];
}
```

### 2.3 Integration 관계

```typescript
// WorkflowStep 1:N AgentStep / SkillStep
interface WorkflowStep {
  id: string;
  workflowId: string;
  stepType: StepType;
  agentId?: string;
  skillId?: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
}

// CollaborationScenario N:M Agent, N:M Skill
interface CollaborationScenario {
  id: string;
  name: string;
  description: string;
  involvedAgents: string[];
  involvedSkills: string[];
  executionOrder: ExecutionOrder[];
}
```

## 3. 상태 전이 정의

### 3.1 에이전트 활용 상태 전이

```
[AVAILABLE] --(execute)--> [EXECUTING]
[EXECUTING] --(complete)--> [COMPLETED]
[EXECUTING] --(error)--> [FAILED]
[FAILED] --(retry)--> [EXECUTING]
[COMPLETED] --(analyze)--> [ANALYZED]
```

### 3.2 스킬 실행 상태 전이

```
[READY] --(validate_input)--> [INPUT_VALIDATED]
[INPUT_VALIDATED] --(generate)--> [GENERATING]
[GENERATING] --(complete)--> [COMPLETED]
[GENERATING] --(error)--> [FAILED]
[FAILED] --(retry)--> [INPUT_VALIDATED]
[COMPLETED] --(integrate)--> [INTEGRATED]
```

### 3.3 워크플로우 상태 전이

```
[TRIGGERED] --(execute_step)--> [IN_PROGRESS]
[IN_PROGRESS] --(step_complete)--> [STEP_COMPLETE]
[STEP_COMPLETE] --(next_step)--> [IN_PROGRESS]
[IN_PROGRESS] --(all_complete)--> [COMPLETED]
[IN_PROGRESS] --(error)--> [FAILED]
[FAILED] --(retry_step)--> [IN_PROGRESS]
```

## 4. 검증 규칙

### 4.1 에이전트 검증 규칙

```typescript
interface AgentValidationRule {
  id: string;
  ruleType: ValidationType;
  description: string;
  pattern: string;
  errorMessage: string;
  severity: Severity;
}

// 예시 규칙들
const AGENT_VALIDATION_RULES: AgentValidationRule[] = [
  {
    id: 'agent-yaml-format',
    ruleType: ValidationType.FORMAT,
    description: '에이전트 YAML 프론트매터 형식 검증',
    pattern: '^---\\s*name:',
    errorMessage: '에이전트 정의는 YAML 프론트매터로 시작해야 합니다',
    severity: Severity.ERROR
  },
  {
    id: 'agent-system-prompt',
    ruleType: ValidationType.REQUIRED_FIELD,
    description: '시스템 프롬프트 필수 항목 검증',
    pattern: 'system_prompt:',
    errorMessage: '에이전트는 system_prompt 필드를 반드시 포함해야 합니다',
    severity: Severity.ERROR
  }
];
```

### 4.2 스킬 검증 규칙

```typescript
interface SkillValidationRule {
  id: string;
  ruleType: ValidationType;
  description: string;
  pattern: string;
  errorMessage: string;
  severity: Severity;
}

// 예시 규칙들
const SKILL_VALIDATION_RULES: SkillValidationRule[] = [
  {
    id: 'skill-directory-structure',
    ruleType: ValidationType.STRUCTURE,
    description: '스킬 디렉토리 구조 검증',
    pattern: '^.*\\/SKILL\\.md$',
    errorMessage: '스킬은 [skill-name]/SKILL.md 구조를 따라야 합니다',
    severity: Severity.ERROR
  },
  {
    id: 'skill-template-variables',
    ruleType: ValidationType.TEMPLATE,
    description: '템플릿 변수 형식 검증',
    pattern: '\\{\\{[a-zA-Z_][a-zA-Z0-9_]*\\}\\}',
    errorMessage: '템플릿 변수는 {{variable}} 형식을 따라야 합니다',
    severity: Severity.WARNING
  }
];
```

## 5. 제약 조건

### 5.1 데이터 무결성

- 모든 ID는 고유한 문자열이어야 함
- 관계 데이터는 참조 무결성을 보장해야 함
- 모든 시간 정보는 ISO 8601 형식을 따라야 함

### 5.2 형식 제약

- 에이전트 정의는 표준화된 형식(YAML 또는 Markdown)을 따라야 함
- 스킬 정의는 일관된 디렉토리 구조를 가져야 함
- 모든 문서는 프로젝트 헌법 원칙을 준수해야 함

### 5.3 품질 제약

- 기술 명세는 실제 기능과 100% 일치해야 함
- 문서는 신규 개발자가 2시간 내에 이해하고 사용할 수 있어야 함
- 개발자 가이드는 새로운 기능 개발 성공률 95% 이상 보장해야 함

## 6. 확장성 고려사항

### 6.1 새로운 에이전트 추가

- 새로운 전문 분야 정의 가능
- 기존 에이전트와의 충돌 방지
- 표준화된 정의 형식 준수
- 프로젝트 헌법 원칙 준수

### 6.2 새로운 스킬 추가

- 새로운 자동화 분야 정의 가능
- 기존 스킬과의 통합성 확보
- 표준화된 템플릿 구조 준수
- 코드 품질 기준 충족

### 6.3 아키텍처 확장

- 새로운 통합 패턴 정의 가능
- 기존 워크플로우와의 호환성 확보
- 확장성 있는 통신 프로토콜 지원
- 유연한 협업 모델 지원

이 데이터 모델은 기존에 구현된 AI 에이전트 및 스킬 시스템을 체계적으로 분석하고 문서화하기 위한 데이터 구조를 제공합니다. 역분석을 통해 얻은 핵심 개념과 관계를 정의하여, 새로운 기능 추가나 시스템 확장 시 일관된 구조를 유지할 수 있습니다.