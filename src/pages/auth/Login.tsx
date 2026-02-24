import { useState } from 'react';
import { supabase } from '../../lib/db';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error:', error);
                if (error.message === 'Email not confirmed') {
                    setError('이메일 인증이 필요합니다. 가입하신 이메일의 수신함을 확인하여 인증 링크를 클릭해주세요. (만약 인증을 없애고 싶다면 Supabase 대시보드에서 Email Confirmations 옵션을 꺼주세요)');
                } else {
                    setError(error.message);
                }
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Login exception:', err);
            setError(err.message || 'An unexpected error occurred');
        }
        setLoading(false);
    };

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl">
            <div>
                <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-slate-400">
                    Continue your English journey
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg p-3">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div >

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form >
        </div >
    );
}
