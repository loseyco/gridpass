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
  },
  {
    id: 'fox-river',
    name: 'Fox River Waterway',
    location: 'Northern Illinois',
    type: 'waterway',
    pois: [],
    hazards: [],
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
    occupancy: { current: 3, max: 150 }
  },
  {
    id: 'lake-michigan-winthrop',
    name: 'Lake Michigan / Winthrop Harbor',
    location: 'Winthrop Harbor, IL',
    type: 'waterway',
    pois: [
      {
        name: 'North Point Marina Boat Ramp',
        type: 'launch',
        location: 'Winthrop Harbor, IL',
        fee: '$10 Daily',
        amenities: ['10-lane concrete ramp', 'Vehicle/trailer parking', 'Floating finger-docks']
      },
      {
        name: 'The Tropics Restaurant & Bar',
        type: 'vendor',
        location: 'North Point Marina',
        amenities: ['Indoor Dining', 'Outdoor Patio', 'Harbor Views']
      },
      {
        name: 'Harbor Brewing Co. Lakefront Biergarten',
        type: 'vendor',
        location: 'North Point Marina',
        amenities: ['Craft Beer', 'Live Music', 'Food Trucks']
      }
    ],
    hazards: [
      {
        name: 'Open Lake Michigan Swells',
        type: 'danger_zone',
        description: 'Sudden high winds and waves. Ensure PWC is capable and check weather forecasts before departing.'
      }
    ],
    rules: [
      {
        title: 'PFD Mandatory',
        desc: 'USCG approved life jackets must be worn by all PWC riders.'
      },
      {
        title: 'Passenger Pickup Zone',
        desc: 'Designated passenger loading and swapping is at the public floating finger-docks near the ramp.'
      }
    ],
    occupancy: { current: 5, max: 200 }
  }
];

