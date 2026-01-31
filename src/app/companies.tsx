import { Outlet, createFileRoute } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

export const Route = createFileRoute('/companies')({
  component: CompaniesLayout,
});

function CompaniesLayout() {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
}
