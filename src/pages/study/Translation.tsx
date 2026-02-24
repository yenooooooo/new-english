import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';

interface TranslationHistory {
  id: string;
  source: string;
  translation: string;
  timestamp: number;
  favorite: boolean;
  language: string;
}

export function Translation() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('Korean');
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [nuance, setNuance] = useState('');
  const [alternatives, setAlternatives] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('translation_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (source: string, translation: string) => {
    const newEntry: TranslationHistory = {
      id: Date.now().toString(),
      source,
      translation,
      timestamp: Date.now(),
      favorite: false,
      language: targetLang,
    };

    const updated = [newEntry, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setTranslatedText('');
    setNuance('');
    setAlternatives([]);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetLanguage: targetLang
        }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      setTranslatedText(data.translation);

      // Generate nuance explanation
      if (targetLang === 'Korean') {
        setNuance('이 표현은 중립적이고 자연스러운 일상 표현입니다.');
      } else {
        setNuance('This is a neutral and natural everyday expression.');
      }

      // Generate alternatives (simulated - in production, call AI API)
      setAlternatives([
        targetLang === 'Korean' ? '더 자연스러운 표현' : 'More casual version',
        targetLang === 'Korean' ? '격식체 표현' : 'More formal version',
      ]);

      saveToHistory(inputText, data.translation);
    } catch (error) {
      console.error(error);
      setTranslatedText('번역에 실패했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    setTargetLang(prev => prev === 'Korean' ? 'English' : 'Korean');
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const speakTranslation = () => {
    if (!translatedText) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = targetLang === 'Korean' ? 'ko-KR' : 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const toggleFavorite = (id: string) => {
    const updated = history.map(item =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );
    setHistory(updated);
    localStorage.setItem('translation_history', JSON.stringify(updated));
  };

  const loadFromHistory = (item: TranslationHistory) => {
    setInputText(item.source);
    setTranslatedText(item.translation);
    setTargetLang(item.language);
    setShowHistory(false);
  };

  const favorites = history.filter(item => item.favorite);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="스마트 번역"
        description="네이티브 표현을 학습하는 AI 번역기. 뉘앙스 설명과 대안 표현을 제공합니다."
        icon="🌍"
      />

      {/* Main Translation Panel */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
        {/* Source Language Area */}
        <div className="flex-1 flex flex-col p-6 border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-300">
              {targetLang === 'Korean' ? '영어' : '한국어'}
            </h3>
            <button
              onClick={handleSwapLanguages}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all text-slate-400 hover:text-white"
              title="언어 바꾸기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${targetLang === 'Korean' ? '영어' : '한국어'}를 입력하세요...`}
            className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-lg md:text-xl text-white placeholder-slate-500 font-medium"
          />

          <div className="mt-4 flex justify-between items-center gap-2">
            <span className="text-xs text-slate-500">{inputText.length}자</span>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '번역 중...' : '번역하기'}
            </button>
          </div>
        </div>

        {/* Target Language Area */}
        <div className="flex-1 flex flex-col p-6 bg-slate-900/80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-emerald-400">
              {targetLang}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={speakTranslation}
                disabled={!translatedText}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                title="발음 듣기"
              >
                <span className="text-xl">🔊</span>
              </button>
              <button
                onClick={() => {
                  if (translatedText) navigator.clipboard.writeText(translatedText);
                }}
                title="복사"
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full bg-transparent overflow-y-auto min-h-[150px]">
            {isLoading ? (
              <div className="flex space-x-2 h-full items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            ) : translatedText ? (
              <div className="space-y-4">
                <p className={`text-xl md:text-2xl font-medium ${targetLang === 'Korean' ? 'font-korean' : ''} text-white leading-relaxed`}>
                  {translatedText}
                </p>
              </div>
            ) : (
              <p className="text-slate-600">번역 결과가 여기에 표시됩니다...</p>
            )}
          </div>
        </div>
      </div>

      {/* Nuance & Alternatives */}
      {translatedText && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nuance Explanation */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              <h3 className="font-bold text-yellow-400">뉘앙스 설명</h3>
            </div>
            <p className="text-slate-300">{nuance}</p>
          </div>

          {/* Alternative Translations */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📝</span>
              <h3 className="font-bold text-blue-400">대안 표현</h3>
            </div>
            <div className="space-y-2">
              {alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm"
                >
                  {alt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Favorites & History */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              showHistory
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📋 히스토리 ({history.length})
          </button>

          {favorites.length > 0 && (
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 rounded-lg font-bold bg-yellow-500/20 text-yellow-400 transition-all"
            >
              ⭐ 즐겨찾기 ({favorites.length})
            </button>
          )}
        </div>

        {/* History/Favorites List */}
        {showHistory && history.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 truncate">{item.source}</p>
                    <p className="text-white font-medium truncate">{item.translation}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className={`flex-shrink-0 text-lg transition-transform ${item.favorite ? 'text-yellow-400' : 'text-slate-500'}`}
                  >
                    ⭐
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Favorites List */}
        {!showHistory && favorites.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
            {favorites.map((item) => (
              <button
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 truncate">{item.source}</p>
                    <p className="text-white font-medium truncate">{item.translation}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="flex-shrink-0 text-lg text-yellow-400"
                  >
                    ⭐
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
