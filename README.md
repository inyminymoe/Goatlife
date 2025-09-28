# 갓생상사 (Goatlife Inc.)
> 나의 값진 시간을 팝니다. 갓생상사.

## 🏢 서비스 소개
갓생상사는 **의지박약형 인간을 위한 루틴 강제 커뮤니티**입니다. 
혼자서는 작심삼일로 끝나는 사람들도 '회사 출근' 컨셉으로 지속 가능하게 목표를 달성할 수 있도록 도와줍니다.

### 핵심 컨셉
- **자율 입사 방식**: 누구나 지원서 없이 입사 가능
- **온라인 독서실 + 스터디 + 정보공유** 통합 플랫폼
- **9-6 또는 3교대** 일정으로 체계적인 루틴 관리
- **업무 보고 & 승진 시스템**을 통한 게임화
- **디스코드 기반** 실시간 캠스터디

### 차별화 포인트
1. **회사 컨셉**: 단순 To-Do가 아닌 '출근'이라는 책임감 부여
2. **커뮤니티**: 같은 목적을 가진 사람들과 함께
3. **게임화**: 직급 시스템과 승진을 통한 동기부여
4. **통합 관리**: 일-식사-운동 루틴을 한 번에

## 🎯 주요 기능

### 출퇴근 시스템
- 정시 출근/퇴근 체크 (버튼 클릭 또는 명령어)
- 3교대 근무 시간 선택 (야간반/주간반/오후반)
- 점심시간 및 휴게시간 관리

### 승진 시스템
- 인턴 → 사원 → 대리 → 과장 → 부장
- 근속일, 업무보고, 기여도 기반 자동 승진
- 직급별 전용 채널 및 권한 부여

### 업무 보고
- 매일 오전 업무계획 + 퇴근 전 결과 보고
- 출근율 및 목표 달성률 추적
- 주간/월간 랭킹 시스템

### 커뮤니티 공간
- 부서별 전문 채널
- 챌린지 및 미션 참여
- 성과 인증 및 정보 공유

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.13
- **State Management**: Redux Toolkit 2.9.0 + React Redux 9.2.0
- **Database**: Supabase 2.58.0
- **Animation**: Framer Motion 12.23.22
- **Icons**: Iconify React 6.0.2

### Development
- **Package Manager**: npm
- **Node Version**: 20+
- **Linting**: ESLint 9 + Next.js config
- **CSS Processing**: PostCSS + Autoprefixer
- 
### Backend & Database
- **Database**: Supabase (PostgreSQL-based)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage (이미지/파일)
  
## 🚀 로컬 개발

# 저장소 클론
git clone https://github.com/inyminymoe/Goatlife.git
cd goatlife

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

## 📁 프로젝트 구조

현재 **Component-by-Type** 구조를 사용하고 있습니다. Next.js의 표준 관례를 따르며, 작은-중간 규모 프로젝트에 적합합니다.

### 폴더 구조 원칙

- **app/**: Next.js App Router를 활용한 파일 기반 라우팅
- **components/**: 기능별로 분류된 재사용 가능한 컴포넌트
- **lib/**: 비즈니스 로직, 유틸리티, 설정 파일
- **public/**: 정적 파일 (이미지, 아이콘 등)

### 컴포넌트 네이밍 규칙

- **PascalCase**: 컴포넌트 파일명 (`Header.tsx`)
- **camelCase**: 함수, 변수명 (`isLoggedIn`)
- **kebab-case**: 파일/폴더명 (assets의 경우)

> 프로젝트 규모가 커지면 Feature-Sliced Design 등의 구조로 리팩토링을 고려할 예정입니다.

#

## README.md (English)
```markdown
# Goatlife Inc.

> We sell our precious time. Goatlife Inc.

## 🏢 Service Overview

Goatlife Inc. is a **routine enforcement community for willpower-challenged individuals**. 
It helps people who usually give up after three days achieve their goals sustainably through a 'corporate work' concept.

### Core Concept
- **Open Recruitment**: Anyone can join without application
- **Integrated Platform**: Online study room + community + information sharing
- **Structured Schedule**: 9-6 or 3-shift system for systematic routine management
- **Gamified System**: Work reporting & promotion system
- **Discord-based** real-time community

### Key Differentiators
1. **Corporate Concept**: Responsibility through 'going to work', not just to-do lists
2. **Community**: Together with people sharing the same goals
3. **Gamification**: Motivation through rank system and promotions
4. **Integrated Management**: Work-meal-exercise routines in one place

## 🎯 Main Features

### Check-in/Check-out System
- Punctual work attendance tracking (button click or commands)
- 3-shift options (night/day/afternoon shift)
- Lunch break and rest time management

### Promotion System
- Intern → Employee → Assistant Manager → Manager → Director → Executive
- Auto-promotion based on attendance, reports, and contributions
- Rank-specific channels and privileges

### Work Reporting
- Daily morning plans + evening results reporting
- Attendance rate and goal achievement tracking
- Weekly/monthly ranking system

### Community Spaces
- Department-specific professional channels
- Challenge and mission participation
- Achievement verification and information sharing

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Discord Bot API (planned)
- **Database**: PostgreSQL (planned)
- **Deployment**: Vercel (planned)

## 🚀 Local Development
```bash
# Clone repository
git clone https://github.com/inyminymoe/Goatlife.git
cd goatlife

# Install dependencies
npm install

# Run development server
npm run dev
