import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import ParkCard from '../components/ParkCard';

function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }

    const searchParks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/parks?q=${debouncedQuery}`);
        const data = await response.json();
        setResults(data.data)
      } catch (error) {
        setError('Failed to fetch parks');
      } finally {
        setLoading(false);
      }
    };

    searchParks();
  }, [debouncedQuery])

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
    </div>
  );
}

export default Search;