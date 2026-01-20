import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

// Increase timeout for LLM processing if possible, or process only a few items
export const maxDuration = 60; // 60 seconds (Vercel generic limit)
export const dynamic = 'force-dynamic';

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-3.5-turbo';
const LLM_TEMPERATURE = parseFloat(process.env.LLM_TEMPERATURE || '0.5');
const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || '500');
const VOCABULARY_COUNT = parseInt(process.env.VOCABULARY_COUNT || '8');
const ENABLE_EXAMPLE_SENTENCES = process.env.ENABLE_EXAMPLE_SENTENCES === 'true';

async function processWithLLM(text: string, title: string) {
    if (!LLM_API_KEY) {
        // Return mock if no key (for dev)
        console.warn("No LLM_API_KEY provided, using mock data");
        return {
            simplifiedText: "This is a simulated simplified text because no LLM Key was provided. " + text.slice(0, 50) + "...",
            coreVocabulary: ["Simulation", "NoKey", "Test"],
            chineseSummary: "这是模拟数据,因为没有提供 LLM API Key。",
            vocabularyDetails: []
        }
    }

    const prompt = `
  You are a friendly American English podcast host for beginner learners. 
  Your goal is to explain the news in a helpful, conversational, and "spoken" style, perfect for listening practice.

  Task:
  1. **Spoken Story (The Content):** Retell the news article below (Title: "${title}") as if you are chatting directly to a listener. 
     - Use natural, spoken English (e.g., use contractions like "it's", "they're", "didn't").
     - Use simple connectors like "So...", "And then...", "But...".
     - Keep the tone warm, engaging, and casual.
     - Avoid formal "written" style or complex grammar. 
     - Keep it suitable for A2/B1 level learners. 
     - Length: around 100-150 words.
  2. **Core Vocabulary:** Extract ${VOCABULARY_COUNT} interesting words or phrases from your spoken story suitable for beginners to learn.
  ${ENABLE_EXAMPLE_SENTENCES ? '3. **Example Sentences:** For each vocabulary word, provide a simple, conversational example sentence (not a dictionary definition style).' : ''}
  4. **Chinese Summary:** Provide a summary in Chinese (Simplified).

  Input Article:
  "${text.slice(0, 2000)}"

  Output **ONLY** a valid JSON object with this exact structure:
  {
    "simplifiedText": "Hey listeners! Today's story is about...",
    "coreVocabulary": ["Word1", "Word2", ...],
    ${ENABLE_EXAMPLE_SENTENCES ? '"vocabularyDetails": [{"word": "Word1", "sentence": "Example..."}], ' : ''}
    "chineseSummary": "中文摘要..."
  }
  `;

    try {
        const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: "system", content: "You represent a JSON API. You answer strictly in JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: LLM_TEMPERATURE,
                max_tokens: LLM_MAX_TOKENS
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("LLM Error:", err);
            throw new Error("LLM API Failed");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse JSON from content (handle markdown code blocks if present)
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("LLM Processing Failed:", error);
        return null;
    }
}

export async function GET(request: Request) {
    // Security: Check for CRON secret if configured
    const cronSecret = process.env.CRON_SECRET;
    // Allow local development to bypass this check
    if (cronSecret && process.env.NODE_ENV !== 'development') {
        const { searchParams } = new URL(request.url);
        const providedSecret = searchParams.get('secret');
        if (providedSecret !== cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    if (!NEWSDATA_API_KEY && process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ error: 'NEWSDATA_API_KEY not configured' }, { status: 500 });
    }

    try {
        await dbConnect();

        // Configuration
        const requireImage = process.env.REQUIRE_IMAGE === 'true';
        const minContentLength = parseInt(process.env.MIN_CONTENT_LENGTH || '200');
        const articlesPerRun = parseInt(process.env.ARTICLES_PER_RUN || '5');
        const newsCategories = process.env.NEWS_CATEGORIES || 'technology,science,health';

        // 1. Fetch News
        const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&language=en&category=${newsCategories}`;

        console.log("Fetching news from:", url.replace(NEWSDATA_API_KEY || '', 'HIDDEN_KEY'));

        const newsResponse = await fetch(url);
        if (!newsResponse.ok) {
            console.error("News API failed:", await newsResponse.text());
            return NextResponse.json({ error: 'News Data API failed' }, { status: 502 });
        }

        const newsData = await newsResponse.json();
        const results = newsData.results || [];
        console.log(`Fetched ${results.length} articles from NewsData API`);

        let processedCount = 0;
        let skippedCount = 0;
        const skippedReasons: Record<string, number> = {
            'already_exists': 0,
            'no_image': 0,
            'too_short': 0,
            'llm_failed': 0
        };

        for (const item of results) {
            if (processedCount >= articlesPerRun) break;

            // Check if exists
            const exists = await Article.findOne({ originalId: item.article_id });
            if (exists) {
                skippedReasons['already_exists']++;
                continue;
            }

            // Filter: Require image if configured
            if (requireImage && !item.image_url) {
                skippedReasons['no_image']++;
                skippedCount++;
                continue;
            }

            // Filter: Filter out duplicates

            // Filter: Check minimum content length
            // Strategy: Pick the longest available text to maximize context (and pass the length filter)
            // This handles cases where 'description' is a short "Read more" stub but 'title' is long and descriptive.
            const candidates = [item.content, item.description, item.title].filter((s: any) => s && typeof s === 'string');
            const originalText = candidates.sort((a: any, b: any) => b.length - a.length)[0] || "";

            if (originalText.length < minContentLength) {
                console.log(`Skipping article "${item.title.substring(0, 20)}...": Content length ${originalText.length} < ${minContentLength}`);
                skippedReasons['too_short']++;
                skippedCount++;
                continue;
            }

            // Process with LLM
            const llmResult = await processWithLLM(originalText, item.title);

            if (llmResult) {
                await Article.create({
                    originalId: item.article_id,
                    title: item.title,
                    simplifiedText: llmResult.simplifiedText,
                    coreVocabulary: llmResult.coreVocabulary,
                    chineseSummary: llmResult.chineseSummary,
                    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                    imageUrl: item.image_url,
                    category: item.category ? item.category[0] : 'General',
                    source: item.source_id,
                    originalUrl: item.link
                });
                processedCount++;
            } else {
                skippedReasons['llm_failed']++;
                skippedCount++;
            }
        }

        console.log("Fetch Summary:", { processed: processedCount, skipped: skippedCount, reasons: skippedReasons });

        // Trigger revalidation of the home page
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: `Processed ${processedCount} new articles`,
            totalFetched: results.length,
            processed: processedCount,
            skipped: skippedCount,
            skippedReasons,
            debug_skippedItems: skippedCount > 0 ? results.slice(0, 3).map((i: any) => ({
                title: i.title,
                contentLen: (i.content || i.description || i.title || "").length,
                hasImage: !!i.image_url
            })) : undefined,
            configuration: {
                requireImage,
                minContentLength,
                articlesPerRun,
                categories: newsCategories
            }
        });

    } catch (error) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
