-- 1. Create the changelogs table
create table if not exists changelogs (
  id uuid default gen_random_uuid() primary key,
  version text not null,
  title text not null,
  summary text,
  changes jsonb not null default '[]'::jsonb, -- Array of { type: 'feature'|'fix'|'improvement', text: string }
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table changelogs enable row level security;

-- 3. Policies
-- Public read access
create policy "Public can view changelogs" 
  on changelogs for select 
  using (true);

-- Admin write access (Insert)
create policy "Admins can insert changelogs" 
  on changelogs for insert 
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('superadmin', 'admin')
    )
  );

-- Admin write access (Update)
create policy "Admins can update changelogs" 
  on changelogs for update 
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('superadmin', 'admin')
    )
  );

-- Admin write access (Delete)
create policy "Admins can delete changelogs" 
  on changelogs for delete 
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('superadmin', 'admin')
    )
  );

-- 4. Seed Data (Preserving existing JSON history)
INSERT INTO changelogs (version, published_at, title, summary, changes)
VALUES
(
    'v0.1.0',
    '2026-01-29 12:00:00+00',
    'The Awakening (Alpha)',
    'GridPass enters the era of automated intelligence.',
    '[
        {"type": "feature", "text": "Launched **Local SEO Agent** to automate 2026 search standards."},
        {"type": "feature", "text": "Deployed **Project Manager AI** to coordinate local experts."},
        {"type": "fix", "text": "Resolved startup crashes in the **AI HUD**."}
    ]'::jsonb
),
(
    'v0.0.5',
    '2026-01-25 12:00:00+00',
    'ShopManager Integration',
    'Connecting the physical world to the digital grid.',
    '[
        {"type": "feature", "text": "Added support for **ShopManager** API integration."},
        {"type": "improvement", "text": "Enhanced **User Authentication** flow with faster redirects."}
    ]'::jsonb
),
(
    'v0.1.1',
    now(),
    'Identity & Integrity',
    'Refining the visual language and restoring order to the directory.',
    '[
        {"type": "feature", "text": "Deployed **New Brand Identity** with high-contrast GridPass typography across the platform."},
        {"type": "fix", "text": "Restored **Founder Status** verification, ensuring Gold Badge recognition for limited members."},
        {"type": "improvement", "text": "Enhanced **Directory Filters** to ensure only active, verified members appear in public listings."},
        {"type": "feature", "text": "Launched **Live Changelog System** to track platform evolution in real-time."}
    ]'::jsonb
);
