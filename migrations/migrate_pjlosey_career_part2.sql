
-- Supplemental migration for pjlosey career history
-- User ID: 23112883-3775-4994-a6c9-e66409535173

INSERT INTO os_user_work_history (user_id, role, team_name, start_date, end_date, is_current, description, series)
VALUES 
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Data Engineer / Race Strategist',
    'Multiple Teams', -- Inferred
    '2018-01-01', -- Estimated/Placeholder
    '2021-01-01',
    false,
    'Developed real-time race strategies based on data analysis. Managed MoTeC/Cosworth data logging and telemetry from all race cars. Served as IT Coordinator, maintaining trackside technical equipment and managing live timing/scoring infrastructure.',
    'SRO / IMSA'
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Team Manager / Electronics Engineer',
    'Davidson Racing', -- Found in search results
    '2015-01-01', -- Estimated/Placeholder
    '2018-01-01',
    false,
    'Managed all logistics, team operations, travel, and race strategy. Built and maintained race cars and high-value collection vehicles. Core technical duties included designing Mil-Spec wiring harnesses and programming engine control units (ECUs).',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Data Engineer / Fueler',
    'World Challenge / Grand-AM Teams',
    '2012-01-01', -- Estimated/Placeholder
    '2015-01-01',
    false,
    'Performed data acquisition and analysis for professional World Challenge and Grand-AM teams. Managed hot/cold tire pressures and temperatures. Executed critical car fueling operations during races.',
    'World Challenge / Grand-AM'
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Manager - Multiple Positions',
    'Ford / Dodge Dealership',
    '2008-01-01', -- Estimated/Placeholder
    '2012-01-01',
    false,
    'Managed Service Operations, daily workflow, and inventory control for Ford/Dodge dealership. Operated as primary IT Coordinator, maintaining dealership technical infrastructure.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Automotive Installer',
    'MECP Certified',
    '2005-01-01', -- Estimated/Placeholder
    '2008-01-01',
    false,
    'Certified MECP mobile installer. Installed aftermarket electronic systems, including advanced stereo configurations, security systems, and remote start installations.',
    null
),
(
    '23112883-3775-4994-a6c9-e66409535173',
    'Paper Boy',
    'Register Mail', -- From first migration but maybe missed or duplicate? It was in the first json.
    '1996-01-01',
    '1998-03-31',
    false,
    'Executed daily, seven-day-a-week delivery route serving the commercial business district. Demonstrated punctuality and reliability.',
    null
)
ON CONFLICT DO NOTHING;
