import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/lib/auth';

export const Route = createFileRoute('/projects/')({
  component: ProjectsIndexPage,
});

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  share_id: string | null;
  created_at: string;
  updated_at: string;
}

function ProjectsIndexPage() {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    const headers = getAuthHeaders();
    fetch('/api/projects', { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [getAuthHeaders]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-2">
              Your projects
            </h1>
            <p className="text-muted-foreground text-base">
              Create and manage map projects. Open a project to edit slides and layers, then share the link.
            </p>
          </div>
          <Button onClick={createNewProject} disabled={creating}>
            {creating ? 'Creating…' : 'New project'}
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : projects.length === 0 ? (
          <Card className="border border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No projects yet.</p>
              <Button onClick={createNewProject} disabled={creating}>
                {creating ? 'Creating…' : 'Create your first project'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id} className="border border-border shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-foreground truncate">{p.name}</CardTitle>
                    {p.description && (
                      <CardDescription className="text-muted-foreground line-clamp-2 mt-1">
                        {p.description}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="default" size="sm">
                    <Link to="/customize" search={{ projectId: p.id }}>
                      Open
                    </Link>
                  </Button>
                  {p.share_id && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`/p/${p.share_id}`} target="_blank" rel="noopener noreferrer">
                        View shared
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id)}
                  >
                    {deletingId === p.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
