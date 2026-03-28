import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** avatar_url이 안전한 https URL인지 검증. 실패 시 빈 문자열 반환 */
export function safeAvatarUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return url;
  } catch { /* invalid URL */ }
  return '';
}
