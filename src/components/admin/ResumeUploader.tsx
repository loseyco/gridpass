'use client';

import { useState } from 'react';
import { Upload, FileText, Check, X, Loader } from 'lucide-react';

interface ResumeUploaderProps {
    leadId: string;
    currentResumeUrl?: string;
}

export default function ResumeUploader({ leadId, currentResumeUrl }: ResumeUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState(currentResumeUrl);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(f => f.type === 'application/pdf');

        if (pdfFile) {
            await uploadFile(pdfFile);
        } else {
            alert('Please upload a PDF file');
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('leadId', leadId);

            const response = await fetch('/api/admin/upload-resume', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setUploadedUrl(result.url);
                window.location.reload(); // Refresh to show updated URL
            } else {
                alert('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border border-white/10 bg-neutral-900/30 rounded-xl p-6">
            <h3 className="font-bold mb-4 text-neutral-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resume Upload
            </h3>

            {uploadedUrl ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-bold">Resume Uploaded</span>
                    </div>
                    <a
                        href={uploadedUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-2 rounded-lg transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        View Resume PDF
                    </a>
                    <button
                        onClick={() => setUploadedUrl(undefined)}
                        className="w-full text-xs text-neutral-500 hover:text-neutral-300"
                    >
                        Upload Different File
                    </button>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center transition-all
                        ${isDragging
                            ? 'border-indigo-400 bg-indigo-500/10'
                            : 'border-white/20 hover:border-white/40 bg-black/20 hover:bg-black/30'
                        }
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="resume-upload"
                        disabled={isUploading}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-sm text-neutral-400">Uploading...</p>
                        </div>
                    ) : (
                        <label htmlFor="resume-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
                            <p className="text-sm text-neutral-300 font-bold mb-1">
                                Drop PDF here or click to upload
                            </p>
                            <p className="text-xs text-neutral-500">
                                Maximum file size: 10MB
                            </p>
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
