
-- Migrate career history for pjlosey
-- User ID: 23112883-3775-4994-a6c9-e66409535173

INSERT INTO os_user_work_history (user_id, role, team_name, start_date, end_date, is_current, description, series)
VALUES 
(
    '23112883-3775-4994-a6c9-e66409535173',
    'IndyCar Trackside Engineer',
    'Honda Racing Corporation',
    '2024-05-01',
    '2025-12-15',
    false,
    'Executed real-time setup calibration and optimization for HRC IndyCar powerplants. Utilized Pi Toolbox telemetry for immediate analysis of engine health, gearbox performance, and driver input correlation.',
    'IndyCar'
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Proton Therapy Engineer',
    'Siemens Healthineers',
    '2022-03-01',
    '2024-05-31',
    false,
    'Installed Varian ProBeam360 proton therapy system. Directed installation team of 10 electricians. Managed maintenance, site IT infrastructure, and daily Quality Assurance documentation.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Advanced Systems Engineer',
    'GETZ FIRE EQUIPMENT',
    '2021-04-01',
    '2022-04-30',
    false,
    'Installed and programmed commercial fire panel and alarm systems for high-value corporate clients (e.g., State Farm headquarters). Configured full system operation from wiring to final programming.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Car Chief',
    'Global Racing Group',
    '2021-01-01',
    '2021-04-30',
    false,
    'Lead mechanic for the #24 car in FR Americas. Managed vehicle setup, maintenance schedule, and crew workflow.',
    'FR Americas'
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Freelancer',
    'Losey.Co',
    '2002-01-01',
    null,
    true,
    'Independent technical services specialist focused on IT infrastructure and computer architecture. Delivered outsourced technical and data support (fly-in basis) directly to professional race teams.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Shipping Manager',
    'IMI MCR',
    '2001-06-01',
    '2002-06-30',
    false,
    'Managed daily shipping operations, overseeing the high-volume output of 50-100 pieces of equipment daily. Promoted from the assembly line role.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Manager',
    'McDonald''s',
    '1998-03-01',
    '2001-06-30',
    false,
    'Progressed to Shift Manager. Managed daily inventory, enforced labor budgets, set schedules, and handled financial closing procedures.',
    null
);
