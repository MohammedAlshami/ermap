import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { GeoJSONPreviewMap } from '~/components/GeoJSONPreviewMap';
import { supabase } from '~/lib/supabase';

export const Route = createFileRoute('/data/$id')({
  component: DataDetailPage,
});

const PAGE_BG = '#0c0c0c';

interface GeoJSONDatasetEntry {
  id: string;
  slug: string;
  name: string;
  format: string;
  metadata: Record<string, unknown> | null;
}

function DataDetailPage() {
  const { id } = Route.useParams();
  const [entry, setEntry] = useState<GeoJSONDatasetEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || '';

  useEffect(() => {
    async function load() {
      if (supabase) {
        const { data, error: e } = await supabase
          .from('geojson_datasets')
          .select('id, slug, name, format, metadata')
          .eq('id', id)
          .maybeSingle();
        if (!e && data) {
          setEntry(data);
          setLoading(false);
          return;
        }
        const bySlug = await supabase
          .from('geojson_datasets')
          .select('id, slug, name, format, metadata')
          .eq('slug', id)
          .maybeSingle();
        if (!bySlug.error && bySlug.data) {
          setEntry(bySlug.data);
          setLoading(false);
          return;
        }
      }
      const r = await fetch(`/api/geojson-datasets/${id}`);
      if (r.ok) {
        const data = await r.json();
        setEntry(data);
      } else {
        setError(true);
      }
    }
    load()
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-screen"
        style={{ backgroundColor: PAGE_BG }}
      >
        <p className="text-gray-500 font-phudu">Loading…</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div
        className="flex-1 min-h-screen overflow-auto py-16 px-6"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div className="w-full">
          <Link
            to="/data"
            className="text-foreground hover:text-foreground/80 font-phudu mb-4 inline-block"
          >
            ← Back to Data
          </Link>
          <h1 className="text-2xl font-bold text-white font-phudu">Not found</h1>
          <p className="text-gray-500 font-phudu mt-2">No dataset with ID {id}.</p>
        </div>
      </div>
    );
  }

  const geoJsonUrl = `/api/files/${entry.slug}`;

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-gray-900 font-phudu overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        {mapboxToken ? (
          <GeoJSONPreviewMap
            url={geoJsonUrl}
            token={mapboxToken}
            tileKey={entry.slug}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-phudu">
            Set VITE_MAPBOX_TOKEN to show the map.
          </div>
        )}
      </div>
      <Link
        to="/data"
        className="absolute top-3 left-3 z-10 flex items-center justify-center w-10 h-10 rounded-lg bg-white/95 text-foreground hover:bg-white shadow-md hover:shadow-lg transition font-phudu border border-gray-200/80"
        aria-label="Back to Data"
      >
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </Link>
    </div>
  );
}
