import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowLeft, MapPin, Check } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../hooks/useAuth';
import ParkCard from '../components/ParkCard';

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['DC', 'Washington D.C.'],
];

const POPULAR_PARK_CODES = ['yell', 'yose', 'grca', 'grsm', 'romo', 'zion', 'olym', 'acad', 'glac'];

const ROUTES = [
  {
    id: 'southwest',
    name: 'Southwest Desert Loop',
    description: 'Red rock canyons, towering arches, and canyon country classics',
    parkCodes: ['grca', 'zion', 'brca', 'arch', 'cany'],
  },
  {
    id: 'pacific',
    name: 'Pacific Coast Drive',
    description: 'Ancient forests and dramatic coastline from California to Washington',
    parkCodes: ['redw', 'crla', 'olym'],
  },
  {
    id: 'rockies',
    name: 'Rocky Mountain Road Trip',
    description: 'Alpine peaks, ancient cliff dwellings, and dramatic canyon views',
    parkCodes: ['romo', 'grsa', 'meve', 'blca'],
  },
  {
    id: 'eastcoast',
    name: 'East Coast Classics',
    description: 'From the rocky Maine coast to the misty southern Appalachians',
    parkCodes: ['acad', 'shen', 'grsm'],
  },
];

const LIMIT = 9;

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-muted animate-pulse h-72" />
  );
}

