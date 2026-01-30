import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const { entries } = await req.json();

        if (!entries || !Array.isArray(entries)) {
            return NextResponse.json({ error: 'Invalid entries data' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using flash-latest for speed and cost effectiveness
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are a no-nonsense Race Team Manager reviewing a resume. 
            You hate "LinkedIn-style" corporate buzzwords (e.g., "synergized," "leveraged," "thought leader").
            You want FACTS. You want to know exactly what they did, what cars/tools they used, and the specific outcome.

            Review the following Career Entries.
            For each description, if it is vague or fluffy, provide a "better_version" that is:
            1. Direct and punchy.
            2. Includes specific technical details if implied (infer reasonably).
            3. Removes "I" statements or passive voice.
            4. Sounds like a pro mechanic or racer talking to another pro.

            If the description is already solid and factual, set "better_version" to null.

            Input Data:
            ${JSON.stringify(entries.map((e: any) => ({
            id: e.id,
            title: e.title,
            organization: e.organization,
            description: e.description
        })))}

            Return ONLY a JSON array of objects with this schema:
            [
                {
                    "id": "entry_id",
                    "original": "original description text",
                    "better_version": "enhanced description text (or null)",
                    "reason": "Brief explanation of why this is better (e.g. 'Added specific metrics', 'Removed fluff')"
                }
            ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonStr = response.text();

        // Cleanup markdown
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

        const suggestions = JSON.parse(jsonStr);

        return NextResponse.json({ suggestions });

    } catch (error: any) {
        console.error('Optimization Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to optimize resume' }, { status: 500 });
    }
}
