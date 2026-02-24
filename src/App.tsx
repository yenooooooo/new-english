import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/db';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Vocabulary } from './pages/study/Vocabulary';
import { Dashboard } from './pages/study/Dashboard';
import { Shadowing } from './pages/study/Shadowing';
import { Collocations } from './pages/study/Collocations';
import { AiChat } from './pages/study/AiChat';
import { Translation } from './pages/study/Translation';

function App() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-korean">
      {/* Navigation */}
      <header className="p-4 border-b border-white/5 flex justify-between items-center backdrop-blur-xl bg-slate-950/80 sticky top-0 z-50">
        <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          NativeTalk
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-bold tracking-wide uppercase">대시보드</Link>
              <span className="text-xs text-slate-400 px-3 py-1 bg-slate-900/60 rounded-full">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 px-4 py-2 rounded-full hover:bg-slate-800">로그인</Link>
              <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">시작하기</Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/5 p-4 space-y-4">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-indigo-400 hover:text-indigo-300 font-bold">대시보드</Link>
              <div className="text-xs text-slate-400 px-3 py-2 bg-slate-800 rounded">{user.email}</div>
              <button onClick={handleLogout} className="w-full text-left text-slate-300 hover:text-white font-medium px-4 py-2 bg-slate-800 rounded">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white px-4 py-2 border border-slate-700 rounded">로그인</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block text-center text-white font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded">시작하기</Link>
            </>
          )}
        </nav>
      )}

      <main className="flex-1 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        {/* Particle animation background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/register" element={<RegisterWrapper />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/shadowing" element={<Shadowing />} />
          <Route path="/collocations" element={<Collocations />} />
          <Route path="/translate" element={<Translation />} />
        </Routes>
      </main>
    </div>
  );
}

function LoginWrapper() {
  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Login />
    </div>
  );
}

function RegisterWrapper() {
  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <Register />
    </div>
  );
}

