import { NextRequest, NextResponse } from 'next/server';
import { parseResumeWithAI } from '@/lib/ai-resume-parser';
import { performBackgroundCheck } from '@/lib/ai-background-check';
import { discoverCandidateProfile } from '@/lib/ai-candidate-discovery';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const { leadId, resumeUrl } = await request.json();

        if (!leadId) {
            return NextResponse.json(
                { error: 'Missing leadId' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch lead details
        const { data: lead } = await supabase
            .from('resume_leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // --- STEP 1: OBTAIN DATA (Parse or Discover) ---
        let parsedData: any = {};
        let dataSource = 'resume';

        if (resumeUrl) {
            try {
                console.log('Attempting to parse resume PDF...');
                parsedData = await parseResumeWithAI(resumeUrl);
            } catch (pdfError) {
                // If PDF parsing fails (e.g., library issues), fall back to Discovery Mode
                console.warn('Resume parsing failed, falling back to Discovery Mode:', pdfError);
                dataSource = 'web-discovery (resume parse failed)';
                parsedData = await discoverCandidateProfile(lead.name, lead.email);
            }
        } else {
            dataSource = 'web-discovery';
            console.log(`Starting discovery for ${lead.name}...`);
            parsedData = await discoverCandidateProfile(lead.name, lead.email);
        }

        // --- STEP 2: BACKGROUND CHECK ---
        const backgroundCheck = await performBackgroundCheck(parsedData);

        // --- STEP 3: ENHANCE BIO with Gemini ---
        let enhancedBio = parsedData.professionalBio;
        if (parsedData.professionalBio) {
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `Rewrite the following professional bio to be punchy, impressive, and optimized for a high-end talent directory. Keep it under 250 characters. Do not use hashtags or emojis. Return ONLY the rewritten bio, nothing else.\n\nOriginal bio: ${parsedData.professionalBio}`;

                const result = await model.generateContent(prompt);
                const generatedBio = result.response.text().trim();

                if (generatedBio && generatedBio.length > 10) {
                    enhancedBio = generatedBio;
                }
            } catch (e) {
                console.error('Bio enhancement failed:', e);
                // Keep original bio
            }
        }

        // --- STEP 4: COVER PHOTO (Use curated fallback) ---
        // Since Gemini doesn't have image generation, use a professional stock image
        const coverPhotoUrl = "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1920&q=80";

        // --- STEP 5: AUTO-ACCEPT & DETERMINE TASKS ---
        const acceptedFields: any = {};
        const remainingTasks: string[] = [];
        const updates: any = {};

        // Standard fields
        const directFields = ['name', 'email', 'phone', 'linkedin', 'city'];
        directFields.forEach(field => {
            const val = (parsedData as any)[field];
            const confidence = parsedData.confidence?.[field] || 'low';

            if (val && confidence === 'high') {
                acceptedFields[field] = val;
                updates[field] = val;
            } else if (!val) {
                remainingTasks.push(`Missing ${field}`);
            } else {
                remainingTasks.push(`Verify ${field} (${confidence} confidence)`);
            }
        });

        if (parsedData.currentRole) updates.job_title = parsedData.currentRole;

        // Metadata updates
        const metadataUpdates: any = {
            ai_parsed_data: parsedData,
            background_check: backgroundCheck,
            ai_enhanced_bio: enhancedBio,
            ai_last_run: new Date().toISOString(),
            data_source: dataSource,
            background_url: coverPhotoUrl
        };

        if (parsedData.skills) metadataUpdates.skills = parsedData.skills;
        if (parsedData.experience) metadataUpdates.experience = parsedData.experience;
        if (parsedData.education) metadataUpdates.education = parsedData.education;

        // Profile Photo
        if (!lead?.photo_url) {
            remainingTasks.push("Upload Profile Picture");
        }

        // Merge metadata
        updates.metadata = {
            ...(lead.metadata || {}),
            ...metadataUpdates
        };

        // Update database
        const { error } = await supabase.from('resume_leads').update(updates).eq('id', leadId);
        if (error) throw error;

        return NextResponse.json({
            success: true,
            summary: {
                source: dataSource === 'web-discovery' ? 'Web Discovery' : 'Resume Parsed',
                parsed: parsedData,
                background: backgroundCheck,
                generated: {
                    coverPhoto: 'Premium Stock Image',
                    enhancedBio: enhancedBio !== parsedData.professionalBio ? 'Yes' : 'No'
                },
                remainingTasks
            }
        });

    } catch (error) {
        console.error('AI Auto-Pilot error:', error);
        return NextResponse.json(
            {
                error: 'Failed to run AI Auto-Pilot',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
