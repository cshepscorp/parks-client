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
      <div
        className="flex flex-col items-center text-center py-32 gap-6 rounded-2xl mb-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://www.nps.gov/common/uploads/structured_data/68BFC1AC-BF96-629F-89D261D78F181C64.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* dark overlay so text is readable */}
        <div className="absolute inset-0 bg-black/50 rounded-2xl" />

        {/* content needs z-10 to sit above the overlay */}
        <h1 className="text-5xl font-bold tracking-tight text-white relative z-10">
          Discover America's Parks
        </h1>
        <p className="text-xl text-white/80 max-w-2xl relative z-10">
          Search, save, and plan road trips to national and state parks across the US.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg relative z-10">
          <input
            type="text"
            placeholder="Search parks..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-md border border-white/30 bg-white/20 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
          />
          <Button type="submit" className="bg-white text-black hover:bg-white/90">Search</Button>
        </form>
        {user && (
          <Button
            variant="outline"
            className="border-2 border-white text-white bg-white/20 hover:bg-white hover:text-black relative z-10 backdrop-blur-sm"
            onClick={() => navigate('/trips')}
          >
            My Trips
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