export type NewsCategory =
  | 'open_wheel'
  | 'sportscar'
  | 'stock_car'
  | 'motocross_supercross'
  | 'flat_track'
  | 'dirt'
  | 'grassroots_club'
  | 'autocross_timeattack'
  | 'drifting'
  | 'offroad_rally'
  | 'motorcycles'
  | 'rc_racing'
  | 'drag'
  | 'sim_racing'
  | 'car_shows'
  | 'track_culture'
  | 'car_builds'
  | 'business'
  | 'food_trucks'
  | 'vendors_merch'
  | 'jobs_gigs'
  | 'parts_classifieds';

export const NEWS_CATEGORIES: { id: NewsCategory; label: string; icon: string }[] = [
  // Community & Marketplace
  { id: 'car_builds', label: 'Garage Projects & Car Builds', icon: '🛠️' },
  { id: 'business', label: 'Speed Shops & Businesses', icon: '🏢' },
  { id: 'food_trucks', label: 'Food Trucks & Catering', icon: '🍔' },
  { id: 'vendors_merch', label: 'Trackside Vendors & Merch', icon: '🎪' },
  { id: 'jobs_gigs', label: 'Looking for Crew & Jobs', icon: '💼' },
  { id: 'parts_classifieds', label: 'Parts & Classifieds', icon: '🏷️' },

  // Motorsport Disciplines
  { id: 'stock_car', label: 'NASCAR & Stock Car', icon: '🚗' },
  { id: 'open_wheel', label: 'IndyCar & F1', icon: '🏎️' },
  { id: 'sportscar', label: 'IMSA & Sports Car', icon: '🏁' },
  { id: 'grassroots_club', label: 'SCCA, NASA & Club Racing', icon: '🏁' },
  { id: 'motocross_supercross', label: 'AMA Supercross & MX', icon: '🏍️' },
  { id: 'flat_track', label: 'American Flat Track (AFT)', icon: '🏁' },
  { id: 'dirt', label: 'Grassroots Dirt & Outlaws', icon: '💨' },
  { id: 'autocross_timeattack', label: 'SCCA Autocross & Time Attack', icon: '⏱️' },
  { id: 'drifting', label: 'Formula DRIFT & Grassroots', icon: '🔥' },
  { id: 'offroad_rally', label: 'Baja, Rally & Off-Road', icon: '🚙' },
  { id: 'rc_racing', label: 'RC Racing (ROAR & IFMAR)', icon: '🕹️' },
  { id: 'motorcycles', label: 'MotoAmerica & MotoGP', icon: '🏍️' },
  { id: 'drag', label: 'NHRA & Drag Racing', icon: '🚦' },
  { id: 'sim_racing', label: 'Sim Racing & Esports', icon: '🎮' },
  { id: 'car_shows', label: 'Car Shows & Meets', icon: '✨' },
  { id: 'track_culture', label: 'HPDE & Track Days', icon: '⏱️' },
];

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  car_builds: 'Garage Projects & Car Builds',
  business: 'Speed Shops & Businesses',
  food_trucks: 'Food Trucks & Catering',
  vendors_merch: 'Trackside Vendors & Merch',
  jobs_gigs: 'Looking for Crew & Jobs',
  parts_classifieds: 'Parts & Classifieds',
  stock_car: 'NASCAR & Stock Car',
  open_wheel: 'IndyCar & F1',
  sportscar: 'IMSA & Sports Car',
  grassroots_club: 'SCCA, NASA & Club Racing',
  motocross_supercross: 'AMA Supercross & MX',
  flat_track: 'American Flat Track (AFT)',
  dirt: 'Grassroots Dirt & Outlaws',
  autocross_timeattack: 'SCCA Autocross & Time Attack',
  drifting: 'Formula DRIFT & Grassroots',
  offroad_rally: 'Baja, Rally & Off-Road',
  rc_racing: 'RC Racing (ROAR & IFMAR)',
  motorcycles: 'MotoAmerica & MotoGP',
  drag: 'NHRA & Drag Racing',
  sim_racing: 'Sim Racing & Esports',
  car_shows: 'Car Shows & Meets',
  track_culture: 'HPDE & Track Days',
};