function RouteCard({ route, coverPark, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer group h-48 w-full text-left"
    >
      {coverPark?.images?.[0] ? (
        <img
          src={coverPark.images[0].url}
          alt={coverPark.images[0].altText}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-600 to-stone-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="w-3.5 h-3.5 text-white/60" />
          <span className="text-white/60 text-xs">{route.parkCodes.length} parks</span>
        </div>
        <h3 className="text-white font-semibold text-lg leading-tight mb-1">{route.name}</h3>
        <p className="text-white/70 text-xs line-clamp-2">{route.description}</p>
      </div>
    </button>
  );
}

function Search() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [stateCode, setStateCode] = useState('');
  const [results, setResults] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [discoverParks, setDiscoverParks] = useState({});
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeSaved, setRouteSaved] = useState(false);
  const [addingToTripId, setAddingToTripId] = useState(null);
  const loaderRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);
  const hasInput = debouncedQuery.length >= 3 || stateCode !== '';

  useEffect(() => {
    const allCodes = [...new Set([...POPULAR_PARK_CODES, ...ROUTES.flatMap(r => r.parkCodes)])];
    fetch(`${import.meta.env.VITE_API_URL}/api/parks?parkCodes=${allCodes.join(',')}&limit=50`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        (data.data || []).forEach(p => { map[p.parkCode] = p; });
        setDiscoverParks(map);
      })
      .catch(() => {})
      .finally(() => setDiscoverLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/trips`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUserTrips(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (hasInput) setActiveRoute(null);
  }, [hasInput]);

  const addParksToTrip = async (tripId, parks) => {
    for (const park of parks) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npsId: park.parkCode,
            name: park.fullName,
            states: park.states,
            latitude: park.latitude,
            longitude: park.longitude,
            description: park.description,
            imageUrl: park.images?.[0]?.url || null,
          }),
        });
      } catch {
        // continue adding remaining parks even if one fails
      }
    }
  };

  const handleCreateTrip = async (route, parks) => {
    setSavingRoute(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: route.name }),
      });
      if (!res.ok) throw new Error('Failed to create trip');
      const newTrip = await res.json();
      await addParksToTrip(newTrip.id, parks);
      setUserTrips(prev => [...prev, newTrip]);
      setRouteSaved(true);
      setTimeout(() => setRouteSaved(false), 3000);
    } catch {
      // silently fail for now
    } finally {
      setSavingRoute(false);
    }
  };

  const handleAddAllToTrip = async (tripId, parks) => {
    setAddingToTripId(tripId);
    try {
      await addParksToTrip(tripId, parks);
      setRouteSaved(true);
      setTimeout(() => setRouteSaved(false), 3000);
    } finally {
      setAddingToTripId(null);
    }
  };

  const buildUrl = (q, state, startIndex) => {
    const params = new URLSearchParams({ start: startIndex, limit: LIMIT });
    if (q) params.set('q', q);
    if (state) params.set('stateCode', state);
    return `${import.meta.env.VITE_API_URL}/api/parks?${params}`;
  };

  const searchParks = async (q, state, startIndex = 0) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildUrl(q, state, startIndex));
      const data = await response.json();
      const newParks = data.data || [];
      setResults(prev => startIndex === 0 ? newParks : [...prev, ...newParks]);
      setStart(startIndex + LIMIT);
      setHasMore(newParks.length === LIMIT);
    } catch {
      setError('Failed to fetch parks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInput) {
      setResults([]);
      setStart(0);
      setHasMore(false);
      return;
    }
    searchParks(debouncedQuery.length >= 3 ? debouncedQuery : '', stateCode, 0);
  }, [debouncedQuery, stateCode]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        searchParks(debouncedQuery.length >= 3 ? debouncedQuery : '', stateCode, start);
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, start, debouncedQuery, stateCode]);

  const popularParks = POPULAR_PARK_CODES.map(code => discoverParks[code]).filter(Boolean).slice(0, 6);
  const routeParks = activeRoute
    ? activeRoute.parkCodes.map(code => discoverParks[code]).filter(Boolean)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Search Parks</h1>
        <p className="text-muted-foreground text-sm">Find national and state parks across the US</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, keyword..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={stateCode}
          onChange={e => setStateCode(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground w-full sm:w-auto"
        >
          <option value="">All states</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Search results */}
      {hasInput && (
        <>
          {error && <p className="text-destructive text-sm mb-4">{error}</p>}
          {!loading && results.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              {results.length} park{results.length !== 1 ? 's' : ''} found
              {debouncedQuery.length >= 3 ? ` for "${debouncedQuery}"` : ''}
              {stateCode ? ` in ${US_STATES.find(([c]) => c === stateCode)?.[1]}` : ''}
              {hasMore ? '+' : ''}
            </p>
          )}
          {loading && results.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(park => (
                <ParkCard key={park.id} park={park} />
              ))}
            </div>
          )}
          {loading && results.length > 0 && (
            <p className="text-sm text-muted-foreground text-center mt-6">Loading more...</p>
          )}
          {!loading && results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg font-medium mb-2">No parks found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term{stateCode ? ' or state' : ''}.
              </p>
            </div>
          )}
        </>
      )}

      {/* Active route view */}
      {!hasInput && activeRoute && (
        <>
          <button
            onClick={() => { setActiveRoute(null); setRouteSaved(false); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{activeRoute.name}</h2>
              <p className="text-muted-foreground text-sm">{activeRoute.description}</p>
            </div>
            {user && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {routeSaved ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <Check className="w-4 h-4" /> Saved!
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleCreateTrip(activeRoute, routeParks)}
                      disabled={savingRoute || !!addingToTripId}
                      className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {savingRoute ? 'Saving...' : '+ Create Trip'}
                    </button>
                    {userTrips.length > 0 && (
                      <select
                        defaultValue=""
                        disabled={savingRoute || !!addingToTripId}
                        onChange={e => {
                          if (e.target.value) handleAddAllToTrip(e.target.value, routeParks);
                          e.target.value = '';
                        }}
                        className="px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-foreground disabled:opacity-50"
                      >
                        <option value="" disabled>{addingToTripId ? 'Adding...' : 'Add all to...'}</option>
                        {userTrips.map(trip => (
                          <option key={trip.id} value={trip.id}>{trip.name}</option>
                        ))}
                      </select>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {routeParks.map(park => (
              <ParkCard key={park.parkCode} park={park} />
            ))}
          </div>
        </>
      )}

      {/* Discover section */}
      {!hasInput && !activeRoute && (
        <div className="space-y-12">
          <div>
            <h2 className="text-xl font-semibold mb-4">Popular Parks</h2>
            {discoverLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularParks.map(park => (
                  <ParkCard key={park.parkCode} park={park} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Popular Routes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROUTES.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  coverPark={discoverParks[route.parkCodes[0]]}
                  onClick={() => setActiveRoute(route)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={loaderRef} className="h-1" />
    </div>
  );
}

export default Search;
