'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, AlertCircle } from 'lucide-react';

interface DriverStanding {
    rank: number;
    driver_name: string;
    car_number: string;
    team: string; // Not yet in schema, maybe use role or custom metadata?
    points: number;
    wins: number;
    top5: number;
    incidents: number;
    diff_leader: number;
}

export function StandingsTable({ standings }: { standings: DriverStanding[] }) {
    if (standings.length === 0) {
        return <div className="text-center p-8 text-gray-500 bg-white/5 rounded-xl border border-white/10">No standings data available yet. Race some laps!</div>;
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent bg-white/5 uppercase text-xs tracking-wider">
                        <TableHead className="w-[80px] text-center text-gray-400 font-bold">Pos</TableHead>
                        <TableHead className="text-gray-400 font-bold">Driver</TableHead>
                        <TableHead className="text-center text-gray-400 font-bold">Wins</TableHead>
                        <TableHead className="text-center text-gray-400 font-bold hidden sm:table-cell">Top 5</TableHead>
                        <TableHead className="text-right text-gray-400 font-bold pr-8">Points</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {standings.map((driver) => (
                        <TableRow key={driver.rank} className="border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="text-center font-mono text-lg font-bold">
                                {driver.rank === 1 && <Trophy className="h-5 w-5 text-yellow-400 mx-auto" />}
                                {driver.rank === 2 && <Medal className="h-5 w-5 text-gray-300 mx-auto" />}
                                {driver.rank === 3 && <Medal className="h-5 w-5 text-amber-700 mx-auto" />}
                                {driver.rank > 3 && <span className="text-gray-500 group-hover:text-white transition-colors">{driver.rank}</span>}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border border-white/10 font-mono text-sm font-bold text-gray-400 group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-all">
                                        {driver.car_number || '#'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{driver.driver_name}</div>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            {driver.diff_leader > 0 && <span className="text-red-400">-{driver.diff_leader} Lead</span>}
                                            {driver.incidents > 0 && <span className="flex items-center gap-0.5"><AlertCircle className="h-3 w-3" /> {driver.incidents}x</span>}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                {driver.wins > 0 ? (
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">{driver.wins}</Badge>
                                ) : (
                                    <span className="text-gray-700">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                                <span className={driver.top5 > 0 ? 'text-gray-300' : 'text-gray-700'}>{driver.top5 || '-'}</span>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                                <div className="font-mono text-xl font-black text-cyan-400 group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                    {driver.points}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
