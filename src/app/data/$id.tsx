import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { GeoJSONPreviewMap } from '~/components/GeoJSONPreviewMap';

export const Route = createFileRoute('/data/$id')({
  component: DataDetailPage,
});

const PAGE_BG = '#0c0c0c';

interface DataMappingR2Entry {
  id?: string;
  r2Key?: string;
  name: string;
  format: string;
}

interface DataMapping {
  malaysia?: {
    geojson?: Record<string, DataMappingR2Entry>;
    statistics?: Record<string, DataMappingR2Entry>;
    hotels?: Record<string, DataMappingR2Entry>;
    speedmart?: Record<string, DataMappingR2Entry>;
  };
}

function findEntryById(mapping: DataMapping | null, id: string): DataMappingR2Entry | null {
  if (!mapping?.malaysia) return null;
  const sections = [
    mapping.malaysia.geojson,
    mapping.malaysia.statistics,
    mapping.malaysia.hotels,
    mapping.malaysia.speedmart,
  ].filter(Boolean) as Record<string, DataMappingR2Entry>[];
  for (const section of sections) {
    const entry = Object.values(section).find((e) => e.id === id);
    if (entry) return entry;
  }
  return null;
}

function DataDetailPage() {
  const { id } = Route.useParams();
  const [dataMapping, setDataMapping] = useState<DataMapping | null>(null);
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || '';

  useEffect(() => {
    fetch('/data-mapping.json')
      .then((r) => r.json())
      .then(setDataMapping)
      .catch(() => setDataMapping(null));
  }, []);

  const entry = findEntryById(dataMapping, id);
  const showMap = Boolean(entry?.r2Key && entry?.format === 'GeoJSON');

  if (dataMapping === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ backgroundColor: PAGE_BG }}>
        <p className="text-gray-500 font-phudu">Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex-1 min-h-screen overflow-auto py-16 px-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="w-full">
          <Link to="/data" className="text-[#c5d86d] hover:text-[#b8cc5a] font-phudu mb-4 inline-block">
            ← Back to Data
          </Link>
          <h1 className="text-2xl font-bold text-white font-phudu">Not found</h1>
          <p className="text-gray-500 font-phudu mt-2">No dataset with ID {id}.</p>
        </div>
      </div>
    );
  }

  if (!showMap) {
    return (
      <div className="flex-1 min-h-screen overflow-auto py-16 px-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="w-full">
          <Link to="/data" className="text-[#c5d86d] hover:text-[#b8cc5a] font-phudu mb-4 inline-block">
            ← Back to Data
          </Link>
          <h1 className="text-2xl font-bold text-white font-phudu">{entry.name}</h1>
          <p className="text-gray-500 font-phudu mt-2">No map for this dataset (not GeoJSON or no file).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-gray-900 font-phudu overflow-hidden">
      <div className="absolute inset-0 w-full h-full">
        {mapboxToken ? (
          <GeoJSONPreviewMap
            url={`/api/files/${entry.r2Key}`}
            token={mapboxToken}
            tileKey={entry.r2Key}
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
        className="absolute top-3 left-3 z-10 p-2 rounded-full bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 transition shadow font-phudu"
        aria-label="Back to Data"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>
    </div>
  );
}
