'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { db, auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { 
  Monitor, Lock, Unlock, Settings, Power, Maximize2, Minimize2, X, 
  Search, Shield, Zap, Sparkles, RefreshCw, Layers, Grid, Sliders, 
  Volume2, VolumeX, Wifi, Battery, Clock, Warehouse, Car, Wrench, 
  Trophy, Activity, MessageSquare, BookOpen, Crown, ChevronRight,
  ExternalLink, Sun, Moon, Image as ImageIcon, Laptop, User, Key, Check,
  Plus, ExternalLink as LaunchIcon, Eye, Tag, AlertTriangle, Folder,
  FileText, Calculator, Terminal as TerminalIcon, SlidersHorizontal, Trash2, Globe, Move
} from 'lucide-react';

// Embedded Application Components
import GarageInventoryManager from '@/components/inventory/GarageInventoryManager';

export interface WindowInstance {
  id: string;
  appKey: string;
  title: string;
  icon: any;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export type WallpaperPreset = 'carbon' | 'asphalt' | 'paddock' | 'lake' | 'crimson' | 'custom';

export interface OSPreferences {
  wallpaper: WallpaperPreset;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  pinCode: string;
}

export interface DesktopWidgetInstance {
  id: string;
  type: 'clock' | 'race_countdown' | 'stopwatch' | 'telemetry' | 'garage' | 'inventory';
  title: string;
  x?: number;
  y?: number;
}

export type IconPositions = Record<string, { x: number; y: number }>;

const WIDGET_CATALOG: Array<{
  type: DesktopWidgetInstance['type'];
  title: string;
  description: string;
  icon: any;
}> = [
  {
    type: 'clock',
    title: 'Local Time & Digital Clock',
    description: 'Live sweeping digital clock with local date',
    icon: Clock
  },
  {
    type: 'race_countdown',
    title: 'Next Track Event Countdown',
    description: 'Live countdown to upcoming race meets',
    icon: Trophy
  },
  {
    type: 'stopwatch',
    title: 'Pit Stop & Session Stopwatch',
    description: 'Interactive qualifying timer & lap stopwatch',
    icon: Activity
  },
  {
    type: 'telemetry',
    title: 'Sim Telemetry & Platform FPS',
    description: 'Real-time time dilation & FPS monitor',
    icon: Zap
  },
  {
    type: 'garage',
    title: 'Staged Machines Quick Roster',
    description: 'Live vehicle passports summary card',
    icon: Car
  },
  {
    type: 'inventory',
    title: 'Master Inventory Valuation',
    description: 'Total equipment & part valuation badge',
    icon: Warehouse
  }
];

const WALLPAPER_STYLES: Record<WallpaperPreset, { name: string; bg: string }> = {
  carbon: {
    name: 'Carbon Fiber',
    bg: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black'
  },
  asphalt: {
    name: 'Track Asphalt',
    bg: 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900'
  },
  paddock: {
    name: 'Paddock Sunset',
    bg: 'bg-gradient-to-br from-neutral-950 via-red-950/40 to-black'
  },
  lake: {
    name: 'Lake Blue',
    bg: 'bg-gradient-to-br from-slate-950 via-blue-950/40 to-black'
  },
  crimson: {
    name: 'Crimson Redline',
    bg: 'bg-gradient-to-br from-[#1c1c1e] via-[#bd2925]/30 to-black'
  },
  custom: {
    name: 'Custom Photo Wallpaper',
    bg: 'bg-neutral-950'
  }
};

export default function GridpassDesktopOS() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  // OS Core State (Persists lock state across browser page refreshes)
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('gp_os_locked') === 'true';
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showLaunchpad, setShowLaunchpad] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [launchpadSearch, setLaunchpadSearch] = useState('');

  // Custom Wallpaper State & Upload Handler
  const [customWallpaper, setCustomWallpaper] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gp_os_custom_wallpaper') || '';
    }
    return '';
  });

  const handleFileUploadWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomWallpaper(dataUrl);
        localStorage.setItem('gp_os_custom_wallpaper', dataUrl);
        updatePreferences({ wallpaper: 'custom' });
        showToast({ title: 'Custom Wallpaper Set', message: 'Desktop background updated.' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Desktop Widgets & Stopwatch State
  const [showWidgets, setShowWidgets] = useState(true);
  const [stopwatchTime, setStopwatchTime] = useState(872); // 14m 32s countdown
  const [stopwatchRunning, setStopwatchRunning] = useState(false);

  // Extensible User Active Widgets (Persisted with X, Y coordinates)
  const [activeWidgets, setActiveWidgets] = useState<DesktopWidgetInstance[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gp_os_active_widgets');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [
      { id: 'w-clock', type: 'clock', title: 'Local Time', x: 820, y: 24 },
      { id: 'w-race', type: 'race_countdown', title: 'Next Track Event', x: 820, y: 170 },
      { id: 'w-stopwatch', type: 'stopwatch', title: 'Qualifying Stopwatch', x: 820, y: 310 }
    ];
  });

  // Save active widgets to localStorage
  const saveActiveWidgets = (newWidgets: DesktopWidgetInstance[]) => {
    setActiveWidgets(newWidgets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gp_os_active_widgets', JSON.stringify(newWidgets));
    }
  };

  const addWidget = (type: DesktopWidgetInstance['type']) => {
    const catalogItem = WIDGET_CATALOG.find(w => w.type === type);
    if (!catalogItem) return;
    const newWidget: DesktopWidgetInstance = {
      id: `w-${type}-${Date.now()}`,
      type,
      title: catalogItem.title,
      x: 750 + (activeWidgets.length * 20),
      y: 40 + (activeWidgets.length * 30)
    };
    saveActiveWidgets([...activeWidgets, newWidget]);
    showToast({ title: 'Widget Added', message: `${catalogItem.title} added to desktop.` });
  };

  const removeWidget = (widgetId: string) => {
    const updated = activeWidgets.filter(w => w.id !== widgetId);
    saveActiveWidgets(updated);
    showToast({ title: 'Widget Removed', message: 'Widget removed from desktop.' });
  };

  // Stopwatch Interval
  useEffect(() => {
    let timer: any;
    if (stopwatchRunning) {
      timer = setInterval(() => {
        setStopwatchTime(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stopwatchRunning]);

  // Sticky Notes State
  const [notesText, setNotesText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gp_os_notes') || '• Front Tire Pressure: 28 PSI (Hot)\n• Rear Tire Pressure: 30 PSI (Hot)\n• Wheel Lug Torque: 100 ft-lbs\n• Holley Dominator ECU Serial: #HD-88201';
    }
    return '';
  });

  // Terminal CLI State
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string }>>([
    { cmd: 'system', output: 'Gridpass OS v5.0.0 (Google Agentic Architecture) [Ready]' },
    { cmd: 'help', output: 'Available commands: help, vehicles, inventory, telemetry, clear, lock, version' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Calculator State
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('0');

  // OS Preferences (Persisted in localStorage)
  const [preferences, setPreferences] = useState<OSPreferences>({
    wallpaper: 'carbon',
    theme: 'dark',
    soundEnabled: true,
    pinCode: '1234'
  });

  // Multi-Window Manager State
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(10);

  // Window Dragging & Resizing State
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingWindowId, setResizingWindowId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  // Draggable Desktop Apps & Widgets State
  const [iconPositions, setIconPositions] = useState<IconPositions>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gp_os_icon_positions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {};
  });
  const [draggingIconKey, setDraggingIconKey] = useState<string | null>(null);
  const [iconDragOffset, setIconDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [widgetDragOffset, setWidgetDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Synchronized Position Refs for 100% Reliable LocalStorage Persistence Across Hard Refreshes
  const iconPositionsRef = useRef<IconPositions>(iconPositions);
  useEffect(() => {
    iconPositionsRef.current = iconPositions;
  }, [iconPositions]);

  const activeWidgetsRef = useRef<DesktopWidgetInstance[]>(activeWidgets);
  useEffect(() => {
    activeWidgetsRef.current = activeWidgets;
  }, [activeWidgets]);

  const rafRef = useRef<number | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gp_os_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading OS preferences:", e);
    }
  }, []);

  // Real Firestore Data Collections for Desktop Apps
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Live Real-Time Firestore Sync for Vehicles, Spaces, Events, Inventory & Documents
  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVehicles(docs);
    });

    const unsubSpaces = onSnapshot(collection(db, 'garage_spaces'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSpaces(docs);
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(docs);
      setLoadingData(false);
    });

    const unsubInventory = onSnapshot(collection(db, 'inventory_items'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventoryItems(docs);
    });

    const unsubDocs = onSnapshot(collection(db, 'user_documents'), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(docs);
    });

    return () => {
      unsubVehicles();
      unsubSpaces();
      unsubEvents();
      unsubInventory();
      unsubDocs();
    };
  }, []);

  // Calculate Real Total Inventory Valuation from Firestore
  const totalInventoryValuation = inventoryItems.reduce((acc, item) => {
    const price = Number(item.price || item.unit_price || item.estimated_value || 0);
    const qty = Number(item.quantity || 1);
    return acc + (price * qty);
  }, 0);

  // Save notes to localStorage
  const handleNotesChange = (val: string) => {
    setNotesText(val);
    localStorage.setItem('gp_os_notes', val);
  };

  // Save preferences
  const updatePreferences = (newPrefs: Partial<OSPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem('gp_os_preferences', JSON.stringify(updated));
      return updated;
    });
    showToast({ title: 'Preferences Saved', message: 'Gridpass OS settings updated.' });
  };

  // Reset Desktop Layout Helper (Resets Icons, Widgets & Moves All Open Windows Back On Screen)
  const resetDesktopLayout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gp_os_icon_positions');
      localStorage.removeItem('gp_os_active_widgets');
    }
    setIconPositions({});
    setActiveWidgets([
      { id: 'w-clock', type: 'clock', title: 'Local Time', x: 820, y: 24 },
      { id: 'w-race', type: 'race_countdown', title: 'Next Track Event', x: 820, y: 170 },
      { id: 'w-stopwatch', type: 'stopwatch', title: 'Qualifying Stopwatch', x: 820, y: 310 }
    ]);

    // Reset all open app windows back to centered, visible screen coordinates!
    setWindows(prev => prev.map((win, idx) => ({
      ...win,
      x: 60 + (idx * 30),
      y: 50 + (idx * 30),
      isMinimized: false,
      isMaximized: false
    })));

    showToast({ title: 'Desktop & Windows Reset', message: 'Desktop icons, widgets, and all open windows restored to center screen.' });
  };

  // Real-Time Clock Loop
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (⌘+L Lock, ⌘+K Launchpad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockOS();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowLaunchpad(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock OS Helper
  const lockOS = () => {
    setIsLocked(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gp_os_locked', 'true');
    }
    enterFullScreen();
    showToast({ title: 'Gridpass OS Locked', message: 'Enter your 4-digit security PIN to unlock.' });
  };

  // Unlock Handler (Requires Exact Security PIN)
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (pinInput === preferences.pinCode) {
      setIsLocked(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gp_os_locked');
      }
      setPinInput('');
      showToast({ title: 'Gridpass OS Unlocked', message: `Welcome back, ${user?.displayName || 'PJ Losey'}.` });
    } else {
      showToast({ title: 'Access Denied', message: `Incorrect PIN. Use 'Forgot PIN?' if needed.` });
    }
  };

  // Google OAuth Re-Authentication Recovery Handler
  const handleGoogleReAuthUnlock = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gp_os_locked');
      }
      showToast({ title: 'Logging Out for Safety', message: 'Re-authenticate with Google/Account to unlock OS.' });
      await signOut(auth);
      router.push('/login?redirect=/os');
    } catch (err) {
      console.error("Sign out re-auth error:", err);
      router.push('/login?redirect=/os');
    }
  };

  // Fullscreen Helpers
  const enterFullScreen = () => {
    if (typeof window !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Terminal Command Evaluator
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let output = '';
    if (cmd === 'help') {
      output = 'Available commands: help, vehicles, inventory, telemetry, clear, lock, version, whoami';
    } else if (cmd === 'vehicles') {
      output = `Registered Machines (${vehicles.length}): ${vehicles.map(v => `${v.make} ${v.model} (${v.year})`).join(', ') || 'None'}`;
    } else if (cmd === 'inventory') {
      output = 'Master Inventory Engine: Open Master Inventory app for live parts catalog.';
    } else if (cmd === 'telemetry') {
      output = 'Telemetry Status: Sim Time Dilation: 1.00 | Sim FPS: 45.0 | Platform Status: ONLINE';
    } else if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd === 'lock') {
      lockOS();
      output = 'Locking Gridpass OS...';
    } else if (cmd === 'version') {
      output = 'Gridpass OS v5.0.0 [Google Ultra Agentic Architecture]';
    } else if (cmd === 'whoami') {
      output = `User: ${user?.displayName || 'PJ Losey'} (${user?.email || 'Super Admin'})`;
    } else {
      output = `Command not recognized: '${cmd}'. Type 'help' for available commands.`;
    }

    setTerminalHistory(prev => [...prev, { cmd: terminalInput, output }]);
    setTerminalInput('');
  };

  // Calculator Evaluator
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('0');
    } else if (val === '=') {
      try {
        const evalRes = eval(calcInput.replace(/×/g, '*').replace(/÷/g, '/'));
        setCalcResult(String(evalRes));
      } catch {
        setCalcResult('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  // Desktop App Roster Definitions
  const DESKTOP_APPS = [
    {
      key: 'inventory',
      title: 'Master Inventory Catalog',
      subtitle: 'Parts, Equipment, Tools & Serial #s',
      icon: Warehouse,
      color: 'bg-amber-500 text-neutral-950',
      component: <GarageInventoryManager />
    },
    {
      key: 'finder',
      title: 'Gridpass Finder',
      subtitle: 'Build Specs, PDFs & Documents',
      icon: Folder,
      color: 'bg-blue-500 text-white',
      component: (
        <div className="p-4 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-400" />
              GRIDPASS FINDER & DOCUMENT EXPLORER
            </h3>
            <span className="text-xs text-neutral-400">{documents.length} Staged Files</span>
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3">
                  <FileText className="w-8 h-8 text-amber-400 shrink-0" />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">{doc.name || doc.title || 'Document.pdf'}</div>
                    <div className="text-[10px] text-neutral-500">{doc.category || 'General'} • {doc.size || 'Firestore Staged'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl space-y-2 font-mono">
              <Folder className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="text-xs font-bold text-neutral-400 uppercase">⚪ No Staged Documents Found</div>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                Documents and build specs registered in Cloud Firestore will appear here automatically.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'notes',
      title: 'Garage Sticky Notes',
      subtitle: 'Tire Pressures & Staging Notes',
      icon: FileText,
      color: 'bg-yellow-500 text-neutral-950',
      component: (
        <div className="p-4 flex flex-col h-full space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              PADDOCK STICKY NOTES
            </span>
            <span className="text-[10px] text-neutral-500">Auto-Saved</span>
          </div>
          <textarea
            value={notesText}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Type garage notes, tire pressures, torque specs, part part numbers..."
            className="flex-1 w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none font-mono leading-relaxed"
          ></textarea>
        </div>
      )
    },
    {
      key: 'calculator',
      title: 'Paddock Calculator',
      subtitle: 'HP-Weight & Unit Converter',
      icon: Calculator,
      color: 'bg-emerald-600 text-white',
      component: (
        <div className="p-4 max-w-sm mx-auto space-y-4 font-mono">
          <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-right">
            <div className="text-xs text-neutral-500 h-4">{calcInput || '0'}</div>
            <div className="text-2xl font-black text-white">{calcResult}</div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm font-bold">
            {['C', '÷', '×', '⌫', '7', '8', '9', '-', '4', '5', '6', '+', '1', '2', '3', '=', '0', '.'].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcBtn(btn)}
                className={`py-3 rounded-xl cursor-pointer transition-all ${
                  btn === '=' ? 'bg-[#ff3b30] text-white col-span-2' :
                  btn === 'C' ? 'bg-neutral-800 text-amber-400' :
                  'bg-neutral-900 text-white hover:bg-neutral-800'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'terminal',
      title: 'Gridpass Terminal',
      subtitle: 'Developer CLI & Diagnostics',
      icon: TerminalIcon,
      color: 'bg-neutral-900 text-emerald-400 border border-emerald-500/30',
      component: (
        <div className="p-4 bg-black font-mono text-xs text-emerald-400 flex flex-col h-full space-y-3">
          <div className="flex-1 overflow-y-auto space-y-2">
            {terminalHistory.map((h, i) => (
              <div key={i} className="space-y-0.5">
                <div className="text-neutral-500 flex items-center gap-1">
                  <span className="text-emerald-500">gridpass-os:~$</span> {h.cmd}
                </div>
                <div className="text-emerald-400 whitespace-pre-wrap pl-3">{h.output}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 border-t border-neutral-800 pt-2">
            <span className="text-emerald-500 font-bold">gridpass-os:~$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type 'help'..."
              className="flex-1 bg-transparent text-emerald-400 focus:outline-none font-mono"
            />
          </form>
        </div>
      )
    },
    {
      key: 'browser',
      title: 'Gridpass Web Browser',
      subtitle: 'Browse YouTube, Facebook & Websites',
      icon: Globe,
      color: 'bg-blue-600 text-white',
      component: (
        <div className="flex flex-col h-full bg-neutral-950 font-mono text-xs select-auto">
          <div className="p-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('gp-os-browser-iframe') as HTMLIFrameElement;
                if (el) el.src = el.src;
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-800 cursor-pointer"
              title="Refresh Page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 focus-within:border-blue-500">
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <input
                id="gp-os-browser-input"
                type="text"
                defaultValue="https://www.youtube.com/embed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    let val = (e.target as HTMLInputElement).value.trim();
                    if (!val.startsWith('http://') && !val.startsWith('https://')) {
                      val = `https://${val}`;
                    }
                    if (val.includes('youtube.com/watch?v=')) {
                      val = val.replace('watch?v=', 'embed/');
                    }
                    const el = document.getElementById('gp-os-browser-iframe') as HTMLIFrameElement;
                    if (el) el.src = val;
                  }
                }}
                className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none"
                placeholder="Enter URL or search (e.g. youtube.com, facebook.com)..."
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gp-os-browser-input') as HTMLInputElement;
                if (input?.value) window.open(input.value, '_blank');
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
              title="Open in New Browser Tab"
            >
              <LaunchIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open External</span>
            </button>
          </div>

          <div className="px-3 py-1.5 bg-neutral-900/60 border-b border-neutral-800 flex items-center gap-2 text-[10px] text-neutral-400 overflow-x-auto">
            <span className="font-bold text-neutral-500 uppercase">Quick Links:</span>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gp-os-browser-input') as HTMLInputElement;
                const iframe = document.getElementById('gp-os-browser-iframe') as HTMLIFrameElement;
                if (input) input.value = 'https://www.youtube.com/embed';
                if (iframe) iframe.src = 'https://www.youtube.com/embed';
              }}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
            >
              ▶️ YouTube
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gp-os-browser-input') as HTMLInputElement;
                const iframe = document.getElementById('gp-os-browser-iframe') as HTMLIFrameElement;
                if (input) input.value = 'https://facebook.com';
                if (iframe) iframe.src = 'https://facebook.com';
              }}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
            >
              📘 Facebook
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gp-os-browser-input') as HTMLInputElement;
                const iframe = document.getElementById('gp-os-browser-iframe') as HTMLIFrameElement;
                if (input) input.value = 'https://gridpass.app';
                if (iframe) iframe.src = '/';
              }}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold cursor-pointer"
            >
              🏎️ Gridpass Hub
            </button>
          </div>

          <div className="flex-1 bg-black relative">
            <iframe
              id="gp-os-browser-iframe"
              src="https://www.youtube.com/embed"
              className="w-full h-full border-0"
              title="Gridpass OS Web Browser"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )
    },
    {
      key: 'garage',
      title: 'Garage & Machines',
      subtitle: 'Staged Builds & Vehicle Passports',
      icon: Car,
      color: 'bg-[#ff3b30] text-white',
      component: (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-[#ff3b30]" />
                STAGED VEHICLES & MACHINE PASSPORTS
              </h3>
              <p className="text-xs text-neutral-400 font-mono">Live Firestore Garage Roster ({vehicles.length} Machines)</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/v/new')}
              className="px-4 py-2 bg-[#ff3b30] hover:bg-red-600 text-white font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Register Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map((v) => (
              <div key={v.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1">
                    <span className="font-bold text-white">{v.year || 2024}</span>
                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded font-bold text-[10px]">{v.tag_id || 'GP-PASSPORT'}</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight leading-tight">
                    {v.make} {v.model}
                  </h4>
                  {v.specs?.engine && (
                    <p className="text-xs font-mono text-neutral-400 mt-1">{v.specs.engine}</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">{v.trim || 'Standard'}</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/v/${v.id}`)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#ff3b30]" />
                    Passport
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      key: 'storage',
      title: 'Storage & Paddock Spaces',
      subtitle: 'Bays, Shelves, Bins & Facilities',
      icon: Wrench,
      color: 'bg-blue-600 text-white',
      component: (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" />
                STORAGE SPACES & PADDOCK BAYS
              </h3>
              <p className="text-xs text-neutral-400 font-mono">Registered Facility Units ({spaces.length} Spaces)</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/dash/space/new')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Storage Space
            </button>
          </div>

          {spaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {spaces.map((sp) => (
                <div key={sp.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 font-mono text-xs font-black rounded-lg uppercase">
                      {sp.type || sp.space_type || 'STORAGE BAY'}
                    </span>
                    <span className="text-xs font-mono text-neutral-400">{sp.facility_name || sp.location || 'Paddock'}</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">{sp.name || sp.title || 'Storage Space'}</h4>
                  <p className="text-xs text-neutral-400 font-mono mt-1">{sp.description || sp.notes || 'No description added'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl space-y-2 font-mono">
              <Wrench className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="text-xs font-bold text-neutral-400 uppercase">⚪ No Storage Spaces Registered</div>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                No active storage spaces or bays found in Cloud Firestore.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'events',
      title: 'Track Operations & Events',
      subtitle: 'Race Roster, Entrants & Marshals',
      icon: Trophy,
      color: 'bg-emerald-500 text-neutral-950',
      component: (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                ACTIVE TRACK EVENTS & RACE HUB
              </h3>
              <p className="text-xs text-neutral-400 font-mono">Live Roster & Spectator Passes ({events.length} Events)</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/events')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LaunchIcon className="w-4 h-4" />
              Event Hub
            </button>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-black rounded uppercase">LIVE EVENT</span>
                    <h4 className="text-base font-black text-white uppercase tracking-tight mt-1">{evt.name || evt.title}</h4>
                    <p className="text-xs font-mono text-neutral-400 mt-1">{evt.location_name || evt.location || evt.address || 'Trackside'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/events/${evt.id}`)}
                    className="mt-3 w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View Event Grid &amp; Entrants
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-neutral-900/50 border border-dashed border-neutral-800 rounded-2xl space-y-2 font-mono">
              <Trophy className="w-8 h-8 text-neutral-600 mx-auto" />
              <div className="text-xs font-bold text-neutral-400 uppercase">⚪ No Track Events Scheduled</div>
              <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                No active events found in Cloud Firestore.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'telemetry',
      title: 'Real-Time Telemetry & Analytics',
      subtitle: 'Live Sim Stats, Time Dilation & Traffic',
      icon: Activity,
      color: 'bg-purple-600 text-white',
      component: (
        <div className="p-4 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                TELEMETRY & TRAFFIC ANALYTICS
              </h3>
              <p className="text-xs text-neutral-400">Live Sim Stats & Platform Traffic Metrics</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin/analytics')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LaunchIcon className="w-4 h-4" />
              Full Analytics
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
              <span className="text-[10px] text-neutral-500 uppercase block">Sim Time Dilation</span>
              <span className="text-xl font-black text-emerald-400">1.00</span>
            </div>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
              <span className="text-[10px] text-neutral-500 uppercase block">Sim Engine Status</span>
              <span className="text-xl font-black text-emerald-400">ONLINE</span>
            </div>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
              <span className="text-[10px] text-neutral-500 uppercase block">Telemetry Feed</span>
              <span className="text-xl font-black text-white">LIVE</span>
            </div>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
              <span className="text-[10px] text-neutral-500 uppercase block">Rage Clicks</span>
              <span className="text-xl font-black text-emerald-400">0</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'settings',
      title: 'System Preferences',
      subtitle: 'Wallpapers, Themes & OS Options',
      icon: Settings,
      color: 'bg-neutral-700 text-white',
      component: null
    }
  ];

  // Drag App Icon Handlers
  // Drag App Icon Handlers
  const startDragIcon = (e: React.MouseEvent, appKey: string) => {
    e.stopPropagation();
    const idx = DESKTOP_APPS.findIndex(a => a.key === appKey);
    const defaultX = 32 + (Math.floor(idx / 4) * 110);
    const defaultY = 32 + ((idx % 4) * 110);
    const pos = iconPositions[appKey] || { x: defaultX, y: defaultY };

    setDraggingIconKey(appKey);
    setIconDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  // Drag Desktop Widget Handlers
  const startDragWidget = (e: React.MouseEvent, widgetId: string) => {
    e.stopPropagation();
    const idx = activeWidgets.findIndex(w => w.id === widgetId);
    const w = activeWidgets[idx];
    const defaultX = typeof window !== 'undefined' ? window.innerWidth - 320 : 820;
    const defaultY = 32 + (idx * 140);
    const currentX = w?.x !== undefined ? w.x : defaultX;
    const currentY = w?.y !== undefined ? w.y : defaultY;

    setDraggingWidgetId(widgetId);
    setWidgetDragOffset({
      x: e.clientX - currentX,
      y: e.clientY - currentY
    });
  };

  // Open App Window
  const openAppWindow = (appKey: string) => {
    if (appKey === 'settings') {
      setShowSettingsModal(true);
      return;
    }

    const appDef = DESKTOP_APPS.find(a => a.key === appKey);
    if (!appDef) return;

    const existing = windows.find(w => w.appKey === appKey);
    if (existing) {
      const newZ = highestZIndex + 1;
      setHighestZIndex(newZ);
      setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false, zIndex: newZ } : w));
      setActiveWindowId(existing.id);
      return;
    }

    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    const windowId = `win-${appKey}-${Date.now()}`;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const winWidth = Math.min(1000, Math.max(380, screenWidth - 120));
    const winHeight = Math.min(620, Math.max(300, screenHeight - 150));

    // Calculate safe centered cascade coordinates inside screen viewport
    const safeX = Math.max(30, Math.min(60 + (windows.length * 30), screenWidth - winWidth - 40));
    const safeY = Math.max(30, Math.min(40 + (windows.length * 30), screenHeight - winHeight - 60));

    const newWindow: WindowInstance = {
      id: windowId,
      appKey,
      title: appDef.title,
      icon: appDef.icon,
      x: safeX,
      y: safeY,
      width: winWidth,
      height: winHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(windowId);
  };

  // Close Window
  const closeWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    if (activeWindowId === windowId) {
      setActiveWindowId(null);
    }
  };

  // Toggle Minimize
  const toggleMinimize = (windowId: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === windowId) {
        const nextMin = !w.isMinimized;
        if (!nextMin) {
          const newZ = highestZIndex + 1;
          setHighestZIndex(newZ);
          setActiveWindowId(windowId);
          return { ...w, isMinimized: false, zIndex: newZ };
        }
        return { ...w, isMinimized: true };
      }
      return w;
    }));
  };

  // Toggle Maximize
  const toggleMaximize = (windowId: string) => {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  // Focus Window (Bring to Front)
  const focusWindow = (windowId: string) => {
    const newZ = highestZIndex + 1;
    setHighestZIndex(newZ);
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, zIndex: newZ } : w));
    setActiveWindowId(windowId);
  };

  // Dragging Window Handlers
  const startDragWindow = (e: React.MouseEvent, windowId: string) => {
    focusWindow(windowId);
    setDraggingWindowId(windowId);
    const win = windows.find(w => w.id === windowId);
    if (win) {
      setDragOffset({
        x: e.clientX - win.x,
        y: e.clientY - win.y
      });
    }
  };

  // Corner Resizing Handler
  const startResizeWindow = (e: React.MouseEvent, windowId: string) => {
    e.stopPropagation();
    focusWindow(windowId);
    setResizingWindowId(windowId);
    const win = windows.find(w => w.id === windowId);
    if (win) {
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        w: win.width,
        h: win.height
      });
    }
  };

  // Global Hardware-Accelerated 60fps Pointer Move Listener for Windows, Icons & Widgets
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!draggingWindowId && !resizingWindowId && !draggingIconKey && !draggingWidgetId) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (draggingWindowId) {
          const win = windows.find(w => w.id === draggingWindowId);
          const currentW = win?.width || 800;
          const currentH = win?.height || 500;
          const maxAllowedY = Math.max(0, window.innerHeight - currentH - 52);
          const maxAllowedX = Math.max(0, window.innerWidth - currentW - 20);

          const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, maxAllowedX));
          const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, maxAllowedY));
          setWindows(prev => prev.map(w => w.id === draggingWindowId ? { ...w, x: newX, y: newY } : w));
        } else if (resizingWindowId) {
          const win = windows.find(w => w.id === resizingWindowId);
          const winY = win?.y || 0;
          const maxAllowedH = Math.max(240, window.innerHeight - winY - 52);
          const maxAllowedW = Math.max(380, window.innerWidth - (win?.x || 0) - 20);

          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          const newW = Math.max(380, Math.min(resizeStart.w + deltaX, maxAllowedW));
          const newH = Math.max(240, Math.min(resizeStart.h + deltaY, maxAllowedH));
          setWindows(prev => prev.map(w => w.id === resizingWindowId ? { ...w, width: newW, height: newH } : w));
        } else if (draggingIconKey) {
          const newX = Math.max(10, Math.min(e.clientX - iconDragOffset.x, window.innerWidth - 110));
          const newY = Math.max(10, Math.min(e.clientY - iconDragOffset.y, window.innerHeight - 150));
          setIconPositions(prev => ({ ...prev, [draggingIconKey]: { x: newX, y: newY } }));
        } else if (draggingWidgetId) {
          const newX = Math.max(10, Math.min(e.clientX - widgetDragOffset.x, window.innerWidth - 300));
          const newY = Math.max(10, Math.min(e.clientY - widgetDragOffset.y, window.innerHeight - 200));
          setActiveWidgets(prev => prev.map(w => w.id === draggingWidgetId ? { ...w, x: newX, y: newY } : w));
        }
      });
    };

    const handleGlobalPointerUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (draggingIconKey) {
        localStorage.setItem('gp_os_icon_positions', JSON.stringify(iconPositionsRef.current));
      }
      if (draggingWidgetId) {
        localStorage.setItem('gp_os_active_widgets', JSON.stringify(activeWidgetsRef.current));
      }
      setDraggingWindowId(null);
      setResizingWindowId(null);
      setDraggingIconKey(null);
      setDraggingWidgetId(null);
    };

    if (draggingWindowId || resizingWindowId || draggingIconKey || draggingWidgetId) {
      window.addEventListener('pointermove', handleGlobalPointerMove);
      window.addEventListener('pointerup', handleGlobalPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [draggingWindowId, resizingWindowId, draggingIconKey, draggingWidgetId, dragOffset, resizeStart, iconDragOffset, widgetDragOffset]);

  const wallpaperStyle = WALLPAPER_STYLES[preferences.wallpaper] || WALLPAPER_STYLES.carbon;
  const isCustomWallpaper = preferences.wallpaper === 'custom' && !!customWallpaper;

  return (
    <div 
      className={`fixed inset-0 z-[99999] select-none overflow-hidden font-sans ${isCustomWallpaper ? 'bg-neutral-950 bg-cover bg-center bg-no-repeat' : wallpaperStyle.bg}`}
      style={isCustomWallpaper ? { backgroundImage: `url(${customWallpaper})` } : undefined}
    >
      {/* ========================================================================= */}
      {/* 🔒 1. GRIDPASS AUTH LOCK SCREEN & LOGIN GATE */}
      {/* ========================================================================= */}
      {isLocked && (
        <div className="absolute inset-0 z-[99999] bg-neutral-950/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-white transition-all duration-300">
          <div className="w-full flex items-center justify-between text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff3b30]" />
              <span className="font-black uppercase tracking-widest text-white">GRIDPASS OS SECURITY</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-emerald-400" /> ONLINE</span>
              <span className="flex items-center gap-1"><Battery className="w-3.5 h-3.5 text-emerald-400" /> 100%</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center max-w-md w-full">
            <h1 className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white drop-shadow-2xl mb-1">
              {currentTime.split(' ')[0]}
            </h1>
            <p className="text-sm font-mono font-bold uppercase tracking-widest text-neutral-400 mb-8">
              {currentDate}
            </p>

            <div className="p-6 bg-neutral-900/80 border border-neutral-800 rounded-3xl backdrop-blur-xl w-full flex flex-col items-center shadow-2xl">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff3b30] to-red-600 flex items-center justify-center text-2xl font-black text-white shadow-lg border-2 border-white/20">
                  {user?.displayName ? user.displayName.charAt(0) : 'PJ'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-neutral-950 flex items-center justify-center">
                  <Check className="w-3 h-3 text-neutral-950 stroke-[3]" />
                </div>
              </div>

              <h2 className="text-lg font-black uppercase tracking-tight text-white mb-0.5">
                {user?.displayName || 'PJ Losey'}
              </h2>
              <p className="text-xs font-mono text-[#ff3b30] font-bold uppercase tracking-wider mb-2">
                SUPER ADMIN &amp; OWNER
              </p>

              {user?.email && (
                <div className="mb-6 px-3 py-1 bg-neutral-950/60 border border-neutral-800 rounded-full text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Logged in via Google OAuth ({user.email})</span>
                </div>
              )}

              <form onSubmit={handleUnlock} className="w-full space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Enter Security PIN..."
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 bg-neutral-950/90 border border-neutral-700 focus:border-[#ff3b30] rounded-xl text-sm font-mono text-white placeholder-neutral-500 focus:outline-none text-center tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#ff3b30] hover:bg-red-600 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-red-900/40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Unlock Gridpass OS
                </button>
              </form>

              <button
                type="button"
                onClick={handleGoogleReAuthUnlock}
                className="mt-3 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Forgot PIN? Re-authenticate via Google ({user?.email || 'Account'})</span>
              </button>

              <div className="mt-3 text-[10px] font-mono text-neutral-500 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>Protected by Gridpass OS Security</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-neutral-500 flex items-center gap-2">
            <span>Gridpass OS v5.0.0</span>
            <span>•</span>
            <span>Press ⌘+L anytime to lock</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🖥️ 2. DRAGGABLE & PERSISTENT DESKTOP APP SHORTCUTS */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 top-0 bottom-14 pointer-events-none overflow-hidden">
        {DESKTOP_APPS.map((app, idx) => {
          const Icon = app.icon;
          const pos = iconPositions[app.key] || {
            x: 32 + (Math.floor(idx / 4) * 110),
            y: 32 + ((idx % 4) * 110)
          };

          return (
            <div
              key={app.key}
              onMouseDown={(e) => startDragIcon(e, app.key)}
              onDoubleClick={() => openAppWindow(app.key)}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`
              }}
              className={`pointer-events-auto group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/10 active:scale-95 text-center w-24 select-none cursor-grab active:cursor-grabbing ${
                draggingIconKey === app.key ? 'transition-none will-change-[left,top] z-30 scale-105 shadow-2xl' : 'transition-transform duration-100'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl ${app.color} flex items-center justify-center shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all border border-white/20`}>
                <Icon className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow-md line-clamp-2 leading-tight">
                {app.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 🧱 3. DRAGGABLE & PERSISTENT DESKTOP WIDGETS PANEL */}
      {/* ========================================================================= */}
      {showWidgets && activeWidgets.map((widget, idx) => {
        const posX = widget.x !== undefined ? widget.x : (typeof window !== 'undefined' ? window.innerWidth - 320 : 820);
        const posY = widget.y !== undefined ? widget.y : (32 + idx * 140);

        return (
          <div
            key={widget.id}
            onMouseDown={(e) => startDragWidget(e, widget.id)}
            style={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`
            }}
            className={`w-72 pointer-events-auto cursor-grab active:cursor-grabbing font-mono group select-none ${
              draggingWidgetId === widget.id ? 'transition-none will-change-[left,top] z-40 scale-[1.02]' : 'z-20 transition-transform duration-100'
            }`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
                className="absolute -top-2 -right-2 z-[110] w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Remove Widget"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {widget.type === 'clock' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#ff3b30]" /> LOCAL TIME</span>
                    <span className="px-2 py-0.5 bg-neutral-800 rounded text-[10px] text-emerald-400">ONLINE</span>
                  </div>
                  <div className="text-3xl font-black text-white tracking-tighter my-1">{currentTime}</div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{currentDate}</div>
                </div>
              )}

              {widget.type === 'race_countdown' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-400 uppercase flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> NEXT TRACK EVENT</span>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">{events[0]?.location_name || events[0]?.location || 'FIRESTORE'}</span>
                  </div>
                  <div className="p-2.5 bg-neutral-950/80 rounded-2xl border border-neutral-800">
                    <div className="text-xs font-bold text-white uppercase truncate">{events[0]?.name || events[0]?.title || '⚪ No Upcoming Events'}</div>
                    <div className="text-xs font-black text-[#ff3b30] mt-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{events.length > 0 ? `${events.length} ACTIVE EVENTS STAGED` : '⚪ NO SCHEDULED MEETS'}</span>
                    </div>
                  </div>
                </div>
              )}

              {widget.type === 'stopwatch' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-400 uppercase flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> QUALIFYING TIMER</span>
                    <span className="text-[10px] text-neutral-400">{stopwatchRunning ? 'RUNNING' : 'PAUSED'}</span>
                  </div>
                  <div className="text-2xl font-black text-center text-white bg-black/60 py-2 rounded-2xl border border-neutral-800">
                    {Math.floor(stopwatchTime / 60).toString().padStart(2, '0')}:{(stopwatchTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setStopwatchRunning(prev => !prev); }}
                      className={`flex-1 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                        stopwatchRunning ? 'bg-amber-500 text-neutral-950' : 'bg-emerald-500 text-neutral-950'
                      }`}
                    >
                      {stopwatchRunning ? 'Pause' : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setStopwatchRunning(false); setStopwatchTime(872); }}
                      className="px-3 py-1.5 bg-neutral-800 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-neutral-700"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {widget.type === 'telemetry' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-purple-400 uppercase flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> SIM TELEMETRY</span>
                    <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-black/60 rounded-xl border border-neutral-800">
                      <span className="text-[9px] text-neutral-500 block uppercase">Time Dilation</span>
                      <span className="text-sm font-black text-emerald-400">1.00</span>
                    </div>
                    <div className="p-2 bg-black/60 rounded-xl border border-neutral-800">
                      <span className="text-[9px] text-neutral-500 block uppercase">Platform Status</span>
                      <span className="text-sm font-black text-purple-400">ACTIVE</span>
                    </div>
                  </div>
                </div>
              )}

              {widget.type === 'garage' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#ff3b30] uppercase flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> GARAGE MACHINES</span>
                    <span className="text-[10px] text-neutral-400 font-bold">{vehicles.length} Passports</span>
                  </div>
                  <div className="p-2 bg-black/60 rounded-xl border border-neutral-800 text-xs font-bold text-white truncate">
                    {vehicles.length > 0 ? `${vehicles[0].year || ''} ${vehicles[0].make} ${vehicles[0].model}`.trim() : '⚪ No Machines Registered'}
                  </div>
                </div>
              )}

              {widget.type === 'inventory' && (
                <div className="p-4 bg-neutral-900/85 border border-neutral-800 rounded-3xl backdrop-blur-xl shadow-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-amber-400 uppercase flex items-center gap-1.5"><Warehouse className="w-3.5 h-3.5" /> INVENTORY VALUATION</span>
                    <span className="text-[10px] text-emerald-400 font-bold">${totalInventoryValuation.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-black/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 truncate">
                    {inventoryItems.length > 0 ? `${inventoryItems.length} Equipment & Parts Staged` : '⚪ No Inventory Items Registered'}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* 🪟 4. INTERACTIVE MULTI-WINDOW CONTAINER */}
      {/* ========================================================================= */}
      {windows.map((win) => {
        if (win.isMinimized) return null;

        const AppIcon = win.icon;
        const appDef = DESKTOP_APPS.find(a => a.key === win.appKey);

        return (
          <div
            key={win.id}
            onClick={() => focusWindow(win.id)}
            style={{
              position: 'absolute',
              left: win.isMaximized ? 0 : `${win.x}px`,
              top: win.isMaximized ? 0 : `${win.y}px`,
              width: win.isMaximized ? '100vw' : `${win.width}px`,
              height: win.isMaximized ? 'calc(100vh - 48px)' : `${win.height}px`,
              zIndex: win.zIndex
            }}
            className={`bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ${
              draggingWindowId === win.id || resizingWindowId === win.id 
                ? 'transition-none will-change-[transform,width,height] select-none' 
                : 'transition-all duration-75'
            }`}
          >
            <div
              onMouseDown={(e) => startDragWindow(e, win.id)}
              className="h-10 bg-neutral-900 border-b border-neutral-800 px-3 flex items-center justify-between cursor-move select-none"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center group text-neutral-950 font-black text-[9px] cursor-pointer"
                  title="Close Window"
                >
                  <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMinimize(win.id); }}
                  className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center group text-neutral-950 font-black text-[9px] cursor-pointer"
                  title="Minimize Window"
                >
                  <Minimize2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center group text-neutral-950 font-black text-[9px] cursor-pointer"
                  title="Maximize Window"
                >
                  <Maximize2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono font-black text-white uppercase tracking-wide">
                <AppIcon className="w-4 h-4 text-[#ff3b30]" />
                <span>{win.title}</span>
              </div>

              {/* Windows-Style Action Controls (Right Side) */}
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMinimize(win.id); }}
                  className="px-2 py-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Minimize Window (Windows Style)"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                  className="px-2 py-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Maximize Window (Windows Style)"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                  className="px-2 py-1 hover:bg-[#ff3b30] text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Close Window (Windows Style)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto bg-neutral-950 text-white p-4 ${
              draggingWindowId === win.id || resizingWindowId === win.id ? 'pointer-events-none select-none' : ''
            }`}>
              {appDef?.component || (
                <div className="p-8 text-center text-neutral-400">
                  Window Viewport Active
                </div>
              )}
            </div>

            {!win.isMaximized && (
              <>
                <div
                  onMouseDown={(e) => startResizeWindow(e, win.id)}
                  className="absolute top-10 bottom-2 right-0 w-2 cursor-e-resize z-50 hover:bg-[#ff3b30]/40 transition-colors"
                  title="Drag Right Edge to Resize Width"
                ></div>
                <div
                  onMouseDown={(e) => startResizeWindow(e, win.id)}
                  className="absolute bottom-0.5 right-0.5 w-6 h-6 cursor-se-resize flex items-center justify-center group z-50 text-neutral-500 hover:text-[#ff3b30] p-1 select-none bg-neutral-900/90 rounded-tl-lg border-t border-l border-neutral-700"
                  title="Drag Corner to Resize Window"
                >
                  <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-current rounded-br"></div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* ➕ 5. WIDGET STORE MARKETPLACE MODAL */}
      {/* ========================================================================= */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 z-[99996] bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950 font-mono">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>GRIDPASS DESKTOP WIDGET STORE</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWidgetModal(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_CATALOG.map((cat) => {
                  const Icon = cat.icon;

                  return (
                    <div key={cat.type} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-amber-400" />
                        </div>
                        <h4 className="text-xs font-black text-white uppercase">{cat.title}</h4>
                        <p className="text-[11px] text-neutral-400 mt-1">{cat.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addWidget(cat.type);
                          setShowAddWidgetModal(false);
                        }}
                        className="mt-4 w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add to Desktop</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddWidgetModal(false)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
              >
                Close Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 6. SPOTLIGHT LAUNCHPAD MODAL (⌘+K) */}
      {/* ========================================================================= */}
      {showLaunchpad && (
        <div className="fixed inset-0 z-[99990] bg-neutral-950/80 backdrop-blur-xl flex items-start justify-center pt-24 p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#ff3b30]" />
              <input
                type="text"
                placeholder="Search Gridpass OS apps, tools, inventory, or machine passports... (Esc to close)"
                value={launchpadSearch}
                onChange={(e) => setLaunchpadSearch(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-white font-mono text-sm focus:outline-none placeholder-neutral-500"
              />
              <button
                type="button"
                onClick={() => setShowLaunchpad(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
              {DESKTOP_APPS
                .filter(a => a.title.toLowerCase().includes(launchpadSearch.toLowerCase()) || a.subtitle.toLowerCase().includes(launchpadSearch.toLowerCase()))
                .map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.key}
                      type="button"
                      onClick={() => {
                        setShowLaunchpad(false);
                        openAppWindow(app.key);
                      }}
                      className="p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-2xl flex items-center gap-3 transition-colors text-left cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase">{app.title}</div>
                        <div className="text-[11px] text-neutral-400">{app.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ 7. SYSTEM PREFERENCES MODAL */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[99995] bg-neutral-950/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-white uppercase">
                <Settings className="w-4 h-4 text-amber-400" />
                <span>GRIDPASS OS SYSTEM PREFERENCES</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-300 font-mono">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#ff3b30]" />
                    Desktop Wallpaper
                  </h4>
                  <label className="px-3 py-1.5 bg-[#ff3b30] hover:bg-red-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Custom Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadWallpaper}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(WALLPAPER_STYLES) as WallpaperPreset[]).map((key) => {
                    const preset = WALLPAPER_STYLES[key];
                    const isSelected = preferences.wallpaper === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updatePreferences({ wallpaper: key })}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-[#ff3b30] bg-[#ff3b30]/10 text-white' 
                            : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className={`w-full h-12 rounded-xl ${preset.bg} border border-white/10`}></div>
                        <span className="text-xs font-bold">{preset.name}</span>
                      </button>
                    );
                  })}

                  {/* Custom Uploaded Photo Card */}
                  <label
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      preferences.wallpaper === 'custom'
                        ? 'border-[#ff3b30] bg-[#ff3b30]/10 text-white'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                    }`}
                    onClick={() => {
                      if (customWallpaper) {
                        updatePreferences({ wallpaper: 'custom' });
                      }
                    }}
                  >
                    {customWallpaper ? (
                      <div
                        className="w-full h-12 rounded-xl bg-cover bg-center border border-white/20"
                        style={{ backgroundImage: `url(${customWallpaper})` }}
                      ></div>
                    ) : (
                      <div className="w-full h-12 rounded-xl bg-neutral-900 border border-dashed border-neutral-700 flex items-center justify-center text-neutral-500">
                        <Plus className="w-5 h-5 text-amber-400" />
                      </div>
                    )}
                    <span className="text-xs font-bold truncate">
                      {customWallpaper ? 'Custom Photo' : '+ Upload Custom'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadWallpaper}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white uppercase">Desktop Icon &amp; Widget Positions</div>
                  <button
                    type="button"
                    onClick={resetDesktopLayout}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Layout Grid</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Drag any icon or widget anywhere on your screen. Positions automatically save to your browser storage.
                </p>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-white uppercase">Lock Screen PIN Code</div>
                  <span className="text-xs font-bold text-amber-400">Current: {preferences.pinCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Set new 4-digit PIN..."
                    onChange={(e) => {
                      if (e.target.value.length >= 4) {
                        updatePreferences({ pinCode: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs font-mono text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
              >
                Close Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚓ 8. FULL-WIDTH ENTERPRISE BOTTOM TASKBAR (FIXED BOTTOM-0 W-FULL H-12) */}
      {/* ========================================================================= */}
      <div className="h-12 bg-neutral-950/95 border-t border-neutral-800/90 backdrop-blur-2xl px-3 flex items-center justify-between text-xs font-mono text-neutral-300 z-[9000] fixed bottom-0 left-0 right-0 w-full select-none">
        
        {/* Left: Start Button & Launchpad */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAppleMenu(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#ff3b30] hover:bg-red-600 text-white rounded-xl font-mono font-black uppercase text-xs transition-all cursor-pointer shadow-lg shadow-red-950/50"
            >
              <Shield className="w-4 h-4 fill-white" />
              <span>START</span>
            </button>

            {showAppleMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl p-2 text-xs text-neutral-300 z-[9999] space-y-1 font-mono">
                <div className="p-3 border-b border-neutral-800 mb-1">
                  <div className="font-black text-white uppercase tracking-wider text-xs">Gridpass OS v5.0.0</div>
                  <div className="text-[10px] text-neutral-500">Google Ultra Agentic Architecture</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAppleMenu(false); setShowLaunchpad(true); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-white transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#ff3b30]" />
                  <span>Launchpad Search (⌘K)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAppleMenu(false); enterFullScreen(); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-white transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  <span>Enter Fullscreen OS</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAppleMenu(false); setShowSettingsModal(true); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-white transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>System Preferences...</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAppleMenu(false); resetDesktopLayout(); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Reset All Positions</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAppleMenu(false); lockOS(); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-white transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Lock Screen (⌘L)</span>
                </button>
                <div className="border-t border-neutral-800 my-1"></div>
                <button
                  type="button"
                  onClick={() => router.push('/dash')}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-xl flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Exit to Main Gridpass Site</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowLaunchpad(true)}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer border border-neutral-800"
            title="Launchpad Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Enterprise Pinned Taskbar Icons (Windows 11 Centered Alignment) */}
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 overflow-visible">
          {DESKTOP_APPS.map((app) => {
            const Icon = app.icon;
            const isOpen = windows.some(w => w.appKey === app.key);
            const isActive = activeWindowId && windows.find(w => w.id === activeWindowId)?.appKey === app.key;

            return (
              <button
                key={app.key}
                type="button"
                onClick={() => openAppWindow(app.key)}
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isActive ? 'bg-[#ff3b30]/20 border border-[#ff3b30]/60 text-white shadow-lg shadow-red-950/40 scale-105' :
                  isOpen ? 'bg-neutral-900 border border-neutral-700 text-neutral-200 hover:bg-neutral-800' :
                  'hover:bg-neutral-900/80 text-neutral-400 hover:text-white border border-transparent'
                }`}
                title={app.title}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-[#ff3b30]' : ''}`} />
                {isOpen && (
                  <span className={`absolute -bottom-1 w-2 h-0.5 rounded-full ${isActive ? 'bg-[#ff3b30]' : 'bg-neutral-400'}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: System Tray (Clock, Widgets Toggle, Firestore Live, Lock) */}
        <div className="flex items-center gap-3 font-mono">
          <button
            type="button"
            onClick={() => setShowAddWidgetModal(true)}
            className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold transition-all cursor-pointer border border-neutral-800"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>Widgets</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWidgets(prev => !prev)}
            className={`hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              showWidgets ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>{showWidgets ? 'Widgets ON' : 'Widgets OFF'}</span>
          </button>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            FIRESTORE LIVE
          </div>

          <div className="flex items-center gap-2 text-white font-mono font-bold text-xs bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            <Clock className="w-3.5 h-3.5 text-[#ff3b30]" />
            <span>{currentTime}</span>
          </div>

          <button
            type="button"
            onClick={lockOS}
            className="p-1.5 bg-neutral-900 hover:bg-red-950/50 hover:border-red-600 text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer border border-neutral-800"
            title="Lock OS (⌘L)"
          >
            <Lock className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
