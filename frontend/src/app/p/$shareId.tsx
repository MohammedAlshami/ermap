import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { MapLibrary } from '~/components/MapLibrary';
import type { MapLibraryConfig } from '~/components/MapLibrary';
import { buildSlideshowSlidesFromConfig } from '~/config/layerOptions';

export const Route = createFileRoute('/p/$shareId')({
  component: PublicProjectPage,
});

function PublicProjectPage() {
  const { shareId } = Route.useParams();
  const [name, setName] = useState('');
  const [config, setConfig] = useState<{ slides?: Array<{ id: string; title: string; layerEntries?: { layerId: string; type: string }[]; descriptionHtml?: string; contentPosition?: string }>; mapStyle?: string } | null>(null);
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

  const mapConfig: MapLibraryConfig | null = useMemo(() => {
    if (!config) return null;
    const mapStyleUrl =
      config.mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/light-v11';
    const slideshowSlides =
      config.slides?.length ? buildSlideshowSlidesFromConfig(config.slides) : [];
    return {
      mapboxAccessToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
      style: mapStyleUrl,
      initialCamera: { center: [101.9758, 4.2105], zoom: 6 },
      layers: [],
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/" className="text-primary font-medium hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (!mapConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-muted-foreground">Unable to load project.</p>
        <Link to="/" className="text-primary font-medium hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b border-border bg-background/95 backdrop-blur">
        <Link to="/" className="text-lg font-semibold text-foreground hover:opacity-90 font-phudu">
          ERMAP
        </Link>
        <span className="text-sm text-muted-foreground truncate max-w-[60%]" title={name}>
          {name}
        </span>
        <Link
          to="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Home
        </Link>
      </header>
      <main className="flex-1 min-h-0 relative">
        <MapLibrary config={mapConfig} />
      </main>
    </div>
  );
}
