import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

interface Company {
  id: string;
  name: string;
  logo: string;
  description?: string;
}

interface CompaniesData {
  companies: Company[];
}

export const Route = createFileRoute('/companies/')({
  component: CompaniesIndexPage,
});

function CompaniesIndexPage() {
  const [companiesData, setCompaniesData] = useState<CompaniesData | null>(null);

  useEffect(() => {
    fetch('/companies.json')
      .then((r) => r.json())
      .then(setCompaniesData)
      .catch(() => setCompaniesData(null));
  }, []);

  const companies = companiesData?.companies ?? [];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-left mb-12">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-3">
              Companies
            </h1>
            <p className="text-muted-foreground text-base max-w-xl">
              Partner companies and organizations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {companies.length === 0 ? (
              <p className="text-muted-foreground">Loading companies…</p>
            ) : (
            companies.map((company) => (
              <Link
                key={company.id}
                to="/companies/$id"
                params={{ id: company.id }}
                className="group block h-full"
              >
                <Card className="h-full border-0 transition-all duration-200 shadow-sm hover:shadow-md bg-card text-card-foreground pt-0">
                  <div className="flex flex-row items-center gap-4 px-6 py-4">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="h-12 w-12 shrink-0 rounded object-contain bg-muted/50"
                    />
                    <span className="min-w-0 flex-1 font-semibold text-foreground group-hover:text-foreground/90 transition-colors truncate">
                      {company.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:bg-muted pointer-events-none shrink-0"
                      asChild
                    >
                      <span>Open →</span>
                    </Button>
                  </div>
                </Card>
              </Link>
            ))
            )}
          </div>
        </div>
    </section>
  );
}
