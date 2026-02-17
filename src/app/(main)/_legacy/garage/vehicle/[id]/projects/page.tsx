
import { getVehicle } from '@/app/actions/garage';
import { getProjects } from '@/app/actions/project';
import { notFound, redirect } from 'next/navigation';
import ProjectList from '@/components/garage/ProjectList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function VehicleProjectsPage({ params }: PageProps) {
    const { id } = await params;
    const vehicle = await getVehicle(id);

    if (!vehicle) {
        notFound();
    }

    const projects = await getProjects(id);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/dashboard/profile" className="text-neutral-500 hover:text-white flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4" /> Back to Garage
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                            </h1>
                            <p className="text-neutral-400">Manage build projects and maintenance.</p>
                        </div>
                    </div>
                </div>

                {/* Project List Component */}
                <ProjectList vehicle={vehicle} initialProjects={projects} />
            </div>
        </div>
    );
}
