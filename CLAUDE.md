# parks-client

Frontend for the Parks App — a national and state parks trip planning application.
Built with React + Vite. Talks to the `parks-api` Express backend.

## Project overview

A trip planning app that lets users search national and state parks, save
favorites, and plan road trips with ordered stops. This repo is the **React frontend only**. The Express backend lives in a separate repo (`parks-api`).

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Learn the layers explicitly — separate from backend |
| Routing | React Router v6 | Standard client-side routing |
| Auth state | Context API + useAuth hook | Global auth state without extra libraries |
| Styling | Shadcn/ui + Tailwind CSS | Component library with Luma/Olive preset |
| Icons | Lucide React | Included with Shadcn |

## Environment

- Node.js v24.14.1
- Runs on port 5174 locally (5173 in use by another project)
- Backend runs on port 3000 locally, `https://api.christinasheppard.com` in production

## Environment variables

Vite env vars must be prefixed with `VITE_` to be exposed to the browser.
Access them via `import.meta.env.VITE_API_URL` — NOT `process.env`.

```
VITE_API_URL=http://localhost:3000
```

## Folder structure

```
src/
  components/      ← NavBar, ParkCard
  components/ui/   ← Shadcn components (button, card, popover, alert-dialog, etc)
  pages/           ← Home, Search, ParkDetail, Trips, Favorites
  hooks/           ← useAuth.jsx, useDebounce.js
  api/             ← mockParks.js (for dev when NPS rate limited)
  lib/             ← utils.js (Shadcn cn helper)
  App.jsx          ← routes defined here
  main.jsx         ← BrowserRouter + AuthProvider wrap here
```

## Key conventions

**Routing**
- `<Link to='/path'>` — for internal React routes
- `<a href='url'>` — for Express server URLs or external links
- Routes defined in `App.jsx`: /, /search, /parks/:parkCode, /trips, /favorites

**Auth**
- Auth state lives in `AuthProvider` — wraps the whole app in `main.jsx`
- `useAuth()` hook returns `{ user, loading }` from anywhere in the app
- `user` is null if not logged in, or `{ userId, email, iat, exp }` if logged in
- On app load, `useAuth` calls `GET /auth/me` to check auth state
- `credentials: 'include'` is required on ALL fetch calls that need auth
- Sign in → `<a href={VITE_API_URL/auth/google}>` — never use Link for this
- Sign out → `<a href={VITE_API_URL/auth/logout}>` — never use Link for this
- HttpOnly cookie is invisible to JavaScript — never try to read it directly

**Fetch calls**
Always use `credentials: 'include'` for authenticated requests:
```javascript
fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
  credentials: 'include'
})
```

**Shadcn/Tailwind**
- Never use `asChild` on native DOM elements — causes React warnings
- Use `<a>` tags directly with Tailwind classes instead of `<Button asChild><a>`
- Shadcn components live in `src/components/ui/`
- Import with `@/components/ui/button` etc (path alias configured)

**NPS API data shape vs our database shape**
NPS API returns: `fullName`, `parkCode`, `latitude`, `longitude`, `images[]`
Our database returns: `name`, `npsId`, `lat`, `lng`, `imageUrl`
When rendering favorites/trips (from our DB), map fields before passing to ParkCard:
```javascript
park={{
  fullName: favorite.park.name,
  parkCode: favorite.park.npsId,
  images: favorite.park.imageUrl ? [{ url: favorite.park.imageUrl }] : [],
  ...
}}
```

## NavBar behavior
- Transparent + white text on Home page (`isHome` check via `useLocation`)
- Sticky + white background on all other pages
- Nav links hidden on mobile (`hidden sm:block`)
- Uses `useLocation` to detect home page for conditional styling

## Getting started

```bash
npm install
cp .env.example .env
# set VITE_API_URL=http://localhost:3000
npm run dev
```

## Current status — all core features complete

- [x] React + Vite + React Router v6
- [x] Shadcn/ui + Tailwind styling (Luma preset, Olive base, Amber accent)
- [x] AuthProvider + useAuth hook
- [x] NavBar — transparent on home, sticky elsewhere, mobile responsive
- [x] Home page — rotating hero images, search bar, featured parks grid, load more
- [x] Search page — debounced search, infinite scroll, empty/error states
- [x] ParkCard — full bleed image, heart overlay, gradient, hover zoom
- [x] ParkDetail — full bleed hero, park info, weather, fees, activities
- [x] Favorites button on ParkCard and ParkDetail (heart icon, toggles)
- [x] Favorites page — grid of favorited parks with images
- [x] Trips page — list trips, create trip, filter, delete with AlertDialog
- [x] Add park to trip from ParkDetail (Popover with trip list)
- [x] Remove park from trip with AlertDialog confirmation
- [x] Parks shown inside each trip as scrollable thumbnails

## Remaining / nice to have

- [ ] Map integration (Mapbox) — Mapbox account exists, token in .env
- [ ] Dark mode toggle
- [ ] isFavorite state doesn't persist on Search page across sessions
- [ ] Hamburger menu for mobile nav
- [ ] ParkCard on Favorites/Trips shows "Add to Favorites" button — should show unfavorite

## Known gotchas

- NPS API rate limit: 1000 req/hour. Use `src/api/mockParks.js` when rate limited
- `start` parameter must be forwarded in Express parks route for pagination to work
- IntersectionObserver for infinite scroll — `hasMore` must start as `false`
- Delete trip must delete TripPark records first (cascade) 
- Park upsert `update` block must include `imageUrl` or it won't save on re-favorite