# Pie-Dash Frontend Build Plan

Last updated: 2025-08-20T02:11:51+05:30

## Steps
1. Preflight: Verify Node and npm versions
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Preview: `npm run preview`
5. (Optional) Typecheck: `npm run typecheck`

## Environment
- Uses Vite variables from `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_PPQ_API_KEY` (PPQ.AI client key; see security notes)

## Notes
- Build script in `package.json`: `vite build`
- Vite config file: `vite.config.ts`
- Changes applied:
  - React and React-DOM pinned to `^18.2.0`
  - Removed `eslint-config-next` (using ESLint flat config)
  - Updated build script to only run Vite (typecheck separated)
  - Upgraded `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` to `^8.x` (compatible with ESLint 9)

## Deployment (Netlify)
1. Netlify config added: `netlify.toml`
   - `[build] command = "npm run build"`, `publish = "dist"`
   - SPA redirect enabled (/* -> /index.html, 200)
   - Node runtime pinned: `NODE_VERSION=20`
2. Configure env vars in Netlify UI (Site settings > Environment):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PPQ_API_KEY` (Note: exposed to client if used directly)
3. Deploy: connect repo or use CI; alternatively deploy via agent tools.
4. Post-deploy checks: homepage loads, API calls succeed, routes work (SPA).

Security note: For production, proxy PPQ.AI via a Netlify Function to keep API key server-side. Client calls the function endpoint; the function adds the Authorization header using a server env var.

## Stack alignment (verified)
- Frontend: React 18 + TypeScript
- Database: Supabase via `src/services/supabaseClient.ts`
- Styling: Tailwind CSS + shadcn-style components in `src/components/ui/`
- Charts: Recharts (`src/components/ChartDemo.tsx`, dashboard overview charts)
- Maps: Leaflet.js + OpenStreetMap (`src/components/MapDemo.tsx`)
- Routing: OSRM via `src/services/routingService.ts` and `src/hooks/useRouting.ts`
- State: React Context + useState (`src/contexts/AppContext.tsx`)

## Status
- Preflight: completed
- Install deps: pending
- Build: pending
- Preview: pending
