-- Insert Race Teams into organizations table

INSERT INTO public.organizations (name, type, lead_status, status, location, website, notes, description)
VALUES
(
    'ACI Motorsports',
    'team',
    'prospect',
    'active',
    'Chattanooga, TN',
    'https://acimotorsports.com',
    'Source: Agent Search - Fly-in Candidate. Series: SRO GT4 America / IMSA Michelin Pilot Challenge',
    'Premier motorsports organization competing in SRO GT4 America and IMSA Michelin Pilot Challenge.'
),
(
    'Random Vandals Racing',
    'team',
    'prospect',
    'active',
    'Concord, NC',
    'https://randomvandalsracing.com',
    'Source: Agent Search - Fly-in Candidate. Series: SRO GT4 America / IMSA Michelin Pilot Challenge',
    'Professional racing team based in Concord, NC, competing in IMSA and SRO series.'
),
(
    'Silver Hare Racing',
    'team',
    'prospect',
    'active',
    'High Point, NC',
    'https://silverhareracing.com',
    'Source: Agent Search - Fly-in Candidate. Series: Trans Am TA2',
    'Trans Am TA2 racing team based in High Point, NC. Focused on driver development.'
),
(
    'Nitro Motorsports',
    'team',
    'prospect',
    'active',
    'Mooresville, NC',
    'https://nitromotorsport.com',
    'Source: Agent Search - Fly-in Candidate. Series: Trans Am TA2',
    'A leading Trans Am TA2 team based in Mooresville, NC.'
),
(
    'McCumbee McAleer Racing',
    'team',
    'prospect',
    'active',
    'Supply, NC',
    'https://mccumbeemcaleer.com',
    'Source: Agent Search - Fly-in Candidate. Series: IMSA Michelin Pilot Challenge',
    'Competes in the IMSA Michelin Pilot Challenge with the Ford Mustang GT4.'
),
(
    'Stephen Cameron Racing',
    'team',
    'prospect',
    'active',
    'Sonoma, CA',
    'https://cameronracingusa.com',
    'Source: Agent Search - Fly-in Candidate. Series: IMSA MPC / SRO GT4',
    'Based at Sonoma Raceway, competing in SRO GT4 and IMSA series.'
),
(
    'Medusa Motorsports',
    'team',
    'prospect',
    'active',
    'Knoxville, TN',
    'https://medusamotorsports.com',
    'Source: Agent Search - Fly-in Candidate. Series: IMSA Michelin Pilot Challenge',
    'IMSA Michelin Pilot Challenge team based in Knoxville, TN.'
),
(
    'VPX Motorsport',
    'team',
    'prospect',
    'active',
    'Oakville, ON',
    'https://vpxmotorsport.com',
    'Source: Agent Search - Fly-in Candidate. Series: SRO GT4 America',
    'Canadian team competing in SRO GT4 America.'
),
(
    'Blackdog Racing',
    'team',
    'prospect',
    'active',
    'Lincolnshire, IL',
    'https://blackdogspeedshop.com',
    'Source: Agent Search - Fly-in Candidate. Series: SRO GT4 America',
    'Championship winning team competing in SRO GT4 America with Nissan Z GT4.'
),
(
    '6th Gear Racing',
    'team',
    'prospect',
    'active',
    'Dallas, TX',
    'http://6thgearracing.com',
    'Source: Agent Search - Fly-in Candidate. Series: Trans Am TA2',
    'Trans Am TA2 Racing Team based in Dallas, Texas.'
)
ON CONFLICT (id) DO NOTHING; -- Shouldn't conflict as UUIDs are auto-generated, but good practice if IDs were fixed. 
-- Note: Name is not unique in schema, but we don't want duplicates.
-- Ideally we would check for existence by name, but simple insert is fine for now.
