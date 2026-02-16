import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function log(msg: string) {
    try {
        const logPath = path.join(process.cwd(), 'ingest.log');
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
}

export async function POST(request: NextRequest) {
    // ... auth check ...

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        log('Error: Missing Supabase Credentials in Env');
        return NextResponse.json({ error: 'Missing Credentials' }, { status: 500 });
    }

    // Use Service Role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = request.headers.get('authorization');
    log('--- INGEST START ---');
    log(`Auth Header: ${authHeader}`);

    if (authHeader !== `Bearer ${process.env.LEAGUE_INGEST_TOKEN}`) {
        log('Unauthorized attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        log(`Generic Payload received. Subsession ID: ${data.subsession_id}`);

        // const supabase = await createClient(); // REMOVED (Use admin client from outer scope)


        // 1. Identify Existing Event
        const subsessionId = data.subsession_id;
        if (!subsessionId) {
            log('Error: No subsession_id in payload');
            return NextResponse.json({ error: 'No subsession_id in payload' }, { status: 400 });
        }

        const { data: existingEvent } = await supabase
            .from('os_league_events')
            .select('id')
            .eq('subsession_id', subsessionId)
            .single();

        let eventId = existingEvent?.id;

        if (eventId) {
            log(`Found existing event: ${eventId}`);
        } else {
            log(`Event not found for subsession ${subsessionId}. Attempting auto-creation...`);

            // Find Active Season
            const { data: season, error: seasonError } = await supabase
                .from('os_league_seasons')
                .select('id, league_id')
                .eq('is_active', true)
                .single();

            if (seasonError || !season) {
                log(`Error: No active season found. Cannot create event. DB State Check Required.`);
                return NextResponse.json({ error: 'No active season found to attach results to. Please seed the database.' }, { status: 404 });
            }

            log(`Found active season: ${season.id}. Creating event...`);

            const trackName = data.track ? data.track.track_name : 'Unknown Track';
            const configName = data.track ? data.track.track_config_name : 'Unknown Config';
            // iRacing start_time might be "2023-01-01T00:00:00Z"

            const { data: newEvent, error: createError } = await supabase.from('os_league_events').insert({
                season_id: season.id,
                league_id: season.league_id,
                name: `Auto-Imported: ${trackName}`,
                track_name: trackName,
                config_name: configName,
                start_time: data.start_time || new Date().toISOString(),
                subsession_id: subsessionId,
                status: 'completed'
            }).select().single();

            if (createError) {
                log(`Error creating event: ${createError.message}`);
                throw createError;
            }
            eventId = newEvent.id;
            log(`Created new event: ${eventId}`);
        }

        // 2. Process Results
        const results = data.session_results || [];
        // Need to handle if session_results is missing

        const raceSession = results.find((r: any) => r.simsession_name === 'RACE');
        if (!raceSession) {
            log('Error: No RACE session found in payload');
            return NextResponse.json({ error: 'No RACE session found in results' }, { status: 400 });
        }

        const raceResults = raceSession.results;
        log(`Processing ${raceResults.length} race results...`);

        for (const row of raceResults) {
            const custId = row.cust_id;

            // Find member
            let { data: member } = await supabase
                .from('os_league_members')
                .select('id')
                .eq('iracing_customer_id', custId)
                .single();

            if (!member) {
                log(`Member not found for cust_id ${custId}. Creating...`);
                // Need a valid league_id. Use the event's league_id (via season)
                // Get season again if needed or use previous reference.
                // Optimally we fetch league_id earlier.

                // Quick fix: Fetch the league ID from the event we just used/created
                const { data: eventInfo } = await supabase.from('os_league_events').select('league_id').eq('id', eventId).single();

                if (eventInfo) {
                    const { data: newMember, error: memberError } = await supabase
                        .from('os_league_members')
                        .insert({
                            league_id: eventInfo.league_id,
                            iracing_customer_id: custId,
                            role: 'driver',
                            status: 'active', // Auto-active for now?
                            irating: row.old_irating || 1500
                        }).select().single();

                    if (memberError) {
                        log(`Error creating member: ${memberError.message}`);
                    } else {
                        member = newMember;
                        log(`Created member: ${member.id}`);
                    }
                }
            }

            if (member) {
                // Upsert result? Or just insert?
                // Avoid duplicates for same event+member
                const { error: resultError } = await supabase.from('os_league_race_results').insert({
                    event_id: eventId,
                    driver_member_id: member.id,
                    position: (row.finish_position || 0) + 1,
                    qualifying_position: (row.starting_position || 0) + 1,
                    laps_completed: row.laps_complete || 0,
                    best_lap_time: row.best_lap_time || 0,
                    average_lap_time: row.average_lap_time || 0,
                    incidents: row.incidents || 0,
                    points_earned: calculatePoints((row.finish_position || 0) + 1),
                    status: 'official'
                });
                if (resultError) {
                    log(`Error inserting result for member ${member.id}: ${resultError.message}`);
                }
            }
        }

        log('Ingest Complete Success');
        return NextResponse.json({ success: true, event_id: eventId });

    } catch (error: any) {
        log(`Ingest Error: ${error.message || error}`);
        console.error('Ingest Error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message || error}` }, { status: 500 });
    }
}

function calculatePoints(pos: number) {
    const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    return points[pos - 1] || 0;
}
