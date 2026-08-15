'use client';

import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  label?: string;
  description?: string;
  badge?: React.ReactNode;
}

export function SkillsTagInput({
  skills = [],
  onChange,
  label = 'Skills & Tools Used',
  description = 'Highlight specific technical disciplines, tools, software, or hands-on trades utilized.',
  badge,
}: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addSkill = (rawTag: string) => {
    const trimmed = rawTag.trim();
    if (!trimmed) return;

    // Support comma-separated batch adding (e.g. "Welding, Excel, Manager")
    const tagsToAdd = trimmed
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updated = [...skills];
    let addedAny = false;

    for (const tag of tagsToAdd) {
      if (!updated.some((s) => s.toLowerCase() === tag.toLowerCase())) {
        updated.push(tag);
        addedAny = true;
      }
    }

    if (addedAny) {
      onChange(updated);
    }
    setInputValue('');
  };

  const removeSkill = (tagToRemove: string) => {
    const updated = skills.filter((s) => s.toLowerCase() !== tagToRemove.toLowerCase());
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      addSkill(val);
    } else {
      setInputValue(val);
    }
  };

  return (
    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-neutral-200 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-mono font-bold uppercase text-neutral-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#ff3b30]" /> {label}
            </label>
            {badge}
          </div>
          {description && (
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[11px] font-mono font-bold text-neutral-500">
          {skills.length} {skills.length === 1 ? 'Tag' : 'Tags'} Added
        </span>
      </div>

      {/* Tag Cloud Pills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1" data-testid="skills-tag-cloud">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center pl-3.5 pr-1 py-1 bg-white border border-neutral-300 rounded-xl text-xs font-mono font-bold text-neutral-900 shadow-2xs group"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-[#ff3b30] transition-colors cursor-pointer ml-1"
                aria-label={`Remove skill ${skill}`}
                data-testid={`remove-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag Input Field & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          data-testid="skill-tag-input"
          placeholder='Type skill (e.g. "TIG Welding", "ECU Tuning", "Excel", "Fusion 360")...'
          className="flex-1 min-h-[44px] h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] shadow-2xs"
        />
        <button
          type="button"
          onClick={() => addSkill(inputValue)}
          data-testid="add-skill-tag-btn"
          className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Tag
        </button>
      </div>
    </div>
  );
}
