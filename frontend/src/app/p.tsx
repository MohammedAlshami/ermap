import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/p')({
  component: PLayout,
});

function PLayout() {
  return <Outlet />;
}
