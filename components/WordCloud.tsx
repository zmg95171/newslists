"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface WordCloudProps {
    words: string[];
    maxWords?: number;
}

export function WordCloud({ words, maxWords = 10 }: WordCloudProps) {
    // Simple "random" generation based on index to be deterministic
    const displayWords = words.slice(0, maxWords);

    return (
        <div className="flex flex-wrap gap-4 items-center justify-center p-6 min-h-[200px]">
            {displayWords.map((word, idx) => {
                // Pseudo-random sizing
                const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"];
                const colors = ["text-blue-500", "text-indigo-500", "text-purple-500", "text-sky-500", "text-cyan-600"];

                const sizeClass = sizes[(idx * 3 + word.length) % sizes.length];
                const colorClass = colors[(idx * 2 + word.length) % colors.length];
                const rotation = (idx % 3 === 0) ? 'rotate-[-5deg]' : (idx % 2 === 0 ? 'rotate-[5deg]' : 'rotate-0');

                return (
                    <span
                        key={idx}
                        className={cn(
                            "font-bold cursor-pointer hover:scale-110 transition-transform duration-300 drop-shadow-sm select-none",
                            sizeClass,
                            colorClass,
                            rotation
                        )}
                        title={`Definition of ${word}`}
                        onClick={() => {
                            // Future: show modal definition
                            // For now just speak it
                            const u = new SpeechSynthesisUtterance(word);
                            u.lang = 'en-US';
                            window.speechSynthesis.speak(u);
                        }}
                    >
                        {word}
                    </span>
                );
            })}
            {words.length === 0 && (
                <span className="text-muted-foreground italic">No core vocabulary found.</span>
            )}
        </div>
    );
}
