
-- Restore Features (Seed Data)
insert into public.features (title, description, status, priority, tier, category, votes, estimated_hours)
values
-- Racing Operations
('Crew Payroll System', 'Automated per-diem and payout tracking for race weekends.', 'in_progress', 'high', 'pro', 'Racing Operations', 12, 40),
('Tire Banking', 'Track tire sets, heat cycles, and allocation across sessions.', 'planned', 'high', 'pro', 'Racing Operations', 45, 20),
('Run Plan Generator', 'Dynamic scheduling for practice sessions based on tire availability.', 'planned', 'medium', 'pro', 'Racing Operations', 8, 15),
('Setup Sheet History', 'Version controlled setup sheets linked to sessions.', 'completed', 'high', 'core', 'Racing Operations', 150, 10),

-- Shop Ops
('Part Inventory Tracking', 'QR code checking for parts bin locations.', 'in_progress', 'medium', 'core', 'Shop Ops', 34, 60),
('Consumables Alerting', 'Low stock alerts for brake clean, fluids, and zip ties.', 'planned', 'low', 'core', 'Shop Ops', 5, 8),
('Tool Checkout', 'Track who has the digital torque wrench.', 'planned', 'medium', 'pro', 'Shop Ops', 18, 24),

-- Logistics
('Transporter Loading Plan', 'Drag and drop loader for trailer packing.', 'planned', 'high', 'pro', 'Logistics', 56, 40),
('Hotel Rooming List', 'Manage crew accommodation assignments.', 'completed', 'medium', 'core', 'Logistics', 89, 12),
('Travel Itinerary Sync', 'Push massive travel plans to crew calendars.', 'in_progress', 'medium', 'pro', 'Logistics', 22, 30),

-- Financial
('Expense Scanning', 'Mobile receipt scanning for crew members.', 'planned', 'high', 'core', 'Financial', 67, 40),
('Sponsor ROI Dashboard', 'Automated exposure reports for partners.', 'planned', 'low', 'pro', 'Financial', 12, 100),

-- Documents
('Digital Waivers', 'integrated release forms for arrive-and-drive.', 'completed', 'high', 'core', 'Documents', 200, 20),
('Tech Inspection Forms', 'Pre-fill PDF forms for sanctioning bodies.', 'in_progress', 'high', 'pro', 'Documents', 41, 16),

-- Growth
('Public Driver Profiles', 'Shareable link for drivers to showcase stats.', 'completed', 'high', 'core', 'Growth', 312, 40),
('Team Marketplace', 'Find crew members for upcoming events.', 'planned', 'medium', 'pro', 'Growth', 88, 80)

on conflict (title) do update set status = excluded.status;
