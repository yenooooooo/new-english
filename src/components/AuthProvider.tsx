import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/db';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Failed to get session:', error.message);
            }
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch((err) => {
            console.error('getSession exception:', err);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: import('@supabase/supabase-js').Session | null) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [setUser, setLoading]);

    return <>{children}</>;
}
