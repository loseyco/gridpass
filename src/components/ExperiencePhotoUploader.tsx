'use client';

import React, { useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface ExperiencePhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  description?: string;
}

export function ExperiencePhotoUploader({
  photos = [],
  onChange,
  label = 'Asset Photo Gallery & Proof',
  description = 'Upload vehicle builds, dyno sheets, pit lane action, or podium proof (JPG, PNG, WebP).',
}: ExperiencePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const base64Promises = fileList.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    });

    try {
      const newBase64Images = await Promise.all(base64Promises);
      const validImages = newBase64Images.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        onChange([...photos, ...validImages]);
      }
    } catch (err) {
      console.error('Error processing uploaded images:', err);
    }

    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-neutral-200 pb-3">
        <div>
          <label className="text-xs font-mono font-bold uppercase text-neutral-900 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#ff3b30]" /> {label}
          </label>
          {description && (
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[11px] font-mono font-bold text-neutral-500">
          {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Attached
        </span>
      </div>

      {/* Hidden File Input for Native multi-file & camera selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        data-testid="photo-file-input"
      />

      {/* Photos Thumbnail Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1" data-testid="photo-thumbnail-grid">
          {photos.map((photoUrl, idx) => (
            <div
              key={idx}
              data-testid={`photo-thumbnail-card-${idx}`}
              className="relative group rounded-xl overflow-hidden border border-neutral-300 bg-neutral-100 aspect-square shadow-2xs"
            >
              <img
                src={photoUrl}
                alt={`Uploaded photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  data-testid={`delete-photo-btn-${idx}`}
                  aria-label={`Remove photo ${idx + 1}`}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-[#ff3b30] hover:bg-[#bd2925] text-white rounded-xl shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Action / Drop Zone Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={triggerUpload}
          data-testid="add-photos-btn"
          className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-neutral-100 border border-dashed border-neutral-300 hover:border-neutral-400 text-neutral-800 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs active:scale-98 flex-1"
        >
          <Upload className="w-4 h-4 text-[#ff3b30]" />
          <span>{photos.length > 0 ? '+ Add More Photos' : '+ Upload Photos / Camera Capture'}</span>
        </button>
      </div>
    </div>
  );
}
