export type ItemStatus = 'Draft' | 'Photographed' | 'Listed' | 'Sold';

export type ItemCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Parts Only';

export type ItemCategory = 
  | 'Engine & Drivetrain'
  | 'Suspension & Brakes'
  | 'Wheels & Tires'
  | 'Electronics & Telemetry'
  | 'Body & Aerodynamics'
  | 'Hardware & Fasteners'
  | 'Tools & Equipment'
  | 'Apparel & Safety'
  | 'Accessories'
  | 'Other';

export type TransformationCategory = 
  | 'Initial Survey' 
  | 'Work in Progress' 
  | 'Major Sale Milestone' 
  | 'Scrap & Recycling' 
  | 'Final Clean Bay';

export interface GarageLocation {
  zone_id?: string;
  zone_name?: string;
  shelf?: string;
  bin_id?: string;
}

export interface GarageItem {
  id: string;
  garage_id?: string;
  owner_uid: string;
  title: string;
  category: ItemCategory;
  condition: ItemCondition;
  description?: string;
  specs?: string;
  
  cost_price: number;
  list_price: number;
  sale_price?: number;
  
  status: ItemStatus;
  
  serial_number?: string;
  replacement_value?: number;
  is_insured?: boolean;
  insurance_policy_notes?: string;

  photos?: string[];
  primary_photo_url?: string;
  
  location?: GarageLocation;
  
  qr_code_tag?: string;
  
  created_at: string;
  updated_at: string;
  sold_at?: string;
}

export interface GarageTransformationMilestone {
  id: string;
  garage_id?: string;
  owner_uid: string;
  title: string;
  category: TransformationCategory;
  date_str: string;
  notes?: string;
  items_sold_count?: number;
  items_scrapped_count?: number;
  items_discarded_count?: number;
  items_kept_count?: number;
  cash_recovered?: number;
  photos?: string[];
  created_at: string;
}

export interface GarageZone {
  id: string;
  garage_id: string;
  owner_uid: string;
  name: string;
  shelves?: string[];
  bins?: string[];
  description?: string;
  created_at: string;
}

export interface GarageSpaceConfig {
  id?: string;
  owner_uid: string;
  name: string;
  length_ft: number;
  width_ft: number;
  total_sqft: number;
  notes?: string;
  updated_at?: string;
}

export interface GarageSale {
  id: string;
  garage_id?: string;
  owner_uid: string;
  item_id: string;
  item_title: string;
  sale_price: number;
  platform?: string;
  buyer_notes?: string;
  sold_at: string;
}
