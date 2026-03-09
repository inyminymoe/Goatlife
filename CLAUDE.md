# 갓생상사 개발 가이드

## 폴더 구조 규칙

### `src/components/` 구조

```
src/components/
├── features/          # 페이지별 기능 컴포넌트 (기본 위치)
│   ├── attendance/    # 근태 관련 컴포넌트 전체
│   ├── task-plan/     # 업무 계획 관련 컴포넌트
│   │   └── roadmap-card/  # RoadmapCard의 서브 컴포넌트
│   ├── home/          # 홈 페이지 위젯/섹션
│   ├── board/         # 게시판 관련
│   ├── board-post/    # 게시글 관련
│   ├── kanban/        # 칸반 보드
│   └── ...
├── ui/                # 재사용 가능한 순수 UI 컴포넌트 (Button, Modal, Select 등)
├── shared/            # 두 개 이상의 features에서 실제로 공유되는 컴포넌트
├── layout/            # 레이아웃 컴포넌트 (Header, Footer 등)
└── admin/             # 어드민 전용
```

### 규칙

1. **기본 위치는 `features/<기능명>/`**
   - 특정 페이지나 기능에 속하는 컴포넌트는 무조건 해당 features 폴더에 위치
   - 예: `AttendanceCard` → 홈 페이지에서도 쓰이지만 근태 기능이므로 `features/attendance/`

2. **서브 컴포넌트는 하위 폴더로 분리**
   - 카드 컴포넌트의 BottomSheet 내용, 세부 UI 등은 `<카드명>/` 하위 폴더로 분리
   - 예: `task-plan/roadmap-card/RoutineAddContent.tsx`

3. **`shared/`는 진짜 공유될 때만**
   - 두 개 이상의 features에서 실제로 import해야 `shared/`에 위치
   - 하나의 features에서만 쓰이면 해당 features 폴더 안으로 이동

4. **`components/home/`은 사용하지 않음 → `features/home/` 사용**
   - 홈 페이지 전용 컴포넌트는 `features/home/`에 위치

### 현재 attendance 구조 (정리 완료)
```
features/attendance/
├── AttendanceCard.tsx       # 근태 카드 (홈 + 근태 페이지 양쪽 사용)
├── AttendanceView.tsx       # 근태 카드 렌더 뷰 (AttendanceCard 전용)
├── AttendanceDashboardCard.tsx  # Dashboard 카드 (근태 페이지 전용)
└── AttendanceHeatmap.tsx    # 히트맵 (근태 페이지 전용)
```

---

## 다크모드 색상 규칙

### 색상 토큰 체계
`globals.css`에 세 가지 색상 계층이 있습니다.

| 계층 | 예시 | 동작 |
|------|------|------|
| **고정 (fixed)** | `bg-fixed-white`, `text-fixed-grey-900` | 라이트/다크 무관하게 항상 동일 |
| **반응형 (responsive)** | `bg-grey-200`, `text-grey-500` | 다크모드에서 자동 역전 |
| **시맨틱 (semantic)** | `bg-dark`, `text-dark`, `border-dark` | CSS 변수로 추상화, 자동 전환 |

### 반응형 grey 색상 다크모드 역전 원리

라이트모드의 낮은 번호(밝음) ↔ 다크모드의 높은 번호(밝음)

| 클래스 | 라이트 | 다크 | 용도 |
|--------|--------|------|------|
| `grey-100` | 거의 흰색 | 매우 어두운 회색 | 서브 배경 |
| `grey-200` | 연한 회색 | 어두운 회색 | 테두리, 구분선 |
| `grey-300` | 중간-밝은 회색 | 배경과 거의 동일 | **장식적/비중요 요소** |
| `grey-500` | 중간 회색 | 중간 회색 | **보조 텍스트** (양 모드 가시) |
| `grey-700` | 어두운 회색 | 밝은 회색 | 주요 보조 텍스트 |
| `grey-900` | 거의 검정 | 거의 흰색 | 주요 텍스트 |

### 텍스트 색상 선택 기준

