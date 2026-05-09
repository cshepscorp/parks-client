import { Link } from 'react-router-dom';

function ParkCard({ park }) {
    console.log('park details', park)
    return (
        <div>
            <Link to={`/parks/${park.parkCode}`}>
            <h2>{park.fullName}</h2>
            </Link>
            <p>{park.states}</p>
            <p>{park.description}</p>
        </div>
    );
}

export default ParkCard;