import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart } from 'lucide-react';

function ParkCard({ park, isFavorite: initialIsFavorite = false, handleUnfavorite }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  const handleFavoritesClick = async (e) => {
    e.stopPropagation(); // prevents the card click from firing when clicking the button
    try {
      if (isFavorite) {
        // remove from favorites
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favorites/${park.parkCode}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error status: ${response.status}, something went wrong`)
        }
        setIsFavorite(false);
        if (handleUnfavorite) {
          handleUnfavorite();
        }
      } else {
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
            description: park.description,
            imageUrl: park.images?.[0]?.url || null,
          })
        });

        if (!response.ok) {
          throw new Error(`Error status: ${response.status}, something went wrong`)
        }
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group h-72"
      onClick={() => navigate(`/parks/${park.parkCode}`)}
    >
      {/* background image */}
      {park.images?.[0] ? (
        <img
          src={park.images[0].url}
          alt={park.images[0].altText}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center p-6">
          <span className="text-white/40 text-4xl">🏕️</span>
        </div>
      )}

      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* heart button */}
      {user && (
        <button
          onClick={handleFavoritesClick}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 transition-transform"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`}
          />
        </button>
      )}

      {/* text content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-base line-clamp-2 mb-1">
          {park.fullName}
        </h3>
        <p className="text-white/60 text-xs">{park.states}</p>
      </div>
    </div>
  );
}

export default ParkCard;