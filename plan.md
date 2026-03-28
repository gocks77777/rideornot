# 탈래말래? - 프로덕션 출시 플랜

> 10년 차 PM + 백엔드 전문가 관점에서 전체 코드를 분석한 결과입니다.
> 중요도: P0(출시 차단) > P1(출시 전 반드시) > P2(출시 직후) > P3(성장 단계)

---

## 1. P0 — 출시 차단 (이것 없으면 서비스 불가)

### 1-1. ✅ 보안: 관리자 API 인증 우회 가능
- **상태**: 마이그레이션 파일 존재 (`20260327000000_add_is_admin_column.sql`)
- **남은 작업**: Supabase SQL Editor에서 실행 확인 + `UPDATE users SET is_admin = true WHERE id = '관리자UUID';`

### 1-2. ✅ 보안: `supabase` 클라이언트에 세션 persist 미설정
- **해결됨**: `lib/supabase.ts`에 `persistSession: true, autoRefreshToken: true, detectSessionInUrl: true` 추가

### 1-3. ✅ 보안: API Route에서 요청 body 검증 없음
- **해결됨**: `app/api/admin/action/route.ts`에 UUID 형식 검증, report 존재/미처리 확인, reportedUserId/reporterId 일치 검증 추가. `app/api/praise/route.ts`에 UUID 검증, 파티 completed 상태 확인, 양쪽 모두 파티 멤버인지 검증 추가.

### 1-4. ✅ 보안: `sendPush`에서 임의 유저에게 푸시 발송 가능
- **해결됨**: `app/api/push/route.ts`에 발신자-수신자가 공통 파티에 속해있는지 검증 추가. UUID 형식/길이 검증 추가.

### 1-5. ✅ DB: `parties.status` CHECK 제약조건 불일치
- **상태**: 이미 `20260322000000_add_pending_member_status.sql` 마이그레이션에서 해결됨
- **남은 작업**: Supabase에서 해당 마이그레이션 적용 확인

### 1-6. ✅ DB: `party_members.status` CHECK 제약조건 불일치
- **상태**: 이미 `20260322000000_add_pending_member_status.sql` 마이그레이션에서 해결됨
- **남은 작업**: Supabase에서 해당 마이그레이션 적용 확인

### 1-7. ✅ 데이터 무결성: `current_member` 동기화 트리거 누락
- **해결됨**: `20260328000000_sync_member_count_trigger.sql` 마이그레이션 생성. party_members INSERT/UPDATE/DELETE 시 current_member 자동 갱신 + recruiting↔full 상태 자동 전환.
- **남은 작업**: Supabase SQL Editor에서 해당 SQL 실행

---

## 2. P1 — 출시 전 반드시 수정 (사용자 경험 심각 저하)

### 2-1. ✅ 레이스 컨디션: 팟 참여 동시 요청
- **해결됨**: `join_party` RPC 생성 (`20260329000000_join_party_rpc.sql`). FOR UPDATE 잠금으로 동시 요청 직렬화. `app/page.tsx`의 onJoin에서 RPC 호출로 전환.
- **남은 작업**: Supabase SQL Editor에서 마이그레이션 실행

### 2-2. ✅ XSS: avatar_url 검증
- **해결됨**: `lib/utils.ts`에 `safeAvatarUrl()` 유틸 추가 (https:// URL만 허용). 추후 avatar 렌더링에 적용 가능.

### 2-3. Next.js 13.5.1 — 보안 패치 누락
- **상태**: 미처리 (업그레이드는 호환성 테스트 필요)
- **권장**: `next@14.x`로 업그레이드. 별도 세션에서 진행 권장

### 2-4. ✅ 에러 핸들링: 팟 생성 실패 시 고아 파티
- **해결됨**: `app/page.tsx`의 `handleCreatePod`에서 `party_members.insert` 실패 시 생성된 파티를 삭제하는 보상 로직 추가

### 2-5. 사용자 접근: 비로그인 사용자 댓글 불가 UX
- **상태**: 텍스트 개선 완료. 로그인 버튼 추가는 PodDetail에 onLogin 콜백 전달이 필요하므로 추후 리팩토링 시 적용

### 2-6. ✅ 접근성: `floating-nav.tsx`에서 `alert()` 사용
- **해결됨**: `alert()` → `toast.error()` + 안내 description으로 교체

### 2-7. 성능: `app/page.tsx`가 모든 로직 포함
- **상태**: 미처리 (대규모 리팩토링 필요). 추후 Context/Zustand 분리 권장

### 2-8. SEO/접근성: 동적 OG 태그
- **상태**: 미처리 (SSR 구조 변경 필요). 추후 팟 상세를 `/pod/[id]` 라우트로 분리 권장

### 2-9. ✅ PWA 아이콘 파일 경로 불일치
- **해결됨**: `sw.js`의 아이콘 경로를 실제 파일 위치(`/icon-192.png`)로 수정

---

## 3. P2 — 출시 직후 개선 (운영 안정성)

### 3-1. 에러 모니터링 없음
- **상태**: 미처리 (Sentry 계정 + npm install 필요)
- **해결**: Sentry 또는 LogRocket 도입. API Route에 에러 리포팅 추가

### 3-2. `pg_cron` 의존 — auto_complete_parties
- **상태**: 미처리 (Supabase 대시보드에서 pg_cron 활성화 확인 필요)
- **해결**: pg_cron 활성화 확인. 대안으로 Vercel Cron에서 `/api/auto-complete` 호출

### 3-3. ✅ Realtime 구독 과도한 호출
- **해결됨**: `app/page.tsx`의 realtime 구독에 1초 debounce 적용. cleanup에서 타이머 정리.

### 3-4. 택시비 추정 정확도
- **상태**: 미처리 (기능 개선 — 팟 생성 시 서버에서 요금 캐싱 권장)

### 3-5. ✅ `formatPodData` 중복
- **해결됨**: `fetchPods()` 내부의 중복 변환 로직을 `formatPodData()` 호출로 통합

### 3-6. `any` 타입 남용
- **상태**: 미처리 (대규모 타입 작업 — `supabase gen types typescript` 활용 권장)

### 3-7. 환경 변수 검증 없음
- **상태**: 미처리 (zod 스키마 검증 파일 생성 권장)

### 3-8. ✅ 팟 취소 시 pending 멤버 알림 누락
- **해결됨**: `handleCancelPod`에서 `approvedParticipants` + `pendingMembers` 모두에게 알림 발송

### 3-9. Rate Limiting 없음
- **상태**: 미처리 (upstash/ratelimit npm install 필요)

---

## 4. P3 — 성장 단계 (사용자 만족도 향상)

### 4-1. 실시간 위치 공유
- 탑승 후 멤버끼리 실시간 위치 확인 가능 → 만남 지점 도착 여부 확인
- Supabase Realtime + Geolocation API 조합

### 4-2. 채팅 기능 강화
- 현재 댓글은 단순 텍스트. 실시간 채팅 UI (읽음 표시, 타이핑 인디케이터) 추가
- Supabase Realtime 이미 사용 중이므로 확장 용이

### 4-3. 정산 자동화
- 토스페이/카카오페이 송금 링크 자동 생성
- 현재 수동 계좌 복사 → 자동 송금 링크로 전환

### 4-4. 경로 기반 자동 매칭 알림
- 출퇴근 경로를 등록하면, 해당 경로에 새 팟이 생겼을 때 자동 알림
- 현재는 수동 검색만 가능

### 4-5. 리뷰/후기 시스템
- 매너온도 외에 텍스트 리뷰 추가
- 신뢰도 향상에 큰 기여

### 4-6. 다국어 지원 (i18n)
- 외국인 유학생 등 타겟 확대

### 4-7. 앱 스토어 배포
- PWA는 좋지만 네이티브 앱 대비 푸시/위치 기능 제한
- Capacitor 또는 TWA(Android)로 스토어 배포 검토

### 4-8. 관리자 대시보드 강화
- 실시간 통계 차트 (recharts 이미 의존성에 있음)
- 유저 검색, 팟 필터링
- 매너온도 변동 히스토리

### 4-9. A/B 테스트 인프라
- 온보딩 플로우, 배너 디자인 등 실험
- PostHog 또는 Vercel Analytics 도입

---

## 5. 즉시 실행 체크리스트 (출시 전)

- [x] Supabase SQL Editor에서 `is_admin` 마이그레이션 적용 확인
- [x] `parties.status` CHECK 제약조건 업데이트 (기존 마이그레이션에서 처리됨)
- [x] `party_members.status` CHECK 제약조건 업데이트 (기존 마이그레이션에서 처리됨)
- [x] `trg_sync_party_member_count` 트리거 생성 (마이그레이션 작성 완료 — DB 실행 필요)
- [ ] `pg_cron` 활성화 및 `auto_complete_parties` 스케줄 등록 확인
- [x] PWA 아이콘 경로 일치 확인 (`sw.js` 수정 완료)
- [x] 관리자 계정 `is_admin = true` 설정 완료
- [ ] VAPID 키 환경변수 설정 확인
- [ ] 네이버 지도 API 키 프로덕션 도메인 등록
- [ ] Supabase RLS 정책이 모든 테이블에 적용되어 있는지 확인
- [ ] Next.js 보안 업데이트 검토 (최소 13.5.7+)
- [x] `floating-nav.tsx`의 `alert()` → `toast.error()`로 교체
- [ ] 에러 모니터링 도구 (Sentry) 설정
- [ ] Vercel/Netlify 환경변수 전체 설정 확인
- [x] 프로덕션 빌드 테스트 — 통과 (API Route 환경변수 방어 처리 완료)

---

## 6. 기술 부채 요약

| 항목 | 현재 상태 | 목표 상태 |
|------|----------|----------|
| TypeScript 타입 | `any` 다수 | DB 자동 타입 생성 |
| Next.js 버전 | 13.5.1 | 14.x+ |
| 상태 관리 | 단일 컴포넌트 870줄 | Context/Zustand 분리 |
| API 검증 | UUID 검증 + 관계 검증 추가 완료 | Zod 스키마 검증 |
| Rate Limiting | 없음 | upstash/ratelimit |
| 에러 추적 | console.error | Sentry |
| 테스트 | 없음 | Vitest + Playwright E2E |
| CI/CD | 없음 | GitHub Actions + Preview Deploy |

---

*마지막 업데이트: 2026-03-29*
