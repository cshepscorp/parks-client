import { useEffect, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import ParkCard from '../components/ParkCard';

function Search() {
  const [query, setQuery] = useState('');
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
        console.log('API url', `${import.meta.env.VITE_API_URL}/api/parks?q=${debouncedQuery}`)
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
    <div>
      <input
        type="text"
        placeholder="Search parks..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading && <p>Searching...</p>}
      {error && <p>{error}</p>}

      <div>
        {results.map(park => (
          <ParkCard key={park.id} park={park} />
          // <div key={park.id}>

          //   <h2>{park.fullName}</h2>
          //   <p>{park.states}</p>
          // </div>
        ))}
      </div>
    </div>
  );
}

export default Search;