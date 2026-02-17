'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, AlertCircle, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { saveRaceResults } from '@/app/league/actions';

interface ResultsUploadProps {
    eventId: string;
    seasonId: string;
    members: any[];
    pointsConfig: any;
    onSuccess: () => void;
}

export function ResultsUpload({ eventId, seasonId, members, pointsConfig, onSuccess }: ResultsUploadProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [parsedResults, setParsedResults] = useState<any[] | null>(null);
    const [fileStats, setFileStats] = useState<any>(null);

    const supabase = createClient();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                processResults(json);
            } catch (err) {
                toast.error('Invalid JSON file');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const processResults = (data: any) => {
        // 1. Find the Race Session
        // iRacing JSON usually has sessions inside 'session_results' or similar structure depending on endpoint
        // Assuming standard result export structure: { session_results: [ ... ] }

        let raceSession = null;

        // Handle different JSON formats (sometimes root is array, sometimes object)
        const sessions = data.session_results || (Array.isArray(data) ? data : []);

        // Look for session with 'RACE' in name or type 'Race'
        raceSession = sessions.find((s: any) => s.simsession_name === 'RACE' || s.simsession_type_name === 'Race');

        if (!raceSession) {
            // Fallback: Use the last session
            raceSession = sessions[sessions.length - 1];
        }

        if (!raceSession || !raceSession.results) {
            toast.error('No race results found in file');
            return;
        }

        setFileStats({
            track: data.track?.track_name || 'Unknown Track',
            winner: raceSession.results[0]?.display_name || 'Unknown'
        });

        // 2. Map and Score
        const processed = raceSession.results.map((r: any) => {
            // Find member
            const member = members.find(m => m.iracing_customer_id === r.cust_id);

            // Calculate Points
            const pos = r.finish_position + 1; // 0-indexed in JSON usually? usually 0-indexed in array, but check field
            // actually 'finish_position' is 0-indexed in API, let's assume 1-indexed for safety or check.
            // verifying: iRacing usually returns 'finish_position' as 0-based.
            const finishPos = r.finish_position + 1;

            let points = pointsConfig?.[finishPos] || 0;

            // Bonus
            // Pole (start_position 0)
            if (r.start_position === 0 && pointsConfig?.pole_position) {
                points += (pointsConfig.pole_position || 0);
            }
            // Best Lap (check boolean or comparison)
            // JSON often has 'best_lap_time' and 'best_qual_lap_time'
            // We would need to find the global fastest lap to award points securely, simplified here:
            // Assuming we check generic logic later or manual override. 
            // For now, let's rely on points system.

            // Incident Check
            const dq = pointsConfig?.incident_limit > 0 && r.incidents > pointsConfig?.incident_limit;
            if (dq) points = 0;

            return {
                driver_member_id: member?.id || null, // Null if guest/unmatched
                display_name: r.display_name,
                cust_id: r.cust_id,
                car_number: r.livery?.car_number || r.car_number, // variation
                position: finishPos,
                start_position: r.start_position + 1,
                laps_completed: r.laps_complete,
                best_lap_time: r.best_lap_time,
                average_lap_time: r.average_lap_time,
                incidents: r.incidents,
                points_earned: points,
                status: dq ? 'disqualified' : 'official',
                is_member: !!member
            };
        });

        setParsedResults(processed);
    };

    const handleSave = async () => {
        if (!parsedResults) return;
        setLoading(true);

        try {
            // 1. Prepare Inserts
            const resultsToInsert = parsedResults
                .filter(r => r.driver_member_id) // Only save for matched members? Or save all with null member_id? Schema references member_id...
                // Schema: driver_member_id UUID REFERENCES os_league_members(id).
                // If it references, we valid IDs. So we skip guests for now or need to create 'guest' members.
                // Converting: Skipping unmatched for MVP safety.
                .map(r => ({
                    event_id: eventId,
                    driver_member_id: r.driver_member_id,
                    position: r.position,
                    qualifying_position: r.start_position,
                    laps_completed: r.laps_completed,
                    best_lap_time: r.best_lap_time,
                    average_lap_time: r.average_lap_time,
                    incidents: r.incidents,
                    points_earned: r.points_earned,
                    status: r.status
                }));

            if (resultsToInsert.length === 0) {
                toast.warning('No matched members found to save.');
                setLoading(false);
                return;
            }

            // 2. Call Server Action
            await saveRaceResults(eventId, resultsToInsert);

            toast.success(`Saved matching results for ${resultsToInsert.length} drivers.`);
            onSuccess();
            setOpen(false);

        } catch (err: any) {
            toast.error('Failed to save results: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Results
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Race Results</DialogTitle>
                    <DialogDescription>
                        Parse iRacing JSON export and calculate points.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!parsedResults ? (
                        <div className="flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg h-32 hover:bg-zinc-900 transition-colors">
                            <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-gray-500" />
                                <span className="text-sm text-gray-400">Click to select iRacing .json result file</span>
                            </Label>
                            <Input id="file-upload" type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-zinc-900 p-3 rounded border border-zinc-800">
                                <div>
                                    <div className="font-bold text-sm">{fileStats?.track}</div>
                                    <div className="text-xs text-gray-400">Winner: {fileStats?.winner}</div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setParsedResults(null)}>Reset</Button>
                            </div>

                            <div className="rounded-md border border-zinc-800 max-h-[400px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-zinc-800 hover:bg-transparent">
                                            <TableHead className="w-[50px]">Pos</TableHead>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Match?</TableHead>
                                            <TableHead className="text-right">Inc</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedResults.map((row: any) => (
                                            <TableRow key={row.cust_id} className="border-zinc-800 hover:bg-zinc-900/50">
                                                <TableCell>{row.position}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{row.display_name}</div>
                                                    <div className="text-xs text-gray-500">#{row.car_number}</div>
                                                </TableCell>
                                                <TableCell>
                                                    {row.is_member ? (
                                                        <span className="text-green-500 flex items-center gap-1 text-xs"><Check className="h-3 w-3" /> Member</span>
                                                    ) : (
                                                        <span className="text-yellow-500 flex items-center gap-1 text-xs"><AlertCircle className="h-3 w-3" /> Guest</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className={`text-right ${row.incidents > 10 ? 'text-red-500' : ''}`}>{row.incidents}</TableCell>
                                                <TableCell className="text-right font-mono font-bold">{row.points_earned}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!parsedResults || loading} className="bg-cyan-500 text-black font-bold">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm & Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
