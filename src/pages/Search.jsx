import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
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

const LIMIT = 9;

function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [stateCode, setStateCode] = useState('');
  const [results, setResults] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loaderRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  const hasInput = debouncedQuery.length >= 3 || stateCode !== '';

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

  const clearQuery = () => setQuery('');

  const inputClass = "w-full pl-10 pr-10 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const selectClass = "px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground w-full sm:w-auto";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Search Parks</h1>
        <p className="text-muted-foreground text-sm">Find national and state parks across the US</p>
      </div>

      {/* Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, keyword..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={inputClass}
          />
          {query && (
            <button
              onClick={clearQuery}
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
          className={selectClass}
        >
          <option value="">All states</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Results meta */}
      {hasInput && !loading && results.length > 0 && (
        <p className="text-sm text-muted-foreground mb-4">
          {results.length} park{results.length !== 1 ? 's' : ''} found
          {debouncedQuery.length >= 3 ? ` for "${debouncedQuery}"` : ''}
          {stateCode ? ` in ${US_STATES.find(([c]) => c === stateCode)?.[1]}` : ''}
          {hasMore ? '+' : ''}
        </p>
      )}

      {/* States */}
      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(park => (
            <ParkCard key={park.id} park={park} />
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && results.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border bg-card animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && results.length > 0 && (
        <p className="text-sm text-muted-foreground text-center mt-6">Loading more...</p>
      )}

      {/* Empty state */}
      {!loading && hasInput && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">No parks found</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term{stateCode ? ' or state' : ''}.
          </p>
        </div>
      )}

      {/* Prompt state */}
      {!loading && !hasInput && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2">Search for a park</p>
          <p className="text-sm text-muted-foreground">Enter a name, keyword, or filter by state to get started.</p>
        </div>
      )}

      <div ref={loaderRef} className="h-1" />
    </div>
  );
}

export default Search;
