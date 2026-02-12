/**
 * Cleanup Test Resume Data
 * 
 * This script removes all test users and data created during resume workflow testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanupTestData() {
    console.log('🧹 Starting test data cleanup...\n');

    // Test email patterns to look for
    const testEmailPatterns = [
        'test@example.com',
        'workflow.test@example.com',
        '%@example.com' // Catch all example.com emails
    ];

    let totalDeleted = {
        users: 0,
        profiles: 0,
        leads: 0,
        tokens: 0
    };

    for (const pattern of testEmailPatterns) {
        console.log(`\n📧 Looking for pattern: ${pattern}`);

        // 1. Find matching resume leads
        const { data: leads, error: leadsError } = await supabaseAdmin
            .from('resume_leads')
            .select('id, email, user_id')
            .ilike('email', pattern);

        if (leadsError) {
            console.error('Error finding leads:', leadsError);
            continue;
        }

        if (!leads || leads.length === 0) {
            console.log('  ℹ️  No leads found');
            continue;
        }

        console.log(`  Found ${leads.length} leads`);

        for (const lead of leads) {
            console.log(`\n  🗑️  Deleting lead: ${lead.email} (ID: ${lead.id})`);

            // Delete claim tokens
            if (lead.user_id) {
                const { error: tokenError } = await supabaseAdmin
                    .from('claim_tokens')
                    .delete()
                    .eq('entity_id', lead.user_id);

                if (!tokenError) {
                    totalDeleted.tokens++;
                    console.log('     ✅ Deleted claim tokens');
                } else {
                    console.log('     ⚠️  Claim tokens error:', tokenError.message);
                }

                // Delete profile
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .delete()
                    .eq('id', lead.user_id);

                if (!profileError) {
                    totalDeleted.profiles++;
                    console.log('     ✅ Deleted profile');
                } else {
                    console.log('     ⚠️  Profile error:', profileError.message);
                }

                // Delete auth user
                const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
                    lead.user_id
                );

                if (!authError) {
                    totalDeleted.users++;
                    console.log('     ✅ Deleted auth user');
                } else {
                    console.log('     ⚠️  Auth user error:', authError.message);
                }
            }

            // Delete resume lead
            const { error: leadError } = await supabaseAdmin
                .from('resume_leads')
                .delete()
                .eq('id', lead.id);

            if (!leadError) {
                totalDeleted.leads++;
                console.log('     ✅ Deleted resume lead');
            } else {
                console.log('     ⚠️  Resume lead error:', leadError.message);
            }
        }
    }

    console.log('\n\n📊 CLEANUP SUMMARY:');
    console.log(`   🧑 Auth Users deleted: ${totalDeleted.users}`);
    console.log(`   👤 Profiles deleted: ${totalDeleted.profiles}`);
    console.log(`   📄 Resume Leads deleted: ${totalDeleted.leads}`);
    console.log(`   🎟️  Claim Tokens deleted: ${totalDeleted.tokens}`);
    console.log('\n✨ Cleanup complete!\n');
}

cleanupTestData().catch(console.error);
