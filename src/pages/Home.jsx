import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import ParkCard from '@/components/ParkCard';
import { mockParks } from '#src/api/mockParks.js';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [parks, setParks] = useState([]);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const LIMIT = 9;

  const offlineMode = false; // set to true to use mock data and avoid hitting API rate limits during development

  const heroImages = [
    'https://www.nps.gov/common/uploads/structured_data/68BFC1AC-BF96-629F-89D261D78F181C64.jpg',
    'https://www.nps.gov/common/uploads/structured_data/3C7B477B-1DD8-B71B-0BCB48E009241BAA.jpg',
    'https://www.nps.gov/common/uploads/structured_data/3C7A058F-1DD8-B71B-0B188ED102F7285F.jpg',
    'https://www.nps.gov/common/uploads/structured_data/3C861263-1DD8-B71B-0B71EF9B95F9644F.jpg',
  ];

  const fetchParks = async (startIndex) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/parks?limit=${LIMIT}&start=${startIndex}`);
    const data = await res.json();
    const newParks = data.data || [];

    const parksToUse = offlineMode ? mockParks : newParks;
    
    setParks(prev => startIndex === 0 ? parksToUse : [...prev, ...parksToUse]);
    setStart(startIndex + LIMIT);
    setHasMore(newParks.length === LIMIT);
  };

  useEffect(() => {
    fetchParks(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${query}`);
    }
  };

  return (
    <>
      {/* Hero */}
      <div
        className="flex flex-col justify-end pb-20 sm:pb-28 pt-24 gap-4 sm:gap-6 relative overflow-hidden"
        style={{
          backgroundImage: `url(${heroImages[heroIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '600px',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80 dark:to-background" />

        {/* <div className="w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-4 sm:gap-6"> */}
          <div className="w-full max-w-6xl mx-auto px-6 relative z-10 flex flex-col gap-4 sm:gap-6 items-start sm:items-center text-left sm:text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Parks of the United States
          </h1>
          <p className="text-base sm:text-xl text-white/80 max-w-2xl">
            Search, fav, and plan road trips to US national and state parks.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-lg">
            <input
              type="text"
              placeholder="Search parks..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2 rounded-md border border-white/30 bg-white/20 text-white placeholder:text-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            />
            <Button type="submit" className="bg-white text-black hover:bg-white/90 flex-shrink-0">
              Search
            </Button>
          </form>
          {user && (
            <Button
              variant="outline"
              className="border-2 border-white text-white bg-white/20 hover:bg-white hover:text-black backdrop-blur-sm hidden sm:flex w-fit"
              onClick={() => navigate('/trips')}
            >
              My Trips
            </Button>
          )}
        </div>
      </div>

      {/* Featured Parks */}
      <div className="max-w-6xl mx-auto px-6 pt-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-6">Featured Parks</h2>
          {!loading && parks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Unable to load parks right now. Try refreshing.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {parks.map(park => (
              <ParkCard key={park.id} park={park} />
            ))}
          </div>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8 mb-12">
          <Button variant="outline" onClick={() => fetchParks(start)}>
            Load More Parks
          </Button>
        </div>
      )}
    </>
  );
}

export default Home;