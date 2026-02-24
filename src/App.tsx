import { Routes, Route, Link, useNavigate } from 'react-router-dom';
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-korean">
      <header className="p-4 border-b border-white/10 flex justify-between items-center backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
          LingoVercel
        </Link>
        <nav className="flex space-x-6 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-bold tracking-wide uppercase">Dashboard</Link>
              <span className="text-sm text-slate-400 self-center hidden sm:inline-block px-3 py-1 bg-slate-800 rounded-full">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full border border-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 px-4 py-2 rounded-full hover:bg-slate-800">Login</Link>
              <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">Sign Up</Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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

function Home() {
  const { user } = useAuthStore();

  return (
    <div className="text-center max-w-2xl">
      <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
        Master English<br />
        <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Locally & Naturally</span>
      </h2>
      <p className="text-lg text-slate-400 mb-10 leading-relaxed font-korean">
        Immerse yourself in authentic English learning with AI chatbots, smart vocabulary repetitions, and real-time native shadowing practice.
      </p>

      {!user ? (
        <Link to="/register" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.5)] group">
          Start Learning Now
          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      ) : (
        <div className="space-y-6">
          <p className="text-emerald-400 font-medium text-lg">✨ Welcome back! Ready to continue your journey?</p>
          <div>
            <Link to="/dashboard" className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_20px_rgba(30,41,59,0.5)] border border-slate-600 hover:border-indigo-500 group">
              Go to Dashboard
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
