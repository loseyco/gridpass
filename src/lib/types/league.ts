export type LeagueGame = "iracing" | "assetto_corsa" | "acc" | "automobilista2";
export type LeagueStatus = "recruiting" | "in_progress" | "completed" | "archived";
export type RoundStatus = "scheduled" | "qualifying" | "racing" | "completed" | "postponed";
export type ProtestStatus = "submitted" | "under_review" | "penalty_applied" | "dismissed";

export interface SRLeague {
  id: string;
  name: string;
  short_name?: string;
  slug: string;
  tagline?: string;
  description?: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email?: string;
  banner_url?: string;
  logo_url?: string;
  game?: LeagueGame;
  discord_url?: string;
  rules_url?: string;
  website_url?: string;
  custom_domain?: string;
  iracing_league_id?: string | number; // e.g. 25
  total_drivers: number;
  total_seasons: number;
  active_season_id: string;
  car_classes?: string[];
  is_public: boolean;
  featured?: boolean;
  created_at: number;
  updated_at: number;
}

export interface SRLeagueSeries {
  id: string;
  league_id: string;
  name: string;
  short_name?: string;
  description?: string;
  banner_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  game?: LeagueGame;
  car_classes?: string[];
  status?: LeagueStatus;
  points_system?: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
    p6: number;
    p7: number;
    p8: number;
    p9: number;
    p10: number;
    fastest_lap?: number;
    pole_position?: number;
  };
  drop_weeks?: number;
  incident_limit_drive_through?: number;
  incident_limit_dq?: number;
  rounds_count?: number;
  total_drivers?: number;
  teams_enabled?: boolean;
  active_season_id?: string;
  is_archived?: boolean;
  archived_at?: number | null;
  created_at: number;
  updated_at?: number;
}

export interface SRLeagueSeason {
  id: string;
  league_id: string;
  series_id: string;
  name: string;
  season_number: number;
  status: LeagueStatus;
  description?: string;
  banner_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  drop_weeks?: number;
  incident_limit_dq?: number;
  rounds_count?: number;
  total_drivers?: number;
  
  // Season Blueprint Defaults (Pre-fills round scheduling)
  default_car_model?: string;
  default_race_day?: string;
  default_race_time?: string;
  default_timezone?: string;
  default_practice_minutes?: number;
  default_qualifying_minutes?: number;
  default_race_length_type?: "minutes" | "laps";
  default_race_length_value?: number;
  default_start_type?: "standing" | "rolling";
  default_fixed_setup?: boolean;
  default_fast_repairs?: number;
  default_server_region?: string;
  default_server_password?: string;
  is_league_session_default?: boolean;
  entry_fee?: number;
  prize_pool?: string;

  created_at: number;
  updated_at?: number;
}

export interface SRLeagueRound {
  id: string;
  league_id: string;
  season_id: string;
  round_number: number;
  title: string;
  track_name: string;
  track_layout: string;
  car_model?: string;
  scheduled_date: string;
  server_start_time?: string;
  is_league_session?: boolean;
  server_region?: string;
  server_password?: string;
  admin_name?: string;
  practice_minutes?: number;
  qualifying_minutes: number;
  race_length_type: "minutes" | "laps";
  race_length_value: number;
  start_type?: "rolling" | "standing";
  restart_type?: "double_file_back" | "single_file";
  fixed_setup?: boolean;
  fast_repairs?: number;
  incident_limit_dq?: number;
  max_drivers?: number;
  full_course_yellows?: boolean;
  lucky_dog?: boolean;
  wave_arounds?: boolean;
  weather_temp_f: number;
  weather_sky: "clear" | "partly_cloudy" | "overcast" | "dynamic_rain";
  cloud_cover?: "clear" | "partly_cloudy" | "mostly_cloudy" | "overcast";
  track_moisture?: "none" | "light" | "moderate" | "heavy";
  hardcore_aids?: string;
  status: RoundStatus;
  winner_name?: string;
  pole_sitter_name?: string;
  fastest_lap_name?: string;
  fastest_lap_time?: string;
  created_at?: number;
}

export interface SRLeagueDriver {
  id: string;
  league_id: string;
  user_id?: string;
  driver_name: string;
  iracing_custid?: string;
  car_number: string;
  car_class: string;
  car_model: string;
  team_name?: string;
  team_logo_url?: string;
  i_rating: number;
  safety_rating: string;
  points_total: number;
  penalty_points: number;
  wins_count: number;
  podiums_count: number;
  poles_count: number;
  dnfs_count: number;
  incidents_total: number;
  rig_id?: string;
  webrtc_camera_url?: string;
  status: "active" | "standby" | "banned";
  created_at: number;
}

export interface SRLeagueTeam {
  id: string;
  league_id: string;
  team_name: string;
  logo_url?: string;
  primary_color: string;
  drivers_count: number;
  points_total: number;
  team_manager?: string;
}

export interface SRLeagueProtest {
  id: string;
  league_id: string;
  round_id: string;
  submitting_driver_name: string;
  accused_driver_name: string;
  incident_lap: number;
  incident_turn: string;
  description: string;
  replay_timestamp_s: number;
  status: ProtestStatus;
  steward_notes?: string;
  penalty_awarded?: string;
  created_at: number;
  resolved_at?: number;
}

export interface SRLeagueBroadcastOverlayConfig {
  league_id: string;
  theme: "f1_dark" | "imsa_modern" | "gt_world" | "clean_minimal";
  active_widgets: {
    timing_tower: boolean;
    track_map: boolean;
    battle_box_pip: boolean;
    driver_inputs_telemetry: boolean;
    sponsor_lower_thirds: boolean;
    race_flags_ticker: boolean;
    driver_cockpit_cams: boolean;
  };
  battle_driver_a_id?: string;
  battle_driver_b_id?: string;
  active_flag: "GREEN" | "YELLOW" | "FCY" | "SAFETY_CAR" | "RED" | "CHECKERED";
  sponsor_ticker_items: string[];
  obs_browser_source_url: string;
  updated_at: number;
}
