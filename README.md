# RideOrNot Project

## 프로젝트 개요

`RideOrNot`은 **Next.js (React) 기반의 현대적인 웹 애플리케이션**으로, **Supabase**를 백엔드 서비스로 활용하여 사용자들에게 **위치 기반의 차량 공유 또는 택시 공유 서비스**를 제공하는 플랫폼으로 추정됩니다. `app` 디렉토리 구조를 통해 Next.js App Router를 사용하고 있음을 알 수 있습니다.

## 주요 기술 스택

*   **프론트엔드 프레임워크:** Next.js (React) - 서버 사이드 렌더링(SSR) 및 정적 사이트 생성(SSG) 기능을 활용합니다.
*   **백엔드/데이터베이스:** Supabase (PostgreSQL) - 사용자 인증, 데이터베이스 관리, 실시간 기능 등을 제공하는 BaaS(Backend as a Service)입니다.
*   **스타일링:** Tailwind CSS - 유틸리티-퍼스트(utility-first) CSS 프레임워크를 사용하여 빠르고 일관된 UI를 구축합니다.
*   **언어:** TypeScript - 프로젝트 전반에 걸쳐 타입스크립트를 사용하여 코드의 안정성과 유지보수성을 높입니다.

## 주요 기능 (추정)

프로젝트의 파일 구조 및 명명 규칙을 분석한 결과, 다음과 같은 핵심 기능들을 포함할 것으로 예상됩니다.

### 1. 지도 및 위치 기반 서비스
*   **API 엔드포인트 (`app/api/directions`, `app/api/geocode`):** 경로 안내 및 지리적 위치 변환(Geocoding) 기능을 제공하여 사용자의 이동 경로를 계획하고 위치 정보를 처리합니다.
*   **지도 관련 컴포넌트 (`components/map-search-modal.tsx`, `components/map-selector.tsx`):** 사용자가 지도 위에서 출발지와 목적지를 검색하고 선택할 수 있는 직관적인 UI를 제공합니다.

### 2. 차량/택시 공유 관리 ("Pods" 개념)
*   **공유 생성 및 관리 (`components/create-pod-sheet.tsx`, `components/pod-detail.tsx`, `components/pod-list.tsx`):** "Pod"는 차량 공유의 단위를 의미하는 것으로 보이며, 사용자가 새로운 공유 요청을 생성하거나, 기존 공유의 상세 정보를 확인하고, 활성화된 공유 목록을 조회할 수 있습니다.
*   **실시간 공유 현황 (`components/live-pods-scroll.tsx`):** 현재 진행 중인 또는 예정된 차량 공유 목록을 실시간으로 스크롤하여 볼 수 있는 기능을 제공합니다.

### 3. 결제 및 사용자 계정 관리
*   **결제 모달 (`components/payment-modal.tsx`):** 차량 공유 서비스 이용에 필요한 결제 과정을 처리하는 UI를 제공합니다.
*   **데이터베이스 마이그레이션 (`supabase/migrations/20260311222700_add_bank_account.sql`):** 사용자 계정에 은행 계좌 정보를 추가하여 결제 및 정산 기능을 지원하는 백엔드 스키마가 포함되어 있습니다.
*   **사용자 동기화 트리거 (`supabase/migrations/20260310212000_sync_users_trigger.sql`):** 사용자 인증 및 정보 동기화와 관련된 백엔드 로직이 구현될 수 있습니다.

### 4. 사용자 인터페이스 (UI) 및 경험
*   **Shadcn/ui 또는 유사한 UI 라이브러리 (`components/ui` 디렉토리 내 다양한 컴포넌트):** `accordion`, `button`, `card`, `dialog`, `input`, `select` 등 다수의 UI 컴포넌트들이 포함되어 있어, 일관되고 반응성 좋은 사용자 인터페이스를 빠르게 구축하는 데 사용되었음을 알 수 있습니다.
*   **Haptics (`lib/haptics.ts`):** 모바일 환경에서 진동 피드백과 같은 촉각 경험을 통해 사용자 상호작용을 더욱 풍부하게 만듭니다.

## 결론

`RideOrNot` 프로젝트는 사용자들이 편리하게 차량 공유 또는 택시 공유 서비스를 이용하고, 결제 및 계정을 관리하며, 지도 기반의 경로 안내를 받을 수 있도록 설계된 종합적인 웹 애플리케이션입니다. Next.js의 강력한 기능과 Supabase의 유연한 백엔드를 활용하여 빠르고 안정적인 서비스를 목표로 하는 것으로 보입니다.