export interface NewsComment {
  id: string;
  article_id: string;
  user_id?: string | null;
  author_name: string;
  author_avatar?: string | null;
  author_username?: string | null;
  is_verified_driver: boolean;
  content: string;
  photo_url?: string | null;
  likes_count: number;
  created_at: string;
}

export interface TracksideAttendance {
  id: string;
  article_id: string;
  article_slug: string;
  article_title: string;
  user_id: string;
  user_name: string;
  user_username: string;
  user_avatar?: string | null;
  attended_at: string;
}

export type PaddockEntityType = 'series' | 'team' | 'driver' | 'venue' | 'network';

export interface PaddockEntityRef {
  type: PaddockEntityType;
  name: string;
  slug: string;
  image_url?: string;
  passport_url?: string; // Optional crossover to Gridpass /u/[id] or /biz/[id]
  bio?: string;
  category?: NewsCategory;
  discipline?: string;
  official_website?: string;
  location?: string;
  country?: string;
  followers_count?: number;
}

export interface ArticleUpdate {
  id: string;
  title?: string;
  content: string;
  timestamp: string;
  author?: string;
  source_url?: string;
}

export const ENTITY_TYPE_LABELS: Record<PaddockEntityType, { label: string; icon: string; badgeColor: string }> = {
  series: { label: 'Championship Series', icon: '🏆', badgeColor: 'bg-neutral-900 text-white' },
  team: { label: 'Racing Team', icon: '🏎️', badgeColor: 'bg-neutral-900 text-white' },
  driver: { label: 'Driver / Pilot', icon: '🏁', badgeColor: 'bg-neutral-900 text-white' },
  venue: { label: 'Circuit & Venue', icon: '📍', badgeColor: 'bg-neutral-900 text-white' },
  network: { label: 'Wire & Broadcast Network', icon: '📡', badgeColor: 'bg-neutral-900 text-white' },
};

