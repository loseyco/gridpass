'use client';

import React, { useState, useEffect } from 'react';
import { AgentStaff } from '@/lib/types/admin';

interface AgentTrainingDrawerProps {
  isOpen: boolean;
  agent: AgentStaff | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<AgentStaff>) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: AgentStaff['status']) => Promise<void>;
}

const LLM_MODELS = [
  'Claude 3.5 Sonnet',
  'Gemini 2.0 Flash',
  'GPT-4o',
  'DeepSeek-V3',
  'Llama 3.3 70B',
];

const API_KEY_TEMPLATES = [
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'GITHUB_TOKEN',
  'PLAYWRIGHT_AUTH',
];

export function AgentTrainingDrawer({
  isOpen,
  agent,
  onClose,
  onSave,
  onToggleStatus,
}: AgentTrainingDrawerProps) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'sops' | 'status' | 'audit'>('credentials');
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<AgentStaff['status']>('ACTIVE');
  const [llmModel, setLlmModel] = useState('Claude 3.5 Sonnet');
  const [apiKeyName, setApiKeyName] = useState('ANTHROPIC_API_KEY');
  const [credentialsConfigured, setCredentialsConfigured] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (agent) {
      setName(agent.name || '');
      setTitle(agent.title || '');
      setCategory(agent.category || '');
      setStatus(agent.status || 'ACTIVE');
      setLlmModel(agent.llm_model || 'Claude 3.5 Sonnet');
      setApiKeyName(agent.api_key_name || 'ANTHROPIC_API_KEY');
      setCredentialsConfigured(agent.credentials_configured ?? true);
      setSystemPrompt(agent.system_prompt || '');
      setNotes(agent.notes || '');
    }
  }, [agent]);

  if (!isOpen || !agent) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(agent.id, {
        name,
        title,
        category,
        status,
        llm_model: llmModel,
        api_key_name: apiKeyName,
        credentials_configured: credentialsConfigured,
        system_prompt: systemPrompt,
        notes,
        updated_at: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save agent credentials:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200 font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white font-black text-lg flex items-center justify-center shadow-xs">
              {agent.icon || '🤖'}
            </div>
            <div>
              <h2 className="font-black text-base uppercase text-[#1c1c1e] tracking-tight">
                {name}
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                Role: <span className="font-bold text-neutral-900 uppercase">@{agent.role_code}</span> • {category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target-44 min-w-[44px] min-h-[44px] rounded-lg text-neutral-400 hover:text-neutral-900 font-bold active:scale-95 transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-white px-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'credentials', label: '1. Credentials & API' },
            { id: 'sops', label: '2. Training & System SOP' },
            { id: 'status', label: '3. Operational Status' },
            { id: 'audit', label: '4. Telemetry & Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#ff3b30] text-[#ff3b30]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: Credentials & API Keys */}
          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                <span className="text-xs font-black uppercase text-neutral-900 block">LLM Engine & API Configuration</span>
                <p className="text-xs text-neutral-600">
                  Manage backend LLM model routing and environment credential mapping for this subagent.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Primary LLM Model</label>
                <select
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none min-h-[44px]"
                >
                  {LLM_MODELS.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">API Key Environment Reference</label>
                <select
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  className="w-full text-base md:text-xs font-mono font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none min-h-[44px]"
                >
                  {API_KEY_TEMPLATES.map((keyName) => (
                    <option key={keyName} value={keyName}>{keyName}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-800 uppercase block">API Key Status</span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {credentialsConfigured ? '🔑 Verified in .env.development.local' : '⚠️ Missing API Credentials'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCredentialsConfigured(!credentialsConfigured)}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg border transition ${
                    credentialsConfigured
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {credentialsConfigured ? '✓ Configured' : '❌ Unset'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Internal Execution Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or token usage guardrails for this agent..."
                  className="w-full text-base md:text-xs font-sans p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Training & System SOP */}
          {activeTab === 'sops' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Subagent Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">Role & Responsibility Summary</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base md:text-xs font-bold p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:border-[#ff3b30] outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">System Prompt SOP Guidelines</label>
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter system domain rules, coding standard invariants, and SOP steps..."
                  className="w-full text-base md:text-xs font-mono p-3 bg-neutral-900 text-neutral-100 border border-neutral-700 rounded-xl focus:border-[#ff3b30] outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Operational Status */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1">
                <span className="text-xs font-black uppercase text-neutral-900 block">Subagent Availability State</span>
                <p className="text-xs text-neutral-600">
                  Control whether this subagent can be dispatched by the General Manager (GM) for active tasks.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'ACTIVE', label: '🟢 Active', desc: 'Ready for full autonomous execution' },
                  { key: 'TRAINING', label: '🟡 Training', desc: 'SOP refinement and fine-tuning mode' },
                  { key: 'STANDBY', label: '⚪ Standby', desc: 'Idle, available when called' },
                  { key: 'PAUSED', label: '🔴 Paused', desc: 'Disabled from task queue' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatus(item.key as any)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between min-h-[64px] active:scale-95 ${
                      status === item.key
                        ? 'border-[#ff3b30] ring-2 ring-[#ff3b30]/20 bg-neutral-900 text-white'
                        : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="text-xs font-black uppercase">{item.label}</span>
                    <span className={`text-[10px] ${status === item.key ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Audit & Telemetry */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                <span className="text-xs font-black uppercase text-neutral-900 block">Agent Metadata & Telemetry</span>
                <div className="space-y-1 text-xs text-neutral-600 font-mono">
                  <p>Document ID: <span className="text-neutral-900 font-bold">{agent.id}</span></p>
                  <p>Role Code: <span className="text-neutral-900 font-bold">@{agent.role_code}</span></p>
                  <p>Tickets Delivered: <span className="text-neutral-900 font-bold">{agent.tickets_completed || 0}</span></p>
                  <p>SOPs Authored: <span className="text-neutral-900 font-bold">{agent.sops_count || 0}</span></p>
                  <p>Last Active: <span className="text-neutral-900 font-bold">{agent.last_active_at || 'Active Now'}</span></p>
                  <p>Created: <span className="text-neutral-900 font-bold">{agent.created_at || 'Initial Seed'}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(agent.id, status)}
              className={`py-2.5 px-3 min-h-[44px] text-xs font-black uppercase rounded-xl border transition active:scale-95 ${
                status === 'ACTIVE'
                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {status === 'ACTIVE' ? '🔴 Pause Subagent' : '🟢 Activate Subagent'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 min-h-[44px] text-xs font-black uppercase bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-xl transition active:scale-95"
            >
              Close
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full touch-target-44 min-h-[44px] py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving Credentials...' : '💾 Save Agent Credentials'}
          </button>
        </div>

      </div>
    </div>
  );
}
