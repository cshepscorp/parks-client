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

    // console.log("park", park)

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!park) return null;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">

            {park.images?.[0] && (
                <img
                    src={park.images[0].url}
                    alt={park.images[0].altText}
                    className="w-full h-72 object-cover rounded-xl mb-8"
                />
            )}

            <div className="mb-6">
                <h1 className="text-4xl font-bold mb-2">{park.fullName}</h1>
                <p className="text-muted-foreground text-sm uppercase tracking-wide">
                    {park.designation} · {park.states}
                </p>
            </div>

            <p className="text-base leading-relaxed mb-8">{park.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

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

            {park.entranceFees?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 mb-8">
                    <h2 className="font-semibold mb-3">Entrance Fees</h2>
                    <div className="flex flex-col gap-3">
                        {park.entranceFees.map((fee, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{fee.title}</span>
                                <span className="font-medium">${fee.cost}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

        </div>
    );
}

export default ParkDetail;