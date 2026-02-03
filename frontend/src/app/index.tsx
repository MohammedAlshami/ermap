import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { ChartColumn, Briefcase, ArrowUpRight, ArrowLeft, ArrowRight, Check, Star, Layers, Workflow, Sparkles, Users } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { PageLayout } from '~/components/PageLayout';
import { cn } from '~/lib/utils';
import { useAuth } from '~/lib/auth';

const HERO_IMAGE =
  'https://images.ctfassets.net/fi0zmnwlsnja/5kamkNPoauwtkBjgpl2jJW/d90b3d7716227313423422f01bde001c/viz-libraries-07.png?w=1296&h=810&q=50&fm=png';

const trustedBy = [
  { name: 'Google', path: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z' },
  { name: 'Apple', path: 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701' },
  { name: 'Meta', path: "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" },
  { name: 'Tesla', path: 'M12 5.362l2.475-3.026s4.245.09 8.471 2.054c-1.082 1.636-3.231 2.438-3.231 2.438-.146-1.439-1.154-1.79-4.354-1.79L12 24 8.619 5.034c-3.18 0-4.188.354-4.335 1.792 0 0-2.146-.795-3.229-2.43C5.28 2.431 9.525 2.34 9.525 2.34L12 5.362l-.004.002H12v-.002zm0-3.899c3.415-.03 7.326.528 11.328 2.28.535-.968.672-1.395.672-1.395C19.625.612 15.528.015 12 0 8.472.015 4.375.61 0 2.349c0 0 .195.525.672 1.396C4.674 1.989 8.585 1.435 12 1.46v.003z' },
  { name: 'Salesforce', path: 'M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 01-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 018.88 20.4a4.302 4.302 0 01-4.05-2.82c-.27.062-.54.076-.825.076-2.204 0-4.005-1.8-4.005-4.05 0-1.5.811-2.805 2.01-3.51-.255-.57-.39-1.2-.39-1.846 0-2.58 2.1-4.65 4.65-4.65 1.53 0 2.85.705 3.72 1.8' },
  { name: 'Netflix', path: 'm5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z' },
  { name: 'Spotify', path: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' },
  { name: 'GitHub', path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
];

export const Route = createFileRoute('/')({
  component: HomePage,
});

const exploreCategories = [
  {
    to: '/maps',
    title: 'Malaysia Geographic Insights',
    description: 'Tourism, water scarcity, hotels, and retail distribution across Malaysia.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=50&w=450&auto=format&fit=crop',
    imageFirst: false,
  },
  {
    to: '/customize',
    title: 'Customize map',
    description: 'Map with side panel: select which data layers to visualize on the map.',
    image: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=50&w=450&auto=format&fit=crop',
    imageFirst: true,
  },
  {
    to: '/examples',
    title: 'Analysis',
    description: 'Browse map examples and use cases.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=50&w=450&auto=format&fit=crop',
    imageFirst: false,
  },
  {
    to: '/data',
    title: 'Data',
    description: 'Browse datasets: tourism, water scarcity, hotels, SpeedMart, and boundaries.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=50&w=450&auto=format&fit=crop',
    imageFirst: true,
  },
] as const;

const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19,
    annual: 15,
    description: 'Perfect for small online stores',
    features: ['Up to 50 products', 'Basic inventory tracking', 'Email support', 'Mobile-responsive themes', 'Basic analytics'],
    cta: 'Get started for free',
    ctaLabel: 'Get started with Starter plan',
    featured: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly: 79,
    annual: 65,
    description: 'Ideal for growing businesses',
    features: ['Up to 500 products', 'Advanced inventory management', 'Priority email & chat support', 'API access', 'Abandoned cart recovery'],
    cta: 'Get started with Professional',
    ctaLabel: 'Get started with Professional plan',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceCustom: true,
    monthly: 0,
    annual: 0,
    description: 'For high-volume stores',
    features: ['Unlimited products', 'Advanced reporting', '24/7 priority support', 'Dedicated account manager', 'Advanced security features'],
    cta: 'Get started with Enterprise',
    ctaLabel: 'Get started with Enterprise plan',
    featured: false,
  },
] as const;

const featureItems = [
  {
    title: 'Modular Architecture',
    description: 'Component-based design system that scales with your project complexity and requirements.',
    icon: Layers,
  },
  {
    title: 'Smart Automation',
    description: 'Intelligent workflows that reduce manual tasks and accelerate your development process.',
    icon: Workflow,
  },
  {
    title: 'Data Intelligence',
    description: 'Advanced analytics engine providing actionable insights from your application data.',
    icon: ChartColumn,
  },
] as const;

const testimonials = [
  { name: 'Alexandra Mitchell', role: 'Senior Frontend Developer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1', quote: 'This platform has completely transformed our development workflow. The component system is so well-architected that even complex applications feel simple to build.' },
  { name: 'James Thompson', role: 'Technical Lead', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1', quote: 'After trying countless frameworks, this is the one that finally clicked. The documentation is exceptional.' },
  { name: 'Priya Sharma', role: 'Product Designer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2', quote: 'The design system is beautiful and consistent. I can prototype ideas quickly and hand them off to developers with confidence that the implementation will match perfectly.' },
  { name: 'Robert Kim', role: 'Engineering Manager', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2', quote: 'We migrated our entire application to this platform in just two weeks. The performance improvements were immediate.' },
  { name: 'Maria Santos', role: 'Full Stack Engineer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-3', quote: 'The accessibility features are top-notch. Building inclusive applications has never been easier. Every component follows best practices out of the box, and the automated testing suite ensures we maintain high accessibility standards throughout our development process.' },
  { name: 'Thomas Anderson', role: 'Solutions Architect', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-3', quote: 'Scalability was our biggest concern, but this platform handles enterprise-level complexity with ease.' },
  { name: 'Lisa Chang', role: 'UX Researcher', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-4', quote: 'User testing results have been consistently positive since we adopted this platform. The user experience is intuitive and the performance is stellar. Our user satisfaction scores have increased by 40% since the migration.' },
  { name: 'Michael Foster', role: 'DevOps Engineer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-4', quote: 'Deployment and maintenance are a breeze. The platform integrates seamlessly with our CI/CD pipeline.' },
  { name: 'Sophie Laurent', role: 'Creative Director', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-5', quote: 'The creative possibilities are endless. We can bring any design concept to life without compromising on technical quality or user experience.' },
  { name: 'Daniel Wilson', role: 'Backend Developer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-5', quote: 'The API design is exceptional. Clean, intuitive, and well-documented.' },
  { name: 'Natasha Petrov', role: 'Mobile App Developer', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=female-6', quote: 'Cross-platform development has never been this efficient. One codebase, multiple platforms, consistent user experience. This is the future. The responsive design system ensures our apps look perfect on every device.' },
  { name: 'Carlos Rivera', role: 'Startup Founder', avatar: 'https://notion-avatars.netlify.app/api/avatar?preset=male-6', quote: 'As a non-technical founder, this platform gave me the confidence to build our MVP quickly.' },
] as const;

const ctaAvatars = [
  { alt: "Alex Chen's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1' },
  { alt: "Sarah Kim's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1' },
  { alt: "Marcus Johnson's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2' },
  { alt: "Elena Rodriguez's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2' },
  { alt: "David Park's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=male-3' },
  { alt: "Maya Patel's avatar", src: 'https://notion-avatars.netlify.app/api/avatar?preset=female-3' },
];

function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const [exploreProgress, setExploreProgress] = useState(0);
  const [pricingBilling, setPricingBilling] = useState<'monthly' | 'annual'>('annual');

  const scrollExplore = (direction: 'prev' | 'next') => {
    const el = exploreScrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('[data-carousel-item]')?.getBoundingClientRect().width ?? 0;
    const gap = 16;
    const step = (cardWidth + gap) * (direction === 'next' ? 1 : -1);
    el.scrollBy({ left: step, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = exploreScrollRef.current;
    if (!el) return;
    const updateProgress = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const max = scrollWidth - clientWidth;
      setExploreProgress(max <= 0 ? 0 : Math.round((scrollLeft / max) * 100));
    };
    updateProgress();
    el.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    return () => {
      el.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [exploreCategories.length]);

  return (
    <PageLayout theme="light">
      {/* Hero section */}
      <section className="w-full py-12 lg:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <div className="space-y-6">
              <span
                className="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors overflow-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                data-slot="badge"
              >
                <ChartColumn className="size-4" aria-hidden />
                Enterprise-Grade Solutions
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground md:text-5xl lg:text-6xl lg:leading-tight">
                Transform Your Business With Powerful Analytics
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-base text-balance md:text-lg">
                Unlock actionable insights and drive growth with our comprehensive analytics platform designed for modern enterprises
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <Button asChild size="lg" className="rounded-full text-base h-10 px-6" aria-label="Start your free trial">
                  <Link to="/maps">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full text-base h-10 px-6 gap-2" aria-label="View demo">
                  <Link to="/examples">
                    <Briefcase className="size-4" aria-hidden />
                    View Demo
                  </Link>
                </Button>
                {!authLoading && !user && (
                  <Button asChild size="lg" variant="outline" className="rounded-full text-base h-10 px-6">
                    <Link to="/login">Log in</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="relative mt-12 lg:mt-20">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="relative h-[500px] w-full">
                  <img
                    alt="Dashboard preview"
                    className="block size-full object-cover object-top"
                    loading="lazy"
                    src={HERO_IMAGE}
                  />
                  <div className="from-background absolute start-0 end-0 bottom-0 h-1/3 bg-gradient-to-t to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
            <h3 className="mt-16 mb-8 text-center text-xl font-semibold text-foreground md:text-2xl lg:mt-20">
              Trusted by Industry Leaders
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-6">
              {trustedBy.map(({ name, path }) => (
                <div
                  key={name}
                  className="bg-muted/50 hover:bg-muted/80 flex h-16 items-center justify-center rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg role="img" viewBox="0 0 24 24" className="fill-foreground size-6" aria-hidden>
                      <path d={path} />
                    </svg>
                    <span className="text-foreground text-base font-medium md:text-lg">{name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Explore by section – carousel cards */}
      <div className="w-full overflow-hidden">
        <section className="mx-auto w-full max-w-[1400px] px-4 py-12 md:px-6 md:py-16">
          <header className="mb-12 flex flex-col md:mb-16 lg:flex-row lg:items-start lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h2 className="mb-0 text-4xl leading-[1.2] font-medium text-foreground lg:text-[3.25rem]">
                <span className="text-balance">Start Exploring: Find</span>
                <br className="hidden md:block" />
                <span className="text-balance">Your Perfect Category</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-[400px] text-lg lg:text-start">
              Dive into our diverse range of categories and discover the ideal course to match your interests and goals.
            </p>
          </header>
          <div className="relative">
            <div className="relative w-full" role="region" aria-roledescription="carousel" data-slot="carousel">
              <div className="overflow-hidden" data-slot="carousel-content">
                <div
                  ref={exploreScrollRef}
                  className="flex -ml-4 -ms-4 pt-2 pb-4 overflow-x-auto overflow-y-hidden scroll-smooth"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {exploreCategories.map(({ to, title, description, image, imageFirst }) => (
                    <Link
                      key={to}
                      to={to}
                      data-carousel-item
                      data-slot="carousel-item"
                      className="group min-w-0 shrink-0 grow-0 pl-4 basis-full ps-4 sm:basis-1/2 lg:basis-1/3"
                      role="group"
                      aria-roledescription="slide"
                    >
                      <article data-card className="size-full">
                        <Card className="text-card-foreground gap-6 rounded-xl border border-border py-6 shadow-sm bg-white relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg md:py-8">
                        <CardContent className="px-6 flex flex-1 flex-col gap-0 md:px-8">
                          <div className={cn('flex flex-col', imageFirst ? 'order-2' : 'order-1')}>
                            <CardHeader className="mb-6 p-0 border-0">
                              <div className="flex items-start gap-3">
                                <span
                                  data-slot="badge"
                                  className="inline-flex items-center justify-center border border-transparent bg-foreground/5 text-secondary-foreground size-10 rounded-full shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden"
                                  aria-label={`View ${title}`}
                                >
                                  <ArrowUpRight className="size-5" aria-hidden />
                                </span>
                                <CardTitle className="ms-2 text-2xl font-semibold text-balance text-foreground">
                                  {title}
                                </CardTitle>
                              </div>
                              <CardDescription className="mt-2 text-base text-muted-foreground">
                                {description}
                              </CardDescription>
                            </CardHeader>
                          </div>
                          <div
                            className={cn(
                              'relative aspect-[4/3] overflow-hidden rounded-xl shrink-0',
                              imageFirst ? 'order-1 mb-6' : 'order-2'
                            )}
                          >
                            <img
                              alt=""
                              className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                              loading="lazy"
                              decoding="async"
                              src={image}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </article>
                  </Link>
                ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <div className="flex-1">
                <div
                  aria-valuemax={100}
                  aria-valuemin={0}
                  role="progressbar"
                  aria-label="Carousel progress"
                  className="bg-primary/20 relative w-full overflow-hidden rounded-full h-1.5"
                >
                  <div
                    className="bg-primary h-full flex-1 transition-all duration-300 rounded-full"
                    style={{ width: `${exploreProgress}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-slot="carousel-previous"
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 rounded-full size-12 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer outline-none focus-visible:ring-ring focus-visible:ring-2"
                  onClick={() => scrollExplore('prev')}
                  aria-label="Previous slide"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  data-slot="carousel-next"
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 rounded-full size-12 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 cursor-pointer outline-none focus-visible:ring-ring focus-visible:ring-2"
                  onClick={() => scrollExplore('next')}
                  aria-label="Next slide"
                >
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Pricing section */}
      <div className="w-full overflow-hidden">
        <section
          id="pricing-enterprise"
          className="relative z-0 container mx-auto px-4 py-20 before:absolute before:inset-0 before:-z-10 before:[background-size:48px_48px] before:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px)] md:px-6 dark:before:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)]"
        >
          <header className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-4xl font-medium tracking-tight text-balance text-foreground sm:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground mx-auto text-base/relaxed text-balance">
              Choose the perfect plan that fits your business needs. Save up to 20% with annual billing.
            </p>
          </header>
          <div className="mt-8 flex justify-center">
            <Tabs
              value={pricingBilling}
              onValueChange={(v) => setPricingBilling(v as 'monthly' | 'annual')}
              className="w-full max-w-[325px] flex flex-col gap-2"
              dir="ltr"
            >
              <TabsList className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-2">
                <TabsTrigger value="monthly" className="h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-2 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="annual" className="h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-2 py-1 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30">
                  Annual
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => {
              const price =
                'priceCustom' in plan && plan.priceCustom
                  ? 'Custom'
                  : pricingBilling === 'annual'
                    ? `$${plan.annual}`
                    : `$${plan.monthly}`;
              const isFeatured = plan.featured;
              return (
                <Card
                  key={plan.id}
                  data-slot="card"
                  className={cn(
                    'flex flex-col gap-6 rounded-xl border shadow-sm py-0',
                    isFeatured
                      ? 'border-primary border-2 bg-black text-white dark:bg-white dark:text-black relative'
                      : 'border-border/50'
                  )}
                >
                  {isFeatured && (
                    <span
                      data-slot="badge"
                      className="inline-flex items-center justify-center border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 absolute end-4 -top-3 z-10 rounded-full px-2 py-0.5 text-xs font-medium gap-1 shrink-0"
                    >
                      <Star className="size-3.5 fill-current" aria-hidden />
                      Most Popular
                    </span>
                  )}
                  <CardContent className="flex flex-col gap-8 p-6">
                    <h3 className="text-2xl font-medium">{plan.name}</h3>
                    <div className="flex flex-col">
                      <span className="text-5xl font-bold tracking-tight">{price}</span>
                      <span
                        className={cn(
                          'ms-1 text-sm',
                          isFeatured ? 'text-white/65 dark:text-black/65' : 'text-muted-foreground'
                        )}
                      >
                        per user/month, billed annually
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="font-medium">{plan.description}</p>
                      <ul className="space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <div
                              className={cn(
                                'flex size-5 items-center justify-center rounded-full',
                                isFeatured ? 'bg-background' : 'bg-muted'
                              )}
                            >
                              <Check
                                className={cn(
                                  'size-3.5',
                                  isFeatured ? 'text-foreground' : 'text-muted-foreground'
                                )}
                                aria-hidden
                              />
                            </div>
                            <span
                              className={cn(
                                'text-sm',
                                isFeatured ? 'text-white/65 dark:text-black/65' : 'text-muted-foreground'
                              )}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      data-slot="button"
                      className={cn(
                        'w-full h-9',
                        isFeatured && 'bg-white text-black shadow-xs hover:bg-white/90 dark:bg-black dark:text-white dark:hover:bg-black/90 border-0'
                      )}
                      variant={isFeatured ? 'secondary' : 'outline'}
                      aria-label={plan.ctaLabel}
                      asChild
                    >
                      <Link to="/maps">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>

      {/* Features section */}
      <div className="w-full overflow-hidden">
        <section className="py-16 md:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <h2 className="text-4xl font-semibold text-balance text-foreground lg:text-5xl">
                Intelligence meets simplicity
              </h2>
              <p className="text-muted-foreground mt-4">
                Smart solutions that adapt to your workflow while maintaining the simplicity you need to stay productive.
              </p>
            </div>
            <div className="mx-auto mt-8 grid max-w-6xl gap-6 md:mt-16 md:grid-cols-3">
              {featureItems.map(({ title, description, icon: Icon }) => (
                <Card
                  key={title}
                  data-slot="card"
                  className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border/50 py-6 group shadow-xs"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mx-auto h-36 w-36">
                        <div
                          aria-hidden
                          className="absolute inset-0 opacity-30 bg-[length:16px_16px] bg-[radial-gradient(circle,var(--color-foreground)_1px,transparent_1px)]"
                        />
                        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
                        <div className="bg-background absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-md border border-border/50 shadow-xs">
                          <Icon className="h-6 w-6" aria-hidden />
                        </div>
                      </div>
                      <h3 className="mt-6 font-medium text-balance text-foreground">{title}</h3>
                      <p className="text-muted-foreground mt-3 text-sm">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Testimonials section */}
      <div className="w-full overflow-hidden">
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-8">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-balance text-foreground lg:text-4xl">
                Empowering Innovation Worldwide
              </h2>
              <p className="text-muted-foreground mt-6 text-balance lg:text-lg">
                Join thousands of developers and teams who trust our platform to build exceptional digital experiences.
              </p>
            </div>
            <div className="mt-8 md:mt-12">
              <div className="columns-1 gap-4 md:columns-2 md:gap-6 lg:columns-3 lg:gap-4">
                {testimonials.map(({ name, role, avatar, quote }) => (
                  <Card
                    key={name}
                    data-slot="card"
                    className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border/50 py-6 mb-6 break-inside-avoid shadow-none lg:mb-4"
                  >
                    <CardContent className="px-6">
                      <div className="flex items-start gap-4">
                        <span
                          data-slot="avatar"
                          className="relative flex overflow-hidden rounded-full bg-muted size-12 shrink-0"
                        >
                          <img
                            data-slot="avatar-image"
                            className="aspect-square size-full"
                            alt={name}
                            loading="lazy"
                            width={120}
                            height={120}
                            src={avatar}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-foreground">{name}</h3>
                          <span className="text-muted-foreground block text-sm tracking-wide">{role}</span>
                        </div>
                      </div>
                      <blockquote className="mt-4">
                        <p className="text-sm leading-relaxed text-balance text-foreground">{quote}</p>
                      </blockquote>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Call to action section */}
      <div className="w-full overflow-hidden">
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="flex items-center">
                      {ctaAvatars.map(({ alt, src }, i) => (
                        <div
                          key={alt}
                          className="group relative"
                          style={{ marginLeft: i === 0 ? 0 : -12, zIndex: i + 1 }}
                        >
                          <span
                            data-slot="avatar"
                            className="relative flex shrink-0 overflow-hidden rounded-full bg-background size-16 border border-border transition-transform duration-300 ease-out group-hover:-translate-y-1.5"
                            style={{ zIndex: i + 1 }}
                          >
                            <img
                              data-slot="avatar-image"
                              className="aspect-square size-full"
                              alt={alt}
                              src={src}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <span
                    data-slot="badge"
                    className="mx-auto flex w-fit items-center justify-center gap-2 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    <Sparkles className="size-4" aria-hidden />
                    Build Together
                  </span>
                  <h1 className="text-4xl font-bold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                    Where innovative teams{' '}
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      collaborate
                    </span>
                  </h1>
                  <p className="text-muted-foreground mx-auto max-w-2xl text-balance lg:text-xl">
                    Connect with talented professionals, share ideas seamlessly, and build extraordinary products together. Join a community where creativity meets technology.
                  </p>
                </div>
                <div className="relative">
                  <Button
                    data-slot="button"
                    size="lg"
                    className="px-12 py-6 text-lg font-medium h-auto"
                    asChild
                  >
                    <Link to="/maps">
                      Join Our Community
                      <Users className="ms-2 size-5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
