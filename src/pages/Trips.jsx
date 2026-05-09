import { useEffect, useState } from 'react';
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
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Failed to create trip')
            }
            setTrips([...trips, data]);
            setNewTripName(''); // reset input
        } catch (error) {
            console.error('Failed to create trip:', error);
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
        <div>
            <h2>Trips</h2>

            {/* filter existing trips */}
            <input
                type="text"
                placeholder="Filter trips..."
                value={query}
                onChange={e => setQuery(e.target.value)}
            />

            {/* create new trip */}
            <input
                type="text"
                placeholder="Trip name..."
                value={newTripName}
                onChange={e => setNewTripName(e.target.value)}
            />

            <button onClick={handleCreateTrip}>Add a new trip</button>
            {filteredTrips.length > 0 ? (
                filteredTrips.map(trip => (
                    // <TripCard key={park.id} park={park} /> // doesn't exist yet
                    <div key={trip.id}>
                        <h3>{trip.name}</h3>
                        <p>{new Date(trip.createdAt).toLocaleDateString()}</p>
                    </div>
                ))
            ) : (
                <p>You have no saved trips! Why not create one today?</p>
            )}

            <div>

            </div>
        </div>
    );
}

export default Trips;