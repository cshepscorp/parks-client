import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import ParkCard from '../components/ParkCard';
// import { mockParks } from '../api/mockParks';

function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loaderRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  const searchParks = async (searchQuery, startIndex = 0) => {
    if (loading) return; // add this to prevent multiple simultaneous fetches
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/parks?q=${searchQuery}&start=${startIndex}&limit=9`);
      const data = await response.json();
      const newParks = data.data || [];
      // const newParks = mockParks;
      setResults(prev => startIndex === 0 ? newParks : [...prev, ...newParks]);
      setStart(startIndex + 9)
      setHasMore(newParks.length === 9);
    } catch (error) {
      setError('Failed to fetch parks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      setStart(0);
      setHasMore(false);
      return;
    }

    searchParks(debouncedQuery, 0);
  }, [debouncedQuery])

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      console.log('observer fired', {
        isIntersecting: entries[0].isIntersecting,
        hasMore,
        loading
      });
      if (entries[0].isIntersecting && hasMore && !loading) {
        searchParks(debouncedQuery, start);
      }
    });

    // tells the observer to watch that element
    observer.observe(loaderRef.current);

    return () => observer.disconnect();

  }, [hasMore, loading, start, debouncedQuery]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search parks..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {loading && <p className="text-muted-foreground">Searching...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(park => (
          <ParkCard key={park.id} park={park} />
        ))}
      </div>
      <div ref={loaderRef} className="h-1" />
    </div>
  );
}

export default Search;