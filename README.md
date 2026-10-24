# PaBa (Paham Baca)

PaBa is an adaptive reading assistant designed to make digital reading easier for people with dyslexia and older adults. It includes adjustable reading styles, simplified text, reading materials, and Supabase-backed bookmarks and authentication.

In the reader, users can switch between the standard and locally hosted OpenDyslexic fonts, adjust text size and spacing, and reset reading display settings. The Gen-Z option displays a simpler, prewritten version of the material when available; original text is preserved.

The app reads reading materials from the configured Supabase project and uses the local catalog only when that read fails or Supabase is not configured. See the [Supabase and materials setup guide](docs/guides/SUPABASE_SETUP.md) for the active schema and bookmark requirements.

## Run locally

This repository is a static HTML, CSS, and JavaScript app. It does not include a Vite or npm setup.

Serve the repository root over HTTP (for example, with the VS Code Live Server extension), then open `index.html`. Serving over HTTP is required for the app's JavaScript modules.

The Supabase client is configured in `supabase.js`. Use only a Supabase publishable/anon key in the browser; never put a service-role key in frontend code.

## Project layout

- `index.html`, `login.html`, `verify-email.html` — application pages
- `script.js`, `auth.js`, `bookmarks.js`, `supabase.js` — application modules
- `style.css` — application styles
- `supabase/config.toml` — Supabase CLI project configuration
- `supabase/migrations/`, `supabase/seed.sql` — database schema and source-material seed
- `data/materials.js` — local fallback catalog for the five documented materials
- `assets/fonts/` — licensed, self-hosted OpenDyslexic font files
- `docs/` — setup and troubleshooting guides

See the [documentation index](docs/README.md) to find a guide.
