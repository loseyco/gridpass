export interface BusinessModules {
  service_history_sync?: boolean;
  photo_inspection?: boolean;
  sms_notifications?: boolean;
  digital_waivers?: boolean;
  marshall_grid_scanner?: boolean;
  pit_crew_badges?: boolean;
  live_location_radar?: boolean;
  queue_loyalty?: boolean;
  vip_ticketing?: boolean;
}

export interface BusinessSubscription {
  tier: 'starter' | 'pro' | 'enterprise';
  mrr: number;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'demo' | 'past_due';
}

export interface BusinessProfile {
  id: string; // URL Slug, e.g. "nielsens" or "blarney-island"
  owner_uid: string; // The member UID managing this business
  owner_id?: string; // Optional alias for Firestore queries
  name: string; // e.g., "Nielsen Enterprises", "Blarney Island"
  description: string;
  category: 'dealership' | 'track_venue' | 'club_organizer' | 'shop_garage' | 'food_truck' | 'race_team';
  vertical?: 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue' | 'car_club';
  logo_url?: string;
  banner_url?: string;
  
  // Contact & Location
  location_name: string;
  physical_address?: string;
  website_url?: string;
  contact_email?: string;
  
  // Sponsored Assets / Inventory
  sponsored_vehicles?: string[]; // Array of vehicle_ids
  
  // Custom Metadata
  services?: string; // Comma-separated list of services, e.g. "detail, wrap, tint"

  // Modular SaaS Entitlements & Subscription
  enabled_modules?: BusinessModules;
  subscription?: BusinessSubscription;
  branding?: {
    accent_color?: string;
    logo_url?: string;
    custom_tagline?: string;
  };
}

