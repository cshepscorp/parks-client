import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [query, setQuery] = useState('');
  const [newTripName, setNewTripName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'trip', trip } or { type: 'park', tripId, tripParkId, parkName }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateTrip = async () => {
    if (!newTripName) {
      return;
    };
    // POST call to /api/trips with newTripName
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTripName,
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create trip')
      }

      const data = await response.json();

      setTrips([...trips, { ...data, tripParks: [] }]);
      setNewTripName(''); // reset input
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  }

  const handleDeleteTrip = (trip) => {
    setConfirmDelete({ type: 'trip', trip });
  };

  const confirmDeleteTrip = async () => {
    const trip = confirmDelete.trip;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${trip.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete trip');
      setTrips(trips.filter(t => t.id !== trip.id));
    } catch (error) {
      console.error('Failed to delete trip:', error);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRemovePark = (tripId, tripParkId, parkName) => {
    setConfirmDelete({ type: 'park', tripId, tripParkId, parkName });
  };

  const confirmRemovePark = async () => {
    const { tripId, tripParkId } = confirmDelete;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks/${tripParkId}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to remove park');
      setTrips(trips.map(trip =>
        trip.id === tripId
          ? { ...trip, tripParks: trip.tripParks.filter(tp => tp.id !== tripParkId) }
          : trip
      ));
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    const getTrips = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) throw new Error('Failed to create trip');
        setTrips(data)
      } catch (error) {
        setError('Failed to fetch trips details');
      } finally {
        setLoading(false);
      }
    };
    getTrips();
  }, []);

  useEffect(() => {
    setFilteredTrips(
      trips.filter(trip =>
        trip.name.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [trips, query]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Trips</h1>
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Filter trips..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          placeholder="New trip name..."
          value={newTripName}
          onChange={e => setNewTripName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={handleCreateTrip}>Create Trip</Button>
      </div>

      {filteredTrips.map(trip => (
        <div key={trip.id} className="bg-card border border-border rounded-xl p-5 mb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base">{trip.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(trip.createdAt).toLocaleDateString()} · {trip.tripParks.length} {trip.tripParks.length === 1 ? 'stop' : 'stops'}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteTrip(trip)}
            >
              Delete
            </Button>
          </div>

          {trip.tripParks.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {trip.tripParks.map(tp => (
                <div
                  key={tp.id}
                  className="flex-shrink-0 w-32 rounded-lg overflow-hidden relative group/park"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/parks/${tp.park.npsId}`)}
                  >
                    {tp.park.imageUrl ? (
                      <img
                        src={tp.park.imageUrl}
                        alt={tp.park.name}
                        className="w-full h-20 object-cover"
                      />
                    ) : (
                      <div className="w-full h-20 bg-muted flex items-center justify-center">
                        <span className="text-2xl">🏕️</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-0 left-0 right-0 p-1.5">
                      <p className="text-white text-xs font-medium line-clamp-2">{tp.park.name}</p>
                    </div>
                  </div>

                  {/* X button - shows on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePark(trip.id, tp.id);
                    }}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-0 group-hover/park:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-xs leading-none">✕</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.type === 'trip'
                ? 'Delete this trip?'
                : `Remove ${confirmDelete?.parkName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === 'trip'
                ? `"${confirmDelete?.trip?.name}" and all its stops will be permanently deleted.`
                : `This park will be removed from your trip.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete?.type === 'trip' ? confirmDeleteTrip : confirmRemovePark}
            >
              {confirmDelete?.type === 'trip' ? 'Delete Trip' : 'Remove Park'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Trips;