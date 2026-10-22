# PaBa (Paham Baca)

PaBa is an adaptive reading assistant designed to make digital reading easier for people with dyslexia and older adults. It includes adjustable reading styles, simplified text, reading materials, and Supabase-backed bookmarks and authentication.

## Run locally

This repository is a static HTML, CSS, and JavaScript app. It does not include a Vite or npm setup.

Serve the repository root over HTTP (for example, with the VS Code Live Server extension), then open `index.html`. Serving over HTTP is required for the app's JavaScript modules.

The Supabase client is configured in `supabase.js`. Use only a Supabase publishable/anon key in the browser; never put a service-role key in frontend code.

## Project layout

- `index.html`, `login.html`, `verify-email.html` — application pages
- `script.js`, `auth.js`, `bookmarks.js`, `supabase.js` — application modules
- `style.css` — application styles
- `supabase/config.toml` — Supabase CLI project configuration
- `docs/` — setup and troubleshooting guides

See the [documentation index](docs/README.md) to find a guide.
