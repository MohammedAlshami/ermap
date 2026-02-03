import Link from 'next/link';

const CARD_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      {/* Navbar - overlays hero */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-white hover:text-white/90">
            ERMAP
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-white font-bold hover:text-white/90">
              Home
            </Link>
            <Link href="/maps" className="text-white font-bold hover:text-white/90">
              Maps
            </Link>
            <Link href="/examples" className="text-white font-bold hover:text-white/90">
              Examples
            </Link>
          </div>
        </div>
      </nav>

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
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-60% to-white"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Interactive Map Visualizations
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-8 drop-shadow">
            Explore geographic data, tourism, infrastructure, and resource distribution with interactive maps.
          </p>
          <Link
            href="/maps"
            className="inline-block px-6 py-3 bg-[#c5d86d] text-gray-900 rounded-lg hover:bg-[#b8cc5a] transition font-medium"
          >
            View Maps
          </Link>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-left">
            Examples
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/maps"
              className="block overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={CARD_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100"
                  aria-hidden
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Malaysia Geographic Insights
                </h3>
                <p className="text-gray-600 text-sm">
                  Tourism, water scarcity, hotels, and retail distribution across Malaysia.
                </p>
              </div>
            </Link>
            <Link
              href="/examples"
              className="block overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={CARD_IMAGE}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-100"
                  aria-hidden
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  More Examples
                </h3>
                <p className="text-gray-600 text-sm">
                  Browse additional map examples and use cases.
                </p>
              </div>
            </Link>
          </div>
          <div className="text-right mt-8">
            <Link
              href="/examples"
              className="text-gray-600 hover:text-gray-900 underline"
            >
              View all examples →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
              ERMAP
            </Link>
            <p className="mt-1 text-sm text-gray-500">
              Interactive map visualizations
            </p>
          </div>
          <nav className="flex gap-8" aria-label="Footer navigation">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/maps" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Maps
            </Link>
            <Link href="/examples" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Examples
            </Link>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ERMAP. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
