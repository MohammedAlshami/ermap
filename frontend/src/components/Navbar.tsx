import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '~/lib/auth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/data', label: 'Data' },
  { to: '/models', label: 'Models' },
  { to: '/examples', label: 'Analysis' },
] as const;

interface NavbarProps {
  variant?: 'light' | 'dark';
}

export function Navbar({ variant = 'dark' }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLight = variant === 'light';
  const linkClass = isLight
    ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
    : 'text-white/90 hover:bg-white/10 hover:text-white';

  const handleLogout = () => {
    logout();
    navigate({ to: '/' });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full ${isLight ? 'bg-background/95 backdrop-blur' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className={`text-lg font-semibold transition-colors hover:opacity-90 ${isLight ? 'text-foreground' : 'text-white'}`}
        >
          ERMAP
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${linkClass}`}>
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/projects" className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${linkClass}`}>
                Projects
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${linkClass}`}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${linkClass}`}>
                Log in
              </Link>
              <Link to="/register" className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${linkClass}`}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
