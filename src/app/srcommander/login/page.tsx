"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ToastContext";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Lock,
  User as UserIcon,
  Mail,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  QrCode,
  ShieldCheck,
  Zap,
  Loader2,
  ArrowLeft,
  Smartphone,
  HardDrive,
} from "lucide-react";

function SRCommanderLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "qr">("password");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const redirectTarget = searchParams.get("redirect") || "/srcommander";

  // Generate Quick-Login QR Code URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setQrCodeUrl(`${origin}/login?redirect=${encodeURIComponent("/srcommander")}`);
    }
  }, []);

  // Save session locally whenever user changes
  useEffect(() => {
    if (user) {
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "Host",
        photoURL: user.photoURL || null,
        logged_in_at: new Date().toISOString(),
      };
      localStorage.setItem("gridpass_commander_auth_session", JSON.stringify(sessionData));

      // Post to local daemon API
      fetch("/api/commander/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      }).catch(() => {});
    }
  }, [user]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast({
        title: "Welcome Back!",
        message: "Signed in successfully. Offline session cached.",
        icon: "🏎️",
      });
      router.push(redirectTarget);
    } catch (err: any) {
      showToast({
        title: "Login Failed",
        message: err.message || "Invalid email or password.",
        icon: "❌",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast({
        title: "Google Login Successful",
        message: "Signed in to GridPass Sim Commander.",
        icon: "✨",
      });
      router.push(redirectTarget);
    } catch (err: any) {
      showToast({
        title: "Google Login Failed",
        message: err.message,
        icon: "❌",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("gridpass_commander_auth_session");
      showToast({
        title: "Logged Out",
        message: "Signed out of Sim Commander.",
        icon: "👋",
      });
    } catch (err: any) {
      showToast({
        title: "Sign Out Error",
        message: err.message,
        icon: "❌",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
        <p className="text-sm uppercase tracking-widest font-black text-neutral-400">
          Checking GridPass Credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8 flex flex-col items-center justify-center">
      {/* BACKGROUND ACCENT GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* BACK TO DASHBOARD LINK */}
        <div className="flex items-center justify-between">
          <Link
            href="/srcommander"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sim Commander Hub</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MODULE 1: AUTH & IDENTITY</span>
          </div>
        </div>

        {/* HEADER BRANDING */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl mb-1">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            User Login & Account
          </h1>
          <p className="text-xs text-neutral-400 font-medium">
            Sign in as Host, Track Owner, or Driver. Session is cached locally for 100% offline access.
          </p>
        </div>

        {/* IF ALREADY LOGGED IN: SHOW ACTIVE PROFILE CARD */}
        {user ? (
          <div className="bg-neutral-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Active Logged-In Session
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-2.5 py-0.5 rounded-full uppercase">
                Offline Cached
              </span>
            </div>

            <div className="flex items-center gap-4 bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800 border-2 border-red-500/50 flex items-center justify-center text-xl font-black text-white shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0) || user.email?.charAt(0) || "U"
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-base font-black text-white truncate">
                  {user.displayName || user.email?.split("@")[0] || "Host Driver"}
                </div>
                <div className="text-xs font-mono text-neutral-400 truncate flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>{user.email}</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500 truncate">
                  UID: {user.uid}
                </div>
              </div>
            </div>

            {/* STATUS HIGHLIGHTS */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 block uppercase">Storage</span>
                <span className="text-white font-bold flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Local Flash Drive</span>
                </span>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                <span className="text-[10px] text-neutral-500 block uppercase">Cloud Sync</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <Link
                href={redirectTarget}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-neutral-800 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch User / Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* SIGN IN FORM & QR LOGIN TABS */
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* TABS */}
            <div className="grid grid-cols-2 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "password"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Email & Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "qr"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Phone QR Scan</span>
              </button>
            </div>

            {/* TAB 1: EMAIL & PASSWORD */}
            {activeTab === "password" && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="driver@gridpass.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-600 text-base font-medium focus:outline-hidden focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-neutral-400 block tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-neutral-600 text-base font-medium focus:outline-hidden focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Sim Commander</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="border-t border-neutral-800 w-full" />
                  <span className="bg-neutral-900 px-3 text-[10px] uppercase font-mono text-neutral-500 shrink-0">
                    OR 1-CLICK
                  </span>
                  <div className="border-t border-neutral-800 w-full" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-neutral-800 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </form>
            )}

            {/* TAB 2: INSTANT PHONE QR LOGIN */}
            {activeTab === "qr" && (
              <div className="text-center space-y-4 py-2">
                <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl mx-auto border-4 border-red-600">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      qrCodeUrl
                    )}`}
                    alt="Scan to Login"
                    className="w-44 h-44 mx-auto"
                  />
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Scan with Your Phone Camera</span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Sign in on your phone and the sim rig will automatically log you in without typing!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER BADGE */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] font-mono text-neutral-500">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Portable Zero-Install Flash Drive Runtime Ready</span>
        </div>
      </div>
    </div>
  );
}

export default function SRCommanderLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      }
    >
      <SRCommanderLoginContent />
    </Suspense>
  );
}