function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [trialCount, setTrialCount] = useState({
    vocab: parseInt(localStorage.getItem('trial_vocab') || '1'),
    chat: parseInt(localStorage.getItem('trial_chat') || '1'),
    translate: parseInt(localStorage.getItem('trial_translate') || '1'),
  });

  const handleTrialVocab = () => {
    if (!user && trialCount.vocab <= 0) {
      navigate('/register');
      return;
    }
    if (!user && trialCount.vocab > 0) {
      setTrialCount(prev => ({ ...prev, vocab: prev.vocab - 1 }));
      localStorage.setItem('trial_vocab', (trialCount.vocab - 1).toString());
    }
    navigate('/vocabulary');
  };

  const handleTrialChat = () => {
    if (!user && trialCount.chat <= 0) {
      navigate('/register');
      return;
    }
    if (!user && trialCount.chat > 0) {
      setTrialCount(prev => ({ ...prev, chat: prev.chat - 1 }));
      localStorage.setItem('trial_chat', (trialCount.chat - 1).toString());
    }
    navigate('/ai-chat');
  };


  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
          현지인처럼 말하는<br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">영어 습득</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          AI 회화 연습, 지능형 어휘 반복학습, 그리고 실시간 네이티브 발음 연습으로<br className="hidden md:block" />
          1년 안에 자연스러운 영어를 마스터하세요.
        </p>

        {!user ? (
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.5)] group"
          >
            무료로 시작하기
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all border border-slate-600 hover:border-indigo-500 group"
          >
            대시보드로 이동
            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        )}

        {/* Social Proof */}
        <div className="mt-12 text-sm text-slate-400 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>오늘 1,234명이 학습 중</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>누적 458,923시간 학습</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold">✓</span>
            <span>평균 만족도 4.8/5.0</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">
          완전한 영어 학습 경험
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Feature Card 1: Vocabulary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
              <span className="text-2xl">📚</span>
            </div>
            <h4 className="text-xl font-bold mb-3">스마트 어휘 학습</h4>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              SM-2 알고리즘으로 자동 계산된 복습 일정. 중요한 단어는 집중적으로, 이미 알고 있는 단어는 건너뛰세요.
            </p>
            <button
              onClick={handleTrialVocab}
              className="w-full py-2 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 rounded-lg font-medium transition-all text-sm"
            >
              {user ? '시작하기' : trialCount.vocab > 0 ? `체험 (${trialCount.vocab}회 남음)` : '로그인 필요'}
            </button>
          </div>

          {/* Feature Card 2: AI Chat */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-pink-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-500/30 transition-colors">
              <span className="text-2xl">💬</span>
            </div>
            <h4 className="text-xl font-bold mb-3">AI 회화 연습</h4>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              카페 주문, 공항, 비즈니스 미팅 등 실제 상황을 상정한 5가지 시나리오로 자연스러운 대화를 연습하세요.
            </p>
            <button
              onClick={handleTrialChat}
              className="w-full py-2 px-4 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 text-pink-400 rounded-lg font-medium transition-all text-sm"
            >
              {user ? '시작하기' : trialCount.chat > 0 ? `체험 (${trialCount.chat}회 남음)` : '로그인 필요'}
            </button>
          </div>

          {/* Feature Card 3: Shadowing */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-violet-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-violet-500/30 transition-colors">
              <span className="text-2xl">🎤</span>
            </div>
            <h4 className="text-xl font-bold mb-3">섀도잉 발음 연습</h4>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              원어민의 발음을 듣고 따라 읽기. 실시간 오디오 피드백으로 정확한 발음을 습득하세요.
            </p>
            <button
              onClick={() => navigate('/shadowing')}
              className="w-full py-2 px-4 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/50 text-violet-400 rounded-lg font-medium transition-all text-sm"
            >
              둘러보기
            </button>
          </div>
        </div>
      </section>

      {/* Level Selection for Non-logged-in Users */}
      {!user && (
        <section className="py-20">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            당신의 레벨을 선택하세요
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
              <button
                key={level}
                onClick={() => navigate('/register')}
                className="p-6 bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-lg font-bold text-lg transition-all hover:scale-110 group"
              >
                <span className="block text-2xl mb-2 group-hover:scale-125 transition-transform">{level}</span>
                <span className="block text-xs text-slate-400 group-hover:text-indigo-400 transition-colors">
                  {['초급', '초급', '중급', '중급', '고급', '고급'][['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(level)]}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm mt-8">
            정확한 레벨 진단은 가입 후 시작 테스트를 통해 이루어집니다.
          </p>
        </section>
      )}

      {/* Additional Features Section */}
      <section className="py-20">
        <h3 className="text-3xl md:text-4xl font-bold text-center mb-16">
          더 많은 기능들
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <span className="text-3xl">🌍</span>
            <div>
              <h4 className="text-xl font-bold mb-2">스마트 번역</h4>
              <p className="text-slate-400">한국어를 입력하면 네이티브 표현으로 번역해주고, 뉘앙스 설명까지 제공합니다.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-3xl">🔗</span>
            <div>
              <h4 className="text-xl font-bold mb-2">연어 학습</h4>
              <p className="text-slate-400">자주 함께 쓰이는 표현들을 배우고, 빈칸 채우기로 실력을 테스트하세요.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-3xl">🔥</span>
            <div>
              <h4 className="text-xl font-bold mb-2">학습 스트릭</h4>
              <p className="text-slate-400">매일 학습하고 스트릭을 쌓으세요. 당신의 학습 습관을 시각화합니다.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="text-3xl">🎯</span>
            <div>
              <h4 className="text-xl font-bold mb-2">일일 미션</h4>
              <p className="text-slate-400">매일 3가지 미션을 완료하고 보상을 얻으세요. 꾸준함이 습관이 되면 영어도 자연스러워집니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <h3 className="text-3xl md:text-4xl font-bold mb-6">
          1년 안에 네이티브 영어를 마스터하세요
        </h3>
        <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
          매일 조금씩, 꾸준히 학습하면 6개월 후에는 확실한 변화를 느낄 수 있습니다.
        </p>

        {!user && (
          <Link
            to="/register"
            className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(79,70,229,0.4)]"
          >
            무료 가입하기
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        )}
      </section>
    </div>
  );
}

export default App;
