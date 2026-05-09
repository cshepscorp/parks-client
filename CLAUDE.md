# parks-client

Frontend for the Parks App — a national and state parks trip planning application.
Built with React + Vite. Talks to the `parks-api` Express backend.

## Project overview

A trip planning app that lets users search national and state parks, save
favorites, and plan road trips with ordered stops and drive time estimates.
This repo is the **React frontend only**. The Express backend lives in a
separate repo (`parks-api`).

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Learn the layers explicitly — separate from backend |
| Routing | React Router v6 | Standard client-side routing |
| Auth state | Context API + useAuth hook | Global auth state without extra libraries |
| Styling | TBD — considering Claude Design for prototyping |  |
| Map | TBD — Mapbox or Google Maps | |

## Environment

- Node.js v24.14.1
- Runs on port 5174 locally (5173 in use by another project)
- Backend runs on port 3000

## Environment variables

Vite env vars must be prefixed with `VITE_` to be exposed to the browser.
Access them via `import.meta.env.VITE_API_URL` — NOT `process.env`.

```
VITE_API_URL=http://localhost:3000
```

## Folder structure

```
src/
  components/    ← reusable UI (NavBar, ParkCard, etc)
  pages/         ← page components (Home, Search, etc)
  hooks/         ← useAuth.jsx and future custom hooks
  api/           ← functions that call the Express backend
  App.jsx        ← routes defined here
  main.jsx       ← BrowserRouter + AuthProvider wrap here
```

## Key conventions

**Routing**
- `<Link to='/path'>` — for internal React routes
- `<a href='url'>` — for Express server URLs or external links
- Routes are defined in `App.jsx` using `<Routes>` and `<Route>`

**Auth**
- Auth state lives in `AuthProvider` — wraps the whole app in `main.jsx`
- `useAuth()` hook returns `{ user, loading }` from anywhere in the app
- `user` is null if not logged in, or `{ userId, email, iat, exp }` if logged in
- On app load, `useAuth` calls `GET /auth/me` to check auth state
- `credentials: 'include'` is required on ALL fetch calls that need auth
- Sign in → redirect to `VITE_API_URL/auth/google` (Express handles OAuth)
- Sign out → redirect to `VITE_API_URL/auth/logout` (Express clears cookie)
- HttpOnly cookie is invisible to JavaScript — never try to read it directly

**Fetch calls**
Always use `credentials: 'include'` for authenticated requests:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
  credentials: 'include'
})
```

## Getting started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Update VITE_API_URL if your backend runs on a different port

# Start dev server
npm run dev
```

## Current status

- [x] Vite + React scaffolded
- [x] React Router set up with BrowserRouter
- [x] AuthProvider context wrapping the app
- [x] useAuth hook — calls /auth/me on load
- [x] NavBar — shows Sign in/Log out based on auth state
- [x] Home page placeholder
- [x] Search page — debounced input, calls GET /api/parks?q=keyword, renders results
- [x] ParkCard component — shows name, states, description, favorite button
- [x] Park detail page — full park info from GET /api/parks/:parkCode
- [x] Favorites button — POST /api/favorites, toggles to "Favorited ★" on success
- [ ] Trips page
- [ ] Map integration (Mapbox)
- [ ] Styling pass — everything is unstyled, functional only
- [ ] Load user's existing favorites on search page so favorited parks show correctly on load

## Known issues / next session notes

- Favorite button shows "Add to Faves" on every page load even if already favorited
  — needs GET /api/favorites on mount to check existing favorites
- NavBar items running together — needs CSS spacing
- No loading state shown during park detail fetch
- console.log statements cleaned up in favorites.js but double check parks.js

## Next steps

1. Trips page — list user's saved trips, create new trip
2. Map integration — Mapbox with synchronized pins on search results
3. Styling pass — consider Claude Design for prototyping the visual design
4. Load existing favorites on search page mount
5. Add favorite button to ParkDetail page too