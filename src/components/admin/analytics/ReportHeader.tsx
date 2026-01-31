import { Shield } from 'lucide-react';

export default function ReportHeader() {
    return (
        <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-4 mb-8">
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-black" />
                <div>
                    <h1 className="text-2xl font-bold text-black uppercase tracking-widest">GridPass</h1>
                    <p className="text-xs text-gray-500 font-mono tracking-wider">CONFIDENTIAL REPORT</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-black">Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">Authorized: SuperAdmin</p>
            </div>
        </div>
    );
}
