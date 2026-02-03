import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';
import { Navbar } from '~/components/Navbar';

const PAGE_BG_DARK = '#0c0c0c';

interface PageLayoutProps {
  children: ReactNode;
  /** When "light", use white background and light nav/footer for landing. */
  theme?: 'light' | 'dark';
  navTransparent?: boolean;
}

export function PageLayout({ children, theme = 'dark' }: PageLayoutProps) {
  const isLight = theme === 'light';
  return (
    <div
      className="min-h-screen flex flex-col font-phudu relative"
      style={{ backgroundColor: isLight ? '#ffffff' : PAGE_BG_DARK }}
    >
      <Navbar variant={isLight ? 'light' : 'dark'} />
      <main className="flex-1 flex flex-col min-h-0">{children}</main>

      <footer
        className={`py-10 px-6 ${isLight ? 'bg-white' : ''}`}
        style={isLight ? undefined : { backgroundColor: PAGE_BG_DARK }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Link
              to="/"
              className={`text-lg font-semibold font-phudu ${isLight ? 'text-foreground hover:text-primary' : 'text-white hover:text-gray-300'}`}
            >
              ERMAP
            </Link>
            <p className={`mt-1 text-sm font-phudu ${isLight ? 'text-muted-foreground' : 'text-gray-500'}`}>
              Interactive map visualizations
            </p>
          </div>
          <nav className="flex gap-8 font-phudu" aria-label="Footer navigation">
            <Link
              to="/"
              className={`text-sm font-medium font-phudu ${isLight ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Home
            </Link>
            <Link
              to="/maps"
              className={`text-sm font-medium font-phudu ${isLight ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Maps
            </Link>
            <Link
              to="/data"
              className={`text-sm font-medium font-phudu ${isLight ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Data
            </Link>
            <Link
              to="/examples"
              className={`text-sm font-medium font-phudu ${isLight ? 'text-muted-foreground hover:text-foreground' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Analysis
            </Link>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6">
          <p className={`text-xs font-phudu ${isLight ? 'text-muted-foreground' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} ERMAP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
