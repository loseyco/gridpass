'use client';

import React from 'react';

export default function Logo({ className = "w-8 h-8", textClassName = "" }: { className?: string; textClassName?: string }) {
  // Split classes to apply width/height to SVG, and centering/margins to parent div wrapper
  const classes = className.split(' ');
  const svgClasses = classes.filter(c => c.startsWith('w-') || c.startsWith('h-') || c.startsWith('max-w-') || c.startsWith('max-h-')).join(' ');
  const wrapperClasses = classes.filter(c => !c.startsWith('w-') && !c.startsWith('h-') && !c.startsWith('max-w-') && !c.startsWith('max-h-')).join(' ');

  return (
    <div className={`flex items-center gap-2 justify-center ${wrapperClasses}`}>
      <svg 
        className={`${svgClasses} shrink-0`} 
        viewBox="0 0 120 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mountain Peaks - matching the sharp high-contrast offroad crest */}
        <path 
          d="M10 70 L42 22 L65 52 L88 28 L110 70 Z" 
          fill="url(#mountainGrad)" 
          stroke="#1c1c1e" 
          strokeWidth="5" 
          strokeLinejoin="round" />
        {/* Ridge shadow highlights */}
        <path 
          d="M42 22 L52 42 M88 28 L98 48" 
          stroke="#525252" 
          strokeWidth="3.5" 
          strokeLinecap="round" />
        
        {/* Winding curvy asphalt racetrack road */}
        <path 
          d="M18 86 C 48 86, 56 59, 96 59" 
          stroke="#262626" 
          strokeWidth="15" 
          strokeLinecap="round" />
        
        {/* Muted racing red and high-contrast white alternate curb stripes */}
        <path 
          d="M18 90 C 48 90, 56 63, 96 63" 
          stroke="#ffffff" 
          strokeWidth="5.5" 
          strokeLinecap="round" />
        <path 
          d="M18 90 C 48 90, 56 63, 96 63" 
          stroke="#ff3b30" 
          strokeWidth="5.5" 
          strokeDasharray="9 9" 
          strokeLinecap="round" />

        <defs>
          <linearGradient id="mountainGrad" x1="60" y1="22" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1c1c1f" />
            <stop offset="1" stopColor="#08080a" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Brand Logo Text styling - "GRID" in bold charcoal-black, "PASS" in bold system-red */}
      <span className={`font-black tracking-tighter text-neutral-900 ${textClassName}`}>
        GRID<span className="text-[#ff3b30]">PASS</span>
      </span>
    </div>
  );
}
