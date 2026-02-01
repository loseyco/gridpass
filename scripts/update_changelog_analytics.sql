INSERT INTO changelogs (version, title, summary, published_at, is_public, changes)
VALUES (
  'v0.1.4',
  'Live Analytics & Tracking',
  'Introduced the new Live Analytics dashboard for real-time monitoring and integrated Google Analytics & Microsoft Clarity for deep user insights.',
  NOW(),
  true,
  '[
    {"type": "feature", "text": "Added <strong>Live Analytics Dashboard</strong> in Admin Console for real-time traffic monitoring."},
    {"type": "feature", "text": "Integrated <strong>Google Analytics 4</strong> for long-term traffic analysis."},
    {"type": "feature", "text": "Integrated <strong>Microsoft Clarity</strong> for heatmaps and session recording."},
    {"type": "improvement", "text": "Verified PageTracker integration for accurate internal metrics."}
  ]'::jsonb
);
