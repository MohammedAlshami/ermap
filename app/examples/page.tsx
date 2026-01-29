import Link from 'next/link';

export default function ExamplesPage() {
  const CARD_IMAGE =
    'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

  const categories = [
    {
      id: 'basic',
      title: 'Basic',
      examples: [
        {
          title: 'Malaysia Geographic Insights',
          description:
            'Interactive slideshow map with tourism data, water scarcity, hotels, and SpeedMart locations.',
          href: '/maps',
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
          description: 'Interactive map with Mapbox 3D building extrusions. Tilt and zoom to explore.',
          href: '/examples/3d',
          tag: '3D',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <nav className="bg-white sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            ermap
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link href="/maps" className="text-gray-600 hover:text-gray-900">
              Maps
            </Link>
            <Link href="/examples" className="text-gray-600 hover:text-gray-900">
              Examples
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 py-16 px-6 bg-white">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Examples
          </h1>
          <p className="text-gray-600 mb-10">
            Map visualizations and use cases.
          </p>

          {categories.map((category) => (
            <section key={category.id} className="mb-14">
              <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wide mb-4">
                {category.title}
              </h2>
              <ul className="space-y-6">
                {category.examples.map((example) => (
                  <li key={example.href}>
                    <Link
                      href={example.href}
                      className="block overflow-hidden rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                    >
                      {/* Photo with fade toward bottom */}
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
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {example.tag}
                        </span>
                        <h2 className="text-xl font-semibold text-gray-900 mt-1 mb-2">
                          {example.title}
                        </h2>
                        <p className="text-gray-600 text-sm">
                          {example.description}
                        </p>
                        <span className="inline-block mt-3 text-sm text-gray-900 font-medium">
                          Open example →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © Geographic Insights
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <Link href="/maps" className="text-sm text-gray-500 hover:text-gray-700">
              Maps
            </Link>
            <Link href="/examples" className="text-sm text-gray-500 hover:text-gray-700">
              Examples
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
