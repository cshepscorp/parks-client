import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

function NavBar() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const linkClass = `text-sm transition-colors ${
    isHome ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'
  }`;

  const mobileLinkClass = `block px-4 py-3 text-sm font-medium transition-colors rounded-md ${
    isHome ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-accent'
  }`;

  return (
    <nav className={`${isHome ? 'absolute top-0 left-0 right-0 bg-transparent' : 'sticky top-0 bg-background border-b border-border'} z-50`}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          to="/"
          className={`text-lg font-bold flex-shrink-0 flex items-center gap-2 ${isHome ? 'text-white' : 'text-foreground'}`}
        >
          <img src="/favicon.svg" alt="Parks" className="w-6 h-6" />
          Park Trip Planner
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={toggle}
            className={`p-1.5 rounded-md transition-colors ${isHome ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/search" className={linkClass}>Search</Link>
          {user && <Link to="/trips" className={linkClass}>Trips</Link>}
          {user && <Link to="/favorites" className={linkClass}>Favorites</Link>}
          {user ? (
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/logout`}
              className={`inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                isHome ? 'border border-white/50 text-white hover:bg-white/20' : 'border border-input text-foreground hover:bg-accent'
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

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggle}
            className={`p-1.5 rounded-md transition-colors ${isHome ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className={`p-1.5 rounded-md transition-colors ${isHome ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-accent'}`}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={`sm:hidden px-4 pb-4 pt-1 ${isHome ? 'bg-black/80 backdrop-blur-sm' : 'bg-background border-b border-border'}`}>
          <Link to="/search" className={mobileLinkClass}>Search</Link>
          {user && <Link to="/trips" className={mobileLinkClass}>Trips</Link>}
          {user && <Link to="/favorites" className={mobileLinkClass}>Favorites</Link>}
          <div className={`mt-2 pt-2 border-t ${isHome ? 'border-white/20' : 'border-border/50'}`}>
            {user ? (
              <a
                href={`${import.meta.env.VITE_API_URL}/auth/logout`}
                className={mobileLinkClass}
              >
                Log out
              </a>
            ) : (
              <a
                href={`${import.meta.env.VITE_API_URL}/auth/google`}
                className="block px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md text-center"
              >
                Sign in with Google
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
