
import { getProject, getProjectTasks, getProjectMembers } from '@/app/dashboard/profile/project-actions';
import { notFound } from 'next/navigation';
import ProjectBoard from '@/components/garage/ProjectBoard';
import ProjectMembers from '@/components/garage/ProjectMembers';
import Link from 'next/link';
import { ArrowLeft, Calendar, Flag } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
    const { id } = await params;

    // Parallel fetching
    const [project, tasks, members] = await Promise.all([
        getProject(id),
        getProjectTasks(id),
        getProjectMembers(id)
    ]);

    if (!project) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Header */}
            <header className="bg-neutral-900 border-b border-white/5 py-6 px-6 md:px-12 sticky top-0 z-10 backdrop-blur-md bg-neutral-900/80">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <Link href={`/garage/vehicle/${project.vehicle_id}/projects`}>Back to Projects</Link>
                    </div>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                                {project.name}
                                <span className={`text-xs px-2 py-1 rounded font-sans not-italic font-bold tracking-normal ${project.status === 'in_progress' ? 'bg-blue-600/20 text-blue-400' :
                                        project.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                                            'bg-neutral-800 text-neutral-400'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </h1>
                            <p className="text-neutral-400 max-w-2xl mt-1">{project.description}</p>
                        </div>

                        <div className="hidden md:flex items-center gap-6 text-sm text-neutral-500 font-mono">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Board (3/4 width) */}
                <div className="lg:col-span-3 space-y-8">
                    <ProjectBoard project={project} initialTasks={tasks} />
                </div>

                {/* Right Column: Team & Details (1/4 width) */}
                <div className="space-y-8">
                    <ProjectMembers project={project} initialMembers={members} />

                    {/* Meta info if any */}
                    <div className="bg-neutral-900 border border-white/5 rounded-xl p-6">
                        <h3 className="text-sm font-bold uppercase text-neutral-500 mb-4 flex items-center gap-2">
                            <Flag className="w-4 h-4" /> Project Goals
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-600 uppercase mb-1">Target End Date</label>
                                <div className="text-white font-mono">
                                    {project.target_end_date ? new Date(project.target_end_date).toLocaleDateString() : 'Not set'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
