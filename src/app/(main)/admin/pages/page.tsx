import { getAllPageStats } from '@/app/actions/analytics';
import PageManagementTable from '@/components/admin/PageManagementTable';
import { FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PageManagementPage() {
    const pages = await getAllPageStats();

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-indigo-500" />
                    Page Management
                </h1>
                <p className="text-neutral-400">
                    Audit SEO tags, enforce role-based access, and detailed analytics for all system routes.
                </p>
            </header>

            <PageManagementTable initialData={pages} />
        </div>
    );
}
