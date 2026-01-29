import { Outlet, createFileRoute } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

export const Route = createFileRoute('/examples')({
  component: ExamplesLayout,
});

function ExamplesLayout() {
  return (
    <PageLayout navTransparent={false}>
      <Outlet />
    </PageLayout>
  );
}
