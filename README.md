# RideOrNot (탈래말래) — 같은 방향 택시 나눠 타기 PWA

출발지와 도착지를 넣으면 같은 방향으로 가는 사람들과 팟을 만들어 택시비를 나눕니다. 택시는 각자 잡고 비용만 나누는 구조라 결제·정산 리스크를 앱 밖으로 뺐습니다.
2025년 사이드 프로젝트. 실사용자를 모으는 단계까지는 가지 않았고, 출시 전 자체 진단까지 마친 상태입니다.

## 만든 것

- 팟 생성·참여·실시간 목록 (Supabase Realtime 구독)
- 지도 검색과 경로 (Naver Maps, `/api/geocode` · `/api/directions` 서버 라우트로 키 은닉)
- Kakao 로그인, 성별 필터(온보딩에서 1회 확정, DB 트리거로 변경 차단)
- 웹 푸시 알림 (`/api/push`, 같은 팟 멤버에게만 발송하도록 서버 검증)
- 신고·칭찬, 관리자 페이지, 계정 삭제
- PWA (manifest, service worker), 인앱 브라우저 안내, 햅틱

## 설계에서 신경 쓴 것

| 문제 | 처리 |
|---|---|
| 동시에 여러 명이 마지막 자리에 참여 | `join_party` RPC에서 `FOR UPDATE` 잠금으로 직렬화 |
| 인원 수 불일치 | `party_members` 변경 시 트리거로 `current_member` 동기화, 정원 차면 상태 자동 전환 |
| 권한 | 전 테이블 RLS, 관리자 API는 `is_admin` 컬럼 + UUID·상태 검증 |
| 출시 전 위험 | `problem.md`에 Rate Limit 부재, 연결 풀 한계, Realtime 구독 폭발, 822줄 단일 컴포넌트 등 스스로 진단하고 `plan.md`에 P0~P3 우선순위로 정리 |

## 구조

```
app/                Next.js App Router
  api/              admin/action · delete-account · directions · geocode · praise · push
  admin/ ad/ privacy/ terms/
components/         create-pod-sheet · pod-list · pod-detail · map-selector · payment-modal ...
supabase/migrations 스키마 → RLS → 트리거 → RPC 순으로 17개
lib/                supabase · haptics
```

## 실행

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NAVER_* 키
npm run dev                  # http://localhost:3000
```

Supabase 프로젝트에 `supabase/migrations`를 순서대로 적용해야 합니다.
