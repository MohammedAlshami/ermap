import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { PageLayout } from '~/components/PageLayout';

const HERO_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';
const CARD_IMAGE = HERO_IMAGE;

const PAGE_BG = '#0c0c0c';

export const Route = createFileRoute('/')({
  component: HomePage,
});

const features = [
  {
    to: '/maps',
    title: 'Malaysia Geographic Insights',
    description: 'Tourism, water scarcity, hotels, and retail distribution across Malaysia.',
  },
  {
    to: '/examples',
    title: 'More Examples',
    description: 'Browse additional map examples and use cases.',
  },
  {
    to: '/data',
    title: 'Data',
    description: 'Browse datasets: tourism, water scarcity, hotels, SpeedMart, and boundaries.',
  },
] as const;

function HomePage() {
  return (
    <PageLayout navTransparent>
      {/* Hero – negative margin so image sits behind navbar */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden -mt-14 pt-14">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-50% to-[#0c0c0c]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-5 drop-shadow-lg tracking-tight">
            Interactive Map Visualizations
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10 drop-shadow max-w-2xl mx-auto leading-relaxed">
            Explore geographic data, tourism, infrastructure, and resource distribution with interactive maps.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#c5d86d] text-gray-900 hover:bg-[#b8cc5a] text-base px-8 h-12 rounded-lg font-semibold shadow-lg"
            >
              <Link to="/maps">View Maps</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-gray-300 bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900 text-base px-8 h-12 rounded-lg"
            >
              <Link to="/data">Browse Data</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features / Examples */}
      <section className="py-20 px-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              Explore by section
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Jump into maps, datasets, or more example visualizations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {features.map(({ to, title, description }) => (
              <Link key={to} to={to} className="group block h-full">
                <Card className="h-full border-border/50 overflow-hidden transition-all duration-200 group-hover:border-[#c5d86d] bg-[#C5D86D] pt-0">
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={CARD_IMAGE}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-gray-900 group-hover:text-gray-800 transition-colors">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-gray-700">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 justify-center mt-10">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
              <Link to="/data">Data →</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-white">
              <Link to="/examples">View all examples →</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
