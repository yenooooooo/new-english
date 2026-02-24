import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { PageHeader } from '../../components/PageHeader';
import { supabase } from '../../lib/db';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  corrected?: string;
  isNative?: boolean;
}

const scenarios = [
  { id: 'cafe', label: '☕ 카페 주문', description: '커피숍에서 음료를 주문하는 상황' },
  { id: 'airport', label: '✈️ 공항', description: '공항에서 체크인하고 탑승하기' },
  { id: 'business', label: '💼 비즈니스', description: '비즈니스 미팅과 프레젠테이션' },
  { id: 'travel', label: '🌍 여행', description: '호텔, 레스토랑, 관광지에서 대화' },
  { id: 'daily', label: '😊 일상', description: '일상적인 대화와 잡담' },
];

const difficulties = [
  { id: 'easy', label: '🟢 초급', description: '쉬운 단어와 기본 문법' },
  { id: 'intermediate', label: '🟡 중급', description: '자연스러운 표현과 관용구' },
  { id: 'hard', label: '🔴 고급', description: '슬랭과 복잡한 표현' },
];

const quickResponses = ['정말요?', '그렇군요!', '흥미로워요!', '맞아요!', '아, 알겠어요.', '더 말씀해 주세요.'];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! 저는 당신의 AI 영어 선생님입니다. 오늘은 어떤 시나리오로 연습하고 싶으신가요?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('daily');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('intermediate');
  const [showScenarioSelect, setShowScenarioSelect] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startChat = () => {
    setShowScenarioSelect(false);
    const scenario = scenarios.find(s => s.id === selectedScenario);
    const difficulty = difficulties.find(d => d.id === selectedDifficulty);

    setMessages([{
      id: '0',
      role: 'assistant',
      content: `좋습니다! ${scenario?.label}에서 ${difficulty?.label} 수준으로 연습을 시작하겠습니다. 자유롭게 말씀해보세요. 한국어로 쓰시면 영어로 교정해드립니다. 👋`,
    }]);
  };

  const saveConversation = async () => {
    if (!user) return;

    try {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        scenario: selectedScenario,
        messages: messages.filter(m => m.role === 'user').map(m => ({ role: m.role, content: m.content })),
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      const difficulty = difficulties.find(d => d.id === selectedDifficulty);

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          userId: user?.id,
          scenario: scenario?.label,
          difficulty: difficulty?.label,
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || '죄송하지만 오류가 발생했습니다. 다시 말씀해주세요.',
        isNative: data.isNative || false,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-save conversation periodically
      if (messages.length % 10 === 0) {
        saveConversation();
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송하지만 지금은 응답할 수 없습니다. 나중에 다시 시도해주세요.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuickResponse = (text: string) => {
    setInput(text);
  };

  if (showScenarioSelect) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="AI 회화 연습"
          description="실제 상황을 상정한 시나리오로 자연스러운 영어 대화를 연습하세요."
          icon="💬"
        />

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Scenario Selection */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">시나리오 선택</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedScenario === scenario.id
                      ? 'bg-indigo-600/30 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <h4 className="font-bold text-white mb-1">{scenario.label}</h4>
                  <p className="text-xs text-slate-400">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">난이도 선택</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`p-6 rounded-xl border transition-all ${
                    selectedDifficulty === difficulty.id
                      ? 'bg-indigo-600/30 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <h4 className="font-bold text-white mb-2">{difficulty.label}</h4>
                  <p className="text-sm text-slate-400">{difficulty.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={startChat}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105"
            >
              대화 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto h-[70vh] flex flex-col bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center text-xl shadow-lg">
              🤖
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">AI 선생님</h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {scenarios.find(s => s.id === selectedScenario)?.label}
                <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full">
                  {difficulties.find(d => d.id === selectedDifficulty)?.label}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saveConversation();
              setShowScenarioSelect(true);
            }}
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
          >
            시나리오 변경
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] space-y-2`}>
                <div
                  className={`rounded-2xl px-5 py-3 ${message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>

                {message.isNative && message.role === 'assistant' && (
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400 w-fit">
                    <span>💬</span>
                    <span>네이티브 표현</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-5 py-4 border border-slate-700 flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Responses */}
        {!isLoading && (
          <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex gap-2 flex-wrap overflow-x-auto">
            {quickResponses.map((response) => (
              <button
                key={response}
                onClick={() => addQuickResponse(response)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all whitespace-nowrap"
              >
                {response}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="한국어 또는 영어로 입력하세요..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full p-3 h-12 w-12 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
