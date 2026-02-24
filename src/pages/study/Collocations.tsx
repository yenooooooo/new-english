import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/db';

interface Collocation {
    id: string;
    word: string;
    collocation: string;
    example_sentence: string;
    korean_meaning: string;
}

export function Collocations() {
    const [collocations, setCollocations] = useState<Collocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetchCollocations();
    }, []);

    const fetchCollocations = async () => {
        try {
            // Setup demo collocations if DB isn't populated
            const { data, error } = await supabase
                .from('collocations')
                .select('*')
                .limit(10);

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                setCollocations(data);
            } else {
                // Fallback demo data to showcase UI
                setCollocations([
                    {
                        id: "1",
                        word: "Decision",
                        collocation: "Make a decision",
                        example_sentence: "It's time you made a decision about your future.",
                        korean_meaning: "결정을 내리다"
                    },
                    {
                        id: "2",
                        word: "Attention",
                        collocation: "Pay attention",
                        example_sentence: "Please pay attention to the instructions.",
                        korean_meaning: "주의를 기울이다"
                    },
                    {
                        id: "3",
                        word: "Difference",
                        collocation: "Make a difference",
                        example_sentence: "Volunteering can really make a difference in people's lives.",
                        korean_meaning: "차이를 만들다, 변화를 가져오다"
                    }
                ]);
            }
        } catch (e) {
            console.error(e);
            // Fallback
            setCollocations([
                {
                    id: "1",
                    word: "Decision",
                    collocation: "Make a decision",
                    example_sentence: "It's time you made a decision about your future.",
                    korean_meaning: "결정을 내리다 (do a decision 아님!)"
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    const currentItem = collocations[currentIndex];

    const nextItem = () => {
        setCurrentIndex((prev) => (prev + 1) % collocations.length);
    };

    const prevItem = () => {
        setCurrentIndex((prev) => (prev - 1 + collocations.length) % collocations.length);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Collocation Practice
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">Words that naturally go together</p>
                </div>

                <span className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 font-medium text-pink-400">
                    {currentIndex + 1} / {collocations.length}
                </span>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 shadow-[0_0_40px_rgba(236,72,153,0.1)] relative overflow-hidden transition-all duration-300 hover:border-pink-500/50 hover:shadow-[0_0_50px_rgba(236,72,153,0.15)] group flex flex-col items-center">

                {/* Background accent */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 w-full text-center space-y-8">
                    <div className="inline-block">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] relative">
                            Target Word
                        </span>
                        <h3 className="text-4xl font-extrabold text-white mt-2 drop-shadow-lg">
                            {currentItem.word}
                        </h3>
                    </div>

                    <div className="py-6 border-y border-slate-700/50 relative">
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-slate-800/20 rounded-xl blur-xl -z-10"></div>
                        <h4 className="text-3xl font-bold text-pink-400">
                            <span className="animate-pulse opacity-70">"</span>
                            {currentItem.collocation}
                            <span className="animate-pulse opacity-70">"</span>
                        </h4>
                        <p className="text-lg text-slate-300 font-korean mt-3">
                            {currentItem.korean_meaning}
                        </p>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                        <p className="text-lg text-slate-200 font-medium italic">
                            {currentItem.example_sentence}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-center gap-6 pt-4">
                <button
                    onClick={prevItem}
                    className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all hover:scale-110 active:scale-95 text-slate-300 shadow-md group"
                >
                    <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={nextItem}
                    className="p-4 rounded-full bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-500 hover:to-orange-400 border border-transparent shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all hover:scale-110 active:scale-95 text-white group relative overflow-hidden"
                >
                    {/* Shine effect */}
                    <div className="absolute top-0 -left-full w-1/2 h-full bg-white/20 skew-x-12 group-hover:animate-shine"></div>
                    <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

        </div>
    );
}
