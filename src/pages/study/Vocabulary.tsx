import { useState, useEffect } from 'react';
import { supabase } from '../../lib/db';
import { useAuthStore } from '../../stores/authStore';
import { PageHeader } from '../../components/PageHeader';
import { LevelBadge } from '../../components/LevelBadge';

interface Word {
  id: string;
  word: string;
  meaning: string;
  example_en: string;
  example_ko: string;
  cefr_level: string;
  category?: string;
  audio_url?: string;
}

const levelColors = {
  'A1': 'from-green-600/20 to-green-700/20 border-green-500/30',
  'A2': 'from-green-500/20 to-green-600/20 border-green-500/30',
  'B1': 'from-blue-600/20 to-blue-700/20 border-blue-500/30',
  'B2': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  'C1': 'from-purple-600/20 to-purple-700/20 border-purple-500/30',
  'C2': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
};

export function Vocabulary() {
  const { user } = useAuthStore();
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | 'all'>('all');
  const [dailyGoal, setDailyGoal] = useState(10);
  const [completed, setCompleted] = useState(0);
  const [isResponding, setIsResponding] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    fetchWords();
  }, [user]);

  useEffect(() => {
    filterWordsByLevel();
  }, [words, selectedLevel]);

  const fetchWords = async () => {
    try {
      let query = supabase.from('vocabulary').select('*').limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('❌ 단어를 불러올 수 없습니다:', error.message);
        setCompletionMessage('단어를 불러올 수 없습니다. 나중에 다시 시도해주세요.');
      } else if (data && data.length > 0) {
        setWords(data);
      } else {
        setCompletionMessage('등록된 단어가 없습니다. 나중에 다시 확인해주세요.');
      }
    } catch (error: any) {
      console.error('❌ 통신 오류:', error.message);
      setCompletionMessage('통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filterWordsByLevel = () => {
    if (selectedLevel === 'all') {
      setFilteredWords(words);
    } else {
      setFilteredWords(words.filter(w => w.cefr_level === selectedLevel));
    }
    setCurrentIndex(0);
  };

  const handleDifficulty = async (quality: number) => {
    setIsResponding(true);

    try {
      if (user) {
        const currentWord = filteredWords[currentIndex];

        console.log('📝 Recording word review:', {
          user_id: user.id,
          word_id: currentWord.id,
          quality: quality,
        });

        // Create or update word_reviews record
        const { data: existing, error: checkError } = await supabase
          .from('word_reviews')
          .select('*')
          .eq('user_id', user.id)
          .eq('word_id', currentWord.id)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Check error:', checkError);
          throw checkError;
        }

        // Simple SM-2 calculation (local)
        let newInterval = 1;
        let newEaseFactor = 2.5;
        let newRepetitions = 0;

        if (existing) {
          newRepetitions = existing.repetitions || 0;
          newEaseFactor = existing.ease_factor || 2.5;

          if (quality < 3) {
            // Failed - reset
            newInterval = 1;
            newRepetitions = 0;
          } else {
            // Success - increase interval
            newRepetitions += 1;
            if (newRepetitions === 1) {
              newInterval = 1;
            } else if (newRepetitions === 2) {
              newInterval = 3;
            } else {
              newInterval = Math.round((existing.interval || 1) * newEaseFactor);
            }
            // Adjust ease factor
            newEaseFactor = Math.max(1.3, newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
          }
        }

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

        // Update or insert
        const { error: saveError } = await supabase
          .from('word_reviews')
          .upsert({
            user_id: user.id,
            word_id: currentWord.id,
            interval: newInterval,
            repetitions: newRepetitions,
            ease_factor: parseFloat(newEaseFactor.toFixed(2)),
            next_review: nextReviewDate.toISOString().split('T')[0],
            last_reviewed: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,word_id',
          });

        if (saveError) {
          console.error('❌ Save review error:', saveError.message);
        } else {
          console.log('✅ Review saved:', {
            interval: newInterval,
            easeFactor: newEaseFactor,
            repetitions: newRepetitions,
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to record progress:', error.message);
    }

    nextWord();
    setIsResponding(false);

    // Check if completed daily goal
    if (completed + 1 >= dailyGoal) {
      setCompletionMessage(`🎉 오늘의 ${dailyGoal}개 단어 목표를 달성했습니다!`);
    }
    setCompleted(prev => prev + 1);
  };

  const speakWord = () => {
    const currentWord = filteredWords[currentIndex];
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const nextWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    }, 150);
  };

  const prevWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    }, 150);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="어휘 학습" icon="📚" />
        <div className="text-center p-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <h3 className="text-xl font-bold text-slate-300">선택된 레벨에 단어가 없습니다</h3>
          <p className="text-slate-400 mt-2">다른 레벨을 선택하거나 나중에 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  const currentWord = filteredWords[currentIndex];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="어휘 학습"
        description={`매일 새로운 단어를 배우고, 반복학습으로 영구히 기억하세요. (${completed}/${dailyGoal})`}
        icon="📚"
      />

      {/* Completion Message */}
      {completionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-lg text-center animate-pulse">
          {completionMessage}
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level Filter */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">레벨 필터</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedLevel('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedLevel === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                전체
              </button>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedLevel === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">일일 목표</label>
            <div className="flex gap-2">
              {[5, 10, 20].map((goal) => (
                <button
                  key={goal}
                  onClick={() => setDailyGoal(goal)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    dailyGoal === goal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {goal}개
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">진행도</label>
            <div className="bg-slate-800 rounded-lg p-3 h-10 flex items-center">
              <div className="flex-1 bg-slate-700 rounded-full h-2 mr-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completed / dailyGoal) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-slate-300 whitespace-nowrap">{completed}/{dailyGoal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center text-slate-400">
          {currentIndex + 1} / {filteredWords.length}
        </div>

        {/* Card */}
        <div
          className={`relative w-full max-w-2xl h-96 cursor-pointer perspective transition-transform duration-500 ${
            isFlipped ? 'scale-95' : 'scale-100'
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
              isFlipped ? 'rotateY-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className={`absolute w-full h-full bg-gradient-to-br ${
                levelColors[currentWord.cefr_level as keyof typeof levelColors]
              } backdrop-blur-xl rounded-2xl border flex flex-col items-center justify-center p-8 shadow-2xl`}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute top-6 right-6">
                <LevelBadge level={currentWord.cefr_level} />
              </div>

              <h3 className="text-6xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                {currentWord.word}
              </h3>

              {currentWord.category && (
                <span className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 mb-6">
                  {currentWord.category}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord();
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all flex items-center gap-2"
              >
                <span>🔊</span> 발음 듣기
              </button>

              <p className="text-slate-400 mt-8 font-medium">클릭하여 의미 보기</p>
            </div>

            {/* Back */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center p-10 shadow-[0_0_30px_rgba(79,70,229,0.2)]"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <h3 className="text-4xl md:text-5xl font-bold text-indigo-300 mb-8 text-center font-korean">
                {currentWord.meaning}
              </h3>

              <div className="w-full max-w-xl space-y-6">
                <div>
                  <p className="text-sm text-slate-400 mb-2">예문</p>
                  <p className="text-lg text-white italic border-l-4 border-indigo-500 pl-4 py-2">
                    "{currentWord.example_en}"
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-center italic">{currentWord.example_ko}</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-xs text-yellow-400 font-bold mb-1">💡 네이티브 표현</p>
                  <p className="text-sm text-slate-300">이 단어는 {currentWord.cefr_level} 레벨 핵심 표현입니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => handleDifficulty(1)}
            disabled={isResponding}
            className="flex-1 min-w-[140px] px-6 py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            😅 어려움
          </button>
          <button
            onClick={() => handleDifficulty(3)}
            disabled={isResponding}
            className="flex-1 min-w-[140px] px-6 py-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 text-yellow-400 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            🤔 보통
          </button>
          <button
            onClick={() => handleDifficulty(5)}
            disabled={isResponding}
            className="flex-1 min-w-[140px] px-6 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            😊 쉬움
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevWord();
            }}
            className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all hover:scale-110 active:scale-95 text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextWord();
            }}
            className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-transparent shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all hover:scale-110 active:scale-95 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
