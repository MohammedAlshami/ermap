import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

const PAGE_BG = '#0c0c0c';

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
    <section className="py-20 px-6" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">
            Examples
          </h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Map visualizations and use cases.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {allExamples.map((example) => (
            <Link key={example.to} to={example.to} className="group block h-full">
              <Card className="h-full border-border/50 overflow-hidden transition-all duration-200 group-hover:border-[#c5d86d] bg-[#C5D86D] pt-0">
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={CARD_IMAGE}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader>
                  <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {example.tag}
                  </span>
                  <CardTitle className="text-gray-900 group-hover:text-gray-800 transition-colors">
                    {example.title}
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    {example.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