export const CURATED_PADDOCK_ENTITIES: PaddockEntityRef[] = [
  // Series
  {
    type: 'series',
    name: 'MotoAmerica Superbikes',
    slug: 'motoamerica',
    bio: "North America's premier motorcycle road racing championship, sanctioning MotoAmerica Superbike, Supersport, and King of the Baggers.",
    category: 'motorcycles',
    official_website: 'https://motoamerica.com',
    image_url: '/logos/motoamerica.svg',
  },
  {
    type: 'series',
    name: 'IMSA WeatherTech SportsCar Championship',
    slug: 'imsa',
    bio: 'The premier sportscar championship in North America, sanctioning GTP, LMP2, GTD PRO, and GTD endurance classes.',
    category: 'sportscar',
    official_website: 'https://imsa.com',
    image_url: '/logos/imsa.svg',
  },
  {
    type: 'series',
    name: 'NTT IndyCar Series',
    slug: 'indycar',
    bio: "America's premier open-wheel racing series, featuring high-speed superspeedway, permanent road course, and street circuit competition.",
    category: 'open_wheel',
    official_website: 'https://indycar.com',
    image_url: '/logos/indycar.svg',
  },
  {
    type: 'series',
    name: 'NASCAR Cup Series',
    slug: 'nascar',
    bio: 'The highest level of professional stock car competition in the United States and the flagship championship of NASCAR.',
    category: 'stock_car',
    official_website: 'https://nascar.com',
    image_url: '/logos/nascar.svg',
  },
  // Teams
  {
    type: 'team',
    name: 'OrangeCat Racing',
    slug: 'orangecat-racing',
    bio: 'Championship-winning BMW M4 GT4 and sportscar racing operation competing across North American sports car championships.',
    category: 'sportscar',
    official_website: 'https://orangecatracing.com',
  },
  {
    type: 'team',
    name: 'Wayne Taylor Racing with Andretti',
    slug: 'wtr-andretti',
    bio: 'Multi-time Rolex 24 at Daytona winners and championship Acura GTP factory powerhouse in IMSA WeatherTech competition.',
    category: 'sportscar',
    official_website: 'https://waynetaylorracing.com',
    image_url: '/logos/imsa.svg',
  },
  {
    type: 'team',
    name: 'Hendrick Motorsports',
    slug: 'hendrick-motorsports',
    bio: 'The most victorious team in NASCAR Cup Series history, competing with Chevrolet Camaro ZL1s.',
    category: 'stock_car',
    official_website: 'https://hendrickmotorsports.com',
    image_url: '/logos/hendrick.svg',
  },
  // Drivers
  {
    type: 'driver',
    name: 'Patrick Losey',
    slug: 'patrick-losey',
    bio: 'Motorsport competitor, telemetry engineer, and Gridpass founder competing in sports car and club sprint championships.',
    category: 'sportscar',
    passport_url: '/u/patrick-losey',
  },
  {
    type: 'driver',
    name: 'Josef Newgarden',
    slug: 'josef-newgarden',
    bio: 'Two-time NTT IndyCar Series Champion and back-to-back Indianapolis 500 Winner with Team Penske.',
    category: 'open_wheel',
    official_website: 'https://josefnewgarden.com',
    image_url: '/logos/indycar.svg',
  },
  {
    type: 'driver',
    name: 'Kyle Larson',
    slug: 'kyle-larson',
    bio: 'NASCAR Cup Series Champion, Indianapolis 500 Rookie of the Year, and prolific dirt sprint car ace.',
    category: 'stock_car',
    image_url: '/logos/nascar.svg',
  },
  // Venues
  {
    type: 'venue',
    name: 'Road America',
    slug: 'road-america',
    bio: "America's National Park of Speed: iconic 4.048-mile, 14-turn permanent road course located in Elkhart Lake, Wisconsin.",
    category: 'sportscar',
    official_website: 'https://roadamerica.com',
  },
  {
    type: 'venue',
    name: 'Indianapolis Motor Speedway',
    slug: 'indianapolis-motor-speedway',
    bio: 'The Racing Capital of the World: legendary 2.5-mile superspeedway and FIA Grade 1 road course.',
    category: 'open_wheel',
    official_website: 'https://indianapolismotorspeedway.com',
    image_url: '/logos/indycar.svg',
  },
  {
    type: 'venue',
    name: 'WeatherTech Raceway Laguna Seca',
    slug: 'laguna-seca',
    bio: 'Legendary 2.238-mile paved road racing track in central California, home to the iconic Corkscrew elevation drop.',
    category: 'sportscar',
    official_website: 'https://weathertechraceway.com',
    image_url: '/logos/imsa.svg',
  },
  // Networks
  {
    type: 'network',
    name: 'Traxion.GG Sim Racing Global',
    slug: 'traxion-gg',
    bio: 'Leading global voice and authoritative wire covering sim racing, esports, racing games, and digital motorsport culture.',
    category: 'sim_racing',
    official_website: 'https://traxion.gg',
  },
  {
    type: 'network',
    name: 'RACER Magazine Technical Wire',
    slug: 'racer',
    bio: 'Premier authoritative motorsport journalism covering IndyCar, IMSA, Formula 1, and global sportscar endurance.',
    category: 'open_wheel',
    official_website: 'https://racer.com',
  },
  {
    type: 'network',
    name: 'Jayski NASCAR Dispatch',
    slug: 'jayski',
    bio: 'The definitive source for NASCAR Cup, Xfinity, and Craftsman Truck news, team charts, paint schemes, and paddock telemetry.',
    category: 'stock_car',
    official_website: 'https://jayski.com',
  },
  // --- RC RACING (ROAR / IFMAR) ---
  {
    type: 'series',
    name: 'ROAR National RC Racing',
    slug: 'roar-rc',
    bio: 'Remotely Operated Auto Racers: The official governing and sanctioning body for RC car and truck racing in the United States and Canada.',
    category: 'rc_racing',
    official_website: 'https://roarracing.com',
  },
  {
    type: 'series',
    name: 'IFMAR World Championships',
    slug: 'ifmar',
    bio: 'International Federation of Model Auto Racing: Sanctioning body for the global 1/8 Off-Road, 1/10 Electric, and 1/8 IC Track World Championships.',
    category: 'rc_racing',
    official_website: 'https://www.ifmar.org',
  },
  {
    type: 'team',
    name: 'Team Associated / Reedy',
    slug: 'team-associated',
    bio: 'Multi-time IFMAR World Champion and ROAR National Champion chassis, motor, and RC race engineering powerhouse.',
    category: 'rc_racing',
    official_website: 'https://www.associatedelectrics.com',
  },
  {
    type: 'team',
    name: 'Team Losi Racing (TLR)',
    slug: 'team-losi-racing',
    bio: 'Championship-winning 1/8 Nitro Buggy and 1/10 Electric RC platform engineering factory racing team.',
    category: 'rc_racing',
    official_website: 'https://www.tlracing.com',
  },
  {
    type: 'network',
    name: 'LiveRC Wire',
    slug: 'liverc',
    bio: 'The premier destination for live RC broadcast scoring, national race reports, and industry dispatches.',
    category: 'rc_racing',
    official_website: 'https://www.liverc.com',
  },
  // --- GRASSROOTS & CLUB RACING (SCCA / NASA) ---
  {
    type: 'series',
    name: 'Sports Car Club of America (SCCA)',
    slug: 'scca',
    bio: 'The heartbeat of American road racing, Solo Autocross, Time Trials, RoadRally, and the annual SCCA National Championship Runoffs.',
    category: 'grassroots_club',
    official_website: 'https://www.scca.com',
  },
  {
    type: 'series',
    name: 'National Auto Sport Association (NASA)',
    slug: 'nasa-racing',
    bio: 'Premier amateur and grassroots motorsport organization providing wheel-to-wheel sprint racing, Spec Miata, Super Touring, and HPDE programs.',
    category: 'grassroots_club',
    official_website: 'https://nasaproracing.com',
  },
  {
    type: 'series',
    name: 'ChampCar Endurance Series',
    slug: 'champcar',
    bio: 'Real endurance racing for real automotive enthusiasts across North Americas legendary road courses.',
    category: 'grassroots_club',
    official_website: 'https://champcar.org',
  },
  {
    type: 'network',
    name: 'Grassroots Motorsports',
    slug: 'grassroots-motorsports',
    bio: 'The authoritative publication and community wire for amateur sports car racing, autocross, track days, and DIY race builds.',
    category: 'grassroots_club',
    official_website: 'https://grassrootsmotorsports.com',
  },
];

