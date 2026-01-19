import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Article from '@/models/Article';

export const dynamic = 'force-dynamic';

// Simple rate limiting (in-memory, resets on deployment)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '100');
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

export async function GET(request: Request) {
    // Check if API is enabled
    if (process.env.API_ENABLED === 'false') {
        return NextResponse.json({ error: 'API access is disabled' }, { status: 403 });
    }

    // Check API key if required
    if (process.env.API_KEY_REQUIRED === 'true') {
        const apiKey = request.headers.get('X-API-Key');
        const validKey = process.env.API_KEY;
        if (!apiKey || apiKey !== validKey) {
            return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
        }
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
        return NextResponse.json({
            error: 'Rate limit exceeded',
            limit: RATE_LIMIT,
            window: '1 hour'
        }, { status: 429 });
    }

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 per request
        const category = searchParams.get('category');
        const skip = (page - 1) * limit;

        const query = category ? { category } : {};

        const [articles, total] = await Promise.all([
            Article.find(query)
                .sort({ pubDate: -1 })
                .skip(skip)
                .limit(limit)
                .select('-__v')
                .lean(),
            Article.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            data: articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
