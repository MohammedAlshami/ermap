import { createFileRoute, Link } from '@tanstack/react-router';

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

  return (
    <div className="py-16 px-6 w-full">
      <h1 className="text-3xl font-bold text-white mb-2 font-phudu">
        Examples
      </h1>
      <p className="text-gray-400 mb-10 font-phudu">
        Map visualizations and use cases.
      </p>

      {categories.map((category) => (
        <section key={category.id} className="mb-14">
          <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wide mb-4 font-phudu">
            {category.title}
          </h2>
          <ul className="space-y-6">
            {category.examples.map((example) => (
              <li key={example.to}>
                <Link
                  to={example.to}
                  className="block overflow-hidden rounded-lg bg-gray-900/80 hover:bg-gray-800/80 transition font-phudu no-underline text-inherit"
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
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide font-phudu">
                      {example.tag}
                    </span>
                    <h2 className="text-xl font-semibold text-white mt-1 mb-2 font-phudu">
                      {example.title}
                    </h2>
                    <p className="text-gray-400 text-sm font-phudu">
                      {example.description}
                    </p>
                    <span className="inline-block mt-3 text-sm text-white font-medium font-phudu">
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
  );
}
