import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';

function NavBar() {
  const { user } = useAuth();
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* <Link to="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors flex-shrink-0">
      🏕️ Parks
    </Link> */}
        <Link to="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors flex-shrink-0 flex items-center gap-2">
          <img src="/favicon.svg" alt="Parks" className="w-6 h-6" />
          Park Trip Planner
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Search
          </Link>
          {user && (
            <Link to="/trips" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Trips
            </Link>
          )}
          {user && (
            <Link to="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Favorites
            </Link>
          )}
          {user ? (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/logout`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-input rounded-md hover:bg-accent transition-colors whitespace-nowrap"
            >
              Log out
            </a>
          ) : (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/google`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Sign in
            </a>
          )}
        </div>

      </div>
    </nav>
  );
}
export default NavBar;