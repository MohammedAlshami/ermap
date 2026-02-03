import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/examples')({
  component: ExamplesLayout,
});

function ExamplesLayout() {
  return (
    <div className="min-h-screen flex flex-col font-phudu bg-background relative">
      <main className="flex-1 flex flex-col min-h-0 relative">
        <Outlet />
      </main>
      <Link
        to="/"
        className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 rounded-md bg-background/90 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground"
        aria-label="Back to home"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back
      </Link>
    </div>
  );
}
