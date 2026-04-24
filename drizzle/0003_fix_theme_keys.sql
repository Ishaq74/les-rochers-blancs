-- Migration: Fix theme_settings keys to match actual CSS custom property names
-- Old keys used a "-color" suffix (e.g. "primary-color") which never matched
-- the CSS variables (e.g. --primary). This removes stale rows so the admin
-- panel starts clean with the corrected key names.

DELETE FROM theme_settings
WHERE setting_key IN (
  'primary-color',
  'primary-foreground-color',
  'background-color',
  'text-color',
  'border-color',
  'radius-md',
  'font-heading',
  'font-body'
);
