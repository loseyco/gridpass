'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  ShieldAlert, 
  Terminal, 
  Search, 
  RefreshCw, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Bug
} from 'lucide-react';
import Logo from '@/components/Logo';

interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'auth' | 'scan' | 'payment' | 'system' | 'feedback';
  message: string;
  userEmail?: string | null;
  timestamp?: string | null;
  metadata?: Record<string, unknown>;
}

export default function AdminLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Authentication Access Gate
  const isAuthorized = !loading && user && user.email === 'loseyp@gmail.com';

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/admin/logs');
    }
  }, [user, loading, router]);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!isAuthorized) return;

    const logsRef = collection(db, 'system_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(150));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: LogEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let logTime: string | null = null;
        if (data.timestamp) {
          if (data.timestamp.toDate) {
            logTime = data.timestamp.toDate().toLocaleString();
          } else if (data.timestamp.seconds) {
            logTime = new Date(data.timestamp.seconds * 1000).toLocaleString();
          } else {
            logTime = String(data.timestamp);
          }
        }
        logsData.push({
          id: doc.id,
          level: data.level,
          category: data.category,
          message: data.message,
          userEmail: data.userEmail,
          timestamp: logTime,
          metadata: data.metadata,
        });
      });
      setLogs(logsData);
    }, (err) => {
      console.error("Firestore sync error", err);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060608]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  // Render Access Denied layout for unauthorized emails
  if (!user || user.email !== 'loseyp@gmail.com') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#060608] relative px-6 overflow-hidden">
        <div className="mesh-glow" />
        <div className="w-full max-w-md glass-card p-8 rounded-3xl text-center space-y-6 relative z-10 border-red-500/20">
          <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Access Restricted</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              This terminal console is secured for administrative clearance. Only authorized credentials can read database logs.
            </p>
          </div>
          <div className="p-4 bg-neutral-950/60 border border-neutral-900 rounded-xl text-left">
            <p className="text-neutral-500 text-xs uppercase tracking-wider font-bold">Active Principal:</p>
            <p className="text-neutral-300 font-mono text-xs truncate">{user ? user.email : 'Anonymous/Unauthenticated'}</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-xl text-sm transition-all"
          >
            Authenticate Admin User
          </button>
        </div>
      </main>
    );
  }

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] px-4 md:px-8 py-10 relative overflow-hidden">
      <div className="mesh-glow" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Security Clearance: active</span>
            </div>
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8" textClassName="text-2xl md:text-3xl" />
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest pl-2.5 border-l border-neutral-800">SYSTEM LOGGER</span>
            </div>
            <p className="text-neutral-400 text-sm">
              Real-time Firestore operations telemetry stream. Restricted to <span className="font-mono text-neutral-300 font-bold">{user.email}</span>.
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="glass-card px-5 py-3 rounded-2xl">
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Loaded Logs</p>
              <p className="text-2xl font-black text-white">{filteredLogs.length}</p>
            </div>
            <div className="glass-card px-5 py-3 rounded-2xl border-emerald-500/10">
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Feed Sync</p>
              <p className="text-2xl font-black text-emerald-400 flex items-center gap-1">
                Live
              </p>
            </div>
          </div>
        </div>

        {/* Controls Layout (Search & Filter) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="admin-search-logs"
              type="text"
              placeholder="Search logs by keyword or driver email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium"
            />
          </div>

          {/* Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950/60 p-1.5 border border-neutral-900 rounded-xl overflow-x-auto">
            {['all', 'info', 'success', 'warn', 'error'].map(lvl => (
              <button
                key={lvl}
                id={`level-pill-${lvl}`}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${selectedLevel === lvl ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950/60 p-1.5 border border-neutral-900 rounded-xl overflow-x-auto">
            {['all', 'auth', 'scan', 'payment', 'system', 'feedback'].map(cat => (
              <button
                key={cat}
                id={`cat-pill-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Log Feed Table / List */}
        <div className="glass-card rounded-3xl overflow-hidden border border-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-950/50 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Level</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-6">Log Message</th>
                  <th className="py-4 px-6">User Attribution</th>
                  <th className="py-4 px-6 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500 font-medium">
                      No system operations matched the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const levelColors = {
                      info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
                      success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                      warn: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
                      error: 'bg-red-500/10 text-red-400 border border-red-500/20',
                    }[log.level];

                    const levelIcons = {
                      info: <Info className="w-3.5 h-3.5" />,
                      success: <CheckCircle className="w-3.5 h-3.5" />,
                      warn: <AlertTriangle className="w-3.5 h-3.5" />,
                      error: <ShieldAlert className="w-3.5 h-3.5" />,
                    }[log.level];

                    const categoryColors = {
                      auth: 'text-indigo-400',
                      scan: 'text-orange-400',
                      payment: 'text-emerald-400',
                      system: 'text-neutral-400',
                      feedback: 'text-purple-400',
                    }[log.category];

                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-neutral-900/30 transition-colors group">
                          <td className="py-4 px-6 font-mono text-xs text-neutral-500 whitespace-nowrap">
                            {log.timestamp || 'Syncing...'}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${levelColors}`}>
                              {levelIcons}
                              {log.level}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold uppercase tracking-wider text-xs whitespace-nowrap">
                            <span className={categoryColors}>{log.category}</span>
                          </td>
                          <td className="py-4 px-6 text-white font-medium break-words max-w-sm">
                            {log.message}
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-neutral-400">
                            {log.userEmail || 'Anonymous'}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              className={`p-2 rounded-lg transition-colors ${expandedLogId === log.id ? 'bg-blue-600 text-white' : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible JSON Inspector */}
                        {expandedLogId === log.id && (
                          <tr className="bg-neutral-950/80 border-t border-b border-neutral-900">
                            <td colSpan={6} className="py-5 px-8 font-mono text-xs">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                                  <p className="text-neutral-500 font-bold uppercase tracking-wider">Telemetry Properties & Meta</p>
                                  <p className="text-neutral-600 font-bold uppercase text-[10px]">ID: {log.id}</p>
                                </div>
                                <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto p-4 bg-black/60 rounded-xl border border-neutral-900">
                                  {JSON.stringify(log.metadata || {}, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
