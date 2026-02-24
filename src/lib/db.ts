import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Supabase 환경 변수 설정 오류:\n' +
    'VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '❌\n' +
    'VITE_SUPABASE_KEY:', supabaseKey ? '✓' : '❌\n\n' +
    'Vercel 대시보드에서 다음을 설정해주세요:\n' +
    '1. Settings > Environment Variables\n' +
    '2. VITE_SUPABASE_URL = [당신의 Supabase URL]\n' +
    '3. VITE_SUPABASE_KEY = [당신의 Supabase Anon Key]\n' +
    '4. 설정 후 재배포'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
export type { Session };
