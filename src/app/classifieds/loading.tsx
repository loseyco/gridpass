
export default function Loading() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
            <div className="max-w-7xl mx-auto animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="h-10 bg-neutral-900 rounded-lg w-48 mb-2"></div>
                        <div className="h-6 bg-neutral-900 rounded-lg w-64"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[4/3] bg-neutral-900 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
