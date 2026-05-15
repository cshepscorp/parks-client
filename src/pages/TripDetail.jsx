import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GripVertical, MapIcon, Pencil, X, Plus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/useAuth';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

function distanceMiles(lat1, lng1, lat2, lng2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighborRoute(tripParks) {
    const routable = tripParks.filter(tp => tp.park.lat && tp.park.lng);
    const unroutable = tripParks.filter(tp => !tp.park.lat || !tp.park.lng);
    if (routable.length <= 2) return tripParks;

    let bestRoute = null;
    let bestDist = Infinity;

    for (let startIdx = 0; startIdx < routable.length; startIdx++) {
        const visited = new Set([startIdx]);
        const route = [routable[startIdx]];

        while (route.length < routable.length) {
            const last = route[route.length - 1];
            let nearestIdx = -1, nearestDist = Infinity;
            routable.forEach((tp, i) => {
                if (visited.has(i)) return;
                const d = distanceMiles(
                    parseFloat(last.park.lat), parseFloat(last.park.lng),
                    parseFloat(tp.park.lat), parseFloat(tp.park.lng)
                );
                if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
            });
            visited.add(nearestIdx);
            route.push(routable[nearestIdx]);
        }

        let totalDist = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDist += distanceMiles(
                parseFloat(route[i].park.lat), parseFloat(route[i].park.lng),
                parseFloat(route[i + 1].park.lat), parseFloat(route[i + 1].park.lng)
            );
        }
        if (totalDist < bestDist) { bestDist = totalDist; bestRoute = route; }
    }

    return [...bestRoute, ...unroutable];
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
            style={{ width: '100%', height: 300 }}
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

function SortableParkRow({ tp, stopNumber, onRemove, onNavigate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tp.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
        >
            <span className="w-6 text-right text-sm text-muted-foreground flex-shrink-0">
                {stopNumber}
            </span>

            <div
                {...attributes}
                {...listeners}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing flex-shrink-0"
            >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div
                className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => onNavigate(`/parks/${tp.park.npsId}`)}
            >
                {tp.park.imageUrl ? (
                    <img src={tp.park.imageUrl} alt={tp.park.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-lg">🏕️</span>
                    </div>
                )}
            </div>

            <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onNavigate(`/parks/${tp.park.npsId}`)}
            >
                <p className="font-medium text-sm truncate">{tp.park.name}</p>
                {tp.park.states?.length > 0 && (
                    <p className="text-xs text-muted-foreground">{tp.park.states.join(', ')}</p>
                )}
            </div>

            <button
                onClick={() => onRemove()}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                aria-label={`Remove ${tp.park.name} from trip`}
            >
                <X className="w-4 h-4 text-muted-foreground" />
            </button>
        </div>
    );
}

function TripDetail() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [editingTripName, setEditingTripName] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [isOptimized, setIsOptimized] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    useEffect(() => {
        if (!user) return;
        const fetchTrip = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}`, {
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch trip');
                const data = await response.json();
                setTrip(data);
            } catch (err) {
                setError('Failed to load trip.');
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [user, tripId]);

    const handleRenameTrip = async () => {
        if (!editingTripName.trim()) { setEditingName(false); return; }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingTripName.trim() }),
            });
            if (!response.ok) throw new Error('Failed to rename trip');
            setTrip(prev => ({ ...prev, name: editingTripName.trim() }));
        } catch (err) {
            console.error('Failed to rename trip:', err);
        } finally {
            setEditingName(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = trip.tripParks.findIndex(tp => tp.id === active.id);
        const newIndex = trip.tripParks.findIndex(tp => tp.id === over.id);
        const reordered = arrayMove(trip.tripParks, oldIndex, newIndex);

        setTrip(prev => ({ ...prev, tripParks: reordered }));
        setIsOptimized(false);

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

    const optimizeRoute = async () => {
        const optimized = nearestNeighborRoute(trip.tripParks);
        setTrip(prev => ({ ...prev, tripParks: optimized }));
        setIsOptimized(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks/reorder`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: optimized.map(tp => tp.id) }),
            });
        } catch (err) {
            console.error('Failed to save optimized order:', err);
        }
    };

    const confirmRemovePark = async () => {
        const { tripParkId } = confirmRemove;
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks/${tripParkId}`,
                { method: 'DELETE', credentials: 'include' }
            );
            if (!response.ok) throw new Error('Failed to remove park');
            setTrip(prev => ({
                ...prev,
                tripParks: prev.tripParks.filter(tp => tp.id !== tripParkId),
            }));
            setIsOptimized(false);
        } catch (err) {
            console.error('Failed to remove park:', err);
        } finally {
            setConfirmRemove(null);
        }
    };

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
    if (!trip) return null;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <button
                onClick={() => navigate('/trips')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to trips
            </button>

            <div className="mb-6">
                {editingName ? (
                    <input
                        autoFocus
                        value={editingTripName}
                        onChange={e => setEditingTripName(e.target.value)}
                        onBlur={handleRenameTrip}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameTrip();
                            if (e.key === 'Escape') setEditingName(false);
                        }}
                        className="text-3xl font-bold border-b border-input bg-transparent focus:outline-none w-full"
                    />
                ) : (
                    <div className="flex items-center gap-2 group/name">
                        <h1 className="text-3xl font-bold">{trip.name}</h1>
                        <button
                            onClick={() => { setEditingName(true); setEditingTripName(trip.name); }}
                            className="opacity-0 group-hover/name:opacity-100 transition-opacity mt-1"
                            aria-label="Rename trip"
                        >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                    Created {new Date(trip.createdAt).toLocaleDateString()} · {trip.tripParks.length} {trip.tripParks.length === 1 ? 'stop' : 'stops'}
                </p>
            </div>

            {trip.tripParks.length > 0 && (
                <div className="mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMap(prev => !prev)}
                    >
                        <MapIcon className="w-3.5 h-3.5 mr-1" />
                        {showMap ? 'Hide Map' : 'Show Map'}
                    </Button>
                </div>
            )}

            {showMap && trip.tripParks.length > 0 && (
                <div className="mb-6 rounded-lg overflow-hidden border border-border">
                    <TripMap tripParks={trip.tripParks} />
                </div>
            )}

            {trip.tripParks.filter(tp => tp.park.lat && tp.park.lng).length >= 3 && (
                <div className="flex justify-end mb-3">
                    <button
                        onClick={optimizeRoute}
                        disabled={isOptimized}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Navigation className="w-3.5 h-3.5" />
                        {isOptimized ? 'Route optimized' : 'Optimize route'}
                    </button>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={trip.tripParks.map(tp => tp.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2 mb-6">
                        {trip.tripParks.map((tp, i) => (
                            <SortableParkRow
                                key={tp.id}
                                tp={tp}
                                stopNumber={i + 1}
                                onRemove={() => setConfirmRemove({ tripParkId: tp.id, parkName: tp.park.name })}
                                onNavigate={navigate}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {trip.tripParks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No parks added yet. Search for parks to add them to this trip.
                </p>
            )}

            <Button onClick={() => navigate('/search')} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Parks
            </Button>

            <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {confirmRemove?.parkName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This park will be removed from your trip.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={confirmRemovePark}
                        >
                            Remove Park
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default TripDetail;
