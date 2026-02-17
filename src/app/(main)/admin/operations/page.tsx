import OperationsHUD from "@/components/admin/OperationsHUD";

export default function OperationsPage() {
    return (
        <div className="p-6 h-screen overflow-hidden">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100">AI Operations HUD</h1>
                <p className="text-gray-400 text-sm">Real-time monitoring and control of Local AI agents.</p>
            </div>
            <OperationsHUD />
        </div>
    );
}
