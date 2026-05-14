import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

function NavBar() {
  const { user } = useAuth();
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
          🏕️ Parks
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Search
          </Link>
          {user && (
            <Link to="/trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Trips
            </Link>
          )}
          {user && (
            <Link to="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Favorites
            </Link>
          )}
          {user ? (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/logout`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-input rounded-md hover:bg-accent transition-colors"
            >
              Log out
            </a>
          ) : (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/google`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign in with Google
            </a>
          )}
        </div>

      </div>
    </nav>
  );
}
export default NavBar;