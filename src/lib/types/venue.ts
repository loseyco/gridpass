export type VenueType = 'racetrack' | 'waterway' | 'offroad_park' | 'event_center';

export interface VenuePOI {
  name: string;
  type: 'dock' | 'launch' | 'fuel' | 'pit_lane' | 'paddock' | 'gate' | 'trailhead' | 'campsite' | 'vendor' | 'parking';
  location: string;
  fee?: string;
  amenities?: string[];
}

export interface VenueHazard {
  name: string;
  type: 'submerged_cable' | 'no_wake' | 'shallow' | 'rocks' | 'noise_limit' | 'danger_zone';
  description: string;
  location?: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  type: VenueType;
  pit_status?: 'Green Flag' | 'Yellow Flag' | 'Red Flag'; // Racetrack/Offroad
  gate_status?: 'Open' | 'Closed'; // Event / general
  active_sessions?: Array<{ name: string; time: string }>;
  pois: VenuePOI[];
  hazards: VenueHazard[];
  rules: Array<{ title: string; desc: string }>;
  occupancy: { current: number; max: number };
}

export interface VenueSpot {
  id: string;
  venue_id: string;
  name: string;
  latitude: number;
  longitude: number;
  features: string[]; // e.g. ['dock', 'fuel', 'food', 'beach', 'sandbar', 'hazard']
  notes: Array<{ user: string; text: string; timestamp: string }>;
  photo_urls?: string[];
  hours?: string;
  status: 'active' | 'reported_closed' | 'verified';
  business_id?: string; // Optional link to verified B2B storefront
  created_at: string;
  updated_at: string;
}

export interface FriendBeacon {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  latitude: number;
  longitude: number;
  speed?: number; // mph
  heading?: number; // degrees
  updated_at: string;
  status: 'active' | 'ghost';
}
