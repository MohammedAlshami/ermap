import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="font-phudu antialiased min-h-screen">
      <Outlet />
    </div>
  );
}
