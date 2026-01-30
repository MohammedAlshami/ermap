import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/data/')({
  component: DataIndexPage,
});

const PAGE_BG = '#0c0c0c';

interface DataMappingR2Entry {
  id?: string;
  r2Key: string;
  name: string;
  format: string;
}

interface DataMapping {
  malaysia?: {
    geojson?: Record<string, DataMappingR2Entry>;
  };
}

function DataIndexPage() {
  const [dataMapping, setDataMapping] = useState<DataMapping | null>(null);
  const [r2Loaded, setR2Loaded] = useState<Record<string, { features?: number; error?: string }>>({});

  useEffect(() => {
    fetch('/data-mapping.json')
      .then((r) => r.json())
      .then(setDataMapping)
      .catch(() => setDataMapping(null));
  }, []);

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
    <div
      className="flex w-full flex-1 min-h-0"
      style={{ backgroundColor: PAGE_BG }}
    >
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
                  {r2Entries.map(([slug, entry]) => {
                    const href = entry.id ? `/data/${entry.id}` : undefined;
                    const content = (
                      <>
                        <div className="min-w-0 flex items-center gap-3 flex-wrap">
                          <span className="text-white font-medium font-phudu">{entry.name}</span>
                          <span className="text-xs text-gray-500 font-mono font-phudu">{entry.format}</span>
                          {r2Loaded[slug]?.features != null && (
                            <span className="text-xs font-medium text-[#c5d86d] font-phudu">
                              Loaded: {r2Loaded[slug].features} features
                            </span>
                          )}
                          {r2Loaded[slug]?.error && (
                            <span className="text-xs font-medium text-red-400 font-phudu">
                              {r2Loaded[slug].error}
                            </span>
                          )}
                        </div>
                        {href && (
                          <span className="text-sm text-[#c5d86d] font-phudu">View →</span>
                        )}
                      </>
                    );
                    return (
                      <li key={slug}>
                        {href ? (
                          <Link
                            to="/data/$id"
                            params={{ id: entry.id! }}
                            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gray-800/50 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c5d86d] focus:ring-inset block"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 font-phudu">
                            {content}
                          </div>
                        )}
                      </li>
                    );
                  })}
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
    </div>
  );
}
