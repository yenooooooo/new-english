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

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="w-full max-w-md p-8 text-center space-y-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700">
                <h2 className="text-2xl font-bold text-green-400">Registration Successful!</h2>
                <p className="text-slate-300">Please check your email to verify your account.</p>
                <p className="text-sm text-slate-400">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl">
            <div>
                <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">
                    Create Account
                </h2>
                <p className="mt-2 text-center text-slate-400">
                    Start your English journey today
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
                            placeholder="Password (min 6 characters)"
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
                    {loading ? 'Creating account...' : 'Create account'}
                </button>
            </form >
        </div >
    );
}
