import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

export const Route = createFileRoute('/models')({
  component: ModelsLayout,
});

function ModelsLayout() {
  return (
    <PageLayout theme="light">
      <Outlet />
    </PageLayout>
  );
}
