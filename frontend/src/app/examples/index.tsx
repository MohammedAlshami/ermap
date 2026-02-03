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
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-left mb-12">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-3">
              Examples
            </h1>
            <p className="text-muted-foreground text-base max-w-xl">
              Map visualizations and use cases.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
          {allExamples.map((example) => (
            <Link key={example.to} to={example.to} className="group block h-full">
              <Card className="h-full border-0 transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden bg-card text-card-foreground pt-0">
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
        </div>
    </section>
  );
}
