'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { 
  Camera, 
  Upload, 
  Compass, 
  Loader2, 
  AlertTriangle,
  QrCode, 
  HelpCircle, 
  Check, 
  ChevronRight,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import jsQR from 'jsqr';
import { logEvent } from '@/lib/logger';

export default function QRScannerPage() {
  const router = useRouter();
  
  // Camera & Scanner State
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Status HUD
  const [scanStatus, setScanStatus] = useState<string>('Searching for QR code...');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState<boolean>(false);
  
  // Elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // List camera devices
  useEffect(() => {
    async function getDevices() {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        
        // Select back camera by default if available
        const backCamera = videoDevices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment')
        );
        if (backCamera) {
          setSelectedDeviceId(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        } else {
          setHasCamera(false);
          setScanStatus('No camera devices detected. Use file upload below.');
        }
      } catch (err) {
        console.warn("Device enumeration failed:", err);
      }
    }
    getDevices();
  }, []);

  // Control camera stream based on active device and status
  useEffect(() => {
    if (!cameraActive || !hasCamera || isProcessingRedirect) {
      stopCamera();
      return;
    }

    startCamera(selectedDeviceId);

    return () => {
      stopCamera();
    };
  }, [selectedDeviceId, cameraActive, hasCamera, isProcessingRedirect]);

  async function startCamera(deviceId: string) {
    stopCamera();
    setScanStatus('Initializing camera stream...');
    setPermissionState('prompt');

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'environment' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionState('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        
        // Start scanning loop once video is metadata-loaded
        videoRef.current.onloadedmetadata = () => {
          setScanning(true);
          setScanStatus('Align QR code inside framework...');
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error("Camera access error:", err);
      setPermissionState('denied');
      setHasCamera(false);
      setScanStatus('Camera access denied or unavailable. Please upload a photo instead.');
      
      await logEvent(
        'error',
        'scan',
        `Camera stream acquisition failed: ${errMsg}`,
        { error: String(err) }
      );
    }
  }

  function stopCamera() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  // Scanning requestAnimationFrame loop
  const scanLoop = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      // Scale canvas to match video source
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Grab image pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan via jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // Found code!
        handleCodeDetected(code.data);
        return; // Terminate scan loop
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Handle successful QR detection
  const handleCodeDetected = async (data: string) => {
    stopCamera();
    setScanResult(data);
    setIsProcessingRedirect(true);
    setScanStatus('Gridpass tag found! Opening profile...');

    // Attempt geolocation logging (non-blocking)
    let lat: number | undefined;
    let lng: number | undefined;
    let accuracy: number | undefined;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        accuracy = pos.coords.accuracy;
      } catch (e) {
        console.warn("Geolocation prompt declined or timed out.");
      }
    }

    // Standard redirect router resolution
    let targetTagId = data.trim();
    
    // Parse if it's a URL
    try {
      if (data.includes('join?id=')) {
        const url = new URL(data);
        targetTagId = url.searchParams.get('id') || targetTagId;
      } else if (data.includes('/join/')) {
        const parts = data.split('/join/');
        targetTagId = parts[parts.length - 1];
      } else if (data.includes('/qr/')) {
        const parts = data.split('/qr/');
        targetTagId = parts[parts.length - 1];
      }
    } catch (e) {
      console.warn("URL parsing bypassed, resolving as raw tag.");
    }

    try {
      const scanPayload = {
        tagId: targetTagId,
        scannedAt: new Date().toISOString(),
        device: 'Webcam Scanner',
        userAgent: navigator.userAgent,
        ...(lat && lng ? { location: { lat, lng, accuracy } } : {})
      };

      // Add to scans analytics collection
      await addDoc(collection(db, 'tag_scans'), scanPayload);

      await logEvent(
        'info',
        'scan',
        `Physical webcam scan recorded for tag [${targetTagId}]. Location: ${lat ? 'Attributed' : 'Declined'}`,
        scanPayload
      );
    } catch (err) {
      console.error("Failed to write scan event metadata:", err);
    }

    // Route user directly to join portal
    setTimeout(() => {
      router.push(`/join?id=${encodeURIComponent(targetTagId)}`);
    }, 1200);
  };

  // Image Upload Parser Fallback
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('Parsing upload file...');
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          setScanStatus('Failed to find QR code in image. Make sure code is clear.');
          alert("QR Code not recognized in image. Please try another snapshot.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-[#060608] text-white relative overflow-hidden flex flex-col justify-between">
      <div className="mesh-glow" />
      <Navbar />

      <div className="max-w-xl mx-auto px-6 pt-24 pb-16 relative z-10 w-full flex-grow flex flex-col justify-center space-y-8">
        
        {/* Signage Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Zero-Hardware Access check
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
            Scan Gridpass
          </h1>
          <p className="text-neutral-400 text-xs max-w-xs mx-auto uppercase tracking-widest font-mono">
            Gridpass QR Scanner
          </p>
        </div>

        {/* Viewfinder Glass Card */}
        <div className="glass-card p-4 rounded-3xl border-blue-500/10 flex flex-col gap-4 relative">
          
          {/* Scanner Overlay screen HUD */}
          <div className="relative aspect-video w-full bg-neutral-950/80 rounded-2xl overflow-hidden border border-neutral-900 flex items-center justify-center">
            
            {/* Real Webcam Stream element */}
            {hasCamera && cameraActive && !isProcessingRedirect && (
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                muted 
                playsInline 
              />
            )}

            {/* Hidden canvas for image analysis */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Neon scanner overlay lines & indicators */}
            {scanning && !isProcessingRedirect && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                
                {/* Visual Viewfinder targeting corner marks */}
                <div className="absolute w-48 h-48 border border-dashed border-cyan-500/30 rounded-2xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />
                  
                  {/* Glowing core badge */}
                  <QrCode className="w-8 h-8 text-cyan-400/20" />
                </div>
                
                {/* Animated pulsating scan line */}
                <div className="absolute w-full h-0.5 bg-cyan-400/50 shadow-lg shadow-cyan-400/60 animate-scanLine top-0" />
              </div>
            )}

            {/* Fallbacks & Loading states */}
            {isProcessingRedirect && (
              <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 animate-pulse">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-emerald-400 tracking-tight">Scanner Connected</h3>
                  <p className="text-xs text-neutral-400">Opening profile page...</p>
                </div>
                {scanResult && (
                  <div className="max-w-[240px] p-2 bg-neutral-900 border border-neutral-850 rounded-lg text-[9px] font-mono text-neutral-500 truncate">
                    Data: {scanResult}
                  </div>
                )}
              </div>
            )}

            {(!hasCamera || !cameraActive) && !isProcessingRedirect && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-neutral-500">
                <Camera className="w-10 h-10 text-neutral-700" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-neutral-400 uppercase">Camera Blocked or Offline</p>
                  <p className="text-[10px] text-neutral-600 max-w-xs leading-relaxed">
                    Approve camera permissions in your browser or select an image from your camera roll manually using the file link below.
                  </p>
                </div>
              </div>
            )}

            {permissionState === 'prompt' && hasCamera && cameraActive && (
              <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Awaiting Video Link...</p>
              </div>
            )}
          </div>

          {/* StatusHUD readouts */}
          <div className="bg-neutral-950/60 border border-neutral-900 p-3 rounded-2xl flex items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-neutral-400 truncate uppercase flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${scanning && !isProcessingRedirect ? 'bg-cyan-500 animate-ping' : 'bg-neutral-700'}`} />
              {scanStatus}
            </span>
            
            {/* Camera Select selector if multiple cameras exist */}
            {devices.length > 1 && !isProcessingRedirect && (
              <button 
                onClick={() => {
                  const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
                  const nextIndex = (currentIndex + 1) % devices.length;
                  setSelectedDeviceId(devices[nextIndex].deviceId);
                }}
                className="py-3 px-5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-750 text-neutral-200 hover:text-white rounded-xl transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-black/10"
              >
                <RefreshCw className="w-4.5 h-4.5 text-cyan-400" /> Flip Camera
              </button>
            )}
          </div>
        </div>

        {/* File upload fallback container */}
        <div className="text-center space-y-4">
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Or upload saved photo</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 glass-card hover:bg-white/5 border border-dashed border-neutral-900 hover:border-neutral-750 text-neutral-400 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4.5 h-4.5 text-blue-500" />
            Upload from Camera Roll / Snapshot
          </button>
        </div>

        {/* Navigation back helper */}
        <div className="text-center">
          <button 
            onClick={() => router.back()}
            className="text-xs text-neutral-500 hover:text-neutral-300 font-bold uppercase tracking-wider transition-colors"
          >
            ← Cancel Scan
          </button>
        </div>

      </div>
      <Footer />
    </main>
  );
}
