import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

import { useAuth } from '../hooks/useAuth';

function ParkDetail({ isFavorite: initialIsFavorite = false }) {
    const { parkCode } = useParams();
    const { user } = useAuth();
    const [park, setPark] = useState(null);
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [trips, setTrips] = useState([]);
    const [addedToTrips, setAddedToTrips] = useState([]); // track which trips this park was added to
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFavoritesClick = async (e) => {
        e.stopPropagation(); // prevents the card click from firing when clicking the button
        try {
            if (isFavorite) {
                // remove from favorites
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${park.parkCode}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Error status: ${response.status}, something went wrong`)
                }
                setIsFavorite(false);
                // if (handleUnfavorite) {
                //     handleUnfavorite();
                // }
            } else {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        npsId: park.parkCode,
                        name: park.fullName,
                        states: park.states,
                        latitude: park.latitude,
                        longitude: park.longitude,
                        description: park.description,
                        imageUrl: park.images?.[0]?.url || null,
                    })
                });

                if (!response.ok) {
                    throw new Error(`Error status: ${response.status}, something went wrong`)
                }
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Failed to add favorite:', error);
        }
    };

    const handleAddToTrip = async (tripId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    npsId: park.parkCode,
                    name: park.fullName,
                    states: park.states,
                    latitude: park.latitude,
                    longitude: park.longitude,
                    description: park.description,
                    imageUrl: park.images?.[0]?.url || null,
                })
            });

            if (response.status === 409) {
                // already in trip — just mark it as added in UI
                setAddedToTrips(prev => [...prev, tripId]);
                return;
            }

            if (!response.ok) {
                throw new Error(`Error status: ${response.status}, something went wrong. Failed to add to trip.`)
            }
            setAddedToTrips(prev => [...prev, tripId]);
        } catch (error) {
            console.error('Failed to add park to trip:', error);
        }

    };

    useEffect(() => {
        if (!user) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const alreadyFavorited = data.some(fav => fav.park.npsId === parkCode);
                setIsFavorite(alreadyFavorited);
            })
            .catch(err => console.error('Failed to check favorites:', err));
    }, [user, parkCode]);

    useEffect(() => {
        if (!user) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setTrips(data);
                // check which trips already contain this park
                const alreadyAdded = data
                    .filter(trip => trip.tripParks.some(tp => tp.park.npsId === parkCode))
                    .map(trip => trip.id);
                setAddedToTrips(alreadyAdded);
            })
            .catch(err => console.error('Failed to load trips:', err));
    }, [user, parkCode]);

    useEffect(() => {
        const getPark = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/parks/${parkCode}`);
                const data = await response.json();

                setPark(data.data[0])
            } catch (error) {
                setError('Failed to fetch park details');
            } finally {
                setLoading(false);
            }
        };
        getPark();
    }, [parkCode]);

    if (loading) return <p className="max-w-4xl mx-auto px-6 py-8">Loading...</p>;
    if (error) return <p className="max-w-4xl mx-auto px-6 py-8">{error}</p>;
    if (!park) return null;

    return (
  <div>
    {/* Full bleed hero */}
    <div className="relative h-96 w-full">
      {park.images?.[0] ? (
        <img
          src={park.images[0].url}
          alt={park.images[0].altText}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900" />
      )}
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* park name overlaid on image */}
      <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-2">{park.fullName}</h1>
        <p className="text-white/70 text-sm uppercase tracking-wide">
          {park.designation} · {park.states}
        </p>
      </div>

      {/* action buttons overlaid top right */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Popover>
            <PopoverTrigger className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-black/40 backdrop-blur-sm text-white border border-white/20 rounded-md hover:bg-black/60 transition-colors">
              + Add to Trip
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              {trips.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No trips yet. Create one first.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {trips.map(trip => (
                    <button
                      key={trip.id}
                      onClick={() => !addedToTrips.includes(trip.id) && handleAddToTrip(trip.id)}
                      disabled={addedToTrips.includes(trip.id)}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors w-full ${
                        addedToTrips.includes(trip.id)
                          ? 'text-muted-foreground cursor-not-allowed'
                          : 'hover:bg-accent cursor-pointer'
                      }`}
                    >
                      {addedToTrips.includes(trip.id) ? '✓ ' : ''}{trip.name}
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <button
            onClick={handleFavoritesClick}
            className="p-2 bg-black/40 backdrop-blur-sm border border-white/20 rounded-md hover:bg-black/60 transition-colors"
          >
            <Heart
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`}
          />
          </button>
        </div>
      )}
    </div>

    {/* content */}
    <div className="max-w-4xl mx-auto px-6 py-8">
      <p className="text-base leading-relaxed mb-8">{park.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Weather</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{park.weatherInfo}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-3">Directions</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{park.directionsInfo}</p>
          {park.directionsUrl && (
            <a
              href={park.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Get directions →
            </a>
          )}
        </div>
      </div>

      {park.entranceFees?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h2 className="font-semibold mb-3">Entrance Fees</h2>
          <div className="flex flex-col gap-3">
            {park.entranceFees.map((fee, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{fee.title}</span>
                <span className="font-medium">${fee.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {park.activities?.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Activities</h2>
          <div className="flex flex-wrap gap-2">
            {park.activities.map(activity => (
              <span
                key={activity.id}
                className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
              >
                {activity.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)

    // return (
    //     <div className="max-w-4xl mx-auto px-6 py-8">
    //         {park.images?.[0] && (
    //             <img
    //                 src={park.images[0].url}
    //                 alt={park.images[0].altText}
    //                 className="w-full h-72 object-cover rounded-xl mb-8"
    //             />
    //         )}

    //         <div className="mb-6 relative flex items-start justify-between">
    //             <div>
    //                 <h1 className="text-4xl font-bold mb-2">{park.fullName}</h1>
    //                 <p className="text-muted-foreground text-sm uppercase tracking-wide">
    //                     {park.designation} · {park.states}
    //                 </p>
    //             </div>

    //             {user && (
    //                 <div className="flex items-center gap-3 mt-1">
    //                     <Popover>
    //                         <PopoverTrigger className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-accent transition-colors">
    //                             + Add to Trip
    //                         </PopoverTrigger>
    //                         <PopoverContent className="w-56 p-2">
    //                             {trips.length === 0 ? (
    //                                 <p className="text-sm text-muted-foreground p-2">No trips yet. Create one first.</p>
    //                             ) : (
    //                                 <div className="flex flex-col gap-1">
    //                                     {trips.map(trip => (
    //                                         <button
    //                                             key={trip.id}
    //                                             onClick={() => handleAddToTrip(trip.id)}
    //                                             disabled={addedToTrips.includes(trip.id)}
    //                                             className={`text-left px-3 py-2 rounded-md text-sm transition-colors w-full ${addedToTrips.includes(trip.id)
    //                                                 ? 'text-muted-foreground cursor-not-allowed'
    //                                                 : 'hover:bg-accent cursor-pointer'
    //                                                 }`}
    //                                         >
    //                                             {addedToTrips.includes(trip.id) ? '✓ ' : ''}{trip.name}
    //                                         </button>
    //                                     ))}
    //                                 </div>
    //                             )}
    //                         </PopoverContent>
    //                     </Popover>

    //                     <button
    //                         onClick={handleFavoritesClick}
    //                         className="p-1.5 hover:scale-110 transition-transform"
    //                     >
    //                         <Heart
    //                             className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-300 fill-gray-300'}`}
    //                         />
    //                     </button>
    //                 </div>
    //             )}
    //         </div>

    //         <p className="text-base leading-relaxed mb-8">{park.description}</p>

    //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

    //             <div className="bg-card border border-border rounded-xl p-5">
    //                 <h2 className="font-semibold mb-3">Weather</h2>
    //                 <p className="text-sm text-muted-foreground leading-relaxed">{park.weatherInfo}</p>
    //             </div>

    //             <div className="bg-card border border-border rounded-xl p-5">
    //                 <h2 className="font-semibold mb-3">Directions</h2>
    //                 <p className="text-sm text-muted-foreground leading-relaxed">{park.directionsInfo}</p>
    //                 {park.directionsUrl && (
    //                     <a
    //                         href={park.directionsUrl}
    //                         target="_blank"
    //                         rel="noreferrer"
    //                         className="text-sm text-primary hover:underline mt-2 inline-block"
    //                     >
    //                         Get directions →
    //                     </a>
    //                 )}
    //             </div>

    //         </div>

    //         {park.entranceFees?.length > 0 && (
    //             <div className="bg-card border border-border rounded-xl p-5 mb-8">
    //                 <h2 className="font-semibold mb-3">Entrance Fees</h2>
    //                 <div className="flex flex-col gap-3">
    //                     {park.entranceFees.map((fee, i) => (
    //                         <div key={i} className="flex justify-between text-sm">
    //                             <span className="text-muted-foreground">{fee.title}</span>
    //                             <span className="font-medium">${fee.cost}</span>
    //                         </div>
    //                     ))}
    //                 </div>
    //             </div>
    //         )}

    //         {park.activities?.length > 0 && (
    //             <div>
    //                 <h2 className="font-semibold mb-3">Activities</h2>
    //                 <div className="flex flex-wrap gap-2">
    //                     {park.activities.map(activity => (
    //                         <span
    //                             key={activity.id}
    //                             className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
    //                         >
    //                             {activity.name}
    //                         </span>
    //                     ))}
    //                 </div>
    //             </div>
    //         )}

    //     </div>
    // );
}

export default ParkDetail;