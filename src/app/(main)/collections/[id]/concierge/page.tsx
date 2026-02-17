import { createClient } from '@/utils/supabase/server';
import { getCollectionTasks } from '../../concierge-actions';
import { getCollectionVehicles } from '../../actions';
import ServiceRequestForm from '../../components/ServiceRequestForm';
import Link from 'next/link';
import { ArrowLeft, Clock, DollarSign, CheckCircle, Package, UserPlus } from 'lucide-react';

export default async function ConciergeDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tasks = await getCollectionTasks(id);
    const vehicles = await getCollectionVehicles(id);

    // Map vehicles to shape expected by form
    const vehicleOptions = vehicles ? vehicles.map((v: any) => ({
        id: v.id,
        name: `${v.year} ${v.make} ${v.model}`
    })) : [];

    return (
        <main className="min-h-screen bg-black text-white pb-20 pt-24 px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <Link href={`/collections/${id}`} className="inline-flex items-center text-neutral-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collection
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    {/* Left Column: Task List */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-white">Concierge Tasks</h1>
                                <p className="text-neutral-400">Manage service requests and billing.</p>
                            </div>
                            <Link
                                href="/dashboard/concierge/setup-client"
                                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                New Client Setup
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {tasks.length === 0 ? (
                                <div className="p-8 border border-dashed border-neutral-800 rounded-xl text-center text-neutral-500">
                                    No active tasks. Submit a request to get started.
                                </div>
                            ) : (
                                tasks.map((task: any) => (
                                    <div key={task.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl flex items-start justify-between group hover:border-indigo-500/50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-xs text-neutral-500 font-mono uppercase">{task.type}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{task.title}</h3>
                                            <p className="text-neutral-400 text-sm mb-3">{task.description}</p>

                                            {task.vehicle && (
                                                <div className="text-xs text-neutral-500 flex items-center gap-1">
                                                    <Package className="w-3 h-3" />
                                                    {task.vehicle.year} {task.vehicle.make} {task.vehicle.model}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            {task.client_price ? (
                                                <div className="text-lg font-bold text-white font-mono flex items-center justify-end">
                                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                                    {task.client_price.toLocaleString()}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-neutral-500 font-mono">Estimate Pending</div>
                                            )}
                                            <div className="text-xs text-neutral-600 mt-1 uppercase tracking-wide">{task.billing_method}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Request Form */}
                    <div className="w-full md:w-[400px] shrink-0 sticky top-24">
                        <ServiceRequestForm collectionId={id} vehicles={vehicleOptions} />
                    </div>
                </div>
            </div>
        </main>
    );
}
