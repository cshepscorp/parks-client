import { useEffect, useState } from 'react';
import ParkCard from '../components/ParkCard';
import { useAuth } from '../hooks/useAuth';

function Favorites() {
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleUnfavorite = (parkId) => {
        setFavorites(favorites.filter(f => f.park.id !== parkId));
    };

    useEffect(() => {
        if (!user) return;
        const getFavorites = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (!response.ok) throw new Error('Failed to fetch favorites');
                setFavorites(data);
            } catch (error) {
                setError('Failed to fetch favorites');
            } finally {
                setLoading(false);
            }
        };
        getFavorites();
    }, [user]);

    if (authLoading) return <p className="max-w-4xl mx-auto px-6 py-8">Loading...</p>;
    if (!user) return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <p className="text-lg font-semibold mb-2">Sign in to view your favorites</p>
            <p className="text-muted-foreground text-sm mb-6">Save parks you love and find them here anytime.</p>
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
                <h1 className="text-3xl font-bold">My Favorites</h1>
            </div>
            {favorites.length > 0 ? (
                <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favorites.map(favorite => (
                            <ParkCard
                                key={favorite.id}
                                isFavorite={true}
                                handleUnfavorite={() => handleUnfavorite(favorite.park.id)}
                                park={{
                                    fullName: favorite.park.name,
                                    parkCode: favorite.park.npsId,
                                    parkId: favorite.park.id,
                                    states: favorite.park.states,
                                    description: favorite.park.description,
                                    latitude: favorite.park.lat,
                                    longitude: favorite.park.lng,
                                    images: favorite.park.imageUrl
                                        ? [{ url: favorite.park.imageUrl, altText: favorite.park.name }]
                                        : [],
                                }}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg mb-4">You have no saved favorites yet.</p>
                    <p className="text-sm text-muted-foreground">Search for parks and start planning your adventure.</p>
                </div>
            )}
        </div>
    );
}

export default Favorites;
