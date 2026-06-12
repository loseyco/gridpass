import { Venue, VenueSpot, FriendBeacon } from '../types/venue';

export const SEEDED_VENUES: Venue[] = [
  {
    id: 'round-lake-beach',
    name: 'Round Lake Beach & Waterway',
    location: 'Round Lake Beach, IL',
    type: 'waterway',
    pois: [
      {
        name: 'Round Lake Beach Cultural Center Launch',
        type: 'launch',
        location: '2007 Civic Center Way, Round Lake Beach, IL 60073',
        fee: '$15 Daily / $30 Annual',
        amenities: ['Paved Ramp', 'Parking Lot', 'Restrooms Nearby']
      },
      {
        name: 'Village Hall Public Pier',
        type: 'dock',
        location: '1937 N Municipal Way, Round Lake Beach, IL 60073',
        fee: 'Free Access',
        amenities: ['Floating Dock', 'Bench', 'Tie-up Cleats']
      },
      {
        name: 'Lakeside Fuel Dock',
        type: 'fuel',
        location: 'West Shore Marina, Round Lake, IL 60073',
        fee: 'Varies',
        amenities: ['Marine Premium Gas', 'Pump-out Station', 'Pro Shop']
      }
    ],
    hazards: [
      {
        name: 'Round Lake Ski Slalom Submerged Cable Grid',
        type: 'submerged_cable',
        description: 'Galvanized steel mainframe cables run 1.5 to 2 feet under the water surface. Jet suction can pull tethers into impellers, causing major pump damage.',
        location: 'North-East bay corridor'
      },
      {
        name: 'Shallow Sandbar Mudflats',
        type: 'shallow',
        description: 'Soft silt and mud bottom drops to less than 2 feet deep. Keep trim up and ride slow to avoid sucking weeds/mud into engine cooling systems.',
        location: 'North-West shoreline zone'
      }
    ],
    rules: [
      {
        title: 'Fox Waterway Agency (FWA) Sticker Required',
        desc: 'Decals must be displayed on both sides of the PWC bow. Daily permit is $10; annual is $50. Fines up to $150.'
      },
      {
        title: 'USCG Approved PFD Required',
        desc: 'All operators and passengers on personal watercraft must wear a US Coast Guard approved Type I, II, or III life jacket. Inflatables are illegal.'
      },
      {
        title: 'Hours of PWC Operation',
        desc: 'PWCs are strictly prohibited from operating between sunset and sunrise. Returns must be completed before dusk.'
      },
      {
        title: 'Strict No-Wake Buffers',
        desc: 'Must operate at slow, no-wake speeds (under 5 mph) within 150 feet of any dock, shoreline, swimmer, or anchored vessel.'
      }
    ],
    occupancy: { current: 14, max: 75 }
  },
  {
    id: 'badlands-raceway',
    name: 'Badlands Offroad Park & Raceway',
    location: 'Attica, Indiana',
    type: 'racetrack',
    pit_status: 'Green Flag',
    active_sessions: [
      { name: 'Group A - Advanced Track Day', time: '10:00 AM' },
      { name: 'Group B - Intermediate Trial', time: '11:15 AM' },
      { name: 'Group C - Novice Safety Run', time: '01:00 PM' }
    ],
    pois: [
      {
        name: 'Main Gate Paddock Entry',
        type: 'gate',
        location: '3968 N Xavier Rd, Attica, IN 47918',
        fee: '$25 Daily Gate Admission',
        amenities: ['Waiver Sign-off', 'Wristband Kiosk']
      },
      {
        name: 'Technical Inspection Shed',
        type: 'gate',
        location: 'Badlands Main Paddock Row A',
        amenities: ['Brake checks', 'Decal pass stamps', 'Helmets audit']
      },
      {
        name: 'Paddock Fuel Pumps',
        type: 'fuel',
        location: 'Adjacent to main staging area',
        fee: 'Market price',
        amenities: ['93 Octane', '100 octane race fuel']
      }
    ],
    hazards: [
      {
        name: 'Noise Decibel Level Limits',
        type: 'noise_limit',
        description: 'Strict 96 dB limit enforced at trackside sound monitors. Violations require exhaust baffles or entry revocation.'
      }
    ],
    rules: [
      {
        title: 'Motorsports Waiver Required',
        desc: 'All drivers, crew, and spectators must sign the digital liability waiver and display a valid wristband/QR gate ticket at paddock entry.'
      },
      {
        title: 'Pit Lane Speed Limit',
        desc: 'Maximum speed in pit lane and paddock corridors is strictly limited to 15 mph. Heavy penalties apply.'
      }
    ],
    occupancy: { current: 48, max: 120 }
  },
  {
    id: 'redbird-sra',
    name: 'Redbird State Recreation Area',
    location: 'Dugger, IN',
    type: 'offroad_park',
    pois: [
      {
        name: 'Redbird Main Staging Trailhead',
        type: 'trailhead',
        location: '18000 N Redbird Rd, Dugger, IN 47848',
        fee: '$15 Daily ORV permit',
        amenities: ['Trail Maps', 'Trailer Loading Ramps', 'Tire Air Station']
      },
      {
        name: 'Clay Pit Campsite #4',
        type: 'campsite',
        location: 'Camp zone B, trail 3 connector',
        fee: '$20 / night',
        amenities: ['Fire ring', 'Picnic table', 'Compost toilets']
      }
    ],
    hazards: [
      {
        name: 'Off-Camber Clay Rut Slide',
        type: 'danger_zone',
        description: 'Slippery when wet. High rollover risk on deep mud tracks. Recovery winch coordinates marked on boards.',
        location: 'Trail 6 ridge segment'
      }
    ],
    rules: [
      {
        title: 'Registered ORV Decal Required',
        desc: 'All dirt bikes, ATVs, UTVs, and 4x4 vehicles must display a valid Indiana DNR off-road vehicle registration sticker.'
      },
      {
        title: 'Winching Safety Gear Mandatory',
        desc: 'Always use a trunk protector strap when rigging recovery winches to trees. Never hook cable directly to itself.'
      }
    ],
    occupancy: { current: 8, max: 50 }
  },
  {
    id: 'rlb-cultural-center',
    name: 'Round Lake Beach Cultural Center',
    location: 'Round Lake Beach, IL',
    type: 'event_center',
    gate_status: 'Open',
    pois: [
      {
        name: 'Main Registration & Ticket Booth',
        type: 'gate',
        location: '2007 Civic Center Way, Round Lake Beach, IL 60073',
        fee: '$5 General Admission',
        amenities: ['QR Scan Ingress', 'Event wristbands']
      },
      {
        name: 'Sponsor Row Exhibition Walk',
        type: 'vendor',
        location: 'Central Lawn Plaza',
        amenities: ['Gridpass Sticker Customizer Booth', 'Monmouth Marine Display']
      },
      {
        name: 'Food Truck Court',
        type: 'vendor',
        location: 'North Parking Lot Lot-A',
        amenities: ['Lakeside Burgers', 'Taco Express', 'Coffee Dock']
      }
    ],
    hazards: [],
    rules: [
      {
        title: 'Speed Limit in Display Area',
        desc: 'Speed is strictly limited to 5 mph. Watch for pedestrians and spectators walking around vehicles.'
      },
      {
        title: 'QR Code Spec Sheet Display',
        desc: 'Exhibiting vehicles must display their Gridpass vehicle spec-sheet passport QR code prominently on the windshield or dashboard.'
      }
    ],
    occupancy: { current: 124, max: 500 }
  }
];

