import { useState } from 'react';
import { supabase } from '../../lib/db';
import { useNavigate } from 'react-router-dom';

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                console.error('Register error:', error);
                setError(error.message);
            } else {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err: any) {
            console.error('Register exception:', err);
            setError(err.message || 'An unexpected error occurred');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="w-full max-w-md p-8 text-center space-y-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700">
                <h2 className="text-2xl font-bold text-green-400">회원가입 성공!</h2>
                <p className="text-slate-300">✓ 계정이 성공적으로 생성되었습니다!</p>
                <p className="text-sm text-slate-400">
                    이메일 인증이 필요한 경우 받은편지함을 확인하세요.<br/>
                    그렇지 않으면 바로 로그인할 수 있습니다.
                </p>
                <p className="text-xs text-slate-500">로그인 페이지로 이동 중...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl">
            <div>
                <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">
                    계정 생성
                </h2>
                <p className="mt-2 text-center text-slate-400">
                    오늘부터 영어 학습을 시작하세요
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-lg p-3">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">이메일 주소</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">비밀번호</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500"
                            placeholder="비밀번호 (최소 6글자)"
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
                    {loading ? '계정 생성 중...' : '계정 생성'}
                </button>
            </form >
        </div >
    );
}
