import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

export const Route = createFileRoute('/data')({
  component: DataLayout,
});

function DataLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetailPage = pathname.startsWith('/data/') && pathname !== '/data';

  if (isDetailPage) {
    return <Outlet />;
  }

  return (
    <PageLayout theme="light">
      <Outlet />
    </PageLayout>
  );
}
