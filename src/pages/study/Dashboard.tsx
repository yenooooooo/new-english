import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';

interface UserStats {
    words_learned: number;
    streak_days: number;
    total_minutes: number;
}

export function Dashboard() {
    const [stats, setStats] = useState<UserStats>({ words_learned: 0, streak_days: 0, total_minutes: 0 });
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            fetchProgress();
        }
    }, [user]);

    const fetchProgress = async () => {
        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (!error && data) {
                setStats({
                    words_learned: data.words_learned || 0,
                    streak_days: data.streak_days || 0,
                    total_minutes: data.total_minutes || 0,
                });
            }
        } catch (e) {
            console.error('Error fetching stats:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    Your Dashboard
                </h2>
                <p className="mt-2 text-slate-400">
                    Track your progress and pick up where you left off.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Day Streak</p>
                            <h3 className="text-2xl font-bold text-white">{stats.streak_days}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-500/20 rounded-xl">
                            <span className="text-2xl">📚</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Words Learned</p>
                            <h3 className="text-2xl font-bold text-white">{stats.words_learned}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg transform hover:-translate-y-1 transition-transform">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <span className="text-2xl">⏱️</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400">Time Spent</p>
                            <h3 className="text-2xl font-bold text-white">{stats.total_minutes}m</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommended Actions */}
            <h3 className="text-xl font-bold text-white mt-8 mb-4">Recommended for You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/vocabulary" className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">📖</span>
                    </div>
                    <h4 className="text-lg font-bold text-indigo-400 group-hover:text-indigo-300">Daily Vocabulary</h4>
                    <p className="text-sm text-slate-400 mt-2">15 words waiting for review</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-indigo-400">
                        Start Review &rarr;
                    </div>
                </Link>

                <Link to="/ai-chat" className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 hover:border-pink-500 transition-all opacity-70 hover:opacity-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🤖</span>
                    </div>
                    <h4 className="text-lg font-bold text-pink-400 group-hover:text-pink-300">AI Teacher</h4>
                    <p className="text-sm text-slate-400 mt-2">Practice daily conversation</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-pink-400">
                        Start Chat &rarr;
                    </div>
                </Link>

                <Link to="/collocations" className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 hover:border-orange-500 transition-all opacity-80 hover:opacity-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🧩</span>
                    </div>
                    <h4 className="text-lg font-bold text-orange-400 group-hover:text-orange-300">Collocations</h4>
                    <p className="text-sm text-slate-400 mt-2">Learn words that naturally go together</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-orange-400">
                        Start Practice &rarr;
                    </div>
                </Link>

                <Link to="/shadowing" className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-all opacity-80 hover:opacity-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🗣️</span>
                    </div>
                    <h4 className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300">Shadowing</h4>
                    <p className="text-sm text-slate-400 mt-2">Practice speaking like a native</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-emerald-400">
                        Start Practice &rarr;
                    </div>
                </Link>

                <Link to="/translate" className="group relative overflow-hidden bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all opacity-80 hover:opacity-100">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl">🌍</span>
                    </div>
                    <h4 className="text-lg font-bold text-blue-400 group-hover:text-blue-300">Translate</h4>
                    <p className="text-sm text-slate-400 mt-2">Get accurate, natural translations</p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-400">
                        Open Translator &rarr;
                    </div>
                </Link>
            </div>
        </div>
    );
}
