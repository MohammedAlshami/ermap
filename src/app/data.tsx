import { Outlet, createFileRoute } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

export const Route = createFileRoute('/data')({
  component: DataLayout,
});

function DataLayout() {
  return (
    <PageLayout navTransparent={false}>
      <Outlet />
    </PageLayout>
  );
}
