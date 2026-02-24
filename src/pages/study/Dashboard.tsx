import { useState, useEffect } from 'react';
import { supabase } from '../../lib/db';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { LevelBadge } from '../../components/LevelBadge';
import { StreakBanner } from '../../components/StreakBanner';
import { MissionCard } from '../../components/MissionCard';

interface UserStats {
  words_learned: number;
  streak_days: number;
  total_minutes: number;
  xp: number;
  current_level: string;
}

interface DailyMissions {
  vocab_done: boolean;
  chat_done: boolean;
  translate_done: boolean;
}

export function Dashboard() {
  const [stats, setStats] = useState<UserStats>({
    words_learned: 0,
    streak_days: 0,
    total_minutes: 0,
    xp: 0,
    current_level: 'A1',
  });
  const [missions, setMissions] = useState<DailyMissions>({
    vocab_done: false,
    chat_done: false,
    translate_done: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchProgress();
      fetchMissions();
    }
  }, [user]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?user_id=${user?.id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      setStats({
        words_learned: data.words_learned || 0,
        streak_days: data.streak_days || 0,
        total_minutes: data.total_minutes || 0,
        xp: data.xp || 0,
        current_level: data.current_level || 'A1',
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch progress:', error.message);
      setStats({
        words_learned: 0,
        streak_days: 0,
        total_minutes: 0,
        xp: 0,
        current_level: 'A1',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('mission_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMissions({
          vocab_done: data.vocab_done || false,
          chat_done: data.chat_done || false,
          translate_done: data.translate_done || false,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch missions:', error.message);
    }
  };

  const StreakCalendar = () => {
    // Generate last 30 days
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    // Simulate learned days (in real implementation, query from database)
    const learnedDates = new Set<string>();
    for (let i = 0; i < stats.streak_days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      learnedDates.add(date.toISOString().split('T')[0]);
    }

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-white">30일 학습 현황</h3>
        <div className="grid grid-cols-7 gap-2">
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <div key={day} className="text-center text-xs text-slate-400 mb-2 h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
          {days.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const isLearned = learnedDates.has(dateStr);
            return (
              <div
                key={idx}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isLearned
                    ? 'bg-emerald-500/30 border border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-500 opacity-50'
                }`}
                title={dateStr}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-4">🟩 = 학습한 날, ⬜ = 학습하지 않은 날</p>
      </div>
    );
  };

  const XPProgressBar = () => {
    const xpForNextLevel = 1000; // Example: need 1000 XP to level up
    const progressPercent = (stats.xp % xpForNextLevel) / xpForNextLevel * 100;

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">레벨 진행도</h3>
          <LevelBadge level={stats.current_level} size="lg" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">현재 경험치</span>
              <span className="text-white font-bold">{stats.xp} / {Math.ceil(stats.xp / 1000) * 1000} XP</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {Math.round(progressPercent)}% 진행 중
          </p>
        </div>
      </div>
    );
  };

  const WeeklyChart = () => {
    // Simulate weekly learning minutes (in real implementation, query from database)
    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
    const weekMinutes = [45, 30, 60, 45, 30, 50, 40]; // Example data
    const maxMinutes = Math.max(...weekMinutes);

    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6 text-white">주간 학습 시간</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {weekDays.map((day, idx) => {
            const minutes = weekMinutes[idx];
            const height = (minutes / maxMinutes) * 100;
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all hover:from-indigo-500 hover:to-indigo-300"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{day}</span>
                <span className="text-xs font-bold text-slate-300">{minutes}분</span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-slate-400 mt-4">
          이번 주 총 {weekMinutes.reduce((a, b) => a + b, 0)}분 학습
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="대시보드"
        description="오늘의 학습 진행 상황을 확인하고 이어서 공부하세요."
        icon="📊"
      />

      {/* Streak Banner */}
      <StreakBanner currentStreak={stats.streak_days} longestStreak={Math.max(stats.streak_days, 7)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">학습한 단어</p>
              <h3 className="text-3xl font-bold text-white">{stats.words_learned}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <span className="text-2xl">⏱️</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">학습 시간</p>
              <h3 className="text-3xl font-bold text-white">{stats.total_minutes}분</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">경험치</p>
              <h3 className="text-3xl font-bold text-white">{stats.xp} XP</h3>
            </div>
          </div>
        </div>
      </div>

      {/* XP Progress & Weekly Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XPProgressBar />
        <WeeklyChart />
      </div>

      {/* Streak Calendar */}
      <StreakCalendar />

      {/* Daily Missions */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">오늘의 미션</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MissionCard
            icon="📚"
            title="5개 단어 학습"
            description="새로운 단어 5개를 배우세요"
            completed={missions.vocab_done}
            reward={50}
          />
          <MissionCard
            icon="💬"
            title="AI와 대화"
            description="최소 1분 이상 대화하세요"
            completed={missions.chat_done}
            reward={75}
          />
          <MissionCard
            icon="🌍"
            title="번역하기"
            description="적어도 1개의 문장을 번역하세요"
            completed={missions.translate_done}
            reward={50}
          />
        </div>
      </div>

      {/* Recommended Actions */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">추천 학습</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/vocabulary"
            className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">📖</span>
            </div>
            <h4 className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300">일일 어휘</h4>
            <p className="text-sm text-slate-400 mt-2">복습 대기 중인 단어들을 학습하세요</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
              복습 시작 →
            </div>
          </Link>

          <Link
            to="/ai-chat"
            className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 hover:border-pink-500/50 p-6 rounded-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">💬</span>
            </div>
            <h4 className="text-lg font-bold text-pink-400 group-hover:text-pink-300">AI 회화</h4>
            <p className="text-sm text-slate-400 mt-2">자연스러운 일상 회화를 연습하세요</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-pink-400 group-hover:translate-x-1 transition-transform">
              대화 시작 →
            </div>
          </Link>

          <Link
            to="/shadowing"
            className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 p-6 rounded-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🎤</span>
            </div>
            <h4 className="text-lg font-bold text-violet-400 group-hover:text-violet-300">섀도잉</h4>
            <p className="text-sm text-slate-400 mt-2">원어민처럼 발음 연습하기</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-violet-400 group-hover:translate-x-1 transition-transform">
              연습 시작 →
            </div>
          </Link>

          <Link
            to="/collocations"
            className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 hover:border-orange-500/50 p-6 rounded-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🧩</span>
            </div>
            <h4 className="text-lg font-bold text-orange-400 group-hover:text-orange-300">연어 학습</h4>
            <p className="text-sm text-slate-400 mt-2">자주 함께 쓰이는 표현 배우기</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-orange-400 group-hover:translate-x-1 transition-transform">
              연습 시작 →
            </div>
          </Link>

          <Link
            to="/translate"
            className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 p-6 rounded-xl transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-6xl">🌍</span>
            </div>
            <h4 className="text-lg font-bold text-blue-400 group-hover:text-blue-300">스마트 번역</h4>
            <p className="text-sm text-slate-400 mt-2">자연스러운 영어 표현 학습</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
              번역 열기 →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
