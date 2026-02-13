import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ParsedResumeData {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    currentRole?: string;
    professionalBio?: string;
    skills?: string[];
    experience?: string[];
    education?: string[];
    city?: string;
    confidence: {
        [key: string]: 'high' | 'medium' | 'low';
    };
}

/**
 * Parse a resume PDF using AI to extract structured data
 * Uses Gemini
 */
export async function parseResumeWithAI(resumeUrl: string): Promise<ParsedResumeData> {
    try {
        console.log('Downloading resume from:', resumeUrl);

        // Download the PDF from Supabase
        const response = await fetch(resumeUrl);
        if (!response.ok) {
            throw new Error(`Failed to download resume: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('Parsing PDF...');

        // Import PDFParse class from pdf-parse
        // This library exports a class, not a function
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse();
        const pdfData = await parser.parse(buffer);
        const resumeText = pdfData.text;

        if (!resumeText || resumeText.trim().length < 10) {
            throw new Error('PDF appears to be empty or unreadable');
        }

        console.log('Extracted text length:', resumeText.length);
        console.log('Calling Gemini AI...');

        return await parseWithGemini(resumeText);
    } catch (error) {
        console.error('Error parsing resume:', error);
        throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function parseWithGemini(resumeText: string): Promise<ParsedResumeData> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
    });

    const prompt = `You are an expert at parsing resumes. Extract the following information from the resume text below and return it as valid JSON.

Required fields:
- name: Full name (string)
- email: Email address (string or null)
- phone: Phone number (string or null, format as (XXX) XXX-XXXX if possible)
- linkedin: LinkedIn URL (string or null)
- currentRole: Current job title/role (string or null)
- professionalBio: A professional summary, 2-3 sentences (string, create one based on the resume if not explicitly stated)
- skills: Array of key skills (array of strings)
- experience: Array of work experiences, each as a string summary (array of strings)
- education: Array of education entries (array of strings)
- city: City/location (string or null)

For each field in "confidence" object, provide: "high", "medium", or "low" based on how certain you are.

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "linkedin": "...",
  "currentRole": "...",
  "professionalBio": "...",
  "skills": ["..."],
  "experience": ["..."],
  "education": ["..."],
  "city": "...",
  "confidence": {
    "name": "high",
    "email": "high",
    "phone": "medium",
    "linkedin": "high",
    "currentRole": "high",
    "city": "medium"
  }
}

Resume text:
${resumeText.substring(0, 5000)}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        console.log('Gemini raw response:', text.substring(0, 200));

        // Clean up response (remove markdown code blocks if present)
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleaned);

        // Ensure confidence exists
        if (!parsed.confidence) {
            parsed.confidence = {};
        }

        console.log('Successfully parsed resume data');

        return {
            name: parsed.name || null,
            email: parsed.email || null,
            phone: parsed.phone || null,
            linkedin: parsed.linkedin || null,
            currentRole: parsed.currentRole || null,
            professionalBio: parsed.professionalBio || null,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: Array.isArray(parsed.experience) ? parsed.experience : [],
            education: Array.isArray(parsed.education) ? parsed.education : [],
            city: parsed.city || null,
            confidence: parsed.confidence || {},
        };
    } catch (error) {
        console.error('Gemini parsing error:', error);
        throw new Error(`Gemini failed to parse resume: ${error instanceof Error ? error.message : 'Invalid JSON response'}`);
    }
}
