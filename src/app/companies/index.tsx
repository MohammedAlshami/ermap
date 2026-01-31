import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

const PAGE_BG = '#0c0c0c';

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
    <section className="py-20 px-6" style={{ backgroundColor: PAGE_BG }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">
            Companies
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            Partner companies and organizations.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {companies.length === 0 ? (
            <p className="text-white/70">Loading companies…</p>
          ) : (
            companies.map((company) => (
              <Link
                key={company.id}
                to="/companies/$id"
                params={{ id: company.id }}
                className="block"
              >
                <Card className="h-full border-border/50 overflow-hidden transition-all duration-200 hover:border-[#c5d86d] bg-[#C5D86D] pt-0">
                  <div className="flex h-28 w-full items-center justify-center bg-white/90 px-6 py-4">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="max-h-full w-auto max-w-[200px] object-contain"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      {company.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
