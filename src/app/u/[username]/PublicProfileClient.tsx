'use client'

import Link from 'next/link'
import { Globe, Instagram, Twitter, Youtube, Linkedin, Video, Facebook, Briefcase, Car, Layers, Printer } from 'lucide-react'
import VehicleCard from '@/components/profile/VehicleCard'
import { Vehicle } from '@/types/garage'

interface PublicProfileClientProps {
  profile: any
  isVerified: boolean
  isOwner: boolean
  career: any[]
  skills: string[]
  mediaItems: any[]
  recommendations: any[]
  vehicles: Vehicle[]
  collections: any[]
  ownedOrgs?: any[]
}

export default function PublicProfileClient({
  profile,
  isVerified,
  isOwner,
  career,
  skills,
  mediaItems,
  recommendations,
  vehicles,
  collections,
  ownedOrgs = []
}: PublicProfileClientProps) {
  return (
    <>
      <div className="v2-header-container">
        {/* Immersive Header Background */}
        <div className="profile-hero">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
          {profile.cover_url && <img src={profile.cover_url} className="hero-image" alt="Cover" />}
        </div>

        <div className="v2-content profile-content">
          {/* Driver Card */}
          <div className="v2-card driver-card">

            <div className="driver-header">
              <div className="driver-avatar-container">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username || 'User'} className="driver-avatar" />
                ) : (
                  <div className="driver-avatar-placeholder">
                    {profile.username?.[0]?.toUpperCase()}
                  </div>
                )}
                {/* Validated Verification Badge */}
                <div className={`driver-badge ${isVerified ? 'verified-active' : 'verified-inactive'}`} title={isVerified ? "Verified Profile" : "Unverified Profile"}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={isVerified ? "white" : "#666"} />
                  </svg>
                </div>
              </div>
            </div>

            <div className="driver-info">
              <h1 className="driver-name">
                {profile.full_name || profile.username}
              </h1>
              <p className="driver-handle">@{profile.username}</p>

              {/* Location Info - Small */}
              {(profile.logistics_info?.hometown || profile.logistics_info?.home_airport) && (
                <div className="driver-location">
                  {profile.logistics_info?.hometown && (
                    <span className="location-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {profile.logistics_info.hometown}
                    </span>
                  )}
                  {profile.logistics_info?.home_airport && (
                    <span className="location-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                      </svg>
                      {profile.logistics_info.home_airport}
                    </span>
                  )}
                </div>
              )}

              {/* Roles / Badges */}
              <div className="v2-badges v2-mt-2 v2-flex v2-gap-2 v2-flex-wrap">
                {profile.job_preferences?.is_open_to_work && (
                  <span className="v2-badge" style={{ background: 'rgba(46, 164, 79, 0.2)', borderColor: '#2ea44f', color: '#2ea44f' }}>
                    Open To Work
                  </span>
                )}
                {profile.role === 'founder' && (
                  <span className="v2-badge v2-badge-gold">
                    Founder
                  </span>
                )}
                {profile.role === 'superadmin' && (
                  <span className="v2-badge v2-badge-red">
                    The Founder
                  </span>
                )}
                {(!profile.role || (profile.role !== 'founder' && profile.role !== 'superadmin')) && (
                  <span className="v2-badge v2-badge-blue">
                    Member
                  </span>
                )}
              </div>




              {/* Social Telemetry */}
              <div className="social-grid">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-pill" title="Website">
                    <Globe size={16} />
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" className="social-pill" title="Instagram">
                    <Instagram size={16} />
                  </a>
                )}
                {profile.social_links?.twitter && (
                  <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="social-pill" title="Twitter / X">
                    <Twitter size={16} />
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="social-pill" title="LinkedIn">
                    <Linkedin size={16} />
                  </a>
                )}
                {profile.social_links?.youtube && (
                  <a href={profile.social_links.youtube} target="_blank" rel="noopener noreferrer" className="social-pill" title="YouTube">
                    <Youtube size={16} />
                  </a>
                )}
                {profile.social_links?.tiktok && (
                  <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="social-pill" title="TikTok">
                    {/* Custom TikTok Icon or Video fallback */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </a>
                )}
                {profile.social_links?.facebook && (
                  <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="social-pill" title="Facebook">
                    <Facebook size={16} />
                  </a>
                )}
                {profile.social_links?.indeed && (
                  <a href={profile.social_links.indeed} target="_blank" rel="noopener noreferrer" className="social-pill" title="Indeed">
                    <Briefcase size={16} />
                  </a>
                )}
              </div>
            </div>



            {/* Pit Wall Controls */}

            <div className="pit-wall-controls" style={{ flexDirection: 'column' }}>
              {isOwner ? (
                <Link href="/profile/edit" className="v2-btn v2-btn-primary v2-btn-full v2-justify-center">
                  Edit Profile
                </Link>
              ) : (
                <div className="v2-flex v2-flex-col v2-gap-2 v2-w-full">
                  <button
                    onClick={() => window.print()}
                    className="v2-btn v2-btn-secondary v2-btn-full v2-justify-center"
                  >
                    <Printer size={18} className="v2-mr-2" />
                    Save as PDF
                  </button>
                  <button className="v2-btn v2-btn-primary v2-btn-full v2-justify-center" disabled>
                    Contact (Coming Soon)
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Bio and Skills (New Layout) */}
          {/* Bio */}
          {profile.bio && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Bio</h2>
              </div>
              <p className="driver-bio-large">{profile.bio}</p>
            </section>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Skills</h2>
              </div>
              <div className="skills-grid">
                {skills.map((skill: string, idx: number) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </section>
          )}

          {/* Garage / Vehicles */}
          {vehicles && vehicles.length > 0 && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Garage</h2>
                <span className="section-count">{vehicles.length}</span>
              </div>
              <div className="vehicle-grid">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} readOnly={true} />
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {collections && collections.length > 0 && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Collections</h2>
                <span className="section-count">{collections.length}</span>
              </div>
              <div className="v2-list">
                {collections.map((collection, idx) => (
                  <div key={idx} className="v2-card v2-flex v2-items-center v2-gap-4 v2-mb-2 cursor-default">
                    <div className="v2-bg-secondary v2-p-3 rounded-lg">
                      <Layers className="v2-text-accent" size={24} />
                    </div>
                    <div>
                      <h3 className="v2-heading-3 v2-mb-0">{collection.name}</h3>
                      <p className="v2-text-secondary v2-text-sm">{collection.description || 'No description'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Media Gallery */}
          {mediaItems && mediaItems.length > 0 && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Gallery</h2>
              </div>
              <div className="media-scroll-container">
                {mediaItems.map((item: any) => (
                  <div key={item.id} className="media-item">
                    {item.type === 'video' ? (
                      <video src={item.url} className="media-content" controls />
                    ) : (
                      <img src={item.url} alt={item.caption || 'Gallery image'} className="media-content" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Career History */}
          {career && career.length > 0 && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Career</h2>
              </div>
              <div className="v2-list">
                {career.map((entry: any, idx: number) => (
                  <div key={idx} className="v2-card v2-mb-4">
                    <div className="career-header">
                      <h3 className="v2-heading-3 v2-text-white">{entry.title || entry.position}</h3>
                      <span className="career-period">{entry.period || `${entry.start_date} - ${entry.end_date || 'Present'}`}</span>
                    </div>
                    {entry.company && (
                      <p className="v2-text-tertiary v2-font-bold v2-mb-2">{entry.company}</p>
                    )}
                    {entry.description && (
                      <p className="v2-text-secondary v2-text-sm v2-leading-normal">{entry.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}





          {/* Gear & Physical Stats */}
          {(profile.physical_info?.helmet_size || profile.physical_info?.suit_size || profile.physical_info?.shoe_size) && (
            <section className="v2-section">
              <div className="v2-section-header">
                <h2 className="v2-heading-2">Gear & Physical Stats</h2>
              </div>
              <div className="v2-card">
                <div className="gear-grid">
                  {profile.physical_info?.helmet_size && (
                    <div className="gear-stat">
                      <div className="gear-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="10" r="8" />
                          <path d="M12 18c-2.21 0-4-1.79-4-4V10" />
                        </svg>
                      </div>
                      <div className="gear-label">Helmet</div>
                      <div className="gear-value">{profile.physical_info.helmet_size}</div>
                    </div>
                  )}
                  {profile.physical_info?.suit_size && (
                    <div className="gear-stat">
                      <div className="gear-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2c3 0 5 2 5 5v4h2v10H5V11h2V7c0-3 2-5 5-5z" />
                        </svg>
                      </div>
                      <div className="gear-label">Suit</div>
                      <div className="gear-value">{profile.physical_info.suit_size}</div>
                    </div>
                  )}
                  {profile.physical_info?.shoe_size && (
                    <div className="gear-stat">
                      <div className="gear-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 18v-1c0-3.87 3.13-7 7-7h6c3.87 0 7 3.13 7 7v1" />
                          <ellipse cx="9" cy="20" rx="3" ry="2" />
                          <ellipse cx="15" cy="20" rx="3" ry="2" />
                        </svg>
                      </div>
                      <div className="gear-label">Shoes</div>
                      <div className="gear-value">{profile.physical_info.shoe_size}</div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Recommendations */}
          <section className="v2-section">
            <div className="v2-section-header">
              <h2 className="v2-heading-2">Recommendations</h2>
            </div>
            {recommendations && recommendations.length > 0 ? (
              <div className="v2-list">
                {recommendations.slice(0, 3).map((rec: any) => (
                  <div key={rec.id} className="v2-card v2-mb-4">
                    <div className="rec-header">
                      <div className="rec-author">
                        {rec.from_profile?.avatar_url ? (
                          <img src={rec.from_profile.avatar_url} alt={rec.from_profile.full_name} className="rec-avatar" />
                        ) : (
                          <div className="rec-avatar-placeholder">
                            {(rec.from_profile?.full_name || rec.author_name || 'G')?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="rec-author-info">
                          <div className="rec-author-name">
                            {rec.from_profile?.full_name || rec.author_name || 'Guest User'}
                          </div>
                          {rec.from_profile?.username ? (
                            <div className="rec-author-username">@{rec.from_profile.username}</div>
                          ) : (
                            <div className="rec-author-username">Verified Guest</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="v2-text-secondary v2-italic">"{rec.content}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="v2-card v2-text-center v2-py-8">
                <p className="v2-text-secondary">No recommendations yet.</p>
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
        .v2-header-container {
            position: relative;
        }

        .profile-hero {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 280px;
            overflow: hidden;
            z-index: 0;
        }

        .hero-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.5;
        }

        .hero-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, 
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0.2) 60%, 
                rgba(5,5,5,1) 100%
            );
            z-index: 2;
        }

        .hero-pattern {
            position: absolute;
            inset: 0;
            background-image: radial-gradient(var(--v2-border) 1px, transparent 1px);
            background-size: 20px 20px;
            opacity: 0.3;
            z-index: 1;
        }

        .profile-nav {
            background: transparent !important;
            border: none !important;
            backdrop-filter: none !important;
        }

        .profile-content {
            margin-top: 40px;
        }

        /* Driver Card Styles */
        .driver-card {
            padding: 0;
            overflow: visible;
            margin-bottom: var(--v2-space-5);
        }

        .driver-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 20px;
            position: relative;
            margin-top: -60px;
        }

        .driver-number {
             font-family: var(--v2-font-racing);
             font-size: 4rem;
             line-height: 0.8;
             font-weight: 900;
             color: rgba(255,255,255,0.15);
             font-style: normal;
             position: absolute;
             left: 20px;
             bottom: 20px;
             z-index: 0;
         }

        .driver-rank {
             font-family: var(--v2-font-racing);
             font-size: 3rem;
             line-height: 0.8;
             font-weight: 900;
             color: transparent;
             -webkit-text-stroke: 1px rgba(255,255,255,0.15);
             font-style: normal;
             position: absolute;
             right: 20px;
             bottom: 20px;
             z-index: 0;
         }

        .driver-avatar-container {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid var(--v2-bg-card);
            position: relative;
            z-index: 10;
            margin: 0 auto;
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.8);
        }

        .driver-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }

        .driver-avatar-placeholder {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            font-weight: 900;
            color: white;
            font-family: var(--v2-font-racing);
            background: var(--v2-accent-primary);
        }

        .driver-badge {
            position: absolute;
            bottom: 5px;
            right: 5px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid var(--v2-bg-card);
        }

        .verified-active {
            background: var(--v2-accent-primary);
        }

        .verified-inactive {
            background: rgba(255,255,255,0.1);
            border-color: rgba(255,255,255,0.1);
        }

        .driver-info {
            text-align: center;
            padding: 0 20px 20px;
            position: relative;
            z-index: 2;
        }

        .driver-name {
             font-family: var(--v2-font-racing);
             font-size: 2rem;
             line-height: 1;
             font-style: normal;
             text-transform: uppercase;
             margin: 0;
             text-shadow: 0 4px 12px rgba(0,0,0,0.5);
             color: white;
         }

        .driver-handle {
            color: var(--v2-text-secondary);
            font-family: monospace;
            margin-top: 4px;
            font-size: 0.9rem;
            opacity: 0.7;
        }

        .driver-location {
            display: flex;
            gap: 1rem;
            margin-top: 8px;
            justify-content: center;
        }

        .location-item {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.8rem;
            color: var(--v2-text-tertiary);
        }

        .location-item svg {
            opacity: 0.6;
        }

        .driver-bio {
            margin-top: 12px;
            color: var(--v2-text-primary);
            font-size: 0.95rem;
            line-height: 1.5;
            opacity: 0.9;
        }

        .driver-bio-large {
            font-size: 1.1rem;
            line-height: 1.6;
            color: var(--v2-text-primary);
            max-width: 600px;
            margin: 0 auto;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .social-grid {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
        }

        .social-pill {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: var(--v2-text-secondary);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            text-decoration: none;
            transition: all 0.2s;
        }

        .social-pill:hover {
            background: var(--v2-accent-primary);
            border-color: var(--v2-accent-primary);
            color: white;
            transform: translateY(-2px);
        }



        .pit-wall-controls {
            padding: 20px;
            display: flex;
            gap: 10px;
        }

        /* Sections and Grids */
        .vehicle-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .media-scroll-container {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            padding-bottom: 1rem;
            -webkit-overflow-scrolling: touch;
        }

        /* Hide scrollbar for cleaner look but keep functionality */
        .media-scroll-container::-webkit-scrollbar {
            height: 6px;
        }
        
        .media-scroll-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .media-scroll-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        @media (max-width: 400px) {
            .vehicle-grid {
                grid-template-columns: 1fr;
            }
        }

        .media-item {
            flex: 0 0 280px;
            scroll-snap-align: start;
            border-radius: var(--v2-radius-md);
            overflow: hidden;
            border: 1px solid var(--v2-glass-border);
            aspect-ratio: 16/9;
            position: relative;
        }

        .media-content {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .career-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }

        .career-period {
            font-size: 0.75rem;
            color: var(--v2-text-tertiary);
            font-family: monospace;
        }

        .vehicle-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }

        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .skill-tag {
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--v2-border);
            border-radius: 20px;
            font-size: 0.85rem;
            color: white;
            font-weight: 600;
        }

        .section-count {
            background: var(--v2-bg-elevated);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.75rem;
            color: var(--v2-text-secondary);
            font-weight: 700;
        }



        .rec-header {
             display: flex;
             align-items: center;
             gap: 1rem;
             margin-bottom: 1rem;
        }

        .rec-avatar, .rec-avatar-placeholder {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid var(--v2-border);
        }

        .rec-avatar-placeholder {
            background: var(--v2-bg-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
        }

        .rec-author-name {
            font-weight: 700;
            color: white;
            font-size: 0.9rem;
        }

        .rec-author-username {
            font-size: 0.8rem;
            color: var(--v2-text-tertiary);
        }

        .gear-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1.5rem;
        }

        .gear-stat {
            text-align: center;
        }

        .gear-icon {
            background: rgba(227, 30, 36, 0.08);
            border: 1px solid rgba(227, 30, 36, 0.15);
            border-radius: 12px;
            width: 56px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.75rem;
            color: var(--v2-accent-primary);
        }

        .gear-label {
            font-size: 0.7rem;
            color: var(--v2-text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.25rem;
            font-weight: 600;
        }

        .gear-value {
            font-size: 1.1rem;
            color: white;
            font-weight: 700;
        }
        `}</style>
      </div>
    </>
  )
}
