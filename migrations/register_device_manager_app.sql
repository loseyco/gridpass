-- GridPass OS - Device Manager App Registration
-- This makes device management available as an OS app

INSERT INTO os_apps (
  slug,
  name,
  description,
  icon,
  version,
  schema
) VALUES (
  'device-manager',
  'Device Manager',
  'Manage your GridPass Clients and remote devices. Control sim rigs, view telemetry, and execute commands.',
  'Monitor',
  '1.0.0',
  '{
    "component": "Container",
    "children": [
      {
        "component": "Row",
        "children": [
          {
            "component": "GridButton",
            "props": {
              "label": "View All Devices",
              "variant": "primary",
              "href": "/devices"
            }
          }
        ]
      }
    ]
  }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  version = EXCLUDED.version,
  schema = EXCLUDED.schema,
  updated_at = now();
