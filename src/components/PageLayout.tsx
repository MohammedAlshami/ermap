import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';

const PAGE_BG = '#0c0c0c';

interface PageLayoutProps {
  children: ReactNode;
  /** Unused; kept for API compatibility. */
  navTransparent?: boolean;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-[${PAGE_BG}] font-phudu relative`} style={{ backgroundColor: PAGE_BG }}>
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
