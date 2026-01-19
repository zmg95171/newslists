import Link from 'next/link';
import { Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { IArticle } from '@/models/Article';
import { cn } from '@/lib/utils';

interface NewsCardProps {
    article: Partial<IArticle>;
    className?: string;
}

export function NewsCard({ article, className }: NewsCardProps) {
    return (
        <div className={cn("glass-card rounded-2xl overflow-hidden flex flex-col h-full group", className)}>
            <div className="relative h-48 w-full overflow-hidden">
                {article.imageUrl ? (
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
                        News
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {article.category || 'General'}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-muted-foreground mb-3 space-x-2">
                    <Calendar size={14} />
                    <span>{article.pubDate ? new Date(article.pubDate).toLocaleDateString() : 'Unknown Date'}</span>
                </div>

                <h3 className="text-xl font-bold tracking-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {article.chineseSummary}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                    {article.coreVocabulary?.slice(0, 3).map((word, idx) => (
                        <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                            {word}
                        </span>
                    ))}
                </div>

                <Link href={`/article/${article._id}`} className="mt-auto">
                    <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                        Read Simple Version <ArrowRight size={16} />
                    </button>
                </Link>
            </div>
        </div>
    );
}
