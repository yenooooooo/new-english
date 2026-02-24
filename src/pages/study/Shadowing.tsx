import { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { PageHeader } from '../../components/PageHeader';

interface ShadowingSentence {
  id: string;
  text_en: string;
  text_ko: string;
  category: string;
  difficulty: string;
}

const SAMPLE_SENTENCES: ShadowingSentence[] = [
  {
    id: '1',
    text_en: "It's not about how much we lost, it's about how much we have left.",
    text_ko: '우리가 얼마나 잃었는지가 중요한 게 아니야, 얼마나 남았는지가 중요하지.',
    category: '일상',
    difficulty: 'intermediate',
  },
  {
    id: '2',
    text_en: "Can I get a cappuccino with an extra shot of espresso, please?",
    text_ko: '카푸치노에 에스프레소 샷을 하나 더 넣어주세요.',
    category: '카페',
    difficulty: 'easy',
  },
  {
    id: '3',
    text_en: 'I have a flight to New York at 3 PM. Where is the check-in counter?',
    text_ko: '저는 오후 3시에 뉴욕으로 가는 비행기가 있습니다. 체크인 카운터는 어디입니까?',
    category: '여행',
    difficulty: 'intermediate',
  },
];

const categories = [
  { id: 'daily', label: '😊 일상', count: 12 },
  { id: 'business', label: '💼 비즈니스', count: 8 },
  { id: 'travel', label: '🌍 여행', count: 10 },
  { id: 'movie', label: '🎬 영화대사', count: 6 },
  { id: 'news', label: '📰 뉴스', count: 5 },
];

export function Shadowing() {
  const [sentences] = useState<ShadowingSentence[]>(SAMPLE_SENTENCES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selfRating, setSelfRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const { user } = useAuthStore();

  const currentSentence = sentences[currentIndex];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setShowFeedback(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioUrl(null);
    } catch (err) {
      console.error('마이크 접근 오류:', err);
      alert('마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const speakSentence = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentSentence.text_en);
      utterance.lang = 'en-US';
      utterance.rate = playbackSpeed;
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  };

  const uploadAudio = async () => {
    if (!audioChunksRef.current.length || !user) return;

    setIsUploading(true);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, `shadowing-${Date.now()}.webm`);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/shadowing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setShowFeedback(true);
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('음성 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const nextSentence = () => {
    setCurrentIndex((prev) => (prev + 1) % sentences.length);
    setAudioUrl(null);
    setSelfRating(0);
    setShowFeedback(false);
  };

  const prevSentence = () => {
    setCurrentIndex((prev) => (prev - 1 + sentences.length) % sentences.length);
    setAudioUrl(null);
    setSelfRating(0);
    setShowFeedback(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <PageHeader
        title="섀도잉 연습"
        description="원어민의 발음, 강세, 리듬을 따라 하며 자연스러운 영어 발음을 연습하세요."
        icon="🎤"
      />

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-full font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          📚 전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full font-bold transition-all ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Practice Area */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl space-y-8">
        {/* Sentence Display */}
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-bold">
            {currentIndex + 1} / {sentences.length}
          </div>

          <div className="space-y-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white leading-relaxed">
              "{currentSentence.text_en}"
            </h3>
            <p className="text-lg text-slate-400 font-korean">
              {currentSentence.text_ko}
            </p>
          </div>

          {/* Controls Bar */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
            {/* Playback Speed */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-slate-400">재생 속도:</span>
              {[0.75, 1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Listen Button */}
            <button
              onClick={speakSentence}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">🔊</span>
              원어민 발음 듣기
            </button>
          </div>
        </div>

        {/* Recording Section */}
        <div className="border-t border-slate-700/50 pt-8">
          <div className="flex flex-col items-center space-y-6">
            <p className="text-sm text-slate-400">아래 버튼을 눌러 따라 읽기를 시작하세요</p>

            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 ${
                  isRecording
                    ? 'bg-red-500/10 border-red-500 hover:bg-red-500/20 text-red-500'
                    : 'bg-slate-800 border-slate-600 hover:border-indigo-500 text-slate-300 hover:text-indigo-400'
                }`}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="7" />
                  </svg>
                )}
              </button>
            </div>

            <p className={`font-bold text-lg ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              {isRecording ? '⏹️ 녹음 중... 버튼을 눌러 중지' : '🎤 눌러서 녹음 시작'}
            </p>

            {/* Playback and Upload */}
            {audioUrl && !isRecording && (
              <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-6 border border-slate-700 space-y-4 animate-pulse-slow">
                <p className="text-center font-bold text-slate-300">내 녹음</p>
                <audio src={audioUrl} controls className="w-full" />

                <div className="space-y-4">
                  {/* Self Rating */}
                  <div>
                    <p className="text-sm text-slate-400 mb-2">내 발음 평가:</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelfRating(rating)}
                          className={`text-2xl transition-transform hover:scale-125 ${
                            selfRating >= rating ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {showFeedback && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-300">
                      ✅ 녹음이 저장되었습니다! 계속해서 다른 문장을 연습해보세요.
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={uploadAudio}
                      disabled={isUploading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all disabled:opacity-50"
                    >
                      {isUploading ? '처리 중...' : '저장하기'}
                    </button>
                    <button
                      onClick={nextSentence}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                    >
                      다음 문장
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={prevSentence}
            className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSentence}
            className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-transparent shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">💡</span>
          <h3 className="font-bold text-yellow-400">섀도잉 팁</h3>
        </div>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>• <strong>강세:</strong> 강하게 발음되는 음절에 집중하세요</li>
          <li>• <strong>리듬:</strong> 단어와 단어 사이의 자연스러운 연결을 따라하세요</li>
          <li>• <strong>속도:</strong> 느린 속도부터 시작하여 점차 빠르게 연습하세요</li>
          <li>• <strong>반복:</strong> 같은 문장을 여러 번 반복하여 근육 기억을 형성하세요</li>
        </ul>
      </div>
    </div>
  );
}
