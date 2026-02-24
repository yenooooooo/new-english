import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';
// Removed unused authStore import

interface Word {
    id: string;
    word: string;
    meaning: string;
    example_en: string;
    example_ko: string;
    cefr_level: string;
}

export function Vocabulary() {
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    /* Use auth storage later for SM-2 save endpoints */

    useEffect(() => {
        fetchWords();
    }, []);

    const fetchWords = async () => {
        // For now, fetch random words. Later this will use SM-2 scheduling
        const { data, error } = await supabase
            .from('vocabulary')
            .select('*')
            .limit(10);

        if (!error && data) {
            setWords(data);
        }
        setLoading(false);
    };

    const nextWord = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % words.length);
        }, 150);
    };

    const prevWord = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
        }, 150);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                <h3 className="text-xl font-bold text-slate-300">No words found</h3>
                <p className="text-slate-400 mt-2">Please add some vocabulary to your database.</p>
            </div>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Daily Vocabulary
                </h2>
                <span className="bg-slate-800 px-4 py-1.5 rounded-full text-sm font-medium text-slate-300 border border-slate-700">
                    {currentIndex + 1} / {words.length}
                </span>
            </div>

            {/* Flashcard Container */}
            <div
                className="relative h-96 w-full cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>

                    {/* Front of Card */}
                    <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl hover:border-indigo-500/50 transition-colors">
                        <span className="absolute top-6 left-6 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                            {currentWord.cefr_level}
                        </span>
                        <h3 className="text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
                            {currentWord.word}
                        </h3>
                        <p className="text-slate-400 font-medium">Click to reveal meaning</p>
                    </div>

                    {/* Back of Card */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10 bg-indigo-900/40 backdrop-blur-xl rounded-3xl border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.15)]">
                        <h3 className="text-4xl font-bold text-blue-300 mb-6 font-korean">
                            {currentWord.meaning}
                        </h3>
                        <div className="text-center space-y-4 w-full max-w-lg">
                            <p className="text-lg text-white font-medium italic">
                                "{currentWord.example_en}"
                            </p>
                            <p className="text-md text-indigo-300/80 font-korean">
                                {currentWord.example_ko}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={(e) => { e.stopPropagation(); prevWord(); }}
                    className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all hover:scale-110 active:scale-95 text-slate-300"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextWord(); }}
                    className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-transparent shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all hover:scale-110 active:scale-95 text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
