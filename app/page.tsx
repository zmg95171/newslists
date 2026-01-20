import { NewsCard } from '@/components/NewsCard';
import { RefreshNewsButton } from '@/components/RefreshNewsButton';
import dbConnect from '@/lib/mongodb';
import Article, { IArticle } from '@/models/Article';
import { Newspaper } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

async function getArticles() {
  try {
    await dbConnect();
    const articles = await Article.find({}).sort({ pubDate: -1 }).limit(10).lean();

    // Serialize MongoDB objects (convert _id to string, etc if needed by client, 
    // but strict serialization is mostly for passing to Client Components. 
    // Here we pass properties carefully or map them.)
    return JSON.parse(JSON.stringify(articles)) as IArticle[];
  } catch (error) {
    console.error("Failed to fetch articles", error);
    return [];
  }
}

export default async function Home() {
  const articles = await getArticles();

  // Mock data if empty
  const displayArticles = articles.length > 0 ? articles : [
    {
      _id: 'mock1',
      title: 'Scientists Discover New Planet',
      simplifiedText: 'Scientists found a new planet far away in space. The planet is very big. It is bigger than Earth. The planet goes around a star. The star is like our Sun. Scientists used a big telescope to see it. They are very happy about this discovery. They want to learn more about the planet.',
      chineseSummary: '科学家在太空中发现了一颗新行星。这颗行星非常大,比地球还大。它围绕一颗类似太阳的恒星运行。',
      coreVocabulary: ['planet', 'discover', 'space', 'telescope', 'scientist'],
      pubDate: '2026-01-18T00:00:00.000Z',
      category: 'Science',
      imageUrl: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle,
    {
      _id: 'mock2',
      title: 'New Technology Helps Students Learn',
      simplifiedText: 'A new app helps students learn English. The app uses AI to make learning fun. Students can talk to the app. The app listens and gives feedback. Many students like this app. They say it helps them speak better. Teachers also like the app. They use it in their classes.',
      chineseSummary: '一款新应用帮助学生学习英语。该应用使用AI使学习变得有趣。学生可以与应用对话,获得反馈。',
      coreVocabulary: ['technology', 'learn', 'app', 'student', 'feedback'],
      pubDate: '2026-01-17T00:00:00.000Z',
      category: 'Technology',
      imageUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle,
    {
      _id: 'mock3',
      title: 'Healthy Food Makes You Strong',
      simplifiedText: 'Eating good food is important for your body. Fruits and vegetables are very healthy. They give you energy. They help you grow strong. Doctors say we should eat five fruits or vegetables every day. Water is also important. Drink water to stay healthy. Avoid too much sugar and salt.',
      chineseSummary: '吃健康的食物对身体很重要。水果和蔬菜非常健康,能给你能量,帮助你变强壮。',
      coreVocabulary: ['healthy', 'food', 'fruit', 'vegetable', 'energy'],
      pubDate: '2026-01-16T00:00:00.000Z',
      category: 'Health',
      imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle,
    {
      _id: 'mock4',
      title: 'Climate Change Affects Weather',
      simplifiedText: 'The Earth is getting warmer. This is called climate change. It makes the weather different. Some places get more rain. Other places get less rain. Ice in cold places is melting. Scientists are worried. They say we need to help the Earth. We can use less energy and recycle more.',
      chineseSummary: '地球正在变暖,这被称为气候变化。它使天气变得不同。科学家们很担心,我们需要帮助地球。',
      coreVocabulary: ['climate', 'weather', 'warm', 'energy', 'recycle'],
      pubDate: '2026-01-15T00:00:00.000Z',
      category: 'Environment',
      imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle,
    {
      _id: 'mock5',
      title: 'Sports Team Wins Big Game',
      simplifiedText: 'The local basketball team won an important game yesterday. They played very well. The players worked together as a team. The crowd was very excited. Many fans came to watch. The team scored many points. The coach was proud of the players. They will play again next week.',
      chineseSummary: '当地篮球队昨天赢得了一场重要比赛。他们表现很好,球员们团队合作。教练为球员们感到骄傲。',
      coreVocabulary: ['sports', 'team', 'game', 'win', 'player'],
      pubDate: '2026-01-14T00:00:00.000Z',
      category: 'Sports',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle,
    {
      _id: 'mock6',
      title: 'Art Museum Opens New Exhibition',
      simplifiedText: 'The city art museum has a new exhibition. It shows paintings from famous artists. The paintings are very beautiful. They use many colors. People can visit the museum every day. The museum is open from morning to evening. Students can visit for free. Many people love art and want to see it.',
      chineseSummary: '城市艺术博物馆开设了新展览,展示著名艺术家的画作。这些画非常美丽,使用了很多颜色。',
      coreVocabulary: ['art', 'museum', 'exhibition', 'painting', 'beautiful'],
      pubDate: '2026-01-13T00:00:00.000Z',
      category: 'Culture',
      imageUrl: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=80&w=1000'
    } as unknown as IArticle
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
              Vivid News
            </h1>
            <p className="text-lg text-muted-foreground">
              Master English with Simplified News & AI Audio
            </p>
          </div>
          <div className="flex gap-2">
            <RefreshNewsButton />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayArticles.map((article) => (
            <NewsCard key={String(article._id)} article={article} />
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center p-10 glass rounded-xl">
            <h2 className="text-2xl font-bold mb-2">No Articles Found</h2>
            <p className="text-muted-foreground">The database is currently empty. Please trigger the fetch job.</p>
          </div>
        )}
      </div>
    </main>
  );
}
