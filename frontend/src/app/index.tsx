import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { PageLayout } from '~/components/PageLayout';
import { cn } from '~/lib/utils';
import { useAuth } from '~/lib/auth';

const HERO_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const features = [
  {
    to: '/maps',
    title: 'Malaysia Geographic Insights',
    description: 'Tourism, water scarcity, hotels, and retail distribution across Malaysia.',
  },
  {
    to: '/customize',
    title: 'Customize map',
    description: 'Map with side panel: select which data layers to visualize on the map.',
  },
  {
    to: '/examples',
    title: 'Analysis',
    description: 'Browse map examples and use cases.',
  },
  {
    to: '/data',
    title: 'Data',
    description: 'Browse datasets: tourism, water scarcity, hotels, SpeedMart, and boundaries.',
  },
] as const;

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  share_id: string | null;
}

function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const createNewProject = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled', config: { slides: [], mapStyle: 'standard', selectedLayerIds: [] } }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate({ to: '/customize', search: { projectId: String(data.id) } });
      }
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    setProjectsLoading(true);
    fetch('/api/projects', { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, [user, getAuthHeaders]);

  return (
    <PageLayout theme="light">
      {/* Hero – white / light background */}
      <section className="relative bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid grid-cols-1 gap-10 lg:gap-16 items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                Interactive Map Visualizations
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl leading-relaxed">
                Explore geographic data, tourism, infrastructure, and resource distribution with interactive maps.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 font-semibold">
                  <Link to="/maps">View Maps</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/data">Browse Data</Link>
                </Button>
                {!authLoading && !user && (
                  <>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/login">Log in</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-lg">
              <img
                src={HERO_IMAGE}
                alt="Map visualization"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Your projects – when logged in */}
      {user && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-muted/30 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Your projects
                </h2>
                <p className="mt-1 text-muted-foreground text-base">
                  Open or share your saved map projects.
                </p>
              </div>
              <Button onClick={createNewProject} disabled={creating}>
                {creating ? 'Creating…' : 'New project'}
              </Button>
            </div>
            {projectsLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground">No projects yet. Create one from Customize.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 6).map((p) => (
                  <Link key={p.id} to="/customize" search={{ projectId: p.id }} className="block">
                    <Card className="h-full border border-border shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-foreground text-base truncate">{p.name}</CardTitle>
                        {p.description && (
                          <CardDescription className="text-muted-foreground line-clamp-2 text-sm">
                            {p.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <span className="text-sm text-primary font-medium">Open →</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            {projects.length > 0 && (
              <div className="mt-4">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/projects">View all projects</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Explore by section – shadcn Cards */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-left mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Explore by section
            </h2>
            <p className="mt-2 text-muted-foreground text-base max-w-xl">
              Jump into maps, datasets, or analysis visualizations.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ to, title, description }) => (
              <Link key={to} to={to} className="group block h-full">
                <Card
                  className={cn(
                    'h-full border-0 transition-all duration-200 shadow-sm bg-card text-card-foreground',
                    'hover:shadow-md'
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-foreground group-hover:text-foreground/90 transition-colors">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {description}
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
        </div>
      </section>
    </PageLayout>
  );
}
