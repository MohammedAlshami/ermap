import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';

const PAGE_BG = '#0c0c0c';

interface PageLayoutProps {
  children: ReactNode;
  /** When true, navbar is transparent and overlays content (e.g. landing). When false, navbar has solid bg (e.g. examples). */
  navTransparent?: boolean;
}

export function PageLayout({ children, navTransparent = false }: PageLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-[${PAGE_BG}] font-phudu relative`} style={{ backgroundColor: PAGE_BG }}>
      {/* Navbar: transparent + absolute on landing, solid + sticky on examples. Always white text. */}
      <nav
        className={`font-phudu z-50 ${navTransparent ? 'absolute top-0 left-0 right-0 bg-transparent' : 'sticky top-0'}`}
        style={navTransparent ? undefined : { backgroundColor: PAGE_BG }}
      >
        <div className="w-full px-6 py-4 flex items-center justify-between font-phudu">
          <Link
            to="/"
            className="text-xl font-semibold text-white hover:text-white/90 font-phudu"
          >
            ERMAP
          </Link>
          <div className="flex gap-6 font-phudu">
            <Link to="/" className="text-white font-bold hover:text-white/90 font-phudu">
              Home
            </Link>
            <Link to="/maps" className="text-white font-bold hover:text-white/90 font-phudu">
              Maps
            </Link>
            <Link to="/data" className="text-white font-bold hover:text-white/90 font-phudu">
              Data
            </Link>
            <Link to="/examples" className="text-white font-bold hover:text-white/90 font-phudu">
              Examples
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0">{children}</main>

      {/* Footer - same on all pages */}
      <footer className="py-10 px-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Link
              to="/"
              className="text-lg font-semibold text-white hover:text-gray-300 font-phudu"
            >
              ERMAP
            </Link>
            <p className="mt-1 text-sm text-gray-500 font-phudu">
              Interactive map visualizations
            </p>
          </div>
          <nav className="flex gap-8 font-phudu" aria-label="Footer navigation">
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-300 font-phudu">
              Home
            </Link>
            <Link to="/maps" className="text-sm font-medium text-gray-500 hover:text-gray-300 font-phudu">
              Maps
            </Link>
            <Link to="/data" className="text-sm font-medium text-gray-500 hover:text-gray-300 font-phudu">
              Data
            </Link>
            <Link to="/examples" className="text-sm font-medium text-gray-500 hover:text-gray-300 font-phudu">
              Examples
            </Link>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6">
          <p className="text-xs text-gray-500 font-phudu">
            © {new Date().getFullYear()} ERMAP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
