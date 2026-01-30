import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log(`Processing resume: ${file.name} (${file.size} bytes)`);

        // Convert file to Base64 for Gemini
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = file.type || 'application/pdf';

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-flash-latest' (stable alias for 1.5 Flash) to avoid 2.0 quota limits
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `
            You are a Resume Parser. Extract career history from this resume file.
            Return ONLY a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
            
            Schema:
            [
                {
                    "title": "Job Title",
                    "organization": "Company Name",
                    "start_date": "YYYY-MM-DD" (approximate if needed, use 01 for day or use current year if implicit),
                    "end_date": "YYYY-MM-DD" (or null if current),
                    "is_current": boolean,
                    "location": "City, State",
                    "description": "2-3 sentence summary of responsibilities",
                    "type": "employment" | "contract" | "event" (infer from context. 'event' for short races/gigs),
                    "vehicle_info": "Specific car or equipment if mentioned (e.g. Porsche 911 GT3 R)"
                }
            ]

            If dates are just years (e.g. 2021-2023), use "2021-01-01" and "2023-12-31".
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const response = await result.response;
        let jsonStr = response.text();

        console.log("Gemini Response extracted.");

        // Cleanup markdown if present
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

        let entries;
        try {
            entries = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse JSON from AI response", jsonStr);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        if (!Array.isArray(entries)) {
            return NextResponse.json({ error: 'AI returned invalid format (not an array)' }, { status: 500 });
        }

        // Add IDs
        const entriesWithIds = entries.map((e: any) => ({
            ...e,
            id: crypto.randomUUID(),
            highlights: []
        }));

        return NextResponse.json({ entries: entriesWithIds });

    } catch (error: any) {
        console.error('Resume Parse Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to parse resume' }, { status: 500 });
    }
}
