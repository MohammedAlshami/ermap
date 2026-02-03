import { useState, useEffect } from 'react';
import { GeoJSONPreviewMap } from '~/components/GeoJSONPreviewMap';

interface CompanyStoreMapProps {
  /** GeoJSON URL for store locations or distribution centers (relative path or full URL). */
  geoJsonUrl?: string | null;
  /** Message when no URL is provided. */
  emptyMessage?: string;
  className?: string;
}

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || '';

function buildAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

export function CompanyStoreMap({
  geoJsonUrl,
  emptyMessage = 'Map is not available for this company.',
  className = '',
}: CompanyStoreMapProps) {
  const [geoUrl, setGeoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (geoJsonUrl) setGeoUrl(buildAbsoluteUrl(geoJsonUrl));
    else setGeoUrl(null);
  }, [geoJsonUrl]);

  if (!geoJsonUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground ${className}`}
        style={{ minHeight: 360 }}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  if (!MAPBOX_TOKEN?.trim()) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground ${className}`}
        style={{ minHeight: 360 }}
      >
        <p className="text-sm">Map requires VITE_MAPBOX_TOKEN in .env or .env.local.</p>
      </div>
    );
  }

  if (!geoUrl) return null;

  return (
    <div
      className={`rounded-xl overflow-hidden bg-[#141414] ${className}`}
      style={{ height: 400, minHeight: 360 }}
    >
      <GeoJSONPreviewMap url={geoUrl} token={MAPBOX_TOKEN} className="w-full h-full" />
    </div>
  );
}
