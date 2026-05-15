import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Phone, Globe, Clock, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '../hooks/useAuth';
import ParkCard from '@/components/ParkCard';

function distanceMiles(lat1, lng1, lat2, lng2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ALERT_STYLES = {
    'Park Closure': { bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800', icon: XCircle, text: 'text-red-700 dark:text-red-300', iconColor: 'text-red-500 dark:text-red-400' },
    'Danger':       { bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800', icon: AlertTriangle, text: 'text-orange-700 dark:text-orange-300', iconColor: 'text-orange-500 dark:text-orange-400' },
    'Caution':      { bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800', icon: AlertTriangle, text: 'text-yellow-800 dark:text-yellow-300', iconColor: 'text-yellow-500 dark:text-yellow-400' },
    'Information':  { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800', icon: Info, text: 'text-blue-700 dark:text-blue-300', iconColor: 'text-blue-500 dark:text-blue-400' },
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function ParkDetail() {
    const { parkCode } = useParams();
    const { user } = useAuth();
    const [park, setPark] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [nearbyParks, setNearbyParks] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const [trips, setTrips] = useState([]);
    const [addedToTrips, setAddedToTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFavoritesClick = async (e) => {
        e.stopPropagation();
        try {
            if (isFavorite) {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${park.parkCode}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!response.ok) throw new Error(`Error status: ${response.status}`);
                setIsFavorite(false);
            } else {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
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
                if (!response.ok) throw new Error(`Error status: ${response.status}`);
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleAddToTrip = async (tripId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}/parks`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
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
                setAddedToTrips(prev => [...prev, tripId]);
                return;
            }
            if (!response.ok) throw new Error(`Error status: ${response.status}`);
            setAddedToTrips(prev => [...prev, tripId]);
        } catch (error) {
            console.error('Failed to add park to trip:', error);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setIsFavorite(data.some(fav => fav.park.npsId === parkCode)))
            .catch(err => console.error('Failed to check favorites:', err));
    }, [user, parkCode]);

    useEffect(() => {
        if (!user) return;
        fetch(`${import.meta.env.VITE_API_URL}/api/trips`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setTrips(data);
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
                setPark(data.data[0]);
            } catch (error) {
                setError('Failed to fetch park details');
            } finally {
                setLoading(false);
            }
        };
        getPark();
    }, [parkCode]);

    useEffect(() => {
        if (!park?.latitude || !park?.longitude || !park?.states) return;
        const stateCode = park.states.split(',')[0].trim();
        fetch(`${import.meta.env.VITE_API_URL}/api/parks?stateCode=${stateCode}&limit=50`)
            .then(res => res.json())
            .then(data => {
                const nearby = (data.data || [])
                    .filter(p => p.parkCode !== parkCode && p.latitude && p.longitude)
                    .map(p => ({
                        ...p,
                        distance: distanceMiles(
                            parseFloat(park.latitude), parseFloat(park.longitude),
                            parseFloat(p.latitude), parseFloat(p.longitude)
                        ),
                    }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 6);
                setNearbyParks(nearby);
            })
            .catch(() => {});
    }, [park, parkCode]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/parks/${parkCode}/alerts`)
            .then(res => res.json())
            .then(data => setAlerts(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, [parkCode]);

    if (loading) return <p className="max-w-4xl mx-auto px-6 py-8">Loading...</p>;
    if (error) return <p className="max-w-4xl mx-auto px-6 py-8">{error}</p>;
    if (!park) return null;

    const images = park.images || [];
    const phone = park.contacts?.phoneNumbers?.find(p => p.type === 'Voice');
    const hasHours = park.operatingHours?.length > 0;
    const hasPasses = park.entrancePasses?.length > 0;

    return (
        <div>
            {/* Full bleed hero */}
            <div className="relative h-96 w-full">
                {images[heroIndex] ? (
                    <img
                        src={images[heroIndex].url}
                        alt={images[heroIndex].altText}
                        className="w-full h-full object-cover transition-opacity duration-300"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-white mb-2">{park.fullName}</h1>
                    <p className="text-white/70 text-sm uppercase tracking-wide">
                        {park.designation} · {park.states}
                    </p>
                </div>

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
                            <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                        </button>
                    </div>
                )}
            </div>

            {/* Image gallery strip */}
            {images.length > 1 && (
                <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-black">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setHeroIndex(i)}
                            className={`flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${
                                i === heroIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                            }`}
                        >
                            <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="max-w-4xl mx-auto px-6 pt-6 flex flex-col gap-2">
                    {alerts.map(alert => {
                        const style = ALERT_STYLES[alert.category] || ALERT_STYLES['Information'];
                        const Icon = style.icon;
                        return (
                            <div key={alert.id} className={`flex gap-3 p-4 rounded-lg border ${style.bg}`}>
                                <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                                <div>
                                    <p className={`font-semibold text-sm ${style.text}`}>{alert.title}</p>
                                    {alert.description && (
                                        <p className={`text-sm mt-0.5 ${style.text} opacity-80`}>{alert.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <p className="text-base leading-relaxed mb-8">{park.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                {/* Operating hours */}
                {hasHours && (
                    <div className="bg-card border border-border rounded-xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <h2 className="font-semibold">Hours</h2>
                        </div>
                        {park.operatingHours.map((schedule, i) => (
                            <div key={i}>
                                {park.operatingHours.length > 1 && (
                                    <p className="text-sm font-medium mb-2">{schedule.name}</p>
                                )}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                                    {DAYS.map(day => (
                                        <div key={day} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground capitalize">{day.slice(0, 3)}</span>
                                            <span className="font-medium">{schedule.standardHours?.[day] || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                                {schedule.description && (
                                    <p className="text-xs text-muted-foreground mt-2">{schedule.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Fees and passes */}
                {(park.entranceFees?.length > 0 || hasPasses) && (
                    <div className="bg-card border border-border rounded-xl p-5 mb-6">
                        {park.entranceFees?.length > 0 && (
                            <>
                                <h2 className="font-semibold mb-3">Entrance Fees</h2>
                                <div className="flex flex-col gap-3 mb-4">
                                    {park.entranceFees.map((fee, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{fee.title}</span>
                                                <span className="font-medium">${fee.cost}</span>
                                            </div>
                                            {fee.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{fee.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {hasPasses && (
                            <>
                                <h2 className="font-semibold mb-3">Annual Passes</h2>
                                <div className="flex flex-col gap-3">
                                    {park.entrancePasses.map((pass, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{pass.title}</span>
                                                <span className="font-medium">${pass.cost}</span>
                                            </div>
                                            {pass.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{pass.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Contact + website */}
                {(phone || park.url) && (
                    <div className="bg-card border border-border rounded-xl p-5 mb-6 flex flex-wrap gap-6">
                        {phone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <a href={`tel:${phone.phoneNumber}`} className="hover:underline">
                                    {phone.phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                                </a>
                            </div>
                        )}
                        {park.url && (
                            <div className="flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <a href={park.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    Official NPS page
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Activities */}
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

                {/* Nearby Parks */}
                {nearbyParks.length > 0 && (
                    <div className="mt-10">
                        <h2 className="font-semibold mb-4">Nearby Parks</h2>
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
                            {nearbyParks.map(p => (
                                <div key={p.parkCode} className="w-52 flex-shrink-0">
                                    <ParkCard park={p} />
                                    <p className="text-xs text-muted-foreground mt-1.5 px-1">
                                        {Math.round(p.distance)} mi away
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ParkDetail;
