import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface GridpassQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  logoSize?: number;
  ecc?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * GridpassQRCode
 * 100% First-Party, In-House Local QR Generator Engine.
 * Generates crisp QR matrix locally using `qrcode` with High Error Correction (ECC=H)
 * and embeds the official centered Gridpass Mountain Peak & Racetrack Emblem.
 * Zero dependency on third-party QR generation web servers!
 */
export default function GridpassQRCode({
  value,
  size = 220,
  className = '',
  logoSize,
  ecc = 'H'
}: GridpassQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const centerLogoSize = logoSize || Math.max(34, Math.round(size * 0.24));

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: ecc,
      margin: 1,
      width: size,
      color: {
        dark: '#1c1c1e',
        light: '#ffffff'
      }
    }).then(url => {
      if (isMounted) setDataUrl(url);
    }).catch(err => {
      console.error('[GridpassQRCode] Local QR generation error:', err);
    });

    return () => { isMounted = false; };
  }, [value, size, ecc]);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Gridpass QR Code"
          width={size}
          height={size}
          className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm object-contain"
        />
      ) : (
        <div 
          style={{ width: `${size}px`, height: `${size}px` }} 
          className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm flex items-center justify-center text-xs font-mono font-bold text-neutral-400"
        >
          Generating QR...
        </div>
      )}

      {/* Centered Official Gridpass Logo Emblem */}
      <div 
        className="absolute inset-0 m-auto rounded-xl bg-[#0a0a0c] border-2 border-neutral-900 shadow-md flex items-center justify-center p-1 overflow-hidden"
        style={{ width: `${centerLogoSize}px`, height: `${centerLogoSize}px` }}
      >
        <img 
          src="/gridpass_logo.png" 
          alt="Gridpass Logo" 
          className="w-full h-full object-contain" 
        />
      </div>
    </div>
  );
}

/**
 * 100% First-Party Local High-Res 1000x1000 PNG Generator.
 * Renders QR matrix locally using `qrcode` library + composites the centered Gridpass Emblem onto Canvas.
 * Zero external web server API requests!
 */
export async function downloadGridpassQR(value: string, filename = 'Gridpass_QR.png', size = 1000) {
  if (typeof window === 'undefined') return;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    // 1. Generate base QR code locally to Canvas
    await QRCode.toCanvas(canvas, value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: size,
      color: {
        dark: '#1c1c1e',
        light: '#ffffff'
      }
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 2. Draw centered dark background container box with rounded corners and border
    const logoBoxSize = Math.round(size * 0.24); // 240px for 1000px QR
    const logoPos = Math.round((size - logoBoxSize) / 2);

    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    const cornerRadius = Math.round(logoBoxSize * 0.2);
    ctx.roundRect(logoPos, logoPos, logoBoxSize, logoBoxSize, cornerRadius);
    ctx.fill();
    ctx.strokeStyle = '#1c1c1e';
    ctx.lineWidth = Math.max(4, Math.round(size * 0.008));
    ctx.stroke();

    // 3. Composite master /gridpass_logo.png image directly onto Canvas
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = '/gridpass_logo.png';

    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
    });

    const innerPadding = Math.round(logoBoxSize * 0.08);
    ctx.drawImage(
      logoImg,
      logoPos + innerPadding,
      logoPos + innerPadding,
      logoBoxSize - (innerPadding * 2),
      logoBoxSize - (innerPadding * 2)
    );

    // 4. Trigger direct browser file download
    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('[downloadGridpassQR] Failed to generate local QR image:', err);
  }
}
