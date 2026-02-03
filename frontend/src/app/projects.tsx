import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';
import { useAuth } from '~/lib/auth';
import { useEffect } from 'react';

export const Route = createFileRoute('/projects')({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <PageLayout theme="light">
        <div className="py-16 px-4 flex justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </PageLayout>
    );
  }

  if (!user) return null;

  return (
    <PageLayout theme="light">
      <Outlet />
    </PageLayout>
  );
}
