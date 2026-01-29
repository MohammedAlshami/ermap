import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { PageLayout } from '~/components/PageLayout';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

const PAGE_BG = '#0c0c0c';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <PageLayout navTransparent>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={CARD_IMAGE}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-[#0c0c0c]"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg font-phudu">
            Interactive Map Visualizations
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-8 drop-shadow font-phudu">
            Explore geographic data, tourism, infrastructure, and resource distribution with interactive maps.
          </p>
          <Link
            to="/maps"
            className="inline-block px-6 py-3 bg-[#c5d86d] text-gray-900 rounded-lg hover:bg-[#b8cc5a] transition font-medium font-phudu"
          >
            View Maps
          </Link>
        </div>
      </section>

      {/* Examples Section - dark theme, same as examples page */}
      <section className="py-16 px-6" style={{ backgroundColor: PAGE_BG }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-left font-phudu">
            Examples
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/maps"
              className="block overflow-hidden rounded-lg bg-gray-900/80 hover:bg-gray-800/80 transition font-phudu"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={CARD_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80"
                  aria-hidden
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 font-phudu">
                  Malaysia Geographic Insights
                </h3>
                <p className="text-gray-400 text-sm font-phudu">
                  Tourism, water scarcity, hotels, and retail distribution across Malaysia.
                </p>
              </div>
            </Link>
            <Link
              to="/examples"
              className="block overflow-hidden rounded-lg bg-gray-900/80 hover:bg-gray-800/80 transition font-phudu"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={CARD_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80"
                  aria-hidden
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 font-phudu">
                  More Examples
                </h3>
                <p className="text-gray-400 text-sm font-phudu">
                  Browse additional map examples and use cases.
                </p>
              </div>
            </Link>
            <Link
              to="/data"
              className="block overflow-hidden rounded-lg bg-gray-900/80 hover:bg-gray-800/80 transition font-phudu"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={CARD_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/80"
                  aria-hidden
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2 font-phudu">
                  Data
                </h3>
                <p className="text-gray-400 text-sm font-phudu">
                  Browse datasets: tourism, water scarcity, hotels, SpeedMart, and boundaries.
                </p>
              </div>
            </Link>
          </div>
          <div className="text-right mt-8 flex gap-6 justify-end">
            <Link
              to="/data"
              className="text-gray-400 hover:text-white underline font-phudu"
            >
              Data →
            </Link>
            <Link
              to="/examples"
              className="text-gray-400 hover:text-white underline font-phudu"
            >
              View all examples →
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
