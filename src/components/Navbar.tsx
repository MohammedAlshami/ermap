import { Link } from '@tanstack/react-router';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/companies', label: 'Companies' },
  { to: '/data', label: 'Data' },
  { to: '/examples', label: 'Examples' },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-transparent bg-transparent">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="text-lg font-semibold text-white transition-colors hover:opacity-90"
        >
          ERMAP
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
