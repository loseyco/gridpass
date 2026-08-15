'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

interface ExperienceDatePickerProps {
  startDate: string; // e.g. "2021-06" or "2021"
  endDate: string; // e.g. "2024-02" or ""
  isCurrent: boolean; // true if Present
  onChange: (data: { startDate: string; endDate: string; isCurrent: boolean; dateRangeText: string }) => void;
}

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 45 }, (_, i) => (currentYear - i).toString());

export function ExperienceDatePicker({
  startDate = '',
  endDate = '',
  isCurrent = false,
  onChange,
}: ExperienceDatePickerProps) {
  // Parse startDate into month and year
  const [startYearPart, startMonthPart] = startDate.includes('-')
    ? startDate.split('-')
    : [startDate || '', ''];

  // Parse endDate into month and year
  const [endYearPart, endMonthPart] = endDate.includes('-')
    ? endDate.split('-')
    : [endDate || '', ''];

  const computeDateRangeText = (
    sYear: string,
    sMonth: string,
    eYear: string,
    eMonth: string,
    current: boolean
  ) => {
    let startLabel = '';
    if (sYear) {
      const monthObj = MONTHS.find((m) => m.value === sMonth);
      startLabel = monthObj ? `${monthObj.label} ${sYear}` : sYear;
    }

    if (!startLabel) return '';

    if (current) {
      return `${startLabel} – Present`;
    }

    let endLabel = '';
    if (eYear) {
      const monthObj = MONTHS.find((m) => m.value === eMonth);
      endLabel = monthObj ? `${monthObj.label} ${eYear}` : eYear;
    }

    return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
  };

  const handleStartYearChange = (year: string) => {
    const sDate = startMonthPart ? `${year}-${startMonthPart}` : year;
    const dateRangeText = computeDateRangeText(year, startMonthPart, endYearPart, endMonthPart, isCurrent);
    onChange({ startDate: sDate, endDate, isCurrent, dateRangeText });
  };

  const handleStartMonthChange = (month: string) => {
    const sDate = month && startYearPart ? `${startYearPart}-${month}` : (startYearPart || '');
    const dateRangeText = computeDateRangeText(startYearPart, month, endYearPart, endMonthPart, isCurrent);
    onChange({ startDate: sDate, endDate, isCurrent, dateRangeText });
  };

  const handleEndYearChange = (year: string) => {
    const eDate = endMonthPart ? `${year}-${endMonthPart}` : year;
    const dateRangeText = computeDateRangeText(startYearPart, startMonthPart, year, endMonthPart, isCurrent);
    onChange({ startDate, endDate: eDate, isCurrent, dateRangeText });
  };

  const handleEndMonthChange = (month: string) => {
    const eDate = month && endYearPart ? `${endYearPart}-${month}` : (endYearPart || '');
    const dateRangeText = computeDateRangeText(startYearPart, startMonthPart, endYearPart, month, isCurrent);
    onChange({ startDate, endDate: eDate, isCurrent, dateRangeText });
  };

  const handleToggleCurrent = (checked: boolean) => {
    const eDate = checked ? '' : endDate;
    const dateRangeText = computeDateRangeText(
      startYearPart,
      startMonthPart,
      checked ? '' : endYearPart,
      checked ? '' : endMonthPart,
      checked
    );
    onChange({ startDate, endDate: eDate, isCurrent: checked, dateRangeText });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#ff3b30]" /> Role Timeline & Dates
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => handleToggleCurrent(e.target.checked)}
            className="w-4 h-4 rounded text-[#ff3b30] focus:ring-[#ff3b30] border-neutral-300 cursor-pointer"
          />
          <span className="text-xs font-bold text-neutral-700">Currently in this role (Present)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            Start Date <span className="text-[#ff3b30]">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={startMonthPart}
              onChange={(e) => handleStartMonthChange(e.target.value)}
              className="h-12 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] outline-none transition-all min-h-[44px]"
            >
              <option value="">Month (Optional)</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={startYearPart}
              onChange={(e) => handleStartYearChange(e.target.value)}
              className="h-12 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] outline-none transition-all min-h-[44px]"
            >
              <option value="">Year *</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* End Date */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
            End Date
          </span>
          {isCurrent ? (
            <div className="h-12 px-4 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present (Active Role)
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <select
                value={endMonthPart}
                onChange={(e) => handleEndMonthChange(e.target.value)}
                className="h-12 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] outline-none transition-all min-h-[44px]"
              >
                <option value="">Month (Optional)</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={endYearPart}
                onChange={(e) => handleEndYearChange(e.target.value)}
                className="h-12 px-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-sm font-bold focus:bg-white focus:border-[#ff3b30] outline-none transition-all min-h-[44px]"
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
