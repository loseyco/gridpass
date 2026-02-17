
import MissionControlClient from './MissionControlClient';

export const metadata = {
    title: 'Mission Control | GridPass OS',
};

export default function MissionControlPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">My Mission Control</h1>
            <p className="text-zinc-400 mb-8">Manage local automation bots and site interactions.</p>
            <MissionControlClient />
        </div>
    );
}
