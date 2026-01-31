import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

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

export const Route = createFileRoute('/data/')({
  component: DataIndexPage,
});

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
    <section className="py-20 px-6" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">
            Data
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Datasets loaded from Cloudflare R2. Mapping and metadata in data-mapping.json.
          </p>
        </div>

        {r2Entries.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {r2Entries.map(([slug, entry]) => {
              const href = entry.id ? `/data/${entry.id}` : undefined;
              const meta = r2Loaded[slug];
              return (
                <div key={slug}>
                  {href ? (
                    <Link to="/data/$id" params={{ id: entry.id! }} className="group block h-full">
                      <Card className="h-full border-border/50 overflow-hidden transition-all duration-200 group-hover:border-[#c5d86d] bg-[#C5D86D] pt-0">
                        <div className="relative h-44 w-full overflow-hidden">
                          <img
                            src={CARD_IMAGE}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-gray-900 group-hover:text-gray-800 transition-colors">
                            {entry.name}
                          </CardTitle>
                          <CardDescription className="text-gray-800">
                            {entry.format}
                            {meta?.features != null && (
                              <span className="block mt-1">
                                {meta.features} features
                              </span>
                            )}
                            {meta?.error && (
                              <span className="block mt-1 text-red-700">
                                {meta.error}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ) : (
                    <Card className="h-full border-border/50 bg-[#C5D86D] pt-0">
                      <div className="relative h-44 w-full overflow-hidden">
                        <img
                          src={CARD_IMAGE}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-gray-900">{entry.name}</CardTitle>
                        <CardDescription className="text-gray-800">
                          {entry.format}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/70 text-center">No R2 entries in data-mapping.json.</p>
        )}
      </div>
    </section>
  );
}
