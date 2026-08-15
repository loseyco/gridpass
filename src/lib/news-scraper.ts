import * as cheerio from "cheerio";
// @ts-ignore
import Parser from "rss-parser";
import { cleanStoryText } from "./news-cleaner";

export { cleanStoryText };

export interface ScrapedArticleResult {
  title: string;
  cover_image: string;
  summary: string;
  content: string;
  author?: string;
  published_at?: string;
}

export async function scrapeFullArticle(url: string): Promise<ScrapedArticleResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Gridpass-News-Crawler/2.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return await scrapeWithHeadlessBrowser(url);
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. High-Res Cover Image
    let coverImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="og:image:secure_url"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[name="twitter:image:src"]').attr("content") ||
      $('article img, .post-thumbnail img, .featured-image img, .entry-content img').first().attr("src") ||
      "";

    if (coverImage && !coverImage.startsWith("http")) {
      try {
        const parsedUrl = new URL(url);
        coverImage = parsedUrl.origin + (coverImage.startsWith("/") ? "" : "/") + coverImage;
      } catch {}
    }

    // 2. Title & Author
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("h1.entry-title, h1.post-title, h1.article-title, h1").first().text().trim() ||
      "";

    const author =
      $('meta[name="author"]').attr("content") ||
      $('.author-name, .byline, [rel="author"]').first().text().trim() ||
      "Paddock Wire";

    // 3. Clean up unwanted elements before extracting content
    $(
      'script, style, iframe, .ads, .advertisement, .related-posts, .related-articles, .related, .yarpp, .post-links, .wp-block-latest-posts, .feed-links, .widget, .sidebar, .menu, nav, footer, header, .author-box, .post-meta, .jp-relatedposts, [class*="related"], [class*="popular"], [class*="recommended"], [class*="widget"], [id*="related"]'
    ).remove();

    const isJunkParagraph = (t: string) => {
      const lower = t.toLowerCase().trim();
      return (
        lower.length < 20 ||
        /preferred sources|google news|trusted source|follow us on|subscribe to|newsletter|appeared first on|all rights reserved|cookie policy|terms of use|terms of service|photo by|image credit|read more|advertisement|sign up|join our discord|minute read|published on|written by/i.test(lower) ||
        /^\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i.test(lower) ||
        /^by\s+[a-z\s\.\-]+$/i.test(lower)
      );
    };

    // 4. Content extraction
    let paragraphs: string[] = [];
    const mainContainer = $('article, .entry-content, .post-content, .article-body, .td-post-content, .story-content, .article__body, .c-entry-content, .entry, main').first();

    if (mainContainer.length > 0) {
      mainContainer.find('p, h2, h3, blockquote').each((_, el) => {
        const tag = el.tagName.toLowerCase();
        const $el = $(el);

        // If the element is purely a link to another post, skip it
        const childLinks = $el.find('a');
        if (childLinks.length > 0 && childLinks.text().trim().length >= $el.text().trim().length * 0.75) {
          return;
        }

        const text = $el.text().trim().replace(/\s+/g, ' ');
        if (!text) return;
        if (isJunkParagraph(text)) return;

        // Skip standalone uppercase headline links
        if (text.length > 15 && text.length < 120 && text === text.toUpperCase()) {
          return;
        }

        if (tag === 'h2') {
          paragraphs.push(`\n## ${text}\n`);
        } else if (tag === 'h3') {
          paragraphs.push(`\n### ${text}\n`);
        } else if (tag === 'blockquote') {
          paragraphs.push(`\n> "${text}"\n`);
        } else {
          paragraphs.push(text);
        }
      });
    }

    // Fallback: If container selector missed, extract all valid editorial paragraphs
    if (paragraphs.length === 0) {
      $('p').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim().replace(/\s+/g, ' ');
        if (text && !isJunkParagraph(text) && text.length > 35) {
          if (text !== text.toUpperCase()) {
            paragraphs.push(text);
          }
        }
      });
    }

    const rawFullContent = paragraphs.join('\n\n');
    const fullContent = cleanStoryText(rawFullContent);

    // Find the first genuine editorial paragraph for the summary
    const cleanLeadParagraph = paragraphs.find((p) => !p.startsWith('#') && !p.startsWith('>') && p.length > 30) || '';
    const summary = cleanLeadParagraph.slice(0, 240);

    if (fullContent.length > 250) {
      return {
        title,
        cover_image: coverImage,
        summary,
        content: fullContent,
        author,
      };
    }

    // 5. Headless Browser Fallback for Bot-Protected Sites (Vercel/Cloudflare checkpoints)
    return await scrapeWithHeadlessBrowser(url);
  } catch (err: any) {
    // Attempt headless fallback on fetch error
    return await scrapeWithHeadlessBrowser(url);
  }
}

async function scrapeWithHeadlessBrowser(url: string): Promise<ScrapedArticleResult | null> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      // Remove unwanted elements
      const toRemove = document.querySelectorAll(
        'script, style, iframe, nav, footer, header, .ads, .social-share, .comments, .related-posts, .related-articles, .widget, .sidebar'
      );
      toRemove.forEach((el) => el.remove());

      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                      document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                      document.querySelector('article img')?.getAttribute('src') || '';

      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                      document.querySelector('h1')?.textContent?.trim() || '';

      const authorName = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                         document.querySelector('.author, .byline')?.textContent?.trim() || 'Paddock Wire';

      const paragraphs: string[] = [];
      const articleEl = document.querySelector('article, .entry-content, .post-content, main');

      if (articleEl) {
        articleEl.querySelectorAll('p, h2, h3, blockquote').forEach((el) => {
          const text = el.textContent?.trim().replace(/\s+/g, ' ');
          if (text && text.length > 25) {
            // Check if link farm
            const isLink = el.querySelector('a') && el.querySelector('a')!.textContent?.trim().length === text.length;
            if (isLink) return;

            // Skip uppercase related story headline lists
            if (text.length > 15 && text.length < 120 && text === text.toUpperCase()) return;

            paragraphs.push(text);
          }
        });
      }

      return {
        title: ogTitle,
        cover_image: ogImage,
        summary: paragraphs[0] ? paragraphs[0].slice(0, 240) : '',
        content: paragraphs.join('\n\n'),
        author: authorName,
      };
    });

    await browser.close();

    if (data && data.content.length > 150) {
      data.content = cleanStoryText(data.content);
      return data;
    }
    return null;
  } catch (err: any) {
    return null;
  }
}