- **읽지 않아도 되는 장식적 정보** (이전달 날짜, 스켈레톤 로더, 희미한 구분선): `text-grey-300` / `bg-grey-300`
  → 다크모드에서 배경에 묻혀 자연스럽게 후퇴함 (의도적)

- **읽을 수 있어야 하는 보조 텍스트** (레이블, 서브타이틀, "Today", "Timer" 등): `text-grey-500`
  → 다크모드에서도 중간 회색으로 가시성 확보

- **어댑티브 주요 텍스트**: `text-dark` (시맨틱 토큰 사용)

- **고정 색상이 필요한 경우** (말풍선 배경+삼각형 CSS 트릭, Toast 등): `text-fixed-grey-900` / `bg-fixed-white`

### 배경/테두리 기본 패턴

```tsx
// ✅ 올바른 패턴 — 어댑티브 서피스
<div className="bg-dark border border-dark text-dark">

// ✅ 고정 컬러가 필요한 특수 케이스
<div className="bg-fixed-white text-fixed-grey-900">

// ❌ 금지 — 라이트모드 전용이 됨
<div className="bg-white text-grey-900">
```

### 의도적으로 bg-white를 유지하는 케이스
- `Toast.tsx` — 항상 흰 배경 (디자인 의도)
- `ExecMessageView.tsx` — 말풍선 CSS 삼각형 트릭 (`before:border-r-white` 동반)
- `Badge.tsx` — `white` variant
- `RoadmapCard` 루틴 시작하기 버튼 — 원래 디자인 의도

---

## 아이콘 다크모드 처리

### icon-park:* (멀티컬러 아이콘)
`icon-park:*` 아이콘은 SVG에 fill 값이 하드코딩되어 있어 CSS `color`로 색상 제어 불가.

- **케밥 메뉴 등 단색(검정) 아이콘**: `icon-dark-invert` 클래스 추가
  ```tsx
  <Icon icon="icon-park:more-one" className="w-6 h-6 icon-dark-invert" />
  ```
  → `:root.dark`에서 `filter: invert(1)` 적용, 다크모드에서 흰색으로 반전

- **멀티컬러 장식 아이콘** (파랑+검정 등): 건드리지 않음. 다크모드 완벽 지원 어려움.

- **`icon-park-outline:*` / `icon-park-solid:*`**: `currentColor` 사용 → CSS `color`로 제어 가능.

### 적용 대상 (케밥 메뉴 아이콘 전체)
`icon-park:more-one`을 사용하는 모든 컴포넌트에 `icon-dark-invert` 추가:
- `TodoItem.tsx`
- `PomodoroTimerCard.tsx`
- `board-post/card/PostActionMenu.tsx`
- `RoadmapCard.tsx`

---

## Supabase 관련

### 서버 액션 패턴
```typescript
// app/_actions/*.ts 패턴
export async function getSomething(): Promise<{ ok: true; data: T[] } | { ok: false; error: string }> {
  const supabase = await getUserSupabaseClient();
  const { data, error } = await supabase.from('table').select('*');
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}
```

### routine_items 테이블 스키마
```sql
CREATE TABLE routine_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL,
  period        TEXT        NOT NULL CHECK (period IN ('AM', 'PM')),
  category      TEXT        NOT NULL CHECK (category IN ('work', 'break', 'leisure')),
  url           TEXT,
  pomodoro_count INTEGER    NOT NULL DEFAULT 1,
  order_index   INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE routine_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routine_items"
  ON routine_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 컴포넌트 컨벤션

### border 색상
- **기본**: `border-grey-200` (진한 `border-grey-300`은 사용 금지)
- **어댑티브 서피스**: `border-dark`

### disabled 상태
- 색상 클래스 대신 `disabled:opacity-40` 사용 → 다크/라이트 모드 모두 자연스럽게 dim

### 낙관적 업데이트 (Optimistic Update) 패턴
```tsx
const handleAction = async () => {
  const prev = state;
  setState(optimistic); // 즉시 반영
  const result = await serverAction();
  if (!result.ok) {
    setState(prev); // 롤백
    toast.error('오류 메시지');
  }
};
```
