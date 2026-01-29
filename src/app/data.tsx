import { createFileRoute, Link } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';
import { GeoJSONPreviewMap } from '~/components/GeoJSONPreviewMap';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/data')({
  component: DataPage,
});

const PAGE_BG = '#0c0c0c';

interface DataMappingR2Entry {
  r2Key: string;
  name: string;
  format: string;
}

interface DataMapping {
  malaysia?: {
    geojson?: Record<string, DataMappingR2Entry>;
  };
}

type PreviewEntry = { id: string; entry: DataMappingR2Entry };

function DataPage() {
  const [dataMapping, setDataMapping] = useState<DataMapping | null>(null);
  const [r2Loaded, setR2Loaded] = useState<Record<string, { features?: number; error?: string }>>({});
  const [preview, setPreview] = useState<PreviewEntry | null>(null);
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) || '';

  useEffect(() => {
    fetch('/data-mapping.json')
      .then((r) => r.json())
      .then(setDataMapping)
      .catch(() => setDataMapping(null));
  }, []);

  useEffect(() => {
    if (!preview) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [preview]);

  useEffect(() => {
    if (!dataMapping?.malaysia?.geojson) return;
    const entries = Object.entries(dataMapping.malaysia.geojson).filter(([, v]) => v.r2Key);
    entries.forEach(([id, entry]) => {
      fetch(`/api/files/${entry.r2Key}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
        .then((geojson: GeoJSON.FeatureCollection) => {
          setR2Loaded((prev) => ({
            ...prev,
            [id]: { features: geojson.features?.length ?? 0 },
          }));
        })
        .catch((err) => {
          setR2Loaded((prev) => ({
            ...prev,
            [id]: { error: err.message || 'Not found' },
          }));
        });
    });
  }, [dataMapping]);

  const r2Entries = dataMapping?.malaysia?.geojson
    ? Object.entries(dataMapping.malaysia.geojson).filter(([, v]) => v.r2Key)
    : [];

  return (
    <PageLayout navTransparent={false}>
      <div
        className="flex w-full flex-1 min-h-0"
        style={{ backgroundColor: PAGE_BG }}
      >
        {/* Left: content */}
        <div className="flex-1 min-w-0 overflow-auto py-16 px-6">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-white mb-2 font-phudu">
              Data
            </h1>
            <p className="text-gray-400 mb-10 font-phudu">
              Datasets loaded from Cloudflare R2. Mapping and metadata in <code className="text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded text-sm">public/data-mapping.json</code>.
            </p>

            {r2Entries.length > 0 ? (
              <section className="mb-10">
                <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wide mb-4 font-phudu">
                  R2 files
                </h2>
                <div className="rounded-lg bg-gray-900/80 border border-gray-800 overflow-hidden font-phudu">
                  <ul className="divide-y divide-gray-800">
                    {r2Entries.map(([id, entry]) => (
                      <li
                        key={id}
                        role="button"
                        tabIndex={0}
                        onClick={() => entry.format === 'GeoJSON' && setPreview({ id, entry })}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && entry.format === 'GeoJSON') {
                            e.preventDefault();
                            setPreview({ id, entry });
                          }
                        }}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gray-800/50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5d86d] focus:ring-inset"
                      >
                        <div className="min-w-0 flex items-center gap-3 flex-wrap">
                          <span className="text-white font-medium font-phudu">{entry.name}</span>
                          <span className="text-xs text-gray-500 font-mono font-phudu">{entry.format}</span>
                          {r2Loaded[id]?.features != null && (
                            <span className="text-xs font-medium text-[#c5d86d] font-phudu">
                              Loaded: {r2Loaded[id].features} features
                            </span>
                          )}
                          {r2Loaded[id]?.error && (
                            <span className="text-xs font-medium text-red-400 font-phudu">
                              {r2Loaded[id].error}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {entry.format === 'GeoJSON' && (
                            <button
                              type="button"
                              onClick={() => setPreview({ id, entry })}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition font-phudu"
                            >
                              Show map
                            </button>
                          )}
                          <a
                            href={`/api/files/${entry.r2Key}`}
                            download={entry.name.replace(/\s+/g, '-').toLowerCase() + (entry.format === 'GeoJSON' ? '.geojson' : '.json')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-[#c5d86d] text-gray-900 hover:bg-[#b8cc5a] transition font-phudu"
                          >
                            Download
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : (
              <p className="text-gray-500 font-phudu">No R2 entries in data-mapping.json (malaysia.geojson with r2Key).</p>
            )}

            <div className="mt-12 pt-8 border-t border-gray-800">
              <Link
                to="/maps"
                className="inline-flex items-center gap-2 text-[#c5d86d] hover:text-[#b8cc5a] font-medium font-phudu"
              >
                View these data on the map →
              </Link>
            </div>
          </div>
        </div>

        {/* Right: map panel (pushes content left, part of layout) */}
        {preview && (
          <aside
            className="w-full max-w-[50vw] min-w-[320px] h-full flex flex-col shrink-0 bg-gray-900 font-phudu overflow-hidden"
            aria-label="Map preview"
          >
            <div className="relative flex-1 min-h-0 flex flex-col w-full">
              {mapboxToken ? (
                <GeoJSONPreviewMap
                  url={`/api/files/${preview.entry.r2Key}`}
                  token={mapboxToken}
                  className="flex-1 min-h-0 w-full"
                />
              ) : (
                <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500 font-phudu">
                  Set VITE_MAPBOX_TOKEN to show the map.
                </div>
              )}
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800 transition shadow"
                aria-label="Close map"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </aside>
        )}
      </div>
    </PageLayout>
  );
}
