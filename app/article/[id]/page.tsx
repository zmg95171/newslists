import dbConnect from '@/lib/mongodb';
import Article, { IArticle } from '@/models/Article';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';
import { AudioPlayer } from '@/components/AudioPlayer';
import { WordCloud } from '@/components/WordCloud';

async function getArticle(id: string) {
    try {
        await dbConnect();
        const article = await Article.findById(id).lean();
        if (!article) return null;
        return JSON.parse(JSON.stringify(article)) as IArticle;
    } catch (error) {
        return null;
    }
}

export default async function ArticlePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const article = await getArticle(params.id);

    if (!article) {
        // Check if it's a mock article
        if (params.id.startsWith('mock')) {
            return <MockArticleView id={params.id} />
        }
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to News
                </Link>

                {/* Hero Section */}
                <div className="glass rounded-3xl overflow-hidden shadow-xl mb-8">
                    <div className="h-64 md:h-80 relative">
                        {article.imageUrl && (
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end">
                            <div className="p-8 text-white w-full">
                                <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
                                    <span className="bg-white/20 px-2 py-1 rounded backdrop-blur-md">{article.category || 'News'}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(article.pubDate).toLocaleDateString()}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-lg">{article.title}</h1>
                            </div>
                        </div>
                    </div>

                    {/* Audio Player Sticky/Prominent */}
                    <div className="p-6 border-b bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <AudioPlayer text={article.simplifiedText} className="w-full shadow-sm" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x border-b">
                        {/* English Content */}
                        <div className="p-8 bg-white/60 dark:bg-slate-800/60">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Simplified English</h2>
                            <div className="prose dark:prose-invert text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                                {article.simplifiedText.split('\n').map((para, i) => para && <p key={i} className="mb-4 last:mb-0">{para}</p>)}
                            </div>
                        </div>

                        {/* Chinese Summary */}
                        <div className="p-8 bg-slate-50/60 dark:bg-slate-900/60">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Chinese Summary</h2>
                            <div className="prose dark:prose-invert text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                {article.chineseSummary.split('\n').map((para, i) => para && <p key={i} className="mb-4 last:mb-0">{para}</p>)}
                            </div>
                        </div>
                    </div>

                    {/* Vocabulary Section */}
                    <div className="p-8 bg-white/40 dark:bg-slate-800/40">
                        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">
                            Core Vocabulary {article.vocabularyDetails && article.vocabularyDetails.length > 0 ? '& Spoken Examples' : ''}
                        </h2>

                        {article.vocabularyDetails && article.vocabularyDetails.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {article.vocabularyDetails.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl border hover:shadow-md transition-shadow group">
                                        <div className="font-bold text-xl text-primary mb-2 group-hover:text-primary/80 transition-colors">{item.word}</div>
                                        <div className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed">
                                            "{item.sentence}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl border p-4">
                                <WordCloud words={article.coreVocabulary} />
                            </div>
                        )}
                    </div>

                    {/* Footer / Original Link */}
                    <div className="p-6 bg-slate-100/50 dark:bg-slate-900/50 flex justify-between items-center text-sm text-muted-foreground">
                        <span>Source: {article.source || 'Verified Source'}</span>
                        {article.originalUrl && (
                            <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
                                Read Original <ExternalLink size={14} className="ml-1" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MockArticleView({ id }: { id: string }) {
    const mockArticles: Record<string, IArticle> = {
        'mock1': {
            _id: 'mock1',
            title: 'Scientists Discover New Planet',
            simplifiedText: 'Scientists found a new planet far away in space. The planet is very big. It is bigger than Earth. The planet goes around a star. The star is like our Sun. Scientists used a big telescope to see it. They are very happy about this discovery. They want to learn more about the planet.\n\nThis discovery is important for science. It helps us understand space better. Maybe one day we can visit this planet. For now, we can only look at it from Earth. The scientists will keep studying it.',
            chineseSummary: '科学家在太空中发现了一颗新行星。这颗行星非常大,比地球还大。它围绕一颗类似太阳的恒星运行。\n\n这一发现对科学很重要。它帮助我们更好地了解太空。',
            coreVocabulary: ['planet', 'discover', 'space', 'telescope', 'scientist', 'Earth', 'star', 'important'],
            pubDate: '2026-01-18T00:00:00.000Z',
            category: 'Science',
            imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=1000',
            source: 'Science Daily',
            originalUrl: '#'
        } as unknown as IArticle,
        'mock2': {
            _id: 'mock2',
            title: 'New Technology Helps Students Learn',
            simplifiedText: 'A new app helps students learn English. The app uses AI to make learning fun. Students can talk to the app. The app listens and gives feedback. Many students like this app. They say it helps them speak better. Teachers also like the app. They use it in their classes.\n\nThe app is free for students. It works on phones and computers. You can use it anywhere. Learning English is now easier and more fun.',
            chineseSummary: '一款新应用帮助学生学习英语。该应用使用AI使学习变得有趣。学生可以与应用对话,获得反馈。\n\n该应用对学生免费。它可以在手机和电脑上使用。学习英语现在更容易、更有趣了。',
            coreVocabulary: ['technology', 'learn', 'app', 'student', 'feedback', 'AI', 'English', 'teacher'],
            pubDate: '2026-01-17T00:00:00.000Z',
            category: 'Technology',
            imageUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1000',
            source: 'Tech News',
            originalUrl: '#'
        } as unknown as IArticle,
        'mock3': {
            _id: 'mock3',
            title: 'Healthy Food Makes You Strong',
            simplifiedText: 'Eating good food is important for your body. Fruits and vegetables are very healthy. They give you energy. They help you grow strong. Doctors say we should eat five fruits or vegetables every day. Water is also important. Drink water to stay healthy. Avoid too much sugar and salt.\n\nHealthy eating is a good habit. Start eating better today. Your body will thank you. You will feel better and have more energy.',
            chineseSummary: '吃健康的食物对身体很重要。水果和蔬菜非常健康,能给你能量,帮助你变强壮。\n\n健康饮食是一个好习惯。从今天开始吃得更好。你会感觉更好,有更多的能量。',
            coreVocabulary: ['healthy', 'food', 'fruit', 'vegetable', 'energy', 'doctor', 'water', 'strong'],
            pubDate: '2026-01-16T00:00:00.000Z',
            category: 'Health',
            imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000',
            source: 'Health Magazine',
            originalUrl: '#'
        } as unknown as IArticle,
        'mock4': {
            _id: 'mock4',
            title: 'Climate Change Affects Weather',
            simplifiedText: 'The Earth is getting warmer. This is called climate change. It makes the weather different. Some places get more rain. Other places get less rain. Ice in cold places is melting. Scientists are worried. They say we need to help the Earth. We can use less energy and recycle more.\n\nEveryone can help fight climate change. Turn off lights when you leave a room. Walk or bike instead of driving. Plant trees. These small actions make a big difference.',
            chineseSummary: '地球正在变暖,这被称为气候变化。它使天气变得不同。科学家们很担心,我们需要帮助地球。\n\n每个人都可以帮助对抗气候变化。离开房间时关灯。步行或骑自行车而不是开车。种树。这些小行动会产生很大的影响。',
            coreVocabulary: ['climate', 'weather', 'warm', 'energy', 'recycle', 'Earth', 'scientist', 'help'],
            pubDate: '2026-01-15T00:00:00.000Z',
            category: 'Environment',
            imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?auto=format&fit=crop&q=80&w=1000',
            source: 'Environment Today',
            originalUrl: '#'
        } as unknown as IArticle,
        'mock5': {
            _id: 'mock5',
            title: 'Sports Team Wins Big Game',
            simplifiedText: 'The local basketball team won an important game yesterday. They played very well. The players worked together as a team. The crowd was very excited. Many fans came to watch. The team scored many points. The coach was proud of the players. They will play again next week.\n\nTeamwork is very important in sports. When players work together, they can win. The team practiced hard every day. Their hard work paid off.',
            chineseSummary: '当地篮球队昨天赢得了一场重要比赛。他们表现很好,球员们团队合作。教练为球员们感到骄傲。\n\n团队合作在体育运动中非常重要。当球员们一起努力时,他们就能获胜。球队每天都努力训练。他们的努力得到了回报。',
            coreVocabulary: ['sports', 'team', 'game', 'win', 'player', 'coach', 'practice', 'teamwork'],
            pubDate: '2026-01-14T00:00:00.000Z',
            category: 'Sports',
            imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000',
            source: 'Sports Daily',
            originalUrl: '#'
        } as unknown as IArticle,
        'mock6': {
            _id: 'mock6',
            title: 'Art Museum Opens New Exhibition',
            simplifiedText: 'The city art museum has a new exhibition. It shows paintings from famous artists. The paintings are very beautiful. They use many colors. People can visit the museum every day. The museum is open from morning to evening. Students can visit for free. Many people love art and want to see it.\n\nArt is important for culture. It makes us think and feel. Visiting museums is a good way to learn about art. You can see many different styles of painting.',
            chineseSummary: '城市艺术博物馆开设了新展览,展示著名艺术家的画作。这些画非常美丽,使用了很多颜色。\n\n艺术对文化很重要。它让我们思考和感受。参观博物馆是了解艺术的好方法。你可以看到许多不同风格的画作。',
            coreVocabulary: ['art', 'museum', 'exhibition', 'painting', 'beautiful', 'artist', 'culture', 'visit'],
            pubDate: '2026-01-13T00:00:00.000Z',
            category: 'Culture',
            imageUrl: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=80&w=1000',
            source: 'Culture News',
            originalUrl: '#'
        } as unknown as IArticle
    };

    const article = mockArticles[id] || mockArticles['mock1'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to News
                </Link>

                {/* Hero Section */}
                <div className="glass rounded-3xl overflow-hidden shadow-xl mb-8">
                    <div className="h-64 md:h-80 relative">
                        {article.imageUrl && (
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end">
                            <div className="p-8 text-white w-full">
                                <div className="flex items-center gap-2 text-sm opacity-80 mb-2">
                                    <span className="bg-white/20 px-2 py-1 rounded backdrop-blur-md">{article.category || 'News'}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(article.pubDate).toLocaleDateString()}</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-lg">{article.title}</h1>
                            </div>
                        </div>
                    </div>

                    {/* Audio Player Sticky/Prominent */}
                    <div className="p-6 border-b bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                        <AudioPlayer text={article.simplifiedText} className="w-full shadow-sm" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x border-b">
                        {/* English Content */}
                        <div className="p-8 bg-white/60 dark:bg-slate-800/60">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Simplified English</h2>
                            <div className="prose dark:prose-invert text-lg leading-relaxed text-slate-700 dark:text-slate-200">
                                {article.simplifiedText.split('\n').map((para, i) => para && <p key={i} className="mb-4 last:mb-0">{para}</p>)}
                            </div>
                        </div>

                        {/* Chinese Summary */}
                        <div className="p-8 bg-slate-50/60 dark:bg-slate-900/60">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Chinese Summary</h2>
                            <div className="prose dark:prose-invert text-base leading-relaxed text-slate-600 dark:text-slate-400">
                                {article.chineseSummary.split('\n').map((para, i) => para && <p key={i} className="mb-4 last:mb-0">{para}</p>)}
                            </div>
                        </div>
                    </div>

                    {/* Word Cloud */}
                    <div className="p-8 bg-white/40 dark:bg-slate-800/40">
                        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Core Vocabulary</h2>
                        <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl border p-4">
                            <WordCloud words={article.coreVocabulary} />
                        </div>
                    </div>

                    {/* Footer / Original Link */}
                    <div className="p-6 bg-slate-100/50 dark:bg-slate-900/50 flex justify-between items-center text-sm text-muted-foreground">
                        <span>Source: {article.source || 'Verified Source'}</span>
                        {article.originalUrl && (
                            <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
                                Read Original <ExternalLink size={14} className="ml-1" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
