'use client';

import { useState } from 'react';
import { Sparkles, Check, X, AlertCircle, Loader2 } from 'lucide-react';

interface AIVerificationPanelProps {
    leadId: string;
    resumeUrl?: string | null;
    currentData: any;
}

export function AIVerificationPanel({
    leadId,
    resumeUrl,
    currentData
}: AIVerificationPanelProps) {
    const [parsing, setParsing] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [crossRefIssues, setCrossRefIssues] = useState<any[]>([]);
    const [updating, setUpdating] = useState(false);

    const handleParseResume = async () => {
        if (!resumeUrl) {
            setError('No resume uploaded yet');
            return;
        }

        setParsing(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/parse-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, resumeUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to parse resume');
            }

            const data = await response.json();
            setParsedData(data);

            // Also get cross-reference issues
            const crossRefResponse = await fetch('/api/admin/cross-reference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, leadData: currentData }),
            });

            if (crossRefResponse.ok) {
                const crossRefData = await crossRefResponse.json();
                setCrossRefIssues(crossRefData.issues || []);
            }
        } catch (err) {
            setError('Failed to parse resume. Please try again.');
        } finally {
            setParsing(false);
        }
    };

    const handleAcceptAll = async () => {
        if (!parsedData || updating) return;

        setUpdating(true);
        try {
            // Update via server action endpoint
            const response = await fetch('/api/admin/update-resume-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId,
                    fields: parsedData.data
                }),
            });

            if (response.ok) {
                window.location.reload(); // Refresh to show updates
            } else {
                setError('Failed to update fields');
            }
        } catch (err) {
            setError('Failed to update fields');
        } finally {
            setUpdating(false);
        }
    };

    const handleAcceptField = async (fieldKey: string, value: any) => {
        if (updating) return;

        setUpdating(true);
        try {
            const response = await fetch('/api/admin/update-resume-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId,
                    fields: { [fieldKey]: value }
                }),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                setError('Failed to update field');
            }
        } catch (err) {
            setError('Failed to update field');
        } finally {
            setUpdating(false);
        }
    };

    const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
        const colors = {
            high: 'bg-green-500/20 text-green-400 border-green-500/30',
            medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            low: 'bg-red-500/20 text-red-400 border-red-500/30',
        };

        return (
            <span className={`px-2 py-0.5 rounded border text-xs ${colors[confidence]}`}>
                {confidence}
            </span>
        );
    };

    return (
        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">AI Verification</h3>
                </div>

                <button
                    onClick={handleParseResume}
                    disabled={!resumeUrl || parsing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    {parsing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Parsing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Parse Resume
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {!resumeUrl && !parsedData && (
                <div className="text-sm text-white/50 text-center py-8">
                    Upload a resume first to enable AI parsing
                </div>
            )}

            {/* Parsed Data */}
            {parsedData && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-white/70">
                            Found {Object.keys(parsedData.data || {}).length} fields
                        </p>
                        <button
                            onClick={handleAcceptAll}
                            disabled={updating}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                            {updating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Accept All
                        </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {Object.entries(parsedData.data || {}).map(([key, value]: [string, any]) => {
                            if (!value) return null;

                            const confidence = parsedData.confidence?.[key] || 'low';
                            const displayValue = Array.isArray(value) ? value.join(', ') : value;

                            return (
                                <div
                                    key={key}
                                    className="flex items-start gap-2 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-medium text-white/50 uppercase">
                                                {key.replace(/_/g, ' ')}
                                            </p>
                                            {getConfidenceBadge(confidence)}
                                        </div>
                                        <p className="text-sm text-white/90 break-words">
                                            {displayValue}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAcceptField(key, value)}
                                        disabled={updating}
                                        className="flex-shrink-0 p-1.5 hover:bg-green-500/20 text-green-400 rounded transition-colors disabled:opacity-50"
                                        title="Accept this field"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cross-Reference Issues */}
            {crossRefIssues.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                    <h4 className="text-sm font-medium text-white/70">Data Consistency Issues</h4>
                    {crossRefIssues.map((issue, idx) => (
                        <div
                            key={idx}
                            className={`text-sm p-3 rounded-lg flex items-start gap-2 ${issue.severity === 'error'
                                    ? 'bg-red-400/10 border border-red-400/20 text-red-400'
                                    : 'bg-amber-400/10 border border-amber-400/20 text-amber-400'
                                }`}
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">{issue.field}</p>
                                <p className="text-xs opacity-80">{issue.issue}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
