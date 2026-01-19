"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    text: string;
    className?: string;
}

const TTS_API_URL = "https://tts-api.2068.online";

export function AudioPlayer({ text, className }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [voice, setVoice] = useState("en-US-AriaNeural"); // Default voice
    const [playbackRate, setPlaybackRate] = useState(1.0); // Default speed 1.0x

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const fetchAndPlay = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${TTS_API_URL}/synthesize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, voice }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch audio");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audio = new Audio(url);
            audioRef.current = audio;

            // Apply playback rate
            audio.playbackRate = playbackRate;

            audio.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(url);
            };

            audio.play();
            setIsPlaying(true);
        } catch (error) {
            console.error("TTS Error:", error);
            alert("Failed to generate audio. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlay = () => {
        if (isLoading) return;

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else if (audioRef.current && !isPlaying) {
            // Resume if exists? Audio element doesn't keep state well if we created new one each time.
            // But here we keep audioRef. Check if it's the same text? 
            // Simplified: if audio exists, play it. If not (or different text logic needed), fetch.
            // For now, if we have audioRef, we play. THIS assumes single track.
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            fetchAndPlay();
        }
    };

    // If text changes, we should probably reset?
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }
    }, [text, voice]);

    // Update playback rate when it changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    return (
        <div className={cn("glass rounded-xl p-4 flex flex-col gap-3", className)}>
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex-shrink-0"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={22} />
                    ) : isPlaying ? (
                        <Pause size={22} />
                    ) : (
                        <Play size={22} className="ml-0.5" />
                    )}
                </button>

                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <Volume2 size={16} className="text-primary" />
                        <span>AI Read Aloud</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {voice.split('-').slice(2).join(' ')} Voice • {playbackRate}x Speed
                    </p>
                </div>

                <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                    className="text-xs border rounded px-2 py-1.5 bg-white dark:bg-slate-800 max-w-[110px]"
                    disabled={isPlaying || isLoading}
                >
                    <option value="en-US-AriaNeural">Aria (US)</option>
                    <option value="en-US-GuyNeural">Guy (US)</option>
                    <option value="en-GB-SoniaNeural">Sonia (UK)</option>
                    <option value="en-AU-NatashaNeural">Natasha (AU)</option>
                </select>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-3 px-1">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Speed:
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={isLoading}
                />
                <span className="text-xs font-medium text-primary min-w-[35px] text-right">
                    {playbackRate.toFixed(1)}x
                </span>
            </div>
        </div>
    );
}
