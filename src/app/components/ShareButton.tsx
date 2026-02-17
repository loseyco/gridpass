"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  variant?: "icon" | "button";
  referralUser?: string;
}

export default function ShareButton({
  title = "GridPass",
  text = "Check out this profile on GridPass!",
  url,
  className = "",
  variant = "icon",
  referralUser
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const [shareUrl, setShareUrl] = useState(url || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let currentUrl = url || window.location.href;

      if (referralUser) {
        try {
          const urlObj = new URL(currentUrl);
          urlObj.searchParams.set("ref", referralUser);
          currentUrl = urlObj.toString();
        } catch (e) {
          // Fallback for relative URLs or errors
          if (currentUrl.startsWith("/")) {
            currentUrl = `${window.location.origin}${currentUrl}${currentUrl.includes('?') ? '&' : '?'}ref=${referralUser}`;
          }
        }
      }

      setShareUrl(currentUrl);
    }
  }, [url, referralUser]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleShare = async () => {
    // Try Native Share First (Mobile/Safari)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.log('Share canceled or failed', err);
        } else {
          return;
        }
      }
    }

    // Fallback to Desktop Modal
    setIsOpen(!isOpen);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: "X",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-sky-400 hover:bg-sky-400/10"
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-blue-500 hover:bg-blue-500/10"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: "hover:text-blue-600 hover:bg-blue-600/10"
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + shareUrl)}`,
      color: "hover:text-emerald-500 hover:bg-emerald-500/10"
    }
  ];

  return (
    <div ref={containerRef} className="relative inline-block">
      {variant === "icon" ? (
        <button
          onClick={handleShare}
          className={`v2-btn v2-btn-icon v2-btn-ghost ${className} ${isOpen ? "bg-white/10" : ""}`}
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleShare}
          className={`v2-btn v2-btn-primary gap-2 ${className}`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <span className="text-sm font-bold text-white">Share Via</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 grid grid-cols-4 gap-1">
              {shareLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-neutral-400 transition-colors ${link.color}`}
                  title={link.name}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">{link.name}</span>
                </a>
              ))}
            </div>

            <div className="p-3 bg-black/20 border-t border-white/5">
              <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg p-2">
                <span className="flex-1 text-xs text-neutral-400 truncate font-mono">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
