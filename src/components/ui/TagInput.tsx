'use client';

import { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    suggestions?: string[];
}

export default function TagInput({ value = [], onChange, placeholder = "Add a tag...", suggestions = [] }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value.length - 1);
        }
    };

    const addTag = () => {
        const tag = inputValue.trim();
        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
            setInputValue('');
        }
    };

    const removeTag = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 p-3 bg-neutral-950 border border-white/10 rounded min-h-[50px] focus-within:border-indigo-500 transition-colors">
                {value.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-sm px-2 py-1 rounded">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="hover:text-white focus:outline-none"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    className="flex-1 bg-transparent border-none outline-none text-white min-w-[120px] placeholder:text-neutral-600"
                    placeholder={value.length === 0 ? placeholder : ''}
                />
            </div>
            {suggestions.length > 0 && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.filter(s => !value.includes(s)).slice(0, 8).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    onChange([...value, s]);
                                }}
                                className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-2 py-1 rounded border border-white/5 transition-colors"
                            >
                                + {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
