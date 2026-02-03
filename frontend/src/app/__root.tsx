import { Outlet, createRootRoute } from '@tanstack/react-router';
import { AuthProvider } from '~/lib/auth';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AuthProvider>
      <div className="font-phudu antialiased min-h-screen">
        <Outlet />
      </div>
    </AuthProvider>
  );
}
