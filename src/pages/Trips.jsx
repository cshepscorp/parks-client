import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Pencil, GripVertical, MapIcon } from 'lucide-react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

function SortableParkThumb({ tp, onRemove, onNavigate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tp.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className="flex-shrink-0 w-32 rounded-lg overflow-hidden relative group/park"
        >
            <div className="cursor-pointer" onClick={() => onNavigate(`/parks/${tp.park.npsId}`)}>
                {tp.park.imageUrl ? (
                    <img src={tp.park.imageUrl} alt={tp.park.name} className="w-full h-20 object-cover" />
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

            <div
                {...attributes}
                {...listeners}
                className="absolute top-1 left-1 bg-black/50 rounded p-0.5 cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover/park:opacity-100 transition-opacity"
            >
                <GripVertical className="w-3 h-3 text-white" />
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover/park:opacity-100 transition-opacity"
            >
                <span className="text-white text-xs leading-none">✕</span>
            </button>
        </div>
    );
}

function TripMap({ tripParks }) {
    const valid = tripParks.filter(tp => tp.park.lat && tp.park.lng);

    if (valid.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-6 text-center">
                No location data available for these parks.
            </p>
        );
    }

    const lngs = valid.map(tp => parseFloat(tp.park.lng));
    const lats = valid.map(tp => parseFloat(tp.park.lat));
    const pad = valid.length === 1 ? 3 : 1;

    const bounds = [
        [Math.min(...lngs) - pad, Math.min(...lats) - pad],
        [Math.max(...lngs) + pad, Math.max(...lats) + pad],
    ];

    const lineData = valid.length >= 2 ? {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: valid.map(tp => [parseFloat(tp.park.lng), parseFloat(tp.park.lat)]),
        },
    } : null;

    return (
        <Map
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            initialViewState={{ bounds, fitBoundsOptions: { padding: 40 } }}
            style={{ width: '100%', height: 280 }}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            scrollZoom={false}
        >
            {lineData && (
                <Source id="route" type="geojson" data={lineData}>
                    <Layer
                        id="route-line"
                        type="line"
                        paint={{ 'line-color': '#854d0e', 'line-width': 2, 'line-dasharray': [2, 2] }}
                    />
                </Source>
            )}
            {valid.map((tp, i) => (
                <Marker
                    key={tp.id}
                    longitude={parseFloat(tp.park.lng)}
                    latitude={parseFloat(tp.park.lat)}
                    anchor="bottom"
                >
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg border-2 border-white">
                        {i + 1}
                    </div>
                </Marker>
            ))}
        </Map>
    );
}

function Trips() {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [query, setQuery] = useState('');
    const [newTripName, setNewTripName] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingTripId, setEditingTripId] = useState(null);
    const [editingTripName, setEditingTripName] = useState('');
    const [expandedMaps, setExpandedMaps] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    const toggleMap = (tripId) => {
        setExpandedMaps(prev => {
            const next = new Set(prev);
            if (next.has(tripId)) next.delete(tripId);
            else next.add(tripId);
            return next;
        });
    };

    const handleDragEnd = async (event, tripId) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const trip = trips.find(t => t.id === tripId);
        const oldIndex = trip.tripParks.findIndex(tp => tp.id === active.id);
        const newIndex = trip.tripParks.findIndex(tp => tp.id === over.id);
        const reordered = arrayMove(trip.tripParks, oldIndex, newIndex);

        setTrips(prev => prev.map(t => t.id === tripId ? { ...t, tripParks: reordered } : t));

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks/reorder`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: reordered.map(tp => tp.id) }),
            });
        } catch (err) {
            console.error('Failed to save order:', err);
        }
    };

    const handleRenameTrip = async (tripId) => {
        if (!editingTripName.trim()) { setEditingTripId(null); return; }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingTripName.trim() }),
            });
            if (!response.ok) throw new Error('Failed to rename trip');
            setTrips(trips.map(t => t.id === tripId ? { ...t, name: editingTripName.trim() } : t));
        } catch (error) {
            console.error('Failed to rename trip:', error);
        } finally {
            setEditingTripId(null);
        }
    };

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

    const handleDeleteTrip = (trip) => setConfirmDelete({ type: 'trip', trip });

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
    }, []);

    useEffect(() => {
        setFilteredTrips(trips.filter(trip =>
            trip.name.toLowerCase().includes(query.toLowerCase())
        ));
    }, [trips, query]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
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
                <div key={trip.id} className="bg-card border border-border rounded-xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            {editingTripId === trip.id ? (
                                <input
                                    autoFocus
                                    value={editingTripName}
                                    onChange={e => setEditingTripName(e.target.value)}
                                    onBlur={() => handleRenameTrip(trip.id)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRenameTrip(trip.id);
                                        if (e.key === 'Escape') setEditingTripId(null);
                                    }}
                                    className="font-semibold text-base border-b border-input bg-transparent focus:outline-none"
                                />
                            ) : (
                                <div className="flex items-center gap-1.5 group/name">
                                    <h3 className="font-semibold text-base">{trip.name}</h3>
                                    <button
                                        onClick={() => { setEditingTripId(trip.id); setEditingTripName(trip.name); }}
                                        className="opacity-0 group-hover/name:opacity-100 transition-opacity"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                Created {new Date(trip.createdAt).toLocaleDateString()} · {trip.tripParks.length} {trip.tripParks.length === 1 ? 'stop' : 'stops'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {trip.tripParks.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleMap(trip.id)}
                                >
                                    <MapIcon className="w-3.5 h-3.5 mr-1" />
                                    {expandedMaps.has(trip.id) ? 'Hide Map' : 'Show Map'}
                                </Button>
                            )}
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTrip(trip)}>
                                Delete
                            </Button>
                        </div>
                    </div>

                    {trip.tripParks.length > 0 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={event => handleDragEnd(event, trip.id)}
                        >
                            <SortableContext
                                items={trip.tripParks.map(tp => tp.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {trip.tripParks.map(tp => (
                                        <SortableParkThumb
                                            key={tp.id}
                                            tp={tp}
                                            onRemove={() => handleRemovePark(trip.id, tp.id, tp.park.name)}
                                            onNavigate={navigate}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {expandedMaps.has(trip.id) && (
                        <div className="mt-4 rounded-lg overflow-hidden border border-border">
                            <TripMap tripParks={trip.tripParks} />
                        </div>
                    )}
                </div>
            ))}

            <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDelete?.type === 'trip' ? 'Delete this trip?' : `Remove ${confirmDelete?.parkName}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDelete?.type === 'trip'
                                ? `"${confirmDelete?.trip?.name}" and all its stops will be permanently deleted.`
                                : 'This park will be removed from your trip.'}
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