export const SEEDED_SPOTS: VenueSpot[] = [
  {
    id: 'spot-north-point-ramp',
    venue_id: 'lake-michigan-winthrop',
    name: 'North Point Marina Boat Ramp',
    latitude: 42.4920,
    longitude: -87.7994,
    features: ['launch', 'dock'],
    notes: [
      { user: 'System', text: 'The primary 10-lane concrete launch site and vehicle/trailer parking area ($10 daily fee) used to enter the open lake. This area also includes the public floating finger-docks, which serve as the designated pick-up spot for loading and swapping out passengers.', timestamp: '2026-06-28T10:00:00Z' }
    ],
    hours: '24/7',
    status: 'verified',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  },
  {
    id: 'spot-tropics-restaurant',
    venue_id: 'lake-michigan-winthrop',
    name: 'The Tropics Restaurant & Bar',
    latitude: 42.4913,
    longitude: -87.8003,
    features: ['food'],
    notes: [
      { user: 'System', text: 'A casual, family-friendly sit-down restaurant with an indoor dining room and a large outdoor patio overlooking the harbor slips. It is located just steps from the boat ramp docks, making it a convenient stop to grab a burger or pizza while keeping an eye on the watercraft.', timestamp: '2026-06-28T10:00:00Z' }
    ],
    hours: '11:00 AM - 9:00 PM',
    status: 'verified',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  },
  {
    id: 'spot-harbor-brewing',
    venue_id: 'lake-michigan-winthrop',
    name: 'Harbor Brewing Co. Lakefront Biergarten',
    latitude: 42.4876,
    longitude: -87.7963,
    features: ['food'],
    notes: [
      { user: 'System', text: 'An open-air waterfront craft beer garden located on the harbor grounds. It offers a relaxed, casual environment that frequently hosts live music and local food trucks on summer weekends.', timestamp: '2026-06-28T10:00:00Z' }
    ],
    hours: '12:00 PM - 10:00 PM',
    status: 'verified',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  },
  {
    id: 'spot-illinois-beach-landing',
    venue_id: 'lake-michigan-winthrop',
    name: 'Illinois Beach State Park Resort Landing Zone',
    latitude: 42.4582,
    longitude: -87.8015,
    features: ['beach', 'sandbar'],
    notes: [
      { user: 'System', text: 'A wide, unrestricted sandy shoreline located roughly 2.5 miles south of the marina basin, positioned directly in front of the resort hotel. This area is entirely clear of the swimming-only boundaries, allowing you to legally nose a PWC up onto the dry sand, anchor down, and layout a beach towel.', timestamp: '2026-06-28T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'verified',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  },
  {
    id: 'spot-lake-marie-sandbar',
    venue_id: 'round-lake-beach',
    name: 'Lake Marie Sandbar Bar & Grille Shoreline',
    latitude: 42.4578,
    longitude: -88.1311,
    features: ['beach', 'sandbar', 'food'],
    notes: [
      { user: 'System', text: 'A dedicated, boater-accessible sand beach and dock setup situated on the south end of Lake Marie. This establishment allows PWC riders and boaters to pull directly up to land, hang out on the physical sand shore, and grab food or drinks right off the lake.', timestamp: '2026-06-28T10:00:00Z' }
    ],
    hours: '11:00 AM - 9:00 PM',
    status: 'verified',
    created_at: '2026-06-28T10:00:00Z',
    updated_at: '2026-06-28T10:00:00Z'
  },
  {
    id: 'spot-port-blarney',
    venue_id: 'round-lake-beach',
    name: 'Port of Blarney Boat Launch & Grill',
    latitude: 42.4449,
    longitude: -88.1651,
    features: ['dock', 'launch', 'food', 'fuel'],
    notes: [
      { user: 'PJ Losey', text: 'Clean paved double launch ramp. Decent fuel prices. Great food and drinks before hitting Grass Lake.', timestamp: '2026-06-08T14:30:00Z' },
      { user: 'Kristina', text: 'Staff is super friendly, helped us secure the PWC bumpers on the concrete side dock.', timestamp: '2026-06-09T16:15:00Z' }
    ],
    hours: '8:00 AM - 10:00 PM',
    status: 'verified',
    business_id: 'monmouth-marine-demo',
    created_at: '2026-06-08T14:00:00Z',
    updated_at: '2026-06-09T16:15:00Z'
  },
  {
    id: 'spot-petite-sandbar',
    venue_id: 'round-lake-beach',
    name: 'Petite Lake Sandbar',
    latitude: 42.4308,
    longitude: -88.1290,
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
    latitude: 42.4445,
    longitude: -88.1683,
    features: ['dock', 'food', 'sandbar'],
    notes: [
      { user: 'ChainRider84', text: 'Great spot to anchor out in Grass Lake. Watch out for deep weeds. Heavy wake from the shuttle boat.', timestamp: '2026-06-09T19:20:00Z' }
    ],
    hours: '11:00 AM - Midnight',
    status: 'active',
    created_at: '2026-06-09T10:00:00Z',
    updated_at: '2026-06-09T19:20:00Z'
  },
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
  },
  {
    id: 'spot-pottawatomie',
    venue_id: 'fox-river',
    name: 'Pottawatomie Park Boat Launch',
    latitude: 41.9201202,
    longitude: -88.3150293,
    features: ["launch", "dock", "food"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in St. Charles, Illinois. Access: —, rating: 4.8/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fabyan',
    venue_id: 'fox-river',
    name: 'Fabyan Forest Preserve Boat Launch',
    latitude: 41.8696886,
    longitude: -88.3113724,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Geneva, Illinois. Access: —, rating: 4.7/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-island-park',
    venue_id: 'fox-river',
    name: 'Island Park Boat Launch',
    latitude: 41.8838735,
    longitude: -88.3017564,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Geneva, Illinois. Access: public, rating: 4.7/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-jon-duerr',
    venue_id: 'fox-river',
    name: 'Jon J. Duerr Forest Preserve Boat Launch',
    latitude: 41.9724232,
    longitude: -88.2981557,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Coleman, Illinois. Access: —, rating: 4.7/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-festival-park',
    venue_id: 'fox-river',
    name: 'Festival Park Boat Launch',
    latitude: 42.0328065,
    longitude: -88.2808328,
    features: ["launch", "dock", "food"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Elgin, Illinois. Access: —, rating: 4.6/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-wells-park',
    venue_id: 'fox-river',
    name: 'Wells Park Boat Launch',
    latitude: 44.446429,
    longitude: -88.0608139,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in De Pere, Wisconsin. Access: —, rating: 4.5/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-walton-island',
    venue_id: 'fox-river',
    name: 'Walton Island Park Boat Launch',
    latitude: 42.0394026,
    longitude: -88.2880055,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Elgin, Illinois. Access: —, rating: 4.5/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-riverside-park',
    venue_id: 'fox-river',
    name: 'Riverside Park Boat Launch',
    latitude: 43.9794581,
    longitude: -88.9498244,
    features: ["launch", "dock", "campsite"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in City of Berlin, Wisconsin. Access: —, rating: 4.5/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-mccullough',
    venue_id: 'fox-river',
    name: 'McCullough Park Boat Launch',
    latitude: 41.7688194,
    longitude: -88.3123894,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Aurora, Illinois. Access: —, rating: 4.4/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-marie-grolich',
    venue_id: 'fox-river',
    name: 'Marie Grolich Park Boat Launch',
    latitude: 42.0210699,
    longitude: -88.2774425,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Elgin, Illinois. Access: —, rating: 4.4/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-geneva-dam',
    venue_id: 'fox-river',
    name: 'Geneva Dam Boat Launch',
    latitude: 41.8881432,
    longitude: -88.3021258,
    features: ["launch", "hazard"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Geneva, Illinois. Access: —, rating: 4.3/5. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3437629,
    longitude: -88.2616522,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry-alt-13',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3417176,
    longitude: -88.2598875,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry-alt-14',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3465487,
    longitude: -88.259375,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry-alt-15',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3384892,
    longitude: -88.2522247,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-16',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Millhurst, Illinois)',
    latitude: 41.6092288,
    longitude: -88.5628335,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Millhurst, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry-alt-17',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3270677,
    longitude: -88.2537777,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-18',
    venue_id: 'fox-river',
    name: 'Fox River (Yorkville, Illinois)',
    latitude: 41.6424932,
    longitude: -88.4408093,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Yorkville, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-19',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Oswego township, Illinois)',
    latitude: 41.672779,
    longitude: -88.3948227,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Oswego township, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-wagner-dam',
    venue_id: 'fox-river',
    name: 'Wagner Dam Boat Launch',
    latitude: 46.47212,
    longitude: -86.065603,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Seney Township, Michigan. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-sfcg-21',
    venue_id: 'fox-river',
    name: 'Fox River Sfcg Boat Launch',
    latitude: 46.399818,
    longitude: -86.02876,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Seney Township, Michigan. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-kayak-canoe-launch-22',
    venue_id: 'fox-river',
    name: 'Kayak/Canoe Launch',
    latitude: 44.2642323,
    longitude: -88.3841753,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Appleton, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-23',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Kaukauna, Wisconsin)',
    latitude: 44.2747176,
    longitude: -88.2495984,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Kaukauna, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-24',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Geneva, Illinois)',
    latitude: 41.8872971,
    longitude: -88.3017945,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Geneva, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-25',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Batavia, Illinois)',
    latitude: 41.8589303,
    longitude: -88.3089398,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Batavia, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-26',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Algonquin, Illinois)',
    latitude: 42.1686705,
    longitude: -88.2884943,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Algonquin, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-27',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Oswego, Illinois)',
    latitude: 41.676549,
    longitude: -88.3854279,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Oswego, Illinois. Access: private, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-28',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Cuba, Illinois)',
    latitude: 42.202991,
    longitude: -88.196848,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Cuba, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-appleton-fireboat-launch-29',
    venue_id: 'fox-river',
    name: 'Appleton Fireboat Launch',
    latitude: 44.2582931,
    longitude: -88.397787,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Appleton, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-mchenry-alt-30',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (McHenry, Illinois)',
    latitude: 42.3400224,
    longitude: -88.2549032,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-d-s-marine-service-31',
    venue_id: 'fox-river',
    name: 'D\'s Marine Service Boat Launch',
    latitude: 42.3425957,
    longitude: -88.2616956,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in McHenry, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-32',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Brookfield, Wisconsin)',
    latitude: 43.0780664,
    longitude: -88.1616676,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Brookfield, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-33',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Town of Burlington, Wisconsin)',
    latitude: 42.618488,
    longitude: -88.223029,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Town of Burlington, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-34',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Geneva, Illinois)',
    latitude: 41.8883327,
    longitude: -88.3011294,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Geneva, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-35',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Kaukauna, Wisconsin)',
    latitude: 44.2834141,
    longitude: -88.2569563,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Kaukauna, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-36',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Lake Barrington, Illinois)',
    latitude: 42.2076117,
    longitude: -88.1937037,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Lake Barrington, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-37',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Town of Princeton, Wisconsin)',
    latitude: 43.7923843,
    longitude: -89.1244687,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Town of Princeton, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-jefferson-street-boat-ramp-38',
    venue_id: 'fox-river',
    name: 'Jefferson Street Boat Ramp',
    latitude: 43.852628,
    longitude: -89.133915,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF PRINCETON, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-39',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Appleton, Wisconsin)',
    latitude: 44.2502695,
    longitude: -88.4207567,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Appleton, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-rustic-road-landing-40',
    venue_id: 'fox-river',
    name: 'Rustic Road Landing',
    latitude: 43.917423,
    longitude: -89.080122,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF SENECA, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-access-41',
    venue_id: 'fox-river',
    name: 'Fox River Access (TOWN OF AURORA, Wisconsin)',
    latitude: 43.997306,
    longitude: -88.90123,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF AURORA, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-42',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Montello, Wisconsin)',
    latitude: 43.7878463,
    longitude: -89.3296881,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Montello, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-access-43',
    venue_id: 'fox-river',
    name: 'Fox River Access (TOWN OF MONTELLO, Wisconsin)',
    latitude: 43.785637,
    longitude: -89.315408,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF MONTELLO, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-canoe-launch-44',
    venue_id: 'fox-river',
    name: 'Fox River Canoe Launch',
    latitude: 42.610995,
    longitude: -88.225155,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF WHEATLAND, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-perkofski',
    venue_id: 'fox-river',
    name: 'Perkofski Boat Launch',
    latitude: 44.458937,
    longitude: -88.0689756,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in De Pere, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-and-hounds-park-boat-ramp-46',
    venue_id: 'fox-river',
    name: 'Fox and Hounds Park Boat Ramp',
    latitude: 44.040795,
    longitude: -88.738712,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF OMRO, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-bomier-boat-launch-47',
    venue_id: 'fox-river',
    name: 'Bomier Boat Launch',
    latitude: 44.4435631,
    longitude: -88.061083,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in De Pere, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-point-boat-launch-48',
    venue_id: 'fox-river',
    name: 'Fox Point Boat Launch',
    latitude: 44.4635862,
    longitude: -88.0540822,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in De Pere, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-stearns-park-boat-ramp-49',
    venue_id: 'fox-river',
    name: 'Stearns Park Boat Ramp',
    latitude: 44.039477,
    longitude: -88.750021,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF OMRO, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-berlin-locks-access-50',
    venue_id: 'fox-river',
    name: 'Berlin Locks Access Boat Launch',
    latitude: 43.952816,
    longitude: -88.959279,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF BERLIN, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-lock-access-51',
    venue_id: 'fox-river',
    name: 'Fox River Lock Access Boat Launch',
    latitude: 43.900793,
    longitude: -89.083338,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF SAINT MARIE, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-access-52',
    venue_id: 'fox-river',
    name: 'Fox River Access (TOWN OF BERLIN, Wisconsin)',
    latitude: 43.948101,
    longitude: -88.966959,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF BERLIN, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-access-53',
    venue_id: 'fox-river',
    name: 'Fox River Access (TOWN OF SAINT MARIE, Wisconsin)',
    latitude: 43.872366,
    longitude: -89.115126,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF SAINT MARIE, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-berlin-locks-access-54',
    venue_id: 'fox-river',
    name: 'Berlin Locks Access Boat Launch',
    latitude: 43.952836,
    longitude: -88.958475,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF BERLIN, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-55',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Kaukauna, Wisconsin)',
    latitude: 44.2821704,
    longitude: -88.2794201,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Kaukauna, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-longcroft-park-boat-launch-56',
    venue_id: 'fox-river',
    name: 'Longcroft Park Boat Launch',
    latitude: 43.969399,
    longitude: -88.952318,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF BERLIN, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-city-of-omro-wisconsin-boat-launch-57',
    venue_id: 'fox-river',
    name: 'CITY OF OMRO, Wisconsin Boat Launch',
    latitude: 44.041881,
    longitude: -88.731171,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF OMRO, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-frog-alley-boat-landing-58',
    venue_id: 'fox-river',
    name: 'Frog Alley Boat Landing',
    latitude: 42.898799,
    longitude: -88.320787,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in VILLAGE OF MUKWONAGO, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-59',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Town of Rushford, Wisconsin)',
    latitude: 43.9950736,
    longitude: -88.8763914,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Town of Rushford, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-riverside-park-boat-launch-60',
    venue_id: 'fox-river',
    name: 'Riverside Park Boat Launch',
    latitude: 43.979876,
    longitude: -88.949034,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in CITY OF BERLIN, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-lock-access-61',
    venue_id: 'fox-river',
    name: 'Fox River Lock Access Boat Launch',
    latitude: 43.89903,
    longitude: -89.085441,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF SAINT MARIE, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-sunset-park-ramp-62',
    venue_id: 'fox-river',
    name: 'Sunset Park Ramp',
    latitude: 44.27625,
    longitude: -88.344723,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in VILLAGE OF KIMBERLY, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-eureka-boat-landing-63',
    venue_id: 'fox-river',
    name: 'Eureka Boat Landing',
    latitude: 44.004209,
    longitude: -88.844875,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in TOWN OF RUSHFORD, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-64',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Allouez, Wisconsin)',
    latitude: 44.4820101,
    longitude: -88.0326946,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Allouez, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-launch-65',
    venue_id: 'fox-river',
    name: 'Fox River Boat Launch',
    latitude: 46.3970521,
    longitude: -86.0127257,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Seney Township, Michigan. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-wagner-dam-boat-launch-66',
    venue_id: 'fox-river',
    name: 'Wagner Dam Boat Launch',
    latitude: 46.4717556,
    longitude: -86.0654096,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Seney Township, Michigan. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-67',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Waukesha, Wisconsin)',
    latitude: 43.0158206,
    longitude: -88.2266331,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Waukesha, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-launch-68',
    venue_id: 'fox-river',
    name: 'Fox River Boat Launch',
    latitude: 42.2387776,
    longitude: -88.186625,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Port Barrington, Illinois. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-69',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Antioch township, Illinois)',
    latitude: 42.477219,
    longitude: -88.1756066,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Antioch township, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-big-bend-village-park-boat-landing-70',
    venue_id: 'fox-river',
    name: 'Big Bend Village Park Boat Landing',
    latitude: 42.876978,
    longitude: -88.211448,
    features: ["launch", "dock"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Big Bend, Wisconsin. Access: public, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-71',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Fox River Grove, Illinois)',
    latitude: 42.2044707,
    longitude: -88.2165088,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Fox River Grove, Illinois. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'spot-fox-river-boat-ramp-72',
    venue_id: 'fox-river',
    name: 'Fox River Boat Ramp (Oshkosh, Wisconsin)',
    latitude: 44.0266787,
    longitude: -88.5607826,
    features: ["launch"],
    notes: [
      { user: 'System', text: 'Unverified boat launch on Fox River in Oshkosh, Wisconsin. Access: —, rating: —. Click Verify to confirm conditions.', timestamp: '2026-06-12T10:00:00Z' }
    ],
    hours: 'Sunrise - Sunset',
    status: 'unverified',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  },
];

export const SEEDED_FRIENDS: FriendBeacon[] = [
  {
    user_id: 'user-kristina-456',
    display_name: 'Kristina',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4455,
    longitude: -88.1630,
    speed: 20,
    heading: 180,
    updated_at: new Date().toISOString(),
    status: 'active'
  },
  {
    user_id: 'user-marcus-123',
    display_name: 'Marcus Mustang',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4435,
    longitude: -88.1690,
    speed: 35,
    heading: 315,
    updated_at: new Date().toISOString(),
    status: 'active'
  },
  {
    user_id: 'user-sarah-789',
    display_name: 'Sarah Spotter',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80',
    latitude: 42.4305,
    longitude: -88.1295,
    speed: 0,
    heading: 90,
    updated_at: new Date().toISOString(),
    status: 'active'
  }
];
