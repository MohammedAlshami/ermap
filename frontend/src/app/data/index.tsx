import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { supabase } from '~/lib/supabase';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

interface GeoJSONDatasetEntry {
  id: string;
  slug: string;
  name: string;
  format: string;
  metadata: Record<string, unknown> | null;
  featureCount: number | null;
}

export const Route = createFileRoute('/data/')({
  component: DataIndexPage,
});

function DataIndexPage() {
  const [datasets, setDatasets] = useState<GeoJSONDatasetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      if (supabase) {
        const { data, error } = await supabase
          .from('geojson_datasets')
          .select('id, slug, name, format, metadata');
        if (!error && data) {
          setDatasets(
            data.map((row) => ({
              id: row.id,
              slug: row.slug,
              name: row.name,
              format: row.format,
              metadata: row.metadata,
              featureCount: null,
            }))
          );
          return;
        }
      }
      const r = await fetch('/api/geojson-datasets');
      if (r.ok) {
        const list = await r.json();
        setDatasets(Array.isArray(list) ? list : []);
      }
    }
    load()
      .catch(() => setDatasets([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = searchQuery.trim()
    ? datasets.filter(
        (entry) =>
          entry.name?.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          entry.format?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : datasets;

  return (
    <div className="w-full overflow-hidden">
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground">
            Data
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl">
            GeoJSON datasets loaded from the database.
          </p>
          <input
            type="search"
            placeholder="Search datasets by name or format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-6 w-full max-w-md rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => (
              <Link
                key={entry.id}
                to="/data/$id"
                params={{ id: entry.id }}
                className="group block h-full"
              >
                <Card
                  className={cn(
                    'h-full rounded-xl border border-border/50 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:shadow-lg pt-0 overflow-hidden'
                  )}
                >
                  <div className="relative h-44 w-full overflow-hidden rounded-t-xl">
                    <img
                      src={CARD_IMAGE}
                      alt=""
                      className="h-full w-full object-cover rounded-t-xl"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-foreground group-hover:text-foreground/90 transition-colors">
                      {entry.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {entry.format}
                      {entry.featureCount != null && (
                        <span className="block mt-1">{entry.featureCount} features</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-muted pointer-events-none"
                      asChild
                    >
                      <span>Open →</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : filteredEntries.length === 0 && datasets.length > 0 ? (
          <p className="text-muted-foreground">No datasets match your search.</p>
        ) : (
          <p className="text-muted-foreground">No datasets in the database.</p>
        )}
      </section>
    </div>
  );
}
