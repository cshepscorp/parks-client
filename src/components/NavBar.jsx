import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function NavBar() {
    const { user } = useAuth();
    return (
        <div>
            <Link to='/'>Parks App</Link>
            <Link to='/search'>Search App</Link>
            {user ? (
                <a href={`${import.meta.env.VITE_API_URL}/auth/logout`}>Log out</a>
            ) : (
                <a href={`${import.meta.env.VITE_API_URL}/auth/google`}>Sign in with Google</a>
            )}
        </div>
    );
}
export default NavBar;