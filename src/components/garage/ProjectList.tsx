'use client';

import { useState } from 'react';
import { GarageProject, Vehicle } from '@/types/garage';
import { createProject } from '@/app/actions/project';
import { Plus, Folder, Calendar, ArrowRight, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProjectListProps {
    vehicle: Vehicle;
    initialProjects: GarageProject[];
}

export default function ProjectList({ vehicle, initialProjects }: ProjectListProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<GarageProject['status']>('planning');

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await createProject({
                vehicle_id: vehicle.id,
                name,
                description,
                status
            });
            // Re-fetch or rely on server action revalidate?
            // Since we passed initialProjects as prop, we might need to refresh router.
            router.refresh();
            setIsModalOpen(false);
            // Ideally we'd update local state too or just wait for refresh.
            // For now, let's just refresh.
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-xl border border-white/5">
                <div>
                    <h2 className="text-xl font-bold">Active Projects</h2>
                    <p className="text-sm text-neutral-400">Track builds, swaps, and major maintenance.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm uppercase tracking-wide"
                >
                    <Plus className="w-4 h-4" /> New Project
                </button>
            </div>

            {initialProjects.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl bg-neutral-900/20">
                    <Folder className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
                    <p className="text-neutral-400 max-w-sm mx-auto mb-6">Start a new project to track tasks, budget, and invite your team.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white/10 text-white px-6 py-2 rounded font-bold hover:bg-white/20 transition-colors"
                    >
                        Create First Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialProjects.map(project => (
                        <Link
                            key={project.id}
                            href={`/garage/project/${project.id}`}
                            className="group block bg-neutral-900 border border-white/10 rounded-xl p-6 hover:border-white/30 transition-all hover:bg-neutral-800"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${project.status === 'in_progress' ? 'bg-blue-600/20 text-blue-400' :
                                    project.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                        'bg-neutral-700 text-neutral-300'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </div>
                                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{project.name}</h3>
                            <p className="text-sm text-neutral-400 line-clamp-2 h-10 mb-4">{project.description || 'No description provided.'}</p>

                            <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono pt-4 border-t border-white/5">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(project.created_at).toLocaleDateString()}
                                </span>
                                {/* Add task count later if possible */}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Start New Project</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Project Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/10 p-3 rounded text-white focus:border-amber-400 outline-none transition-colors"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Engine Rebuild, Winter Prep"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full bg-black border border-white/10 p-3 rounded text-white focus:border-amber-400 outline-none transition-colors"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as any)}
                                >
                                    <option value="planning">Planning</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full bg-black border border-white/10 p-3 rounded text-white h-24 resize-none focus:border-amber-400 outline-none transition-colors"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Briefly describe the goals..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-400 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2 text-sm uppercase tracking-wide"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
