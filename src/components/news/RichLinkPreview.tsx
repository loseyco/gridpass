'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import {
  ExternalLink,
  Car,
  User,
  Calendar,
  Building2,
  Newspaper,
  Play,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  text: string;
}

interface EntityPreview {
  type: 'vehicle' | 'user' | 'event' | 'business' | 'news' | 'youtube' | 'generic';
  url: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  badge?: string;
  badgeIcon?: string;
  details?: string[];
  youtubeId?: string;
  domain?: string;
}

// URL extraction helper
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

export default function RichLinkPreview({ text }: Props) {
  const [previews, setPreviews] = useState<EntityPreview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urls = extractUrls(text);
    if (urls.length === 0) {
      setPreviews([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function resolveUrls() {
      const results: EntityPreview[] = [];

      for (const urlStr of urls.slice(0, 2)) {
        try {
          const parsed = new URL(urlStr);
          const isGridpass =
            parsed.hostname.includes('gridpass.app') ||
            parsed.hostname.includes('localhost') ||
            parsed.hostname.includes('127.0.0.1');

          // 1. YouTube Link Resolution
          if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
            let videoId: string | null = null;
            if (parsed.hostname.includes('youtu.be')) {
              videoId = parsed.pathname.slice(1);
            } else {
              videoId = parsed.searchParams.get('v');
            }

            if (videoId) {
              results.push({
                type: 'youtube',
                url: urlStr,
                title: 'YouTube Video',
                youtubeId: videoId,
                image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                domain: 'youtube.com',
              });
              continue;
            }
          }

          // 2. Gridpass Internal Link Resolution
          if (isGridpass) {
            const pathname = parsed.pathname;

            // A) Vehicle Passport: /v/[id]
            if (pathname.startsWith('/v/')) {
              const vehicleId = pathname.replace('/v/', '').split('/')[0];
              if (vehicleId) {
                try {
                  const snap = await getDoc(doc(db, 'vehicles', vehicleId));
                  if (snap.exists()) {
                    const data = snap.data();
                    const photo =
                      data.primary_photo ||
                      data.cover_photo ||
                      (data.photos && data.photos[0]) ||
                      (data.gallery && data.gallery[0]) ||
                      null;

                    const title = `${data.year || ''} ${data.make || ''} ${data.model || ''} ${
                      data.trim || ''
                    }`.trim() || 'Vehicle Passport';

                    const details: string[] = [];
                    if (data.hp || data.horsepower) details.push(`${data.hp || data.horsepower} HP`);
                    if (data.class_category || data.class) details.push(data.class_category || data.class);
                    if (data.chassis) details.push(`Chassis ${data.chassis}`);

                    results.push({
                      type: 'vehicle',
                      url: urlStr,
                      title,
                      subtitle: data.owner_name ? `Owner: ${data.owner_name}` : 'Verified Vehicle Passport',
                      image: photo,
                      badge: 'Vehicle Passport',
                      badgeIcon: '🚗',
                      details,
                      domain: 'gridpass.app',
                    });
                    continue;
                  }
                } catch (e) {
                  console.warn('Error resolving vehicle preview:', e);
                }
              }
            }

            // B) Driver Profile: /u/[id]
            if (pathname.startsWith('/u/')) {
              const userId = pathname.replace('/u/', '').split('/')[0];
              if (userId) {
                try {
                  const snap = await getDoc(doc(db, 'users', userId));
                  if (snap.exists()) {
                    const data = snap.data();
                    results.push({
                      type: 'user',
                      url: urlStr,
                      title: data.displayName || data.name || data.handle || 'Driver Passport',
                      subtitle: data.bio || data.title || 'Official Gridpass Driver & Member',
                      image: data.photoURL || data.avatar || null,
                      badge: 'Driver Passport',
                      badgeIcon: '🏁',
                      domain: 'gridpass.app',
                    });
                    continue;
                  }
                } catch (e) {
                  console.warn('Error resolving user preview:', e);
                }
              }
            }

            // C) Event Passport: /e/[id]
            if (pathname.startsWith('/e/')) {
              const eventId = pathname.replace('/e/', '').split('/')[0];
              if (eventId) {
                try {
                  const snap = await getDoc(doc(db, 'events', eventId));
                  if (snap.exists()) {
                    const data = snap.data();
                    results.push({
                      type: 'event',
                      url: urlStr,
                      title: data.title || data.name || 'Official Event',
                      subtitle: `${data.date_str || data.date || ''} • ${data.location || data.track || ''}`,
                      image: data.cover_image || data.banner_url || data.image || null,
                      badge: 'Official Event',
                      badgeIcon: '📅',
                      domain: 'gridpass.app',
                    });
                    continue;
                  }
                } catch (e) {
                  console.warn('Error resolving event preview:', e);
                }
              }
            }

            // D) Business / Shop: /biz/[id]
            if (pathname.startsWith('/biz/')) {
              const bizId = pathname.replace('/biz/', '').split('/')[0];
              if (bizId) {
                try {
                  const snap = await getDoc(doc(db, 'businesses', bizId));
                  if (snap.exists()) {
                    const data = snap.data();
                    results.push({
                      type: 'business',
                      url: urlStr,
                      title: data.business_name || data.name || 'Speed Shop & Partner',
                      subtitle: data.category || data.city_state || 'Verified Paddock Partner',
                      image: data.logo_url || data.cover_photo || null,
                      badge: 'Verified Business',
                      badgeIcon: '🏢',
                      domain: 'gridpass.app',
                    });
                    continue;
                  }
                } catch (e) {
                  console.warn('Error resolving business preview:', e);
                }
              }
            }

            // E) News Story: /news/[slug]
            if (pathname.startsWith('/news/') && !pathname.includes('/hub/') && !pathname.includes('/directory')) {
              const slug = pathname.replace('/news/', '').split('/')[0];
              if (slug) {
                try {
                  const q = query(collection(db, 'news_articles'), where('slug', '==', slug), limit(1));
                  const snap = await getDocs(q);
                  if (!snap.empty) {
                    const data = snap.docs[0].data();
                    results.push({
                      type: 'news',
                      url: urlStr,
                      title: data.title || 'Motorsport Wire Report',
                      subtitle: data.summary?.slice(0, 120) || 'Verified race report and telemetry analysis.',
                      image: data.cover_image || data.cover_image_url || null,
                      badge: 'Wire Story',
                      badgeIcon: '📰',
                      domain: 'gridpass.app',
                    });
                    continue;
                  }
                } catch (e) {
                  console.warn('Error resolving news preview:', e);
                }
              }
            }
          }

          // 3. Generic Web URL Bookmark Fallback
          results.push({
            type: 'generic',
            url: urlStr,
            title: parsed.hostname.replace('www.', ''),
            subtitle: urlStr,
            domain: parsed.hostname.replace('www.', ''),
          });
        } catch (err) {
          console.warn('URL parsing error:', err);
        }
      }

      if (isMounted) {
        setPreviews(results);
        setLoading(false);
      }
    }

    resolveUrls();

    return () => {
      isMounted = false;
    };
  }, [text]);

  if (previews.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      {previews.map((preview, idx) => {
        // A) YouTube Interactive Player
        if (preview.type === 'youtube' && preview.youtubeId) {
          return (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden border border-neutral-200 shadow-xs aspect-video bg-black"
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${preview.youtubeId}`}
                title={preview.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          );
        }

        // B) Rich Card (Vehicle, Driver, Event, Business, News, Generic)
        return (
          <a
            key={idx}
            href={preview.url}
            target={preview.domain === 'gridpass.app' ? '_self' : '_blank'}
            rel="noopener noreferrer"
            className="block group bg-neutral-50 hover:bg-neutral-100/90 border border-neutral-200/90 rounded-2xl overflow-hidden transition duration-200 shadow-2xs hover:shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-stretch">
              {/* Thumbnail Photo (if present) */}
              {preview.image && (
                <div className="sm:w-44 sm:min-w-44 h-36 sm:h-auto bg-neutral-200 relative overflow-hidden shrink-0">
                  <img
                    src={preview.image}
                    alt={preview.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {preview.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-neutral-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1 shadow-xs">
                      <span>{preview.badgeIcon}</span>
                      <span>{preview.badge}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2 min-w-0">
                <div className="space-y-1">
                  {!preview.image && preview.badge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-black uppercase tracking-wider rounded-md">
                      <span>{preview.badgeIcon}</span>
                      <span>{preview.badge}</span>
                    </span>
                  )}

                  <h4 className="text-xs font-black text-neutral-950 uppercase tracking-tight group-hover:text-[#ff3b30] transition leading-snug truncate">
                    {preview.title}
                  </h4>

                  {preview.subtitle && (
                    <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                      {preview.subtitle}
                    </p>
                  )}

                  {/* Spec Pills (Vehicle HP, Class, etc.) */}
                  {preview.details && preview.details.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {preview.details.map((detail, dIdx) => (
                        <span
                          key={dIdx}
                          className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md text-[10px] font-bold text-neutral-800 font-mono shadow-2xs"
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer URL / CTA */}
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-200/60">
                  <span className="truncate flex items-center gap-1">
                    <span className="text-[#ff3b30]">🔗</span>
                    <span className="font-bold text-neutral-700">{preview.domain}</span>
                  </span>
                  <span className="text-[#ff3b30] font-black uppercase text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
