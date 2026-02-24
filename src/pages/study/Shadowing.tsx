import { useState, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';

export function Shadowing() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const { user } = useAuthStore();

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
            };

            mediaRecorder.start();
            setIsRecording(true);
            setAudioUrl(null); // Clear previous recording
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check your permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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
            // Endpoint to handle Vercel Blob/Supabase Storage upload
            const response = await fetch('/api/shadowing', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            console.log('Uploaded successfully:', data);
            alert('Audio uploaded successfully for feedback!');

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload audio. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                    Shadowing Practice
                </h2>
                <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
                    Listen to the native speaker and repeat exactly what you hear. Focus on intonation and rhythm.
                </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -m-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 space-y-8">
                    {/* Target Sentence Area */}
                    <div className="text-center space-y-4">
                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            Current Target
                        </span>
                        <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                            "It's not about how much we lost, it's about how much we have left."
                        </h3>
                        <p className="text-lg text-slate-400 font-korean">
                            우리가 얼마나 잃었는지가 중요한 게 아니야, 얼마나 남았는지가 중요하지.
                        </p>

                        <button className="mt-6 inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-colors text-sm font-medium">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Listen to Native Speaker
                        </button>
                    </div>

                    <div className="border-t border-slate-700/50 pt-8">
                        {/* Recording Controls */}
                        <div className="flex flex-col items-center space-y-6">
                            <div className="relative">
                                {isRecording && (
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
                                )}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 ${isRecording
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
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <p className={`font-medium ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                                {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                            </p>

                            {/* Playback and Upload */}
                            {audioUrl && !isRecording && (
                                <div className="w-full max-w-md bg-slate-800 rounded-2xl p-4 border border-slate-600 space-y-4 animate-fade-in-up">
                                    <div className="text-center font-medium text-slate-300 text-sm mb-2">Your Recording</div>
                                    <audio src={audioUrl} controls className="w-full" />
                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={uploadAudio}
                                            disabled={isUploading}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-colors font-medium flex items-center disabled:opacity-50"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : (
                                                'Get Feedback'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
