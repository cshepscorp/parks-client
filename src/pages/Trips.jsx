import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';

function Trips() {
    const { user } = useAuth();

    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [query, setQuery] = useState('');
    const [newTripName, setNewTripName] = useState('');
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

            setTrips([...trips, data]);
            setNewTripName(''); // reset input
        } catch (error) {
            console.error('Failed to create trip:', error);
        }
    }

    const handleDeleteTrip = async (trip) => {
        if (!trip) {
            return;
        };

        const confirmed = window.confirm(`Are you sure you want to delete "${trip.name}"?`);
        if (!confirmed) return;

        // POST call to /api/trips with newTripName
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${trip.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to create trip')
            }
            const data = await response.json();

            setTrips(trips.filter(t => t.id !== trip.id));
        } catch (error) {
            console.error('Failed to delete trip:', error);
        }
    }

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

    {filteredTrips.length > 0 ? (
      <div className="flex flex-col gap-4">
        {filteredTrips.map(trip => (
          <div key={trip.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">{trip.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(trip.createdAt).toLocaleDateString()}
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
        ))}
      </div>
    ) : (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg mb-4">You have no saved trips yet.</p>
        <p className="text-sm text-muted-foreground">Search for parks and start planning your adventure.</p>
      </div>
    )}
  </div>
);
}

export default Trips;