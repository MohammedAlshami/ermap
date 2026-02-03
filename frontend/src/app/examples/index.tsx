import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Button } from '~/components/ui/button';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

export const Route = createFileRoute('/examples/')({
  component: ExamplesIndexPage,
});

function ExamplesIndexPage() {
  const categories = [
    {
      id: 'basic',
      title: 'Basic',
      examples: [
        {
          title: 'Malaysia Geographic Insights',
          description:
            'Interactive slideshow map with tourism data, water scarcity, hotels, and SpeedMart locations.',
          to: '/maps',
          tag: 'Full map',
        },
      ],
    },
    {
      id: '3d',
      title: '3D',
      examples: [
        {
          title: 'Mapbox 3D Buildings',
          description:
            'Interactive map with Mapbox 3D building extrusions. Tilt and zoom to explore.',
          to: '/examples/3d',
          tag: '3D',
        },
      ],
    },
  ];

  const allExamples = categories.flatMap((cat) =>
    cat.examples.map((ex) => ({ ...ex, category: cat.title }))
  );

  return (
    <div className="w-full overflow-hidden">
      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground">
            Examples
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl">
            Map visualizations and use cases.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {allExamples.map((example) => (
            <Link key={example.to} to={example.to} className="group block h-full">
              <Card className="h-full rounded-xl border border-border/50 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:shadow-lg overflow-hidden pt-0">
                <div className="relative h-44 w-full overflow-hidden rounded-t-xl">
                  <img
                    src={CARD_IMAGE}
                    alt=""
                    className="h-full w-full object-cover rounded-t-xl"
                  />
                </div>
                <CardHeader>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {example.tag}
                  </span>
                  <CardTitle className="text-foreground group-hover:text-foreground/90 transition-colors">
                    {example.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {example.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:bg-muted pointer-events-none"
                    asChild
                  >
                    <span>Open →</span>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
