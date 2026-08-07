'use client';

import React from 'react';

export default function Logo({ 
  className = "w-8 h-8", 
  textClassName = "",
  showText = true,
  variant = "image"
}: { 
  className?: string; 
  textClassName?: string;
  showText?: boolean;
  variant?: "vector" | "image";
}) {
  // Split classes to apply width/height to SVG, and centering/margins to parent div wrapper
  const classes = className.split(' ');
  const svgClasses = classes.filter(c => c.startsWith('w-') || c.startsWith('h-') || c.startsWith('max-w-') || c.startsWith('max-h-')).join(' ');
  const wrapperClasses = classes.filter(c => !c.startsWith('w-') && !c.startsWith('h-') && !c.startsWith('max-w-') && !c.startsWith('max-h-')).join(' ');

  return (
    <div className={`flex items-center gap-2 justify-center ${wrapperClasses}`}>
      {variant === "image" ? (
        <img 
          src="/gridpass_logo.png" 
          alt="Gridpass Logo" 
          className={`${svgClasses} shrink-0 object-contain`} 
        />
      ) : (
        <svg 
          className={`${svgClasses} shrink-0`} 
          viewBox="0 0 400 350" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Official Gridpass Original Logo Emblem Geometry */}
          
          {/* Mountain Peaks (White/Silver High-Contrast Silhouette) */}
          <path 
            d="M 30 205 L 95 88 L 115 185 L 170 40 L 195 145 L 250 85 L 280 155 Z" 
            fill="#ffffff" 
          />
          {/* Inner Mountain Valley Shadow Cutouts */}
          <path 
            d="M 95 88 L 110 170 M 170 40 L 188 135 M 250 85 L 265 148" 
            stroke="#0a0a0c" 
            strokeWidth="7" 
            strokeLinecap="round" 
          />

          {/* Curving Racetrack Road - Left Red & White Rumble Curb Blocks */}
          <g>
            {/* White Curb Block 1 */}
            <path d="M 285 170 C 270 172, 230 185, 205 190 L 225 210 C 250 205, 290 190, 305 188 Z" fill="#ffffff" />
            {/* Red Curb Block 1 */}
            <path d="M 205 190 C 180 195, 150 215, 135 225 L 155 245 C 170 235, 200 215, 225 210 Z" fill="#ff3b30" />
            {/* White Curb Block 2 */}
            <path d="M 135 225 C 120 235, 95 260, 80 275 L 105 298 C 120 280, 145 258, 155 245 Z" fill="#ffffff" />
            {/* Red Curb Block 2 */}
            <path d="M 80 275 C 65 290, 35 330, 25 345 L 55 370 C 65 352, 95 315, 105 298 Z" fill="#ff3b30" />
            {/* White Curb Block 3 */}
            <path d="M 25 345 C 18 355, 10 368, 5 378 L 38 395 C 42 385, 48 375, 55 370 Z" fill="#ffffff" />
          </g>

          {/* Curving Racetrack Right Border - Solid Sweeping Crimson Red Line */}
          <path 
            d="M 335 170 C 300 175, 220 200, 195 245 C 170 290, 175 350, 170 380 L 210 380 C 215 340, 215 285, 240 240 C 260 205, 320 188, 345 182 Z" 
            fill="#ff3b30" 
          />
        </svg>
      )}
      
      {/* Brand Logo Text styling */}
      {showText && (
        <span className={`font-black tracking-tighter text-neutral-900 ${textClassName}`}>
          GRID<span className="text-[#ff3b30]">PASS</span>
        </span>
      )}
    </div>
  );
}
