import { useEffect, useState } from 'react';
import ParkCard from '../components/ParkCard';

function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleUnfavorite = (parkId) => {
  setFavorites(favorites.filter(f => f.park.id !== parkId));
};

    useEffect(() => {
        const getFavorites = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (!response.ok) throw new Error('Failed to fetch favorites');
                console.log('favorites data', data)
                setFavorites(data)
            } catch (error) {
                setError('Failed to fetch favorites details');
            } finally {
                setLoading(false);
            }
        };
        getFavorites();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Favorites</h1>
            </div>
            {/* 
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
    </div> */}

            {favorites.length > 0 ? (
                <div className="flex flex-col gap-4">
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