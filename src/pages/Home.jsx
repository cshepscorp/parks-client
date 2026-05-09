import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import ParkCard from '@/components/ParkCard';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [parks, setParks] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/parks?limit=9`)
      .then(res => res.json())
      .then(data => setParks(data.data || []));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex flex-col items-center text-center py-16 gap-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Discover America's Parks
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Search, save, and plan road trips to national and state parks across the US.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg">
          <input
            type="text"
            placeholder="Search parks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit">Search</Button>
        </form>
        {user && (
          <Button asChild variant="outline">
            <Link to="/trips">My Trips</Link>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-6">Featured Parks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parks.map(park => (
            <ParkCard key={park.id} park={park} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;