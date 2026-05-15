import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import ParkCard from '@/components/ParkCard';
import { MapPin } from 'lucide-react';

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

const heroImages = [
  'https://www.nps.gov/common/uploads/structured_data/68BFC1AC-BF96-629F-89D261D78F181C64.jpg',
  'https://www.nps.gov/common/uploads/structured_data/3C7B477B-1DD8-B71B-0BCB48E009241BAA.jpg',
  'https://www.nps.gov/common/uploads/structured_data/3C7A058F-1DD8-B71B-0B188ED102F7285F.jpg',
  'https://www.nps.gov/common/uploads/structured_data/3C861263-1DD8-B71B-0B71EF9B95F9644F.jpg',
];

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RouteCard({ route, coverPark }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/search?route=${route.id}`)}
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

function SkeletonCard() {
  return <div className="rounded-2xl overflow-hidden bg-muted animate-pulse h-72" />;
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [nearbyParks, setNearbyParks] = useState([]);
  const [routeCoverParks, setRouteCoverParks] = useState({});
  const [parksLoading, setParksLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | granted | denied

  // Hero rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch popular parks (fallback) + route cover images on mount
  useEffect(() => {
    const routeCoverCodes = ROUTES.map(r => r.parkCodes[0]);
    const allCodes = [...new Set([...POPULAR_PARK_CODES, ...routeCoverCodes])];
    fetch(`${import.meta.env.VITE_API_URL}/api/parks?parkCodes=${allCodes.join(',')}&limit=50`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        (data.data || []).forEach(p => { map[p.parkCode] = p; });
        setRouteCoverParks(map);
        const popular = POPULAR_PARK_CODES.map(code => map[code]).filter(Boolean).slice(0, 6);
        setNearbyParks(popular);
      })
      .catch(() => {})
      .finally(() => setParksLoading(false));
  }, []);

  // Auto-fetch nearby parks if geolocation already granted
  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') fetchNearbyParks();
    }).catch(() => {});
  }, []);

  const fetchNearbyParks = () => {
    if (!navigator.geolocation) return;
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const geoData = await geoRes.json();

          // BigDataCloud may return "CA" or "US-CA" — normalize to 2-letter code
          let stateCode = geoData.principalSubdivisionCode || '';
          if (stateCode.includes('-')) stateCode = stateCode.split('-').pop();
          stateCode = stateCode.trim().toUpperCase();

          if (!stateCode || stateCode.length !== 2) throw new Error(`Unexpected state code: "${stateCode}"`);

          const parksRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/parks?stateCode=${stateCode}&limit=50`
          );
          const parksData = await parksRes.json();

          const sorted = (parksData.data || [])
            .filter(p => p.latitude && p.longitude)
            .map(p => ({
              ...p,
              _distance: distanceMiles(latitude, longitude, parseFloat(p.latitude), parseFloat(p.longitude)),
            }))
            .sort((a, b) => a._distance - b._distance)
            .slice(0, 6);

          if (sorted.length > 0) {
            setNearbyParks(sorted);
            setLocationStatus('granted');
          } else {
            setLocationStatus('denied');
          }
        } catch (err) {
          console.error('[nearby parks] error:', err);
          setLocationStatus('denied');
        }
      },
      () => setLocationStatus('denied')
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const parksTitle = locationStatus === 'granted' ? 'Parks near you' : 'Popular Parks';

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

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16 space-y-14">
        {/* Parks near you / Popular Parks */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{parksTitle}</h2>
            {locationStatus === 'idle' && navigator.geolocation && (
              <button
                onClick={fetchNearbyParks}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Near me
              </button>
            )}
            {locationStatus === 'loading' && (
              <span className="text-sm text-muted-foreground">Detecting location...</span>
            )}
          </div>
          {parksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyParks.map(park => (
                <ParkCard key={park.parkCode || park.id} park={park} />
              ))}
            </div>
          )}
        </section>

        {/* Popular Routes */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Popular Routes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROUTES.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                coverPark={routeCoverParks[route.parkCodes[0]]}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Home;