export interface NewsFeed {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  is_active: boolean;
  fetch_interval_mins?: number;
  last_fetched_at: string | null;
  total_ingested: number;
  created_at: string;
  updated_at?: string;
  status?: 'active' | 'paused' | 'error';
  last_error?: string | null;
}

export interface RawNewsItem {
  id: string;
  feed_id: string;
  title: string;
  source_name: string;
  source_url: string;
  summary: string;
  content: string;
  image_url: string | null;
  published_at: string;
  category: NewsCategory;
  ingested_at: string;
}

export interface ArticleSource {
  name: string;
  url: string;
  domain?: string;
  logo_url?: string;
}

export interface RelatedDriver {
  id: string;
  name: string;
  car_number?: string;
  avatar_url?: string;
  series?: string;
}

export interface RelatedEvent {
  id: string;
  title: string;
  date_str?: string;
  location_name?: string;
  cover_image?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: NewsCategory;
  article_type: '4_hour_wire' | 'breakout' | 'breaking' | 'standard' | 'feature' | 'press_release';
  summary: string;
  content: string;
  cover_image_url: string | null;
  gallery_urls?: string[];
  sources: ArticleSource[];
  verified_by: string;
  is_public: boolean;
  status: 'draft' | 'published' | 'queued' | 'archived';
  views: number;
  attendees_count?: number;
  comments_count?: number;
  likes_count?: number;
  reading_time_mins?: number;
  referrers?: Record<string, number>;
  related_drivers?: RelatedDriver[];
  related_events?: RelatedEvent[];
  entities?: PaddockEntityRef[];
  updates?: ArticleUpdate[];
  tags?: string[];
  author?: string;
  author_id?: string;
  author_photo?: string | null;
  source_name?: string;
  source_url?: string;
  cover_image?: string | null;
  checkins_count?: number;
  trackside_attendance_count?: number;
  is_user_post?: boolean;
  is_hidden?: boolean;
  hidden_at?: string | null;
  hidden_by?: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}
