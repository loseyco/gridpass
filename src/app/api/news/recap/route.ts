import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Article, RawNewsItem } from '@/lib/types/news';
import crypto from 'crypto';

export const maxDuration = 300; // 5 min execution for Gemini processing

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  try {
    if (!genAI) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get time window
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const rawItemsSnap = await db.collection('raw_news_items')
      .where('ingested_at', '>=', fourHoursAgo.toISOString())
      .get();

    const items = rawItemsSnap.docs.map(doc => doc.data() as RawNewsItem);

    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No new items to synthesize.' });
    }

    // Group items by category for AI prompting
    const itemsByCategory: Record<string, RawNewsItem[]> = {};
    for (const item of items) {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    }

    // Prepare prompt
    const prompt = `
      You are the Editor-in-Chief for the Gridpass News Machine.
      Your task is to synthesize the following raw news items collected over the last 4 hours.
      Cross-reference facts across all sources to ensure 100% accuracy.
      
      Generate two things in a structured JSON response:
      1. A single authoritative, high-impact "4-Hour Racing Wire" article summarizing the key events across all categories.
      2. Up to 3 breakout articles for the most important individual stories.

      JSON Format:
      {
        "wire_article": {
          "title": "String",
          "subtitle": "String",
          "content": "String (Markdown format)",
          "category": "open_wheel" | "sportscar" | "stock_car" | "dirt" | "drag" | "motorcycles" | "sim_racing" | "car_shows",
          "tags": ["String"],
          "sources": [{"name": "String", "url": "String"}]
        },
        "breakout_articles": [
          {
            "title": "String",
            "subtitle": "String",
            "content": "String (Markdown format)",
            "category": "open_wheel" | "sportscar" | "stock_car" | "dirt" | "drag" | "motorcycles" | "sim_racing" | "car_shows",
            "tags": ["String"],
            "sources": [{"name": "String", "url": "String"}]
          }
        ]
      }

      Raw News Data:
      ${JSON.stringify(itemsByCategory, null, 2)}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON
    let parsedData;
    try {
      const jsonStr = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
      parsedData = JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse Gemini output:', responseText);
      return NextResponse.json({ error: 'AI output parsing failed' }, { status: 500 });
    }

    const generatedArticles: Article[] = [];
    const timestamp = now.toISOString();

    const writeArticle = async (data: any, type: '4_hour_wire' | 'breakout') => {
      const slug = slugify(data.title);
      const id = crypto.randomUUID();
      
      const article: Article = {
        id,
        slug: `${slug}-${id.substring(0, 8)}`,
        title: data.title,
        subtitle: data.subtitle,
        category: data.category || 'open_wheel',
        article_type: type,
        summary: data.subtitle,
        content: data.content,
        cover_image_url: null,
        gallery_urls: [],
        sources: data.sources || [],
        verified_by: 'Gridpass AI Engine',
        is_public: true,
        status: 'published',
        views: 0,
        referrers: {},
        published_at: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
        tags: data.tags || [],
      };

      await db.collection('news_articles').doc(id).set(article);
      generatedArticles.push(article);
    };

    if (parsedData.wire_article) {
      await writeArticle(parsedData.wire_article, '4_hour_wire');
    }

    if (parsedData.breakout_articles && Array.isArray(parsedData.breakout_articles)) {
      for (const breakout of parsedData.breakout_articles) {
        await writeArticle(breakout, 'breakout');
      }
    }

    return NextResponse.json({
      success: true,
      articles_generated: generatedArticles.length,
      articles: generatedArticles.map(a => a.title)
    });
  } catch (error) {
    console.error('Recap engine error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
