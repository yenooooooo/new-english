import { useState } from 'react';

export function Translation() {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [targetLang, setTargetLang] = useState('Korean'); // Default to English -> Korean

    const handleTranslate = async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setTranslatedText('');

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
        } catch (error) {
            console.error(error);
            setTranslatedText("Error mapping translation service. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwapLanguages = () => {
        setTargetLang(prev => prev === 'Korean' ? 'English' : 'Korean');
        setInputText(translatedText);
        setTranslatedText(inputText); // Swap current texts too
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight sm:text-4xl">
                    Smart Translation
                </h2>
                <p className="mt-4 text-lg text-slate-400">
                    Powered by Gemini AI. Get natural-sounding translations that capture native nuances.
                </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[400px]">
                {/* Source Language Area */}
                <div className="flex-1 flex flex-col p-6 border-b md:border-b-0 md:border-r border-slate-700 relative group">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-300">
                            {targetLang === 'Korean' ? 'English' : 'Korean'}
                        </h3>
                        {/* Swap Button (Visible on mobile between sections, and here absolutely positioned on desktop) */}
                        <button
                            onClick={handleSwapLanguages}
                            className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full items-center justify-center border border-slate-600 hover:border-emerald-500 transition-colors shadow-lg"
                        >
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Enter ${targetLang === 'Korean' ? 'English' : 'Korean'} text to translate...`}
                        className="flex-1 w-full bg-transparent border-none resize-none focus:ring-0 text-xl md:text-2xl text-white placeholder-slate-500 font-medium"
                    />

                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-slate-500">{inputText.length} characters</span>
                        <button
                            onClick={handleTranslate}
                            disabled={isLoading || !inputText.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Translating...' : 'Translate'}
                        </button>
                    </div>

                    {/* Mobile Swap Button */}
                    <div className="md:hidden flex justify-center -mb-9 mt-4 relative z-10">
                        <button
                            onClick={handleSwapLanguages}
                            className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600"
                        >
                            <svg className="w-5 h-5 text-slate-300 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Target Language Area */}
                <div className="flex-1 flex flex-col p-6 bg-slate-800/80">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-emerald-400">
                            {targetLang}
                        </h3>
                        <button
                            onClick={() => {
                                if (translatedText) navigator.clipboard.writeText(translatedText);
                            }}
                            title="Copy to clipboard"
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-transparent overflow-y-auto min-h-[150px]">
                        {isLoading ? (
                            <div className="flex space-x-2 h-full items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        ) : (
                            <p className={`text-xl md:text-2xl font-medium ${targetLang === 'Korean' ? 'font-korean' : ''} text-white`}>
                                {translatedText || <span className="text-slate-600">Translation will appear here...</span>}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
