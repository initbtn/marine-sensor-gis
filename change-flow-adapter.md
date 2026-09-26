# Change-Flow Project Adapter: `marine-sensor-gis`

이 문서는 `marine-sensor-gis` 저장소 고유의 실행 파라미터와 진입점을 정의하는 프로젝트 어댑터 정본(SSOT)입니다.

---

## 1. 기본 저장소 메타데이터

| 항목 | 값 | 설명 |
|---|---|---|
| **Repository** | `initbtn/marine-sensor-gis` | GitHub 원격 저장소 |
| **Base Branch** | `main` | 기본 프로덕션 브랜치 |
| **Workspace Mode** | Single Repo (`/home/dominic/projects/marine-sensor-gis`) | 로컬 작업 공간 |
| **Runtime & Node** | Node.js `v18.19.1` / npm `9.2.0` | 런타임 호환 환경 |
| **Tech Stack** | React 18, Vite, TypeScript, Leaflet GIS, Apache ECharts, Vitest | 프론트엔드 및 시각화 스택 |

---

## 2. 검증 및 빌드 커맨드 (Verification)

```bash
# 1. 단위 테스트 (Vitest TDD)
npm run test

# 2. 타입 검사
npm run type-check

# 3. 프로덕션 빌드
npm run build
```

---

## 3. 브랜치 및 변경 흐름 규약

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

---

## 4. 거버넌스 및 시크릿

- **시크릿 출처**: `pass show github.com/initbtn` (on-demand 주입)
- **외부 공개 금지**: 개인 식별 키, 비공개 토큰 코드 하드코딩 금지
- **TDD Iron Law**: production 코드 작성 전 실패하는 테스트(RED) 선행 작성
