import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function NavBar() {
  const { user } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className={`${isHome ? 'absolute top-0 left-0 right-0 bg-transparent' : 'sticky top-0 bg-background border-b border-border'} z-50`}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* <Link
          to="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors flex-shrink-0 flex items-center gap-2"
          > */}
        <Link
          to="/"
          className={`text-lg font-bold flex-shrink-0 flex items-center gap-2 ${isHome ? 'text-white' : 'text-foreground'}`}
        >
          <img src="/favicon.svg" alt="Parks" className="w-6 h-6" />
          Park Trip Planner
        </Link>

        {/* className={`text-lg font-bold flex-shrink-0 flex items-center gap-2 ${isHome ? 'text-white' : 'text-foreground'}`} */}

        <div className="flex items-center gap-3">
          <Link to="/search"
            className={`text-sm transition-colors hidden sm:block ${isHome
              ? 'text-white/80 hover:text-white'
              : 'text-muted-foreground hover:text-foreground'
              }`}>
            Search
          </Link>
          {user && (
            <Link to="/trips"
              className={`text-sm transition-colors hidden sm:block ${isHome
                ? 'text-white/80 hover:text-white'
                : 'text-muted-foreground hover:text-foreground'
                }`}>
              Trips
            </Link>
          )}
          {user && (
            <Link to="/favorites" className={`text-sm transition-colors hidden sm:block ${isHome
              ? 'text-white/80 hover:text-white'
              : 'text-muted-foreground hover:text-foreground'
              }`}>
              Favorites
            </Link>
          )}
          {user ? (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/logout`}
              className={`inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${isHome
                  ? 'border border-white/50 text-white hover:bg-white/20'
                  : 'border border-input text-foreground hover:bg-accent'
                }`}
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