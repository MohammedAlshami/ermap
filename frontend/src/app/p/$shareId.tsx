import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { MapLibrary } from '~/components/MapLibrary';
import type { MapLibraryConfig } from '~/components/MapLibrary';
import { buildSlideshowSlidesFromConfig, buildLayerConfigWithType, LAYER_OPTIONS } from '~/config/layerOptions';
import type { GeoJSONLayerConfig } from '~/components/MapLibrary';

function buildLayerConfig(opt: (typeof LAYER_OPTIONS)[number]): GeoJSONLayerConfig {
  return buildLayerConfigWithType(opt, 'markers');
}

export const Route = createFileRoute('/p/$shareId')({
  component: PublicProjectPage,
});

type ProjectConfig = {
  slides?: Array<{ id: string; title: string; layerEntries?: { layerId: string; type: string }[]; descriptionHtml?: string; contentPosition?: string }>;
  mapStyle?: string;
  selectedLayerIds?: string[];
};

function PublicProjectPage() {
  const { shareId } = Route.useParams();
  const [name, setName] = useState('');
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shareId) {
      setLoading(false);
      setError(true);
      return;
    }
    fetch(`/api/projects/public/${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => {
        setName(data.name || 'Map project');
        setConfig(data.config || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  const mapConfig: MapLibraryConfig = useMemo(() => {
    const mapStyleUrl =
      config?.mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/light-v11';
    const slideshowSlides =
      config?.slides?.length ? buildSlideshowSlidesFromConfig(config.slides) : [];
    const selectedIds = new Set(config?.selectedLayerIds ?? []);
    const layers =
      selectedIds.size > 0
        ? LAYER_OPTIONS.filter((opt) => selectedIds.has(opt.id)).map(buildLayerConfig)
        : [];
    return {
      mapboxAccessToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
      style: mapStyleUrl,
      initialCamera: { center: [101.9758, 4.2105], zoom: 6 },
      layers,
      ...(slideshowSlides.length > 0
        ? {
            slideshow: {
              slides: slideshowSlides,
              autoPlay: false,
              loop: true,
              showControls: true,
              showProgress: true,
            },
          }
        : {}),
    };
  }, [config]);

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <main className="flex-1 min-h-0 flex flex-col min-w-0 relative">
        <div className="flex-1 min-h-0 min-w-0 flex flex-col relative">
          <MapLibrary config={mapConfig} className="absolute inset-0 w-full h-full" />
        </div>
      </main>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      )}
      {error && !loading && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-border/50 bg-background/95 px-4 py-2 shadow-sm backdrop-blur">
          <p className="text-muted-foreground text-sm">Project not found.</p>
          <Link to="/" className="mt-1 block text-sm font-medium text-primary hover:underline">
            Go home
          </Link>
        </div>
      )}
    </div>
  );
}
