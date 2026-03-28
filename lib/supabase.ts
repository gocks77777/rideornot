import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function sendPraise(targetId: string, partyId: string): Promise<{ success?: boolean; alreadyPraised?: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'Unauthorized' };
  const res = await fetch('/api/praise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ targetId, partyId }),
  });
  return res.json();
}

export function sendPush(payload: { userId: string; title: string; body?: string; url?: string }) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) return;
    fetch('/api/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }).catch(err => console.error('[sendPush] failed:', err));
  });
}
