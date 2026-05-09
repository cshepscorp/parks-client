import { useState } from "react";

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ParkCard({ park }) {
    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);

    const handleFavoritesClick = async () => {
        try {
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
                    description: park.description
                })
            });

            if (!response.ok) {
                throw new Error(`Error status: ${response.status}, something went wrong`)
            }
            setIsFavorite(true);
        } catch (error) {
            console.error('Failed to add favorite:', error);
        }
    };

    return (
        <div>
            {user ? (
                <button onClick={handleFavoritesClick}>
                    {isFavorite ? 'Favorited ★' : 'Add to Faves'}
                </button>
            ) : (
                <a href={`${import.meta.env.VITE_API_URL}/auth/google`}>Sign in to favorite</a>
            )}
            <Link to={`/parks/${park.parkCode}`}>
                <h2>{park.fullName}</h2>
            </Link>
            <p>{park.states}</p>
            <p>{park.description}</p>
        </div>
    );
}

export default ParkCard;