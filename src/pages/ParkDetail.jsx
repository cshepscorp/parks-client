import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function ParkDetail() {
        const { parkCode } = useParams();
    console.log('parkCode', parkCode)

    const [park, setPark] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getPark = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/parks/${parkCode}`);
                const data = await response.json();

                setPark(data.data[0])
            } catch (error) {
                setError('Failed to fetch park details');
            } finally {
                setLoading(false);
            }
        };
        getPark();
    }, [parkCode])

    console.log("park", park)

    if (loading) return <p>Loading...</p>;
if (error) return <p>{error}</p>;
if (!park) return null;

    return (
        <div>
                <h2>{park.fullName}</h2>
            <p>Located in: {park.states}</p>
            <p>Description: {park.description}</p>
            <p>Weather: {park.weatherInfo}</p>
        </div>
    );
}

export default ParkDetail;