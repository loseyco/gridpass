'use client';

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Layers, FileJson, CheckCircle2, Search, Code2 } from 'lucide-react';

export default function AdminDatabaseExplorer() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const fetchInspection = async (coll = 'all') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/db-inspect?collection=${coll}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error inspecting database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspection(selectedCollection);
  }, [selectedCollection]);

  const handleCopyReport = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-[#ff3b30]" />
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 uppercase tracking-tight">
              Live Database Inspector & Schema Explorer
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Real-time inspection of Firestore collections, schema shapes, document counts, and raw JSON telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchInspection(selectedCollection)}
            disabled={loading}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-neutral-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleCopyReport}
            disabled={!data}
            className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FileJson className="w-3.5 h-3.5" />}
            <span>{copied ? 'Report Copied!' : 'Copy Full JSON'}</span>
          </button>
        </div>
      </div>

      {/* Collection Selector Bar */}
      {data?.report && (
        <div className="flex flex-wrap items-center gap-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs font-bold">
          <span className="text-neutral-500 uppercase text-[10px] tracking-wider px-1">
            Filter Collection:
          </span>
          <button
            onClick={() => setSelectedCollection('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              selectedCollection === 'all'
                ? 'bg-neutral-900 text-white font-black'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            All Collections
          </button>
          {Object.keys(data.report).map((coll) => {
            const count = data.report[coll]?.countSample || 0;
            return (
              <button
                key={coll}
                onClick={() => setSelectedCollection(coll)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCollection === coll
                    ? 'bg-[#ff3b30] text-white font-black'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <span>{coll}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/10 rounded-full font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Database Report Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs font-bold text-neutral-500">
          Fetching live Firestore telemetry & schemas... ⏳
        </div>
      ) : !data?.report ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-xs font-bold text-neutral-500">
          Failed to load database telemetry report.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(data.report).map((collName) => {
            const collData = data.report[collName];
            const hasError = !!collData.error;
            const schemaFields = collData.schema ? Object.keys(collData.schema) : [];

            return (
              <div
                key={collName}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm space-y-3 p-5"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#ff3b30]" />
                    <h2 className="font-black text-base text-neutral-900 uppercase tracking-tight">
                      Collection: <span className="text-[#ff3b30]">{collName}</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs font-bold">
                    {hasError ? (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg">
                        ⚠️ Permission Denied
                      </span>
                    ) : (
                      <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2.5 py-1 rounded-lg">
                        {collData.countSample} Sample Docs
                      </span>
                    )}
                  </div>
                </div>

                {hasError ? (
                  <p className="text-xs text-red-600 font-semibold bg-red-50 p-3 rounded-xl">
                    Error: {collData.error}
                  </p>
                ) : (
                  <>
                    {/* Schema Field Pills */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                        Detected Schema Fields ({schemaFields.length}):
                      </p>
                      {schemaFields.length === 0 ? (
                        <p className="text-xs text-neutral-400 font-medium">
                          No records stored in this collection yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {schemaFields.map((field) => (
                            <span
                              key={field}
                              className="bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md"
                            >
                              {field} <span className="text-neutral-400 font-normal">({collData.schema[field]})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sample Records JSON View */}
                    {collData.sampleRecords?.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-neutral-400">
                          <span>Sample Document Snapshot (#1)</span>
                          <span className="font-mono text-neutral-500">
                            Doc ID: {collData.sampleRecords[0].id}
                          </span>
                        </div>
                        <pre className="bg-neutral-900 text-neutral-200 text-xs p-4 rounded-xl font-mono overflow-x-auto max-h-60">
                          {JSON.stringify(collData.sampleRecords[0], null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
