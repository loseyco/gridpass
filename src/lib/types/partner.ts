export type RequestCategory = 'feature_request' | 'bug_report' | 'client_customization' | 'sales_blocker';
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestStatus = 'backlog' | 'in_review' | 'in_progress' | 'deployed' | 'closed';

export interface PartnerRequest {
  id: string;
  created_at: string;
  created_by: string; // Email or name of co-founder/partner
  client_id?: string;
  client_name?: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  estimated_mrr_impact?: number;
  status: RequestStatus;
  dev_notes?: string;
  target_release?: string;
}

export interface SalesQuoteConfig {
  client_name: string;
  vertical: 'auto_shop' | 'race_team' | 'food_truck' | 'track_venue' | 'car_club';
  base_tier: 'starter' | 'pro' | 'enterprise';
  selected_modules: string[];
  billing_cycle: 'monthly' | 'annual';
  custom_discount_percent: number;
}
