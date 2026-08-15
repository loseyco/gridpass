import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExtractedLink {
  title: string;
  url: string;
}

export interface ExtractedExperience {
  title: string;
  company: string;
  date_range: string;
  description: string;
  skills: string[];
  links: ExtractedLink[];
}

function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    meta['title'] = titleMatch[1].trim();
  }

  // Extract OpenGraph and standard meta tags
  const metaRegex = /<meta\s+[^>]*?(?:name|property)=["']([^"']+)["'][^>]*?content=["']([^"']*)["'][^>]*?>|<meta\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:name|property)=["']([^"']+)["'][^>]*?>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const key = (match[1] || match[4] || '').toLowerCase().trim();
    const val = (match[2] || match[3] || '').trim();
    if (key && val) {
      meta[key] = val;
    }
  }

  return meta;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function heuristicFallback(rawText: string, url?: string, meta: Record<string, string> = {}): ExtractedExperience[] {
  let title = meta['og:title'] || meta['twitter:title'] || meta['title'] || '';
  // Clean title
  title = title.replace(/\s*[|\-–—].*$/, '').trim();

  let company = meta['og:site_name'] || '';
  if (!company && url) {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = parsedUrl.hostname.replace(/^www\./, '');
      const parts = hostname.split('.');
      if (parts.length > 0 && parts[0]) {
        company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    } catch {
      company = '';
    }
  }

  let description = meta['og:description'] || meta['twitter:description'] || meta['description'] || '';
  if (!description && rawText) {
    description = rawText.slice(0, 300).trim();
  }

  // Look for date range like 2021 - 2024 or 2022 - Present
  const dateMatch = rawText.match(/\b(20\d\d\s*[-–—]\s*(?:Present|present|Current|current|20\d\d))\b/);
  const singleYearMatch = rawText.match(/\b(20\d\d)\b/);
  const date_range = dateMatch ? dateMatch[1] : (singleYearMatch ? singleYearMatch[1] : '');

  // Look for common motorsport / engineering / software skills
  const commonSkills = [
    'Telemetry Analysis', 'ECU Tuning', 'Engine Building', 'Fabrication', 'TIG Welding',
    'Wiring Harness', 'Dyno Tuning', 'Data Acquisition', 'Race Strategy', 'CAD / CAM',
    'Suspension Tuning', 'Brake Systems', 'Powertrain', 'Chassis Setup', 'Pit Crew Operations',
    'Machining', 'Next.js', 'TypeScript', 'React', 'Python', 'Motorsport Photography'
  ];

  const matchedSkills = commonSkills.filter(skill =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(rawText)
  );

  const links: ExtractedLink[] = [];
  if (url) {
    links.push({
      title: title || company || 'Verification Source',
      url: url.startsWith('http') ? url : `https://${url}`,
    });
  }

  return [
    {
      title: title || 'Motorsport / Technical Role',
      company: company || 'Organization / Team',
      date_range: date_range || '',
      description: description || 'Experience asset details extracted from reference content.',
      skills: matchedSkills.length > 0 ? matchedSkills.slice(0, 6) : ['Motorsport Engineering', 'Technical Operations'],
      links,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url, raw_text } = body;

    if (!url && !raw_text) {
      return NextResponse.json(
        { error: 'Please provide either a url or raw_text to extract experience.' },
        { status: 400 }
      );
    }

    let combinedText = '';
    let pageMeta: Record<string, string> = {};
    let resolvedUrl = typeof url === 'string' ? url.trim() : '';

    // If url provided, fetch the page content
    if (resolvedUrl) {
      const isLinkedIn = /linkedin\.com/i.test(resolvedUrl);
      const isFacebook = /facebook\.com/i.test(resolvedUrl);

      const normalizedUrl = resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')
        ? resolvedUrl
        : `https://${resolvedUrl}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Gridpass-AI-Extractor/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const html = await response.text();
          pageMeta = extractMetaTags(html);
          const bodyText = stripHtmlToText(html);

          // Check if LinkedIn / Facebook hit an auth wall
          const isAuthWall = (isLinkedIn || isFacebook) && (
            /sign in|join linkedin|log in|login|authwall/i.test(bodyText.slice(0, 500)) ||
            bodyText.length < 200
          );

          if (isAuthWall && !raw_text) {
            return NextResponse.json({
              auth_required: true,
              platform: isLinkedIn ? 'LinkedIn' : 'Facebook',
              message: `${isLinkedIn ? 'LinkedIn' : 'Facebook'} hides full experience behind a login wall. Please copy your experience text and paste it into the "Raw Resume Excerpt" tab for instant extraction!`,
            });
          }

          combinedText += `Source URL: ${normalizedUrl}\n`;
          if (pageMeta['title']) combinedText += `Page Title: ${pageMeta['title']}\n`;
          if (pageMeta['og:title']) combinedText += `OpenGraph Title: ${pageMeta['og:title']}\n`;
          if (pageMeta['og:site_name']) combinedText += `Site Name: ${pageMeta['og:site_name']}\n`;
          if (pageMeta['og:description'] || pageMeta['description']) {
            combinedText += `Page Description: ${pageMeta['og:description'] || pageMeta['description']}\n`;
          }
          combinedText += `Page Text (first 4000 chars):\n${bodyText.slice(0, 4000)}\n\n`;
        } else if (response.status === 999 || response.status === 403 || response.status === 401) {
          if ((isLinkedIn || isFacebook) && !raw_text) {
            return NextResponse.json({
              auth_required: true,
              platform: isLinkedIn ? 'LinkedIn' : 'Facebook',
              message: `${isLinkedIn ? 'LinkedIn' : 'Facebook'} blocks automated link scraping. Please copy the text from your profile and paste it into the "Raw Resume Excerpt" tab!`,
            });
          }
        }
      } catch (fetchErr: any) {
        console.warn('Could not fetch URL for extraction:', fetchErr?.message || fetchErr);
        if ((isLinkedIn || isFacebook) && !raw_text) {
          return NextResponse.json({
            auth_required: true,
            platform: isLinkedIn ? 'LinkedIn' : 'Facebook',
            message: `${isLinkedIn ? 'LinkedIn' : 'Facebook'} requires a login to view experience. Please copy the text from your profile and paste it into the "Raw Resume Excerpt" tab!`,
          });
        }
      }
    }

    if (raw_text && typeof raw_text === 'string' && raw_text.trim()) {
      combinedText += `User Provided Text / Resume Excerpt:\n${raw_text.trim()}`;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured. Utilizing heuristic extraction fallback.');
      const fallbackList = heuristicFallback(combinedText, resolvedUrl, pageMeta);
      return NextResponse.json({
        experiences: fallbackList,
        data: fallbackList[0] || null,
        source: 'heuristic_fallback',
      });
    }

    const prompt = `You are an AI assistant for Gridpass, a high-performance motorsport, engineering, and automotive trades platform.
Analyze the following webpage extract or raw text and extract structured Experience Assets representing racing roles, engineering projects, speed shop gigs, mechanical roles, or technical achievements.

Content to analyze:
${combinedText}

Extract and return a JSON object with this EXACT schema:
{
  "experiences": [
    {
      "title": "Role, title, or project descriptor (e.g. 'Lead Race Engineer / Pro Driver', 'Shop Foreman', 'Master Engine Builder', 'ECU Calibration Specialist', 'Full-Stack Developer')",
      "company": "Company, racing team, speed shop, venue, or platform name (e.g. 'Honda Racing Corporation (HRC)', 'Losey Racing', 'Road America', 'Gridpass Platform')",
      "date_range": "Timeframe or active years (e.g. '2022 - Present', '2020 - 2023', '2024'). If unspecified, leave as empty string.",
      "description": "2-4 professional, concise, impactful sentences detailing key responsibilities, achievements, vehicle specs, track telemetry, dyno results, or platform architecture.",
      "skills": ["Array of 3 to 8 specific technical skills, automotive trades, machinery, tools, software, or disciplines (e.g. 'Telemetry Analysis', 'ECU Tuning', 'TIG Welding', 'Motec i2', 'Chassis Setup', 'Wiring Harness')"],
      "links": [
        {
          "title": "Short descriptive title (e.g. 'Source Reference', 'Official Announcement', 'GitHub Repo', 'Project Website')",
          "url": "Full valid URL (e.g. '${resolvedUrl || 'https://example.com'}')"
        }
      ]
    }
  ]
}

Rules:
1. Always return an array in the 'experiences' property.
2. If only 1 experience/role is present, return an array with 1 item.
3. If multiple experiences/roles are found in the content (e.g. multi-job resume, LinkedIn profile history, multiple project sections, Facebook history), extract and return all detected distinct roles as individual items in the 'experiences' array in reverse chronological order (newest first).
4. Ensure 'title' and 'company' are concise and clean without clickbait suffixes.
5. If a valid URL was provided in the input, include it in 'links' for each extracted experience.
6. 'skills' must be an array of short string tags.
7. Output STRICTLY raw JSON matching the schema. Do not wrap in backticks or markdown fences.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let geminiResponseJson: any = null;

    for (const model of modelsToTry) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            // Strip any code fences if present
            const cleanJsonText = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            geminiResponseJson = JSON.parse(cleanJsonText);
            break;
          }
        } else {
          const errText = await response.text();
          console.warn(`Gemini API (${model}) failed with status ${response.status}:`, errText);
        }
      } catch (geminiErr: any) {
        console.warn(`Gemini API (${model}) error:`, geminiErr?.message || geminiErr);
      }
    }

    if (geminiResponseJson) {
      let rawList: any[] = [];
      if (Array.isArray(geminiResponseJson)) {
        rawList = geminiResponseJson;
      } else if (geminiResponseJson && Array.isArray(geminiResponseJson.experiences)) {
        rawList = geminiResponseJson.experiences;
      } else if (geminiResponseJson && typeof geminiResponseJson === 'object') {
        if (geminiResponseJson.title || geminiResponseJson.company) {
          rawList = [geminiResponseJson];
        }
      }

      if (rawList.length > 0) {
        const sanitizedExperiences: ExtractedExperience[] = rawList.map((item: any) => {
          const rawLinks = Array.isArray(item.links) ? item.links : [];
          const links: ExtractedLink[] = rawLinks
            .filter((l: any) => l && typeof l.url === 'string' && l.url.trim())
            .map((l: any) => ({
              title: typeof l.title === 'string' && l.title.trim() ? l.title.trim() : 'Reference Link',
              url: l.url.trim(),
            }));

          // Ensure resolvedUrl is included in links if not already present
          if (resolvedUrl) {
            const normUrl = resolvedUrl.startsWith('http') ? resolvedUrl : `https://${resolvedUrl}`;
            const exists = links.some((l) => l.url.toLowerCase() === normUrl.toLowerCase());
            if (!exists) {
              links.unshift({
                title: item.company ? `${item.company} Reference` : 'Verification Link',
                url: normUrl,
              });
            }
          }

          return {
            title: typeof item.title === 'string' ? item.title.trim() : 'Motorsport / Technical Role',
            company: typeof item.company === 'string' ? item.company.trim() : '',
            date_range: typeof item.date_range === 'string' ? item.date_range.trim() : '',
            description: typeof item.description === 'string' ? item.description.trim() : '',
            skills: Array.isArray(item.skills)
              ? item.skills.map((s: any) => String(s).trim()).filter(Boolean)
              : [],
            links,
          };
        });

        return NextResponse.json({
          experiences: sanitizedExperiences,
          data: sanitizedExperiences[0] || null,
          source: 'gemini_ai',
        });
      }
    }

    // Fallback to heuristic if Gemini parsing returned empty
    const fallbackResult = heuristicFallback(combinedText, resolvedUrl, pageMeta);
    return NextResponse.json({
      experiences: fallbackResult,
      data: fallbackResult[0] || null,
      source: 'heuristic_fallback',
    });
  } catch (err: any) {
    console.error('Error in /api/ai/extract-experience:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to extract experience asset details.' },
      { status: 500 }
    );
  }
}

