import { useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      {park.images?.[0] && (
        <img
          src={park.images[0].url}
          alt={park.images[0].altText}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      )}
      <CardHeader className="pb-2">
        <Link to={`/parks/${park.parkCode}`}>
          <CardTitle className="text-base hover:text-primary transition-colors line-clamp-2">
            {park.fullName}
          </CardTitle>
        </Link>
        <p className="text-xs text-muted-foreground">{park.states}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{park.description}</p>
      </CardContent>
      <CardFooter>
        {user ? (
          <Button
            variant={isFavorite ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleFavoritesClick}
            className="w-full"
          >
            {isFavorite ? '★ Favorited' : '☆ Add to Favorites'}
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm" className="w-full">
            <a href={`${import.meta.env.VITE_API_URL}/auth/google`}>Sign in to favorite</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default ParkCard;