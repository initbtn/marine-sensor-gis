# Change-Flow Project Adapter: `marine-sensor-gis`

이 문서는 `marine-sensor-gis` 저장소 고유의 실행 파라미터, 2-Tier 테스트 전략, 검증 진입점을 정의하는 프로젝트 어댑터 정본(SSOT)입니다.

---

## 1. 기본 저장소 메타데이터

| 항목 | 값 | 설명 |
|---|---|---|
| **Repository** | `initbtn/marine-sensor-gis` | GitHub 원격 저장소 |
| **Base Branch** | `main` | 기본 프로덕션 브랜치 |
| **Workspace Mode** | Single Repo (`/home/dominic/projects/marine-sensor-gis`) | 로컬 작업 공간 |
| **Runtime & Node** | Node.js `v18.19.1` / npm `9.2.0` | 런타임 호환 환경 |
| **Tech Stack** | React 18, Vite, TypeScript, Leaflet GIS, Apache ECharts, Vitest, Playwright | 프론트엔드, 시각화 및 테스트 스택 |

---

## 2. 2-Tier 테스트 전략 (Test Architecture)

우리 프로젝트는 변경 속도와 신뢰성을 동시에 확보하기 위해 테스트를 **2개의 계층(Tier)**으로 엄격히 분리하여 운영합니다:

```
[Tier 1: Client TDD Unit Tests] ──► 일상 개발 루프 (0ms, Vitest, 완전 격리 목데이터)
[Tier 2: Post-Deploy / Debug E2E] ──► 배포 직후 & 디버깅 (Playwright, 인증/결제 수동 처리)
```

| 구분 | 도구 / 커맨드 | 격리 및 의존성 원칙 | 실행 시점 |
|---|---|---|---|
| **Tier 1<br>(Client TDD)** | **Vitest**<br>`npm run test`<br>`npm run test:watch` | • **외부 의존성 100% Mocking**: 공공데이터(PORT-MIS), Supabase DB, GCP 선박 엣지 VM, 위성 AIS를 로컬 모의 객체 및 픽스처로 격리<br>• 0ms 수준의 초고속 피드백 루프로 TDD(Red-Green-Refactor) 주도 | 코드 작성 및 로컬 커밋 전 상시 실행 |
| **Tier 2<br>(E2E & Debug)** | **Playwright**<br>`npm run test:e2e`<br>`npm run test:e2e:ui` | • **배포 직후 검증 및 라이브 디버그**: 실제 브라우저 환경에서 HMI 대시보드 렌더링, 콘솔 에러, 레이아웃 스모크 테스트<br>• **인증/결제 수동 우회**: 외부 PG사 결제나 SSO 인증은 세션 쿠키(`marine_session_token`) 및 스토리지(`marine_license_tier`) 사전 주입으로 처리 | `change-flow` 배포(⑩) 직후 또는 크리티컬 디버깅 시 |

---

## 3. 검증 및 빌드 커맨드 (Verification)

```bash
# 1. Tier 1: 단위 및 통합 TDD 테스트 (Vitest Mock-based)
npm run test

# 2. 정적 타입 검사
npm run type-check

# 3. Tier 2: 배포 직후 및 디버그용 E2E 테스트 (Playwright)
npm run test:e2e

# 4. 프로덕션 번들 빌드
npm run build
```

---

## 4. 브랜치 및 변경 흐름 규약

1. **브랜치 네이밍**:
   - 기능 개발: `feat/<feature-slug>`
   - 버그 수정: `fix/<issue-slug>`
   - 환경/문서: `chore/<slug>`
2. **커밋 메시지**:
   - Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
   - 반드시 서명된 GPG 커밋 유지 (시크릿 캐시 WARM 확인 필수)
3. **PR 및 리뷰 게이트**:
   - `publish-pr` 스킬을 사용하여 PR 생성 (`closes #<issue>`)
   - `review-army`의 `reviewer` 서브에이전트 1개 소환 검증
   - 머지는 반드시 사용자의 명시적 승인 후 Squash Merge 집행
4. **TDD Iron Law**:
   - production 코드 작성 전 실패하는 단위 테스트(Tier 1 RED) 선행 작성 필수
   - 배포 후 검증이 필요한 핵심 사용자 여정은 Tier 2 Playwright E2E에 추가 유지보수

---

## 5. 거버넌스, 시크릿 및 모니터링 알림 도구

- **시크릿 출처**: `pass show github.com/initbtn` (on-demand 주입)
- **외부 공개 금지**: 개인 식별 키, 비공개 토큰 코드 하드코딩 금지
- **Zero Decorative Animation Rule**: ISA-101 / IEC 62288에 따라 깜빡임은 미확인 크리티컬 알람에만 한정

| 파라미터 | 값 |
|---|---|
| **프로젝트(◦)** | **2** (owner: `initbtn`, URL: https://github.com/users/initbtn/projects/2) |
| **알림 채널** | 텔레그램 봇 알림 (토큰: `pass show telegram/bot-token` / chat_id: `pass show telegram/chat-id` / 프로젝트 헤더: `[marine-sensor-gis]`) |

### 모니터링 & try-catch 예외 알림 도구 (Alerting Tools)

멀티 프로젝트 공용 텔레그램 봇 환경에서 타 프로젝트(`busan-youth-day` 등)와의 채널 혼선을 방지하고 장애를 신속히 전파하기 위해, 아래 2가지 엔트리포인트를 툴로 사용합니다:

1. **CLI / 배치 / 스크립트 모니터링 툴**:
   - 엔트리포인트: [`scripts/notify-telegram.sh`](file:///home/dominic/projects/marine-sensor-gis/scripts/notify-telegram.sh)
   - 문법: `./scripts/notify-telegram.sh <LEVEL: INFO|WARNING|CRITICAL> <AREA> <MESSAGE> [DETAILS]`
   - 예시 (CI/CD 배포 실패, 스크립트 try-catch 알림):
     ```bash
     ./scripts/notify-telegram.sh CRITICAL "Deployment" "Vercel production deploy failed" "error log SHA: abc1234"
     ```

2. **애플리케이션 런타임 서비스 (TypeScript try-catch)**:
   - 엔트리포인트: [`src/services/telegramAlertService.ts`](file:///home/dominic/projects/marine-sensor-gis/src/services/telegramAlertService.ts)
   - 모니터링 및 센서 스트림 예외 처리 블록에서 호출:
     ```typescript
     try {
       await connectGcpEdgeSocket();
     } catch (err) {
       await sendTelegramAlert({
         level: 'CRITICAL',
         area: 'GCP-Edge-Stream',
         message: 'GCP 10Hz 텔레메트리 스트림 연결 두절',
         details: err instanceof Error ? err.message : String(err),
       });
     }
     ```

---

## 6. 구현 규율 및 프론트엔드 SOLID 헌장

우리 프로젝트의 모든 UI/프론트엔드 컴포넌트는 리액트 기본 철학($UI = f(State)$, One-Way Data Flow, Idempotence, Composition over Inheritance)과 객체지향 SOLID 5원칙을 준수해야 합니다.

| 키 | 값 |
|---|---|
| **프론트엔드 구조(②)** | 컴포넌트는 $UI = f(State)$ 순수 함수로 쓰고, 데이터 fetch·스트림·타이머 같은 부수효과는 Custom Hook 으로 뺀다(SRP). 새 변종은 기존 `if-else`·`switch` 를 고치지 않고 공통 인터페이스를 따르는 레지스트리에 등록한다(OCP). 같은 인터페이스를 따르는 컴포넌트는 서로 바꿔 끼울 수 있다(LSP). 컴포넌트에는 쓰는 props 만 좁게 넘기고 상태 객체째 넘기지 않는다(ISP). UI 는 I/O 클라이언트를 직접 만들거나 import 하지 않고 Props·Context·Hook 으로 받는다(DIP) |
| **스타일(②)** | 인라인 `style={{ }}` 0개. 3-Layer: `@layer base`(테마 토큰·CSS 변수) · `@layer components`(재사용 클래스) · `@layer utilities`(반응형 그리드·터치 타깃 44px 이상). 색·간격 값은 토큰으로만 쓴다 |
| **하드코딩·상수(②)** | 매직 넘버·색·URL·키·문구를 코드에 흩뿌려 박지 않는다. 같은 값이 둘 이상의 자리에 쓰이면 한 곳(상수·토큰·설정)에서 정의해 참조한다. 환경마다 다른 값은 설정·env 로 받고 시크릿은 코드에 두지 않는다 |

위 세 행은 domstack 의 React 어댑터 행 조각 그대로다 — 문안은 그쪽이 정본이라 여기서 고치지 않는다. 아래 6.1·6.2 는 이 프로젝트에만 해당하는 적용이다.

### 6.1 이 프로젝트의 SOLID 적용
- 데이터 fetch, 10Hz 웹소켓 스트림, 5초 타이머 폴링, Store-and-Forward 동기화, 알람 발송 등 모든 비즈니스 로직과 부수 효과는 Custom Hook(`useSensorDashboard` 등)으로 100% 분리한다.
- 순수 UI 컴포넌트는 `React.memo` 로 감싼다.
- 새로운 역할(Role)이나 시각화 위젯 추가 시 기존 렌더링 블록 내 `if-else` 또는 거대 `switch`문을 수정하지 않고, 공통 인터페이스(`BaseChartProps`)를 따르는 위젯 레지스트리(`ROLE_WIDGET_COMPONENTS`)에 새 컴포넌트를 등록하여 확장한다.
- UI 뷰 컴포넌트가 구체적인 I/O 클라이언트(FastAPI 엣지 클라이언트, Supabase 클라이언트 등)를 직접 임포트하여 인스턴스화하지 않고, Hook 또는 Props를 통해 전달받는다.

### 6.2 이 프로젝트의 CSS 적용
- `@layer base`: 테마 컬러 토큰 및 CSS 변수(`--marine-*`) 선언.
- `@layer components`: 해양 도메인 전용 위젯 및 카드 클래스(`.marine-card`, `.marine-header`, `.marine-badge` 등) 캡슐화.
- `@layer utilities`: Tailwind 반응형 그리드 및 최소 터치 타깃($\ge 44\text{px}$) 유틸리티 제어.
- **모바일/반응형 뷰포트**: 모바일 단일 컬럼 스택(`< 768px`) 및 데스크톱 12컬럼 그리드(`>= 1024px`)를 지원하며, 터치 가능한 모든 인터랙티브 요소는 $44\text{px} \times 44\text{px}$ 이상의 터치 영역을 확보한다.

### 6.3 모던 리액트 라이프사이클 및 상태관리(Zustand) 규약
1. **파생 상태(Derived State) 인라인 계산**:
   - `useEffect`로 상태를 복제하거나 다시 `setState`하는 안티패턴을 금지하고, 렌더 단계에서 인라인 계산($UI = f(State)$) 또는 `useMemo`로 처리한다.
2. **사용자 의도(Action)는 이벤트 핸들러에서 집행**:
   - 클릭, 토글 등 사용자 동작으로 발생하는 부수효과는 상태 플래그를 통한 `useEffect` 감지가 아닌, 이벤트 핸들러 콜백 함수에서 직접 호출한다.
3. **I/O 연결 수명주기와 컴포넌트 수명주기의 분리 (Store-driven Lifecycle)**:
   - 10Hz GCP 센서 웹소켓이나 Supabase Realtime 채널 등 장기 수명 연결은 UI 컴포넌트 마운트/언마운트에 의존하지 않고, Zustand 스토어 및 전담 서비스 계층이 수명주기를 소유한다.
   - UI 컴포넌트는 단지 스토어의 상태를 Selector 기반으로 구독(`useTelemetryStore`)하여 불필요한 재연결 및 리렌더링 폭풍을 방지한다.
4. **과도(Transient) 업데이트 활용**:
   - ECharts 옵션 갱신 및 Leaflet GIS 지도 마커 이동 등 고속 시각화 갱신은 리액트 가상 DOM을 거치지 않는 Zustand의 바닐라 구독(`store.subscribe`)을 우선 활용한다.
5. **대칭적 클린업과 멱등성**:
   - 모든 Effect는 React 18 StrictMode의 이중 마운트 시에도 리소스 누수가 없도록 완벽한 대칭적 Cleanup 함수를 반환해야 한다.



