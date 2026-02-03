import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

interface ModelEntry {
  id: string;
  name: string;
  description: string;
  type: string;
}

const MODELS: ModelEntry[] = [
  {
    id: 'landslide-segmentation',
    name: 'Landslide Segmentation Model',
    description: 'Segmentation model for detecting and delineating landslide areas from imagery or terrain data.',
    type: 'Segmentation',
  },
];

export const Route = createFileRoute('/models/')({
  component: ModelsIndexPage,
});

function ModelsIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return MODELS;
    const q = searchQuery.trim().toLowerCase();
    return MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full overflow-hidden">
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground">
            Models
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl">
            Browse and run models for geographic and imagery analysis.
          </p>
          <input
            type="search"
            placeholder="Search models by name, type, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-6 w-full max-w-md rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <Card
              key={model.id}
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
                <CardTitle className="text-foreground">{model.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  <span className="font-medium text-foreground/80">{model.type}</span>
                  <span className="block mt-1">{model.description}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <span className="text-sm text-muted-foreground">Coming soon</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <p className="text-muted-foreground">No models match your search.</p>
        )}
      </section>
    </div>
  );
}