export const SEEDED_SPOTS: VenueSpot[] = [
  {
    id: 'spot-port-blarney',
    venue_id: 'round-lake-beach',
    name: 'Port of Blarney Boat Launch & Grill',
    latitude: 42.4412,
    longitude: -88.1322,
    features: ['dock', 'launch', 'food', 'fuel'],
    notes: [
      { user: 'PJ Losey', text: 'Clean paved double launch ramp. Decent fuel prices. Great food and drinks before hitting Grass Lake.', timestamp: '2026-06-08T14:30:00Z' },
      { user: 'Kristina', text: 'Staff is super friendly, helped us secure the PWC bumpers on the concrete side dock.', timestamp: '2026-06-09T16:15:00Z' }
    ],
    hours: '8:00 AM - 10:00 PM',
    status: 'verified',
    business_id: 'monmouth-marine-demo', // Linked to verified dealership/storefront
    created_at: '2026-06-08T14:00:00Z',
    updated_at: '2026-06-09T16:15:00Z'
  },
  {
    id: 'spot-petite-sandbar',
    venue_id: 'round-lake-beach',
    name: 'Petite Lake Sandbar',
    latitude: 42.4355,
    longitude: -88.1121,
    features: ['beach', 'sandbar'],
    notes: [
      { user: 'Ranger Dave', text: 'Extremely crowded on holiday weekends. Muddy sand, shallow water (2-4ft). Use a double anchor setup.', timestamp: '2026-06-08T18:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'active',
    created_at: '2026-06-08T12:00:00Z',
    updated_at: '2026-06-08T18:00:00Z'
  },
  {
    id: 'spot-blarney-island',
    venue_id: 'round-lake-beach',
    name: 'Blarney Island Sandbar & Docks',
    latitude: 42.4489,
    longitude: -88.1394,
    features: ['dock', 'food', 'sandbar'],
    notes: [
      { user: 'ChainRider84', text: 'Great spot to anchor out in Grass Lake. Watch out for deep weeds. Heavy wake from the shuttle boat.', timestamp: '2026-06-09T19:20:00Z' }
    ],
    hours: '11:00 AM - Midnight',
    status: 'active',
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-09T19:20:00Z'
  },
  // Racetrack Seed Spots
  {
    id: 'spot-tech-shed',
    venue_id: 'badlands-raceway',
    name: 'Technical Safety Inspection Shed',
    latitude: 40.2934,
    longitude: -87.2488,
    features: ['gate'],
    notes: [
      { user: 'John Tech', text: 'Ensure helmets are Snell SA2020 or SA2025. Pre-check battery tie downs.', timestamp: '2026-06-10T08:00:00Z' }
    ],
    status: 'verified',
    created_at: '2026-06-10T08:00:00Z',
    updated_at: '2026-06-10T08:00:00Z'
  }
];

export const SEEDED_FRIENDS: FriendBeacon[] = [
  {
    user_id: 'user-kristina-456',
    display_name: 'Kristina',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4332, // South of launch
    longitude: -88.1325,
    speed: 20,
    heading: 180, // Heading South
    updated_at: new Date().toISOString(),
    status: 'active'
  },
  {
    user_id: 'user-marcus-123',
    display_name: 'Marcus Mustang',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4515, // NW of launch
    longitude: -88.1501,
    speed: 35,
    heading: 315, // Heading NW
    updated_at: new Date().toISOString(),
    status: 'active'
  },
  {
    user_id: 'user-sarah-789',
    display_name: 'Sarah Spotter',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4410, // East of launch
    longitude: -88.1012,
    speed: 0,
    heading: 90, // Anchored
    updated_at: new Date().toISOString(),
    status: 'active'
  }
];
