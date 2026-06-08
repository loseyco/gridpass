'use client';

import React, { useState, useEffect, useRef, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getDatabase, ref, set } from 'firebase/database';
import app from '@/lib/firebase/config';
import { 
  Loader2, ArrowLeft, ShieldAlert, Monitor, Circle, 
  Settings, Compass, Sun, Moon, Power, Check, Radio
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import MapComponent to prevent SSR window reference errors
const MapComponent = dynamic(() => import('@/components/os/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-zinc-950 border border-neutral-900 rounded-xl">
      <Loader2 className="w-6 h-6 text-[#bd2925] animate-spin" />
    </div>
  )
});

// Telemetry State Interface
interface TelemetryState {
  speed: number;
  rpm: number;
  temp: number;
  fuel: number;
  battery: number;
  latitude: number;
  longitude: number;
  heading: number;
  tripDistance: number;
  satellites: number;
  pitch: number;  // Offroad
  roll: number;   // Offroad
  altitude: number; // Moto
  isSwitch1On: boolean;
  isSwitch2On: boolean;
  launchLat: number | null;
  launchLng: number | null;
  topSpeed: number;
  zeroToSixty: number | null;
  brakingDistance: number | null;
  gForceX: number;
  gForceY: number;
  maxGForce: number;
}

export default function DashboardOSPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
      </div>
    }>
      <DashboardOSContent />
    </Suspense>
  );
}

function DashboardOSContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Component States
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<'marine' | 'trail' | 'moto' | 'street'>('marine');
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [firebaseSync, setFirebaseSync] = useState(false);
  
  const [state, setState] = useState<TelemetryState>({
    speed: 0,
    rpm: 0,
    temp: 85,
    fuel: 100,
    battery: 12.6,
    latitude: 25.7617,
    longitude: -80.1918,
    heading: 0,
    tripDistance: 0.0,
    satellites: 9,
    pitch: 0,
    roll: 0,
    altitude: 120,
    isSwitch1On: false,
    isSwitch2On: false,
    launchLat: null,
    launchLng: null,
    topSpeed: 0,
    zeroToSixty: null,
    brakingDistance: null,
    gForceX: 0,
    gForceY: 0,
    maxGForce: 0
  });

  const [trail, setTrail] = useState<{ lat: number; lng: number }[]>([]);
  const [simDrawerOpen, setSimDrawerOpen] = useState(false);
  const [cruiseActive, setCruiseActive] = useState(false);
  const [systemTime, setSystemTime] = useState('12:00 PM');

  // Drag Racing simulation states
  const [dragStage, setDragStage] = useState<'idle' | 'staged' | 'countdown' | 'go' | 'foul' | 'braking' | 'complete'>('idle');
  const [dragTree, setDragTree] = useState({
    preStage: false,
    stage: false,
    y1: false,
    y2: false,
    y3: false,
    green: false,
    red: false
  });
  const [dragReactionTime, setDragReactionTime] = useState<number | null>(null);
  const [dragZeroToSixty, setDragZeroToSixty] = useState<number | null>(null);
  const [dragBrakingDistance, setDragBrakingDistance] = useState<number | null>(null);
  const [dragFtsAccumulated, setDragFtsAccumulated] = useState<number>(0);
  
  // Ref variables for countdown timing
  const dragGreenTimeRef = useRef<number | null>(null);
  const dragLaunchTimeRef = useRef<number | null>(null);
  const dragZeroToSixtyTimeRef = useRef<number | null>(null);
  const dragBrakingStartTimeRef = useRef<number | null>(null);

  const cruiseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simTimeRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const firebaseSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Authenticate user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Clock Ticker
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes: number | string = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      setSystemTime(`${hours}:${minutes} ${ampm}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Drag Racing Countdown Lights Ticker Ticker
  useEffect(() => {
    if (dragStage !== 'countdown') return;

    // Reset countdown sequence
    setDragTree({
      preStage: true,
      stage: true,
      y1: false,
      y2: false,
      y3: false,
      green: false,
      red: false
    });

    let active = true;
    const timeouts: NodeJS.Timeout[] = [];

    // Yellow 1 after 500ms
    timeouts.push(setTimeout(() => {
      if (active) setDragTree(t => ({ ...t, y1: true }));
    }, 500));

    // Yellow 2 after 1000ms
    timeouts.push(setTimeout(() => {
      if (active) setDragTree(t => ({ ...t, y2: true }));
    }, 1000));

    // Yellow 3 after 1500ms
    timeouts.push(setTimeout(() => {
      if (active) setDragTree(t => ({ ...t, y3: true }));
    }, 1500));

    // Green after 2000ms
    timeouts.push(setTimeout(() => {
      if (active) {
        setDragTree(t => ({ ...t, green: true }));
        setDragStage('go');
        dragGreenTimeRef.current = Date.now();
        dragLaunchTimeRef.current = null;
        dragZeroToSixtyTimeRef.current = null;
        dragBrakingStartTimeRef.current = null;
      }
    }, 2000));

    return () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [dragStage]);

  // Fetch Vehicle Metadata & Auto-Detect Preset
  useEffect(() => {
    if (!user || !vehicleId) return;

    async function loadVehicle() {
      const isMock = typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__;

      if (isMock) {
        setVehicle({
          make: 'Jeep',
          model: 'Wrangler Rubicon',
          year: 2021
        });
        setPreset('trail');
        setState(prev => ({
          ...prev,
          latitude: 34.0522,
          longitude: -118.2437,
          launchLat: 34.0522,
          launchLng: -118.2437
        }));
        setTrail([{ lat: 34.0522, lng: -118.2437 }]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'vehicles', vehicleId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVehicle(data);

          // Detect Preset keywords
          const make = (data.make || '').toLowerCase();
          const model = (data.model || '').toLowerCase();
          let detectedPreset: 'marine' | 'trail' | 'moto' | 'street' = 'marine';

          if (
            make.includes('jeep') || make.includes('toyota') || make.includes('ford') ||
            model.includes('wrangler') || model.includes('rubicon') || model.includes('tundra') ||
            model.includes('tacoma') || model.includes('4runner') || model.includes('bronco') ||
            model.includes('raptor') || model.includes('crawler') || model.includes('offroad') ||
            model.includes('trail') || model.includes('atv') || model.includes('quad') ||
            model.includes('sxs') || model.includes('side-by-side') || model.includes('polaris') ||
            model.includes('can-am')
          ) {
            detectedPreset = 'trail';
            setPreset('trail');
          } else if (
            make.includes('ktm') || make.includes('honda') || make.includes('bmw') ||
            make.includes('suzuki') || make.includes('motorcycle') || model.includes('crf') ||
            model.includes('gs') || model.includes('drz') || model.includes('dr-z') ||
            model.includes('dual sport') || model.includes('dualsport') || model.includes('adventure') ||
            model.includes('dirt bike') || model.includes('dirtbike')
          ) {
            if (
              model.includes('r1') || model.includes('r6') || model.includes('cbr') ||
              model.includes('ninja') || model.includes('gsxr') || model.includes('gsx-r') ||
              model.includes('gixxer') || model.includes('panigale') || model.includes('s1000rr') ||
              model.includes('hayabusa')
            ) {
              detectedPreset = 'street';
              setPreset('street');
            } else {
              detectedPreset = 'moto';
              setPreset('moto');
            }
          } else if (
            make.includes('porsche') || make.includes('ferrari') || make.includes('lamborghini') ||
            make.includes('mclaren') || make.includes('corvette') || model.includes('mustang') ||
            model.includes('camaro') || model.includes('miata') || model.includes('mx-5') ||
            model.includes('supra') || model.includes('brz') || model.includes('gr86') ||
            model.includes('s2000') || model.includes('nsx') || model.includes('gtr') ||
            model.includes('type r') || model.includes('m3') || model.includes('m4') ||
            model.includes('m5') || model.includes('rs6') || model.includes('r8')
          ) {
            detectedPreset = 'street';
            setPreset('street');
          } else {
            detectedPreset = 'marine';
            setPreset('marine');
          }

          // Center starting location based on preset
          const startCoords = getPresetStartingCoords(detectedPreset);
          setState(prev => ({
            ...prev,
            latitude: startCoords.lat,
            longitude: startCoords.lng
          }));
          setTrail([{ lat: startCoords.lat, lng: startCoords.lng }]);

        } else {
          setVehicle({ make: 'GridPass', model: 'Guest Vehicle', year: 2026 });
          setPreset('marine');
        }
      } catch (err) {
        console.error("Failed to fetch vehicle metadata:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVehicle();
  }, [user, vehicleId]);

  // Set default coordinates for simulation starting points
  const getPresetStartingCoords = (targetPreset: 'marine' | 'trail' | 'moto' | 'street') => {
    if (targetPreset === 'trail') return { lat: 34.3639, lng: -118.4312 }; // Mojave Trail Desert
    if (targetPreset === 'moto') return { lat: 39.7392, lng: -104.9903 }; // Denver mountain climbs
    if (targetPreset === 'street') return { lat: 34.8732, lng: -118.2646 }; // Willow Springs Raceway
    return { lat: 25.7617, lng: -80.1918 }; // Miami bay
  };

  // Sync state coordinates on preset changes
  useEffect(() => {
    const coords = getPresetStartingCoords(preset);
    setState(prev => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      launchLat: null,
      launchLng: null
    }));
    setTrail([{ lat: coords.lat, lng: coords.lng }]);
    setCruiseActive(false);
  }, [preset]);

  // Handle tactile feedback click
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Firebase Realtime Telemetry Sync Loop
  useEffect(() => {
    if (!firebaseSync || !vehicleId) {
      if (firebaseSyncIntervalRef.current) {
        clearInterval(firebaseSyncIntervalRef.current);
        firebaseSyncIntervalRef.current = null;
      }
      return;
    }

    const rtdb = getDatabase(app);
    const telemetryRef = ref(rtdb, `telemetry/vehicle-${vehicleId}`);

    const sync = () => {
      const payload = {
        speed: Math.round(state.speed),
        rpm: Math.round(state.rpm),
        temp: Math.round(state.temp),
        fuel: Math.round(state.fuel),
        battery: parseFloat(state.battery.toFixed(1)),
        latitude: state.latitude,
        longitude: state.longitude,
        heading: Math.round(state.heading),
        tripDistance: parseFloat(state.tripDistance.toFixed(2)),
        satellites: state.satellites,
        pitch: Math.round(state.pitch),
        roll: Math.round(state.roll),
        altitude: Math.round(state.altitude),
        isSwitch1On: state.isSwitch1On,
        isSwitch2On: state.isSwitch2On,
        lastUpdated: new Date().toISOString()
      };
      
      set(telemetryRef, payload)
        .catch(err => console.error("Firebase RTDB telemetry sync error:", err));
    };

    // Trigger initial and interval syncs
    sync();
    firebaseSyncIntervalRef.current = setInterval(sync, 2000);

    return () => {
      if (firebaseSyncIntervalRef.current) {
        clearInterval(firebaseSyncIntervalRef.current);
        firebaseSyncIntervalRef.current = null;
      }
    };
  }, [firebaseSync, vehicleId, state]);

  // Dynamic Telemetry Simulator Cruise Loop
  useEffect(() => {
    if (!cruiseActive) {
      if (cruiseIntervalRef.current) {
        clearInterval(cruiseIntervalRef.current);
        cruiseIntervalRef.current = null;
      }
      return;
    }

    // Mark current spot as starting base if not set
    if (state.launchLat === null) {
      setState(prev => ({ ...prev, launchLat: state.latitude, launchLng: state.longitude }));
    }

    simTimeRef.current = 0;
    lastTimeRef.current = Date.now();

    cruiseIntervalRef.current = setInterval(() => {
      simTimeRef.current += 0.1;
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;      setState(prev => {
        let speed = prev.speed;
        let rpm = prev.rpm;
        let temp = prev.temp;
        let fuel = prev.fuel;
        let battery = prev.battery;
        let lat = prev.latitude;
        let lng = prev.longitude;
        let heading = prev.heading;
        let distance = prev.tripDistance;
        let pitch = prev.pitch;
        let roll = prev.roll;
        let altitude = prev.altitude;
        let gForceX = prev.gForceX;
        let gForceY = prev.gForceY;

        const cycle = simTimeRef.current;

        // Custom path physics per preset
        if (preset === 'marine') {
          // Dynamic curves in the bay
          speed = Math.max(15, Math.min(65, 32 + Math.sin(cycle) * 12));
          rpm = Math.max(2000, Math.min(6500, 4200 + Math.sin(cycle) * 1400));
          temp = Math.min(185, 130 + Math.sin(cycle / 5) * 10);
          fuel = Math.max(5, prev.fuel - 0.01);
          battery = 13.6 + Math.sin(cycle * 3) * 0.1;
          gForceX = (Math.random() - 0.5) * 0.1;
          gForceY = (Math.random() - 0.5) * 0.1;

          // Float coordinates
          const milesPerSec = speed / 3600;
          const distMoved = milesPerSec * deltaTime;
          const headingRad = (heading * Math.PI) / 180;
          const dLat = (distMoved * Math.cos(headingRad)) / 69;
          const dLng = (distMoved * Math.sin(headingRad)) / (69 * Math.cos((lat * Math.PI) / 180));
          
          lat += dLat;
          lng += dLng;
          distance += distMoved;
          heading = (heading + 40 * deltaTime) % 360;

        } else if (preset === 'trail') {
          // Slow rocky climb
          speed = Math.max(3, Math.min(18, 8 + Math.cos(cycle) * 4));
          rpm = Math.max(1100, Math.min(3200, 1800 + Math.sin(cycle * 2) * 500));
          temp = Math.min(225, 205 + Math.sin(cycle / 3) * 8);
          battery = 13.8 + Math.sin(cycle * 0.5) * 0.2;
          fuel = Math.max(12, prev.fuel - 0.005);
          gForceX = (Math.random() - 0.5) * 0.2;
          gForceY = (Math.random() - 0.5) * 0.15;

          // Simulated Pitch & Roll shifts
          pitch = Math.sin(cycle * 1.5) * 18 + Math.cos(cycle) * 4;
          roll = Math.cos(cycle * 1.2) * 12 + Math.sin(cycle) * 3;

          // Float coordinates
          const milesPerSec = speed / 3600;
          const distMoved = milesPerSec * deltaTime;
          const headingRad = (heading * Math.PI) / 180;
          const dLat = (distMoved * Math.cos(headingRad)) / 69;
          const dLng = (distMoved * Math.sin(headingRad)) / (69 * Math.cos((lat * Math.PI) / 180));

          lat += dLat;
          lng += dLng;
          distance += distMoved;
          // Rugged steering corrections
          heading = (heading + (Math.sin(cycle * 3) * 60) * deltaTime) % 360;

        } else if (preset === 'moto') {
          // Moto mountain run
          speed = Math.max(25, Math.min(85, 50 + Math.sin(cycle) * 20));
          rpm = Math.max(3000, Math.min(8500, 5500 + Math.sin(cycle) * 2200));
          battery = 14.1 + Math.sin(cycle) * 0.1;
          temp = Math.min(195, 175 + Math.sin(cycle / 6) * 5);
          fuel = Math.max(8, prev.fuel - 0.015);
          gForceX = Math.sin(cycle * 1.2) * 0.4;
          gForceY = Math.cos(cycle * 1.5) * 0.2;
          
          // Climb in altitude
          altitude = Math.max(100, prev.altitude + Math.sin(cycle / 2) * 15);

          // Float coordinates
          const milesPerSec = speed / 3600;
          const distMoved = milesPerSec * deltaTime;
          const headingRad = (heading * Math.PI) / 180;
          const dLat = (distMoved * Math.cos(headingRad)) / 69;
          const dLng = (distMoved * Math.sin(headingRad)) / (69 * Math.cos((lat * Math.PI) / 180));

          lat += dLat;
          lng += dLng;
          distance += distMoved;
          heading = (heading + (Math.sin(cycle / 2) * 35) * deltaTime) % 360;

        } else {
          // Street performance preset
          const startCoords = getPresetStartingCoords('street');
          
          if (dragStage !== 'idle') {
            // Drag mode physics
            if (dragStage === 'staged') {
              speed = 0;
              rpm = 4500 + Math.sin(cycle * 30) * 120;
              gForceX = 0;
              gForceY = 0;
            } else if (dragStage === 'countdown') {
              speed = 0;
              rpm = 4500 + Math.sin(cycle * 30) * 120;
              gForceX = 0;
              gForceY = 0;
            } else if (dragStage === 'go') {
              if (dragLaunchTimeRef.current === null) {
                // Reaction time delay (simulate driver reaction of 180ms)
                const elapsedSinceGreen = dragGreenTimeRef.current ? Date.now() - dragGreenTimeRef.current : 0;
                if (elapsedSinceGreen >= 180) {
                  dragLaunchTimeRef.current = Date.now();
                  const rt = (dragLaunchTimeRef.current - (dragGreenTimeRef.current || 0)) / 1000;
                  setDragReactionTime(rt);
                }
              }

              if (dragLaunchTimeRef.current !== null) {
                // Accelerate hard
                const accelRate = 26; // mph per second acceleration rate
                speed = prev.speed + accelRate * deltaTime;
                gForceY = 0.85 + Math.random() * 0.15;
                gForceX = (Math.random() - 0.5) * 0.05;

                // Gear shifting RPM emulation
                if (speed < 30) {
                  rpm = 4500 + (speed / 30) * 3000; // 1st gear
                } else if (speed < 60) {
                  rpm = 5000 + ((speed - 30) / 30) * 2500; // 2nd gear
                } else if (speed < 90) {
                  rpm = 5200 + ((speed - 60) / 30) * 2300; // 3rd gear
                } else {
                  rpm = 5500 + ((speed - 90) / 30) * 2000; // 4th gear
                }

                // 0-60 Time calculation
                if (speed >= 60 && dragZeroToSixtyTimeRef.current === null) {
                  dragZeroToSixtyTimeRef.current = Date.now();
                  const z60 = (dragZeroToSixtyTimeRef.current - dragLaunchTimeRef.current) / 1000;
                  setDragZeroToSixty(z60);
                }

                if (speed >= 110) {
                  setDragStage('braking');
                  dragBrakingStartTimeRef.current = Date.now();
                }
              } else {
                speed = 0;
                rpm = 4500;
                gForceX = 0;
                gForceY = 0;
              }
            } else if (dragStage === 'braking') {
              // Brake extremely hard
              const brakeRate = 38; // mph per second braking rate
              speed = Math.max(0, prev.speed - brakeRate * deltaTime);
              gForceY = -1.15 - Math.random() * 0.1;
              gForceX = (Math.random() - 0.5) * 0.08;
              rpm = 850 + (speed / 110) * 1200;

              // Track 60-0 braking distance
              if (prev.speed <= 60 && speed > 0) {
                const feetInStep = prev.speed * 1.46667 * deltaTime;
                setDragFtsAccumulated(f => f + feetInStep);
              }

              if (speed <= 0) {
                setDragStage('complete');
                setDragBrakingDistance(dragFtsAccumulated);
              }
            } else {
              // Foul or Complete
              speed = 0;
              rpm = 850;
              gForceX = 0;
              gForceY = 0;
            }
          } else {
            // Normal performance track cruise - Willow Springs loop
            speed = Math.max(45, Math.min(145, 85 + Math.sin(cycle) * 35));
            rpm = Math.max(2200, Math.min(7500, 4800 + Math.sin(cycle * 1.3) * 1800));
            temp = Math.min(215, 192 + Math.sin(cycle / 4) * 6);
            fuel = Math.max(2, prev.fuel - 0.008);
            battery = 14.1 + Math.sin(cycle * 2) * 0.08;
            gForceX = Math.sin(cycle * 1.5) * 0.5;
            gForceY = Math.cos(cycle * 0.8) * 0.3;

            // Track driving coordinates simulation
            lat = startCoords.lat + Math.sin(cycle / 4) * 0.0035;
            lng = startCoords.lng + Math.cos(cycle / 4) * 0.0045;
            heading = (heading + 60 * deltaTime) % 360;
          }

          // Float coordinates (if in drag mode, keep moving forward straight)
          if (dragStage === 'go' || dragStage === 'braking') {
            const milesPerSec = speed / 3600;
            const distMoved = milesPerSec * deltaTime;
            const headingRad = (heading * Math.PI) / 180;
            const dLat = (distMoved * Math.cos(headingRad)) / 69;
            const dLng = (distMoved * Math.sin(headingRad)) / (69 * Math.cos((lat * Math.PI) / 180));
            lat += dLat;
            lng += dLng;
            distance += distMoved;
          }
        }

        // Periodically append trail breadcrumbs
        if (Math.round(cycle * 10) % 5 === 0) {
          setTrail(prevTrail => {
            const newTrail = [...prevTrail, { lat, lng }];
            if (newTrail.length > 300) newTrail.shift();
            return newTrail;
          });
        }

        const newTopSpeed = Math.max(prev.topSpeed || 0, speed);

        return {
          ...prev,
          speed,
          rpm,
          temp,
          fuel,
          battery,
          latitude: lat,
          longitude: lng,
          heading,
          tripDistance: distance,
          pitch,
          roll,
          altitude,
          topSpeed: newTopSpeed,
          zeroToSixty: dragZeroToSixty !== null ? dragZeroToSixty : prev.zeroToSixty,
          brakingDistance: dragBrakingDistance !== null ? dragBrakingDistance : prev.brakingDistance,
          gForceX,
          gForceY,
          maxGForce: Math.max(prev.maxGForce || 0, Math.sqrt(gForceX * gForceX + gForceY * gForceY))
        };
      });
    }, 100);

    return () => {
      if (cruiseIntervalRef.current) {
        clearInterval(cruiseIntervalRef.current);
        cruiseIntervalRef.current = null;
      }
    };
  }, [cruiseActive, preset]);

  // Preset Visual Attributes Helper
  const getPresetConfig = () => {
    switch (preset) {
      case 'trail':
        return {
          name: 'TRAIL OS',
          badge: 'Rugged Incline OS',
          colorClass: 'text-[#ff3d00]',
          accentRgb: '255, 61, 0',
          switch1: 'FRONT LOCKER',
          switch2: 'LED BAR',
          homeLabel: 'BASECAMP',
          homeEmoji: '⛺'
        };
      case 'moto':
        return {
          name: 'MOTO OS',
          badge: 'Adventure Dual Sport',
          colorClass: 'text-[#ff9100]',
          accentRgb: '255, 145, 0',
          switch1: 'HEATED GRIPS',
          switch2: 'AUX LIGHTS',
          homeLabel: 'START POINT',
          homeEmoji: '🏍️'
        };
      case 'street':
        return {
          name: 'PERFORMANCE OS',
          badge: 'Street Track Mode',
          colorClass: 'text-[#00e676]',
          accentRgb: '0, 230, 118',
          switch1: 'SPORT MODE',
          switch2: 'LAUNCH CONTROL',
          homeLabel: 'STARTING GRID',
          homeEmoji: '🏁'
        };
      default:
        return {
          name: 'MARINE OS',
          badge: 'Nautical telemetry',
          colorClass: 'text-[#00e5ff]',
          accentRgb: '0, 229, 255',
          switch1: 'BILGE PUMP',
          switch2: 'DECK LIGHTS',
          homeLabel: 'LAUNCH SPOT',
          homeEmoji: '⚓'
        };
    }
  };

  const presetConfig = getPresetConfig();

  // Helper for Circular SVG gauges
  const drawCircularGauge = (val: number, max: number) => {
    const pct = Math.min(Math.max(val / max, 0), 1);
    return 264 - (pct * 198); // Sweeps 270 degrees
  };

  // Math for Return-to-Launch/Basecamp Geodesics
  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  };

  const getRthStats = () => {
    if (state.launchLat === null || state.launchLng === null) return null;
    const distance = getHaversineDistance(state.latitude, state.longitude, state.launchLat, state.launchLng);
    const bearing = getBearing(state.latitude, state.longitude, state.launchLat, state.launchLng);
    const relativeAngle = (bearing - state.heading + 360) % 360;
    return { distance, relativeAngle };
  };

  const rthStats = getRthStats();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#060608] text-[#f4f4f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#bd2925] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic inline styles for variables, rotations and sweeps */}
      <style>{`
        :root {
          --accent-rgb: ${presetConfig.accentRgb};
          --accent: rgb(var(--accent-rgb));
          --accent-glow: rgba(var(--accent-rgb), 0.35);
        }
        
        .glow-active {
          box-shadow: 0 0 15px var(--accent-glow);
          border-color: var(--accent) !important;
        }

        .switch-active {
          background: rgba(var(--accent-rgb), 0.1) !important;
          border-color: var(--accent) !important;
        }

        .text-accent-color {
          color: var(--accent) !important;
        }

        .bg-accent-color {
          background-color: var(--accent) !important;
        }

        /* High contrast mode overrides */
        .light-mode-card {
          background-color: #ffffff !important;
          color: #000000 !important;
          border: 2px solid #000000 !important;
          box-shadow: 0 6px 0px rgba(0,0,0,0.15) !important;
        }
        
        .light-mode-card .gauge-bg {
          stroke: #e2e8f0 !important;
        }

        .light-mode-card .gauge-fill {
          stroke: #000000 !important;
        }

        .light-mode-card .gauge-value {
          color: #000000 !important;
        }

        .light-mode-card .gauge-title, 
        .light-mode-card .gauge-unit {
          color: #52525b !important;
        }
      `}</style>

      <Navbar />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 w-full flex-1 relative z-10 flex flex-col gap-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href="/dash" className="text-xs font-mono text-neutral-400 hover:text-white flex items-center gap-1.5 uppercase font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Garage
          </Link>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-850 text-neutral-400 px-3 py-1 rounded-full uppercase tracking-wider">
              {presetConfig.badge}
            </span>
          </div>
        </div>

        {/* Dashboard Status Bar */}
        <header className={`glass-card p-4 rounded-2xl border border-neutral-900 bg-neutral-950/40 flex flex-col sm:flex-row justify-between items-center gap-4 ${mode === 'light' ? 'light-mode-card' : ''}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-widest">GRIDPASS <span className="text-accent-color font-black">OS</span></span>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase">
              {vehicle?.make} {vehicle?.model}
            </span>
          </div>

          <div className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className={mode === 'light' ? 'text-black' : 'text-neutral-200'}>{systemTime}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Track status indicator */}
            {firebaseSync && (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-500">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span>SYNC LIVE</span>
              </div>
            )}

            {/* Connection/GPS status */}
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-400">
              <Compass className="w-3.5 h-3.5" />
              <span>{state.satellites} Sats</span>
            </div>

            {/* Dropdown Gear Settings */}
            <div className="relative">
              <button 
                onClick={() => { triggerHaptic(); setDropdownOpen(!dropdownOpen); }}
                className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-all cursor-pointer"
                aria-label="OS Settings"
              >
                <Settings className="w-4 h-4 text-neutral-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl border border-neutral-850 bg-[#060608]/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">Select Preset Preset</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['marine', 'trail', 'moto', 'street'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => { triggerHaptic(); setPreset(p); setDropdownOpen(false); }}
                          className={`py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all cursor-pointer ${
                            preset === p 
                              ? 'bg-neutral-900 border-[#bd2925] text-white' 
                              : 'bg-neutral-950 border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-neutral-900 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Daylight Mode</span>
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setMode(mode === 'dark' ? 'light' : 'dark');
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-bold"
                    >
                      {mode === 'dark' ? (
                        <><Sun className="w-3.5 h-3.5 text-yellow-500" /> Light</>
                      ) : (
                        <><Moon className="w-3.5 h-3.5 text-blue-500" /> Dark</>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-neutral-900 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Firebase Live RTD</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={firebaseSync}
                        onChange={(e) => { triggerHaptic(); setFirebaseSync(e.target.checked); }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-350 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Grid Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT TELEMETRY COLUMN */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            
            {/* Speedometer widget */}
            <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
              <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                  <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                  <circle 
                    className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                    stroke="var(--accent)"
                    strokeDasharray="264"
                    strokeDashoffset={drawCircularGauge(state.speed, preset === 'street' ? 180 : preset === 'trail' ? 25 : 80)}
                    cx="50" cy="50" r="42"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.speed)}</span>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">MPH</span>
                </div>
              </div>
              <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">Speed (GPS)</span>
            </div>

            {/* Custom widget based on Preset */}
            {preset === 'trail' ? (
              /* INCLINOMETER WIDGET */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  {/* Outer pitch dial ring */}
                  <svg className="w-full h-full absolute transform origin-center" viewBox="0 0 100 100" style={{ transform: `rotate(${-state.roll}deg)` }}>
                    <circle className="fill-none stroke-neutral-900 stroke-[4] opacity-50" cx="50" cy="50" r="42"></circle>
                    {/* Tick marks for roll */}
                    <line x1="50" y1="8" x2="50" y2="12" stroke="var(--accent)" strokeWidth="2"></line>
                    <line x1="8" y1="50" x2="12" y2="50" stroke="var(--accent)" strokeWidth="2"></line>
                    <line x1="88" y1="50" x2="92" y2="50" stroke="var(--accent)" strokeWidth="2"></line>
                  </svg>
                  
                  {/* Tilting Jeep Chassis silhouette representation */}
                  <svg className="w-20 h-20 transform transition-all duration-150" viewBox="0 0 100 100" style={{ transform: `rotate(${-state.roll}deg) translateY(${state.pitch * 0.4}px)` }}>
                    <path 
                      d="M20 70 H80 L75 50 H25 Z M30 50 L35 30 H65 L70 50 Z" 
                      fill="none" 
                      stroke="var(--accent)" 
                      strokeWidth="4" 
                      strokeLinecap="round"
                    />
                    <circle cx="32" cy="70" r="8" fill="none" stroke="var(--accent)" strokeWidth="4" />
                    <circle cx="68" cy="70" r="8" fill="none" stroke="var(--accent)" strokeWidth="4" />
                  </svg>

                  {/* Readout stats overlay */}
                  <div className="absolute bottom-2 flex justify-between gap-6 text-[10px] font-mono font-bold text-neutral-500">
                    <span className="flex items-center gap-0.5">P: <span className="text-white font-bold">{Math.round(state.pitch)}°</span></span>
                    <span className="flex items-center gap-0.5">R: <span className="text-white font-bold">{Math.round(state.roll)}°</span></span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">INCLINOMETER</span>
              </div>
            ) : preset === 'moto' ? (
              /* COMPASS HEADING WIDGET */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full absolute transform origin-center transition-all duration-150" viewBox="0 0 100 100" style={{ transform: `rotate(${-state.heading}deg)` }}>
                    <circle className="fill-none stroke-neutral-900 stroke-[5] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <text x="50" y="20" fill="var(--accent)" fontSize="10" fontWeight="900" textAnchor="middle">N</text>
                    <text x="80" y="53" fill="var(--accent)" fontSize="8" fontWeight="700" textAnchor="middle">E</text>
                    <text x="50" y="86" fill="var(--accent)" fontSize="8" fontWeight="700" textAnchor="middle">S</text>
                    <text x="20" y="53" fill="var(--accent)" fontSize="8" fontWeight="700" textAnchor="middle">W</text>
                  </svg>
                  
                  {/* Fixed Center needle pointing north */}
                  <svg className="w-8 h-8 z-10" viewBox="0 0 100 100">
                    <polygon points="50,15 62,55 50,46 38,55" fill="var(--accent)"></polygon>
                    <polygon points="50,85 62,55 50,46 38,55" fill="rgba(255,255,255,0.2)"></polygon>
                  </svg>

                  <div className="absolute bottom-2 flex flex-col items-center justify-center">
                    <span className="font-mono text-sm font-extrabold text-white">
                      {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(state.heading / 45) % 8]} {Math.round(state.heading)}°
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">COMPASS</span>
              </div>
            ) : preset === 'street' ? (
              /* G-FORCE METER WIDGET */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full absolute" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900/60 stroke-[1]" cx="50" cy="50" r="14"></circle>
                    <circle className="fill-none stroke-neutral-900/60 stroke-[1]" cx="50" cy="50" r="28"></circle>
                    <circle className="fill-none stroke-neutral-900/60 stroke-[1]" cx="50" cy="50" r="42"></circle>
                    <line x1="50" y1="8" x2="50" y2="92" className="stroke-neutral-900/60 stroke-[1]"></line>
                    <line x1="8" y1="50" x2="92" y2="50" className="stroke-neutral-900/60 stroke-[1]"></line>
                    
                    <text x="50" y="24" fill="#52525b" fontSize="6" fontWeight="bold" textAnchor="middle">1.0G</text>
                    <text x="50" y="38" fill="#52525b" fontSize="6" fontWeight="bold" textAnchor="middle">0.5G</text>
                    
                    {/* Live G-force indicator dot */}
                    <circle 
                      cx={50 + state.gForceX * 28} 
                      cy={50 - state.gForceY * 28} 
                      r="4.5" 
                      fill="var(--accent)"
                      style={{ filter: 'drop-shadow(0 0 4px var(--accent))' }}
                      className="transition-all duration-75"
                    ></circle>
                  </svg>
                  <div className="absolute bottom-2 flex justify-between gap-6 text-[10px] font-mono font-bold text-neutral-500">
                    <span>LAT: <span className={mode === 'light' ? 'text-black font-bold' : 'text-white font-bold'}>{state.gForceX.toFixed(2)}G</span></span>
                    <span>LON: <span className={mode === 'light' ? 'text-black font-bold' : 'text-white font-bold'}>{state.gForceY.toFixed(2)}G</span></span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">G-FORCE METER</span>
              </div>
            ) : (
              /* TACHOMETER WIDGET (MARINE) */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.rpm, 8000)}
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.rpm)}</span>
                    <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">RPM</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">TACHOMETER</span>
              </div>
            )}

            {/* Custom Secondary gauge */}
            {preset === 'trail' ? (
              /* BATTERY VOLTS GAUGE */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.battery - 9, 6.5)} // Sweeps 9V - 15.5V
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-extrabold tracking-tight leading-none gauge-value">{state.battery.toFixed(1)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">VOLTS</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">BATTERY</span>
              </div>
            ) : preset === 'moto' ? (
              /* ALTIMETER GAUGE */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.altitude, 10000)} // scale to 10k ft
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.altitude)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">FT</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">ALTIMETER</span>
              </div>
            ) : preset === 'street' ? (
              /* PERFORMANCE METRICS CARD */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col justify-between relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <h3 className="text-xs font-black tracking-widest text-neutral-500 uppercase">PERFORMANCE STATS</h3>
                
                <div className="flex-1 flex flex-col justify-center gap-3.5 my-2">
                  <div className="flex justify-between items-center border-b border-neutral-900/50 pb-1.5 font-mono">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Top Speed</span>
                    <span className={mode === 'light' ? 'text-black font-extrabold text-sm' : 'text-white font-extrabold text-sm'}>
                      {Math.round(state.topSpeed)} <span className="text-[10px] text-neutral-500 font-bold">MPH</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-900/50 pb-1.5 font-mono">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">0-60 MPH</span>
                    <span className={mode === 'light' ? 'text-black font-extrabold text-sm' : 'text-white font-extrabold text-sm'}>
                      {dragZeroToSixty !== null ? `${dragZeroToSixty.toFixed(2)}s` : state.zeroToSixty !== null ? `${state.zeroToSixty.toFixed(2)}s` : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-neutral-900/50 pb-1.5 font-mono">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">60-0 Brake</span>
                    <span className={mode === 'light' ? 'text-black font-extrabold text-sm' : 'text-white font-extrabold text-sm'}>
                      {dragBrakingDistance !== null ? `${Math.round(dragBrakingDistance)} ft` : state.brakingDistance !== null ? `${Math.round(state.brakingDistance)} ft` : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center font-mono">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">Reaction RT</span>
                    <span className={mode === 'light' ? 'text-black font-extrabold text-sm' : 'text-white font-extrabold text-sm'}>
                      {dragReactionTime !== null ? `${dragReactionTime.toFixed(3)}s` : '--'}
                    </span>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-neutral-500 font-bold text-center uppercase tracking-wider">
                  Peak G-Force: <span className="text-accent-color font-black">{state.maxGForce.toFixed(2)}G</span>
                </div>
              </div>
            ) : (
              /* COOLANT TEMP GAUGE (MARINE) */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.temp - 60, 170)} // scale from 60 - 230
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.temp)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">°F</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">COOLANT TEMP</span>
              </div>
            )}

            {/* Custom Fourth gauge */}
            {preset === 'trail' ? (
              /* ENGINE TEMP GAUGE (OFFROAD) */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.temp - 60, 170)}
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.temp)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">°F</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">ENGINE TEMP</span>
              </div>
            ) : preset === 'moto' ? (
              /* TACHOMETER GAUGE (MOTO) */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.rpm, 10000)} // scale up to 10k rpm
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-2xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.rpm)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">RPM</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">TACHOMETER</span>
              </div>
            ) : preset === 'street' ? (
              /* DRAG STRIP CHRISTMAS TREE WIDGET */
              <div className={`glass-card p-4 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col justify-between relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="flex justify-between items-center border-b border-neutral-900/40 pb-2">
                  <h3 className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">DRAG STRIP TREE</h3>
                  <span className="text-[9px] font-mono font-bold text-accent-color px-1.5 py-0.5 rounded bg-zinc-900 border border-neutral-850 uppercase">
                    {dragStage}
                  </span>
                </div>

                {/* Staging Lights Panel */}
                <div className="flex-1 flex flex-col items-center justify-center gap-2 my-2">
                  {/* Pre-Stage and Stage LEDs */}
                  <div className="flex gap-4 mb-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase">Pre-Stage</span>
                      <div className={`w-4 h-4 rounded-full border border-neutral-800 transition-all ${
                        dragTree.preStage ? 'bg-amber-500 shadow-md shadow-amber-500/70 border-amber-400' : 'bg-zinc-900'
                      }`} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase">Stage</span>
                      <div className={`w-4 h-4 rounded-full border border-neutral-800 transition-all ${
                        dragTree.stage ? 'bg-amber-500 shadow-md shadow-amber-500/70 border-amber-400' : 'bg-zinc-900'
                      }`} />
                    </div>
                  </div>

                  {/* Christmas Tree Countdown Lights Column */}
                  <div className="flex flex-col items-center gap-1.5 bg-black/45 p-2 rounded-xl border border-neutral-900/50 w-24">
                    {/* Yellow 1 */}
                    <div className={`w-5.5 h-5.5 rounded-full border border-neutral-900 transition-all ${
                      dragTree.y1 ? 'bg-yellow-500 shadow-md shadow-yellow-500/70 border-yellow-400' : 'bg-zinc-800'
                    }`} />
                    {/* Yellow 2 */}
                    <div className={`w-5.5 h-5.5 rounded-full border border-neutral-900 transition-all ${
                      dragTree.y2 ? 'bg-yellow-500 shadow-md shadow-yellow-500/70 border-yellow-400' : 'bg-zinc-800'
                    }`} />
                    {/* Yellow 3 */}
                    <div className={`w-5.5 h-5.5 rounded-full border border-neutral-900 transition-all ${
                      dragTree.y3 ? 'bg-yellow-500 shadow-md shadow-yellow-500/70 border-yellow-400' : 'bg-zinc-800'
                    }`} />
                    {/* Green (GO) and Red (FOUL) row */}
                    <div className="flex gap-2.5">
                      {/* Green */}
                      <div className={`w-5.5 h-5.5 rounded-full border border-neutral-900 transition-all ${
                        dragTree.green ? 'bg-green-500 shadow-md shadow-green-500/70 border-green-400' : 'bg-zinc-800'
                      }`} />
                      {/* Red */}
                      <div className={`w-5.5 h-5.5 rounded-full border border-neutral-900 transition-all ${
                        dragStage === 'foul' || dragTree.red ? 'bg-red-600 shadow-md shadow-red-600/70 border-red-500' : 'bg-zinc-800'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="w-full">
                  {dragStage === 'idle' || dragStage === 'complete' || dragStage === 'foul' ? (
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setDragStage('staged');
                        setDragReactionTime(null);
                        setDragZeroToSixty(null);
                        setDragBrakingDistance(null);
                        setDragFtsAccumulated(0);
                        dragGreenTimeRef.current = null;
                        dragLaunchTimeRef.current = null;
                        dragZeroToSixtyTimeRef.current = null;
                        dragBrakingStartTimeRef.current = null;
                        setDragTree({ preStage: true, stage: true, y1: false, y2: false, y3: false, green: false, red: false });
                        setState(prev => ({ ...prev, speed: 0, rpm: 850, tripDistance: 0.0 }));
                        setTrail([]);
                      }}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer text-white shadow-md shadow-black/10 transition-all"
                    >
                      🚦 Stage Engine
                    </button>
                  ) : dragStage === 'staged' ? (
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setDragStage('countdown');
                      }}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer text-white shadow-md shadow-red-600/10 transition-all animate-pulse"
                    >
                      🚀 Launch Control
                    </button>
                  ) : (
                    <div className="w-full text-center text-[9px] font-mono font-bold text-neutral-400 py-2 border border-neutral-900/60 rounded-xl bg-neutral-900/5 leading-none flex items-center justify-center gap-1.5 uppercase">
                      {dragStage === 'countdown' ? 'Arming Gears...' : dragStage === 'go' ? 'Throttle WOT!' : 'Decelerating!'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* FUEL LEVEL GAUGE (MARINE) */
              <div className={`glass-card p-6 rounded-[2rem] border border-neutral-900 bg-neutral-950/40 aspect-square flex flex-col items-center justify-center relative overflow-hidden ${mode === 'light' ? 'light-mode-card' : ''}`}>
                <div className="relative w-full max-w-[160px] aspect-square flex items-center justify-center">
                  <svg className="w-full h-full -rotate-225 transform origin-center" viewBox="0 0 100 100">
                    <circle className="fill-none stroke-neutral-900 stroke-[7] gauge-bg" cx="50" cy="50" r="42"></circle>
                    <circle 
                      className="fill-none stroke-[8] stroke-linecap-round transition-all duration-150 gauge-fill" 
                      stroke="var(--accent)"
                      strokeDasharray="264"
                      strokeDashoffset={drawCircularGauge(state.fuel, 100)}
                      cx="50" cy="50" r="42"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-mono text-3xl font-extrabold tracking-tight leading-none gauge-value">{Math.round(state.fuel)}</span>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1 gauge-unit">%</span>
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-neutral-500 uppercase mt-4 gauge-title">FUEL LEVEL</span>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: ACCESSORIES & MAP */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Switch switch box */}
            <div className={`glass-card p-6 rounded-3xl border border-neutral-900 bg-neutral-950/40 flex flex-col gap-4 ${mode === 'light' ? 'light-mode-card' : ''}`}>
              <h3 className="text-xs font-black tracking-widest text-neutral-550 uppercase">Accessory Switches</h3>
              <div className="grid grid-cols-2 gap-3">
                
                {/* Switch 1 */}
                <button 
                  onClick={() => { triggerHaptic(); setState(prev => ({ ...prev, isSwitch1On: !prev.isSwitch1On })); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border border-neutral-900 bg-neutral-900/35 transition-all text-left cursor-pointer hover:border-neutral-800 ${
                    state.isSwitch1On ? 'switch-active glow-active' : ''
                  } ${mode === 'light' && state.isSwitch1On ? 'bg-neutral-100 border-black' : ''}`}
                >
                  <div className="text-2xl">⚡</div>
                  <div>
                    <span className="text-[9px] font-mono font-black text-neutral-500 tracking-wider block leading-none">{presetConfig.switch1}</span>
                    <span className="text-sm font-mono font-black mt-1.5 block leading-none text-accent-color">{state.isSwitch1On ? 'ON' : 'OFF'}</span>
                  </div>
                </button>

                {/* Switch 2 */}
                <button 
                  onClick={() => { triggerHaptic(); setState(prev => ({ ...prev, isSwitch2On: !prev.isSwitch2On })); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border border-neutral-900 bg-neutral-900/35 transition-all text-left cursor-pointer hover:border-neutral-800 ${
                    state.isSwitch2On ? 'switch-active glow-active' : ''
                  } ${mode === 'light' && state.isSwitch2On ? 'bg-neutral-100 border-black' : ''}`}
                >
                  <div className="text-2xl">🔌</div>
                  <div>
                    <span className="text-[9px] font-mono font-black text-neutral-500 tracking-wider block leading-none">{presetConfig.switch2}</span>
                    <span className="text-sm font-mono font-black mt-1.5 block leading-none text-accent-color">{state.isSwitch2On ? 'ON' : 'OFF'}</span>
                  </div>
                </button>

              </div>
            </div>

            {/* GPS Leaflet map container widget */}
            <div className={`glass-card p-4 rounded-3xl border border-neutral-900 bg-neutral-950/40 flex flex-col gap-3 relative ${mode === 'light' ? 'light-mode-card' : ''}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black tracking-widest text-neutral-550 uppercase">GPS Navigation</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      triggerHaptic();
                      setState(prev => ({ ...prev, launchLat: state.latitude, launchLng: state.longitude }));
                    }}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-350 cursor-pointer"
                  >
                    Mark {presetConfig.homeLabel}
                  </button>
                  <button 
                    onClick={() => {
                      triggerHaptic();
                      setTrail([{ lat: state.latitude, lng: state.longitude }]);
                      setState(prev => ({ ...prev, tripDistance: 0.0 }));
                    }}
                    className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-350 cursor-pointer"
                  >
                    Reset Path
                  </button>
                </div>
              </div>

              <div className="w-full h-64 rounded-xl border border-neutral-900 overflow-hidden relative">
                <MapComponent 
                  latitude={state.latitude}
                  longitude={state.longitude}
                  heading={state.heading}
                  preset={preset}
                  trail={trail}
                  launchLat={state.launchLat}
                  launchLng={state.launchLng}
                  mode={mode}
                />
                
                {/* Geodesic Vector Return to Basecamp Overlay overlay badge */}
                {rthStats && (
                  <div className="absolute top-2 left-2 z-[999] px-3 py-1.5 rounded-lg border border-neutral-900 bg-[#060608]/90 text-white font-mono text-[10px] font-black uppercase flex items-center gap-1.5 shadow-lg">
                    <span>{presetConfig.homeEmoji} {presetConfig.homeLabel}:</span>
                    <span className="text-accent-color font-black">{rthStats.distance.toFixed(2)} mi</span>
                    <span 
                      style={{ transform: `rotate(${rthStats.relativeAngle}deg)` }} 
                      className="inline-block transition-transform duration-100"
                    >
                      ⬆️
                    </span>
                  </div>
                )}

                {/* Trail stats float details overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between pointer-events-none z-[999]">
                  <div className="px-2 py-1 bg-black/90 text-white border border-neutral-900 rounded font-mono text-[9px] font-bold">
                    TRIP: <span className="text-accent-color">{state.tripDistance.toFixed(2)} mi</span>
                  </div>
                  <div className="px-2 py-1 bg-black/90 text-white border border-neutral-900 rounded font-mono text-[9px] font-bold">
                    HEADING: <span className="text-accent-color">
                      {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(state.heading / 45) % 8]} {Math.round(state.heading)}°
                    </span>
                  </div>
                </div>

              </div>

              {/* Float telemetry summary details grid */}
              <div className="grid grid-cols-3 gap-2 mt-1.5 font-mono text-center">
                <div className="p-2 border border-neutral-900/60 bg-neutral-900/10 rounded-lg">
                  <span className="text-[8px] text-neutral-500 font-bold block uppercase leading-none mb-1">Battery</span>
                  <span className="text-xs font-black text-neutral-300">{state.battery.toFixed(1)}V</span>
                </div>
                <div className="p-2 border border-neutral-900/60 bg-neutral-900/10 rounded-lg">
                  <span className="text-[8px] text-neutral-500 font-bold block uppercase leading-none mb-1">Latitude</span>
                  <span className="text-xs font-black text-neutral-300">{Math.abs(state.latitude).toFixed(4)} {state.latitude >= 0 ? 'N' : 'S'}</span>
                </div>
                <div className="p-2 border border-neutral-900/60 bg-neutral-900/10 rounded-lg">
                  <span className="text-[8px] text-neutral-500 font-bold block uppercase leading-none mb-1">Longitude</span>
                  <span className="text-xs font-black text-neutral-300">{Math.abs(state.longitude).toFixed(4)} {state.longitude >= 0 ? 'E' : 'W'}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* SIMULATOR DRAWER CONTROLS PANEL */}
        <div className={`glass-card p-4 rounded-3xl border border-neutral-900 bg-neutral-950/90 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${
          simDrawerOpen ? 'max-h-[800px]' : 'max-h-[50px] md:max-h-[50px]'
        } ${mode === 'light' ? 'light-mode-card' : ''}`}>
          
          {/* Drawer Header Toggle */}
          <button 
            onClick={() => { triggerHaptic(); setSimDrawerOpen(!simDrawerOpen); }}
            className="w-full flex justify-between items-center text-xs font-black font-mono tracking-widest text-neutral-400 uppercase cursor-pointer"
          >
            <span>📟 ESP32 SENSOR SIMULATOR</span>
            <span>{simDrawerOpen ? '▼ COLLAPSE' : '▲ EXPAND'}</span>
          </button>

          {/* Slider Controls Drawer Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-neutral-900/50 pt-4">
            
            {/* Speed Slider */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                <span>Simulated Speed (MPH)</span>
                <span className="text-white font-bold">{Math.round(state.speed)} MPH</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max={preset === 'trail' ? '25' : '95'} 
                value={state.speed}
                onChange={(e) => {
                  setCruiseActive(false);
                  const val = parseFloat(e.target.value);
                  setState(prev => ({ ...prev, speed: val }));
                }}
                className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
              />
            </div>

            {/* RPM Slider */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                <span>Simulated RPM</span>
                <span className="text-white font-bold">{Math.round(state.rpm)} RPM</span>
              </label>
              <input 
                type="range" 
                min="800" 
                max={preset === 'moto' ? '10000' : '8000'} 
                value={state.rpm}
                onChange={(e) => {
                  setCruiseActive(false);
                  const val = parseInt(e.target.value);
                  setState(prev => ({ ...prev, rpm: val }));
                }}
                className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
              />
            </div>

            {/* Temp Slider */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                <span>Simulated Coolant/Engine Temp (°F)</span>
                <span className="text-white font-bold">{Math.round(state.temp)}°F</span>
              </label>
              <input 
                type="range" 
                min="60" 
                max="240" 
                value={state.temp}
                onChange={(e) => {
                  setCruiseActive(false);
                  const val = parseInt(e.target.value);
                  setState(prev => ({ ...prev, temp: val }));
                }}
                className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
              />
            </div>

            {/* Dynamic Preset Slider: Inclinometer vs Altimeter vs Fuel */}
            {preset === 'trail' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                    <span>Pitch</span>
                    <span className="text-white font-bold">{Math.round(state.pitch)}°</span>
                  </label>
                  <input 
                    type="range" 
                    min="-45" 
                    max="45" 
                    value={state.pitch}
                    onChange={(e) => {
                      setCruiseActive(false);
                      const val = parseInt(e.target.value);
                      setState(prev => ({ ...prev, pitch: val }));
                    }}
                    className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                    <span>Roll</span>
                    <span className="text-white font-bold">{Math.round(state.roll)}°</span>
                  </label>
                  <input 
                    type="range" 
                    min="-45" 
                    max="45" 
                    value={state.roll}
                    onChange={(e) => {
                      setCruiseActive(false);
                      const val = parseInt(e.target.value);
                      setState(prev => ({ ...prev, roll: val }));
                    }}
                    className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
                  />
                </div>
              </div>
            ) : preset === 'moto' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                  <span>Simulated Altitude (FT)</span>
                  <span className="text-white font-bold">{Math.round(state.altitude)} FT</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="12000" 
                  value={state.altitude}
                  onChange={(e) => {
                    setCruiseActive(false);
                    const val = parseInt(e.target.value);
                    setState(prev => ({ ...prev, altitude: val }));
                  }}
                  className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex justify-between">
                  <span>Simulated Fuel (%)</span>
                  <span className="text-white font-bold">{Math.round(state.fuel)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={state.fuel}
                  onChange={(e) => {
                    setCruiseActive(false);
                    const val = parseInt(e.target.value);
                    setState(prev => ({ ...prev, fuel: val }));
                  }}
                  className="w-full accent-red-600 bg-neutral-900 h-1.5 rounded-lg appearance-none"
                />
              </div>
            )}

            {/* Run Auto Cruise simulation button */}
            <div className="md:col-span-2 pt-2 flex justify-end">
              <button 
                onClick={() => { triggerHaptic(); setCruiseActive(!cruiseActive); }}
                className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer select-none shadow-md ${
                  cruiseActive 
                    ? 'bg-[#bd2925] hover:bg-[#bd2925]/90 text-white shadow-[#bd2925]/15' 
                    : 'bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-200'
                }`}
              >
                {cruiseActive ? '■ Stop Cruise Simulator' : '▶ Start Cruise Simulator'}
              </button>
            </div>

          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
