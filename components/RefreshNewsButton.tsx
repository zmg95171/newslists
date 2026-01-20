"use client";

import { useState } from 'react';
import { Newspaper, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RefreshNewsButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cron/fetch-news');
            const data = await res.json();

            if (res.ok && data.success) {
                if (data.processed === 0) {
                    const reasons = Object.entries(data.skippedReasons || {})
                        .filter(([_, count]) => (count as number) > 0)
                        .map(([reason, count]) => `${reason}: ${count}`)
                        .join(', ');
                    alert(`Fetched 0 new articles.\nSkipped reasons: ${reasons || 'None'}\n\nCheck server logs for more details.`);
                } else {
                    alert(data.message || 'News fetched successfully!');
                }
                router.refresh(); // Refresh the page to show new data
            } else {
                alert(`Failed to fetch news: ${data.message || data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while fetching news.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 font-medium hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
        >
            {loading ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <RefreshCw size={18} />
            )}
            {loading ? 'Fetching...' : 'Fetch New Stories'}
        </button>
    );
}
