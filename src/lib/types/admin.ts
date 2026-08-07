export interface MemberUser {
  uid: string;
  display_name: string;
  email: string;
  photo_url?: string;
  phone?: string;
  bio?: string;
  avatar_color?: string;
  is_gold?: boolean;
  role?: 'member' | 'business_owner' | 'admin';
  can_sell?: boolean; // UpfittersOS-style sales permission matrix flag
  sales_role?: 'sales_rep' | 'sales_manager' | 'account_exec';
  invite_token?: string;
  invite_status?: 'pending' | 'accepted';
  vehicles_count?: number;
  joined_date?: string;
}

export interface AgentTicket {
  id: string;
  ticket_number: string;
  agent_role: 'architect' | 'site_auditor' | 'mobile_expert' | 'financial_expert' | 'traffic_expert' | 'git_expert' | 'tester' | 'aiseo_expert' | 'gm';
  title: string;
  category: 'architecture' | 'ui_design' | 'mobile_touch' | 'seo' | 'security' | 'testing' | 'feature' | 'database';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  components_used: string[];
  files_modified: string[];
  schema_changes?: string[];
  sop_summary: string;
  sop_steps: string[];
  created_at: string;
  updated_at?: string;
}

export interface SOPGuide {
  id: string;
  slug: string;
  title: string;
  category: string;
  author_agent: string;
  description: string;
  prerequisites: string[];
  steps: string[];
  code_snippets?: { title: string; language: string; code: string }[];
  components_referenced: string[];
  created_at: string;
}

export type StagingClass =
  | 'stock'
  | 'modified'
  | 'track_weapon'
  | 'show_car'
  | 'fleet'
  | 'craft'
  | 'venue_shuttle'
  | 'pev_micromobility'
  | 'vendor_unit';

export interface GarageVehicle {
  id: string;
  owner_id: string;
  owner_name?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  photo_url?: string;
  qr_tag_id?: string;
  tag_id?: string;
  staging_class?: StagingClass;
  vin_verified?: boolean;
  vin_verified_at?: string | null;
  is_hidden?: boolean;
  archived?: boolean;
  archived_at?: string | null;
  archived_by?: string | null;
  service_logs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminSystemStats {
  total_members: number;
  total_vehicles: number;
  total_events: number;
  total_businesses: number;
  total_mrr: number;
  total_scans: number;
}

export type FeatureStatus = 'idea' | 'planned' | 'in_progress' | 'alpha' | 'beta' | 'live' | 'deprecated';
export type FeatureCategory = 'core' | 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue';
export type FeatureAccessLevel = 'public' | 'members' | 'gold' | 'business_owners' | 'admins_only';
export type SaaSPlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface FeatureNote {
  id: string;
  author: string;
  created_at: string;
  content: string;
}

export interface FeatureBug {
  id: string;
  reported_by: string;
  created_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolved: boolean;
}

export interface FeatureWish {
  id: string;
  requested_by: string;
  created_at: string;
  title: string;
  description?: string;
  status: 'idea' | 'planned' | 'approved' | 'shipped';
  wanted_count?: number;
}

export interface AdminFeature {
  id: string;
  name: string;
  category: FeatureCategory;
  status: FeatureStatus;
  version: string;
  wanted_count?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  notes?: FeatureNote[];
  bugs?: FeatureBug[];
  wishes?: FeatureWish[];
  created_at: string;
  // Feature Page Controller Fields
  route_path?: string; // e.g. '/admin/users'
  is_page_live?: boolean; // Controls if feature/page is live
  is_sellable?: boolean; // Can be actively sold to clients right now
  access_level?: FeatureAccessLevel; // Who can see it
  last_updated_at?: string; // Last code/feature update date
  maintenance_notice?: string; // Displayed if page is offline/maintenance
  // Modular SaaS Package Integration
  module_key?: string; // e.g. 'service_history_sync', 'digital_waivers'
  is_saas_module?: boolean; // Can be enabled/sold to business clients
  saas_addon_price?: number; // Monthly price when added a la carte
  pricing_model?: 'free' | 'monthly' | 'one_time' | 'commission_split' | 'custom_quote';
  requirements?: string; // Detailed functional specs of what the feature needs to do
  included_in_tiers?: SaaSPlanTier[]; // Tiers that include this feature
}

// Simplified Internal CRM Sales & Lead Pipeline Types
export type CrmDealStage = 'new_lead' | 'contacted' | 'meeting' | 'proposal_sent' | 'closed_won' | 'closed_lost';
export type CrmInteractionType = 'call' | 'sms' | 'in_person' | 'meeting' | 'email' | 'demo' | 'note';

export interface CrmInteraction {
  id: string;
  author: string;
  created_at: string;
  type: CrmInteractionType;
  content: string;
}

export interface CrmDeal {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  stage: CrmDealStage;
  assigned_rep: string; // Person managing the lead e.g. "Zach", "PJ"
  notes?: string; // Simple lead notes
  notes_history?: CrmInteraction[];
  last_contact_date?: string;
  created_at: string;
}
