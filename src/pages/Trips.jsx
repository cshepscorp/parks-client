import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChevronRight } from 'lucide-react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function Trips() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [query, setQuery] = useState('');
    const [newTripName, setNewTripName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCreateTrip = async () => {
        if (!newTripName) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTripName }),
            });
            if (!response.ok) throw new Error('Failed to create trip');
            const data = await response.json();
            setTrips([...trips, { ...data, tripParks: [] }]);
            setNewTripName('');
        } catch (error) {
            console.error('Failed to create trip:', error);
        }
    };

    const handleDeleteTrip = (trip) => setConfirmDelete(trip);

    const confirmDeleteTrip = async () => {
        const trip = confirmDelete;
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

    useEffect(() => {
        if (!user) return;
        const getTrips = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips`, {
                    credentials: 'include',
                });
                const data = await response.json();
                if (!response.ok) throw new Error('Failed to fetch trips');
                setTrips(data);
            } catch (error) {
                setError('Failed to fetch trips');
            } finally {
                setLoading(false);
            }
        };
        getTrips();
    }, [user]);

    useEffect(() => {
        setFilteredTrips(trips.filter(trip =>
            trip.name.toLowerCase().includes(query.toLowerCase())
        ));
    }, [trips, query]);

    if (authLoading) return <p className="max-w-4xl mx-auto px-6 py-8">Loading...</p>;
    if (!user) return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <p className="text-lg font-semibold mb-2">Sign in to view your trips</p>
            <p className="text-muted-foreground text-sm mb-6">Plan and save road trips to national and state parks.</p>
            <a
                href={`${import.meta.env.VITE_API_URL}/auth/google`}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
                Sign in with Google
            </a>
        </div>
    );
    if (loading) return <p className="max-w-4xl mx-auto px-6 py-8">Loading...</p>;
    if (error) return <p className="max-w-4xl mx-auto px-6 py-8">{error}</p>;

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Trips</h1>
            </div>

            <div className="flex flex-col gap-3 mb-8">
                <input
                    type="text"
                    placeholder="Filter trips..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="New trip name..."
                        value={newTripName}
                        onChange={e => setNewTripName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTrip()}
                        className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button onClick={handleCreateTrip}>Create Trip</Button>
                </div>
            </div>

            {filteredTrips.map(trip => (
                <div
                    key={trip.id}
                    className="bg-card border border-border rounded-xl p-5 mb-4 cursor-pointer hover:border-foreground/30 hover:shadow-sm transition-all"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-base truncate">{trip.name}</h3>
                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={e => { e.stopPropagation(); handleDeleteTrip(trip); }}
                        >
                            Delete
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                        Created {new Date(trip.createdAt).toLocaleDateString()} · {trip.tripParks.length} {trip.tripParks.length === 1 ? 'stop' : 'stops'}
                    </p>

                    {trip.tripParks.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {trip.tripParks.map(tp => (
                                <div
                                    key={tp.id}
                                    className="flex-shrink-0 w-20 h-14 rounded-md overflow-hidden relative cursor-pointer"
                                    onClick={e => { e.stopPropagation(); navigate(`/parks/${tp.park.npsId}`); }}
                                >
                                    {tp.park.imageUrl ? (
                                        <img src={tp.park.imageUrl} alt={tp.park.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center">
                                            <span className="text-lg">🏕️</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30" />
                                    <div className="absolute bottom-0 left-0 right-0 p-1">
                                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{tp.park.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{confirmDelete?.name}" and all its stops will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={confirmDeleteTrip}
                        >
                            Delete Trip
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default Trips;
