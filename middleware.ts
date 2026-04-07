import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- In-memory Rate Limiter (Token Bucket) ---
// Netlify Edge / Vercel Edge에서 동작. 인스턴스 간 공유는 안 되지만
// 단일 인스턴스 내에서 악의적 요청을 효과적으로 차단함.

interface BucketEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, BucketEntry>();

// 오래된 버킷 정리 (메모리 누수 방지)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1분마다 정리
const BUCKET_TTL = 120_000; // 2분 미사용 시 삭제

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  buckets.forEach((entry, key) => {
    if (now - entry.lastRefill > BUCKET_TTL) {
      buckets.delete(key);
    }
  });
}

function isRateLimited(key: string, maxTokens: number, refillRate: number): boolean {
  cleanup();

  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry) {
    buckets.set(key, { tokens: maxTokens - 1, lastRefill: now });
    return false;
  }

  // 경과 시간에 비례하여 토큰 보충
  const elapsed = now - entry.lastRefill;
  const refill = (elapsed / 1000) * refillRate;
  entry.tokens = Math.min(maxTokens, entry.tokens + refill);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    return true; // 차단
  }

  entry.tokens -= 1;
  return false;
}

// --- 경로별 Rate Limit 설정 ---
// maxTokens: 버킷 최대 크기 (버스트 허용량)
// refillRate: 초당 토큰 보충 속도
interface RateLimitConfig {
  maxTokens: number;
  refillRate: number;
}

function getRouteConfig(pathname: string): RateLimitConfig | null {
  // /api/delete-account — 매우 민감, 분당 3회
  if (pathname.startsWith('/api/delete-account')) {
    return { maxTokens: 3, refillRate: 3 / 60 };
  }
  // /api/admin — 관리자 전용, 분당 30회
  if (pathname.startsWith('/api/admin')) {
    return { maxTokens: 30, refillRate: 30 / 60 };
  }
  // /api/praise — 칭찬, 분당 10회
  if (pathname.startsWith('/api/praise')) {
    return { maxTokens: 10, refillRate: 10 / 60 };
  }
  // /api/push — 푸시 알림, 분당 20회
  if (pathname.startsWith('/api/push')) {
    return { maxTokens: 20, refillRate: 20 / 60 };
  }
  // /api/directions, /api/geocode — 외부 API 호출, 분당 30회
  if (pathname.startsWith('/api/directions') || pathname.startsWith('/api/geocode')) {
    return { maxTokens: 30, refillRate: 30 / 60 };
  }
  return null; // API가 아닌 경로는 Rate Limit 미적용
}

// --- 클라이언트 IP 추출 ---
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

// --- CSP 헤더 ---
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://t1.daumcdn.net https://dapi.kakao.com https://developers.kakao.com https://kauth.kakao.com https://oapi.map.naver.com https://openapi.map.naver.com",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://dapi.kakao.com https://kauth.kakao.com https://naveropenapi.apigw.ntruss.com https://map.naver.com https://oapi.map.naver.com https://openapi.map.naver.com",
  "frame-src 'self' https://kauth.kakao.com",
  "worker-src 'self' blob:",
].join('; ');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 경로에 대해 Rate Limiting 적용
  const config = getRouteConfig(pathname);
  if (config) {
    const ip = getClientIP(request);
    const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`; // IP + 경로 그룹

    if (isRateLimited(key, config.maxTokens, config.refillRate)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  // 모든 응답에 보안 헤더 추가
  const response = NextResponse.next();

  // CSP — XSS 방어
  response.headers.set('Content-Security-Policy', CSP_HEADER);

  // 클릭재킹 방어
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // MIME 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer 정보 최소화
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTPS 강제 (프로덕션)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 브라우저 기능 제한
  response.headers.set('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

  return response;
}

// middleware가 적용될 경로
export const config = {
  matcher: [
    // API 경로 전부
    '/api/:path*',
    // 페이지 경로 (보안 헤더 적용, _next 제외)
    '/((?!_next/static|_next/image|favicon.ico|icon-|banners|manifest.json|sw.js).*)',
  ],
};
