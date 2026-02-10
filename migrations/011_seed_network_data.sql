-- Seed Track and Shop Data

INSERT INTO public.organizations (name, type, location, website, description, status)
VALUES
-- Tracks
('Circuit of the Americas', 'track', 'Austin, TX', 'http://circuitoftheamericas.com', 'Grade 1 FIA specification 3.427-mile motor racing track and facilities located within the extraterritorial jurisdiction of Austin, Texas.', 'active'),
('Road Atlanta', 'track', 'Braselton, GA', 'https://www.roadatlanta.com', 'Michelin Raceway Road Atlanta is a 2.54-mile road course located just north of Braselton, Georgia.', 'active'),
('Watkins Glen International', 'track', 'Watkins Glen, NY', 'https://www.theglen.com', 'Watkins Glen International, nicknamed "The Glen", is an automobile race track located in Watkins Glen, New York.', 'active'),
('Sebring International Raceway', 'track', 'Sebring, FL', 'https://www.sebringraceway.com', 'Sebring International Raceway is a road course auto racing facility in the southeastern United States, located in Sebring, Florida.', 'active'),
('WeatherTech Raceway Laguna Seca', 'track', 'Monterey, CA', 'https://www.weathertechraceway.com', 'WeatherTech Raceway Laguna Seca is a paved road racing track in central California.', 'active'),
('Virginia International Raceway', 'track', 'Alton, VA', 'https://virnow.com', 'Virginia International Raceway is a road course located in Alton, Virginia.', 'active'),
('Sonoma Raceway', 'track', 'Sonoma, CA', 'https://www.sonomaraceway.com', 'Sonoma Raceway is a road course and drag strip located on Land''s End in the southern Sonoma Mountains.', 'active'),
('Lime Rock Park', 'track', 'Lakeville, CT', 'https://limerock.com', 'Lime Rock Park is a natural-terrain motorsport road racing venue located in Lakeville, Connecticut.', 'active'),
('Road America', 'track', 'Elkhart Lake, WI', 'https://www.roadamerica.com', 'Road America is a motorsport road course located near Elkhart Lake, Wisconsin on Wisconsin Highway 67.', 'active'),
('Mid-Ohio Sports Car Course', 'track', 'Lexington, OH', 'https://midohio.com', 'Mid-Ohio Sports Car Course is a comprehensive motorsports facility in Lexington, Ohio.', 'active'),

-- Shops (Generic placeholders for now, real ones to be added)
('Performance Race Engineering', 'shop', 'Portland, OR', 'https://www.preracing.com', 'Specializing in Subaru performance and tuning.', 'active'),
('Turn 14 Distribution', 'shop', 'Horsham, PA', 'https://www.turn14.com', 'Performance parts distributor and industry leader.', 'active'),
('RealTime Racing', 'shop', 'Saukville, WI', 'https://realtimerl.com', 'Premier racing team and shop, specializing in Honda/Acura.', 'active'),
('Fall-Line Motorsports', 'shop', 'Buffalo Grove, IL', 'https://www.fall-linemotorsports.com', 'Premier road racing team and race car preparation shop.', 'active'),
('Kelly-Moss Road and Race', 'shop', 'Madison, WI', 'https://www.kellymoss.com', 'Championship winning Porsche racing team and custom build shop.', 'active')

ON CONFLICT DO NOTHING;
