-- Populate os_task with audit findings and roadmap items

-- 1. Roadmap Items (from HomeClient.tsx)
-- Apps marked as "Coming Soon" or "Alpha/Beta" that need work
INSERT INTO public.os_task (title, description, status, priority, category, tags) VALUES
('Implement My Garage App', 'Complete the "My Garage" app for asset tracking and maintenance logs.', 'todo', 'high', 'Feature', ARRAY['app', 'garage', 'coming_soon']),
('Implement Message System', 'Build the internal messaging system for users and teams.', 'todo', 'high', 'Feature', ARRAY['app', 'messages', 'coming_soon']),
('Implement Classifieds', 'Marketplace for parts and cars.', 'todo', 'medium', 'Feature', ARRAY['app', 'classifieds', 'coming_soon']),
('Implement Rentals', 'Rental management system for track cars.', 'todo', 'medium', 'Feature', ARRAY['app', 'rentals', 'coming_soon']),
('Implement Careers/Jobs', 'Job board for motorsports positions.', 'todo', 'medium', 'Feature', ARRAY['app', 'jobs', 'coming_soon']),
('Implement Logistics Manager', 'Tool for managing team travel and transport.', 'todo', 'low', 'Feature', ARRAY['app', 'logistics', 'coming_soon']),
('Implement Team Manager', 'Roster and staff management system.', 'todo', 'medium', 'Feature', ARRAY['app', 'team_manager', 'coming_soon']),
('Implement Shop Manager', 'Workshop workflows and task tracking.', 'todo', 'low', 'Feature', ARRAY['app', 'shop_manager', 'coming_soon']),
('Implement Tool Box', 'Calculators and utility tools for engineers.', 'todo', 'low', 'Feature', ARRAY['app', 'toolbox', 'coming_soon']),
('Implement Collections', 'Manage curated lists of content or assets.', 'todo', 'low', 'Feature', ARRAY['app', 'collections', 'coming_soon']);

-- 2. Audit Findings (from Codebase Scan)
INSERT INTO public.os_task (title, description, status, priority, category, tags) VALUES
('Fix Stripe Donor Upgrade Logic', 'Ensure donations do not accidentally upgrade users to "Founder" status unless checking "founder_membership". Verify this fix.', 'done', 'critical', 'Bug', ARRAY['payment', 'audit']),
('Fix Navbar Layout on Tablet', 'Navbar menu items get cramped on medium screens. Hide desktop menu earlier (xl) and show hamburger.', 'done', 'medium', 'UI', ARRAY['audit', 'layout']),
('Enable Resume Builder Donations', 'Replace placeholder links with actual Stripe DonationCard in Resume Builder.', 'done', 'high', 'Feature', ARRAY['audit', 'monetization']),
('Audit: Check for Missing Metadata', 'Review all pages for proper SEO metadata and OpenGraph tags.', 'todo', 'medium', 'SEO', ARRAY['audit']),
('Audit: Standardize Loading States', 'Ensure all apps have consistent loading skeletons or spinners.', 'todo', 'low', 'UI', ARRAY['audit']);

-- 3. Technical Debt / Refactoring (Inferred)
INSERT INTO public.os_task (title, description, status, priority, category, tags) VALUES
('Refactor Admin Role Checks', 'Ensure all admin pages use the standardized "getUserRole" or "hasRole" utilities instead of ad-hoc checks.', 'todo', 'medium', 'Tech Debt', ARRAY['security', 'refactor']),
('Optimize Image Loading', 'Verify all images use Next.js Image component with proper sizing.', 'todo', 'low', 'Performance', ARRAY['audit']);
