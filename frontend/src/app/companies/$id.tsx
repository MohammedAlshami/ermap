import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, Fragment } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs';
import { StockChart } from '~/components/StockChart';
import { CompanyStoreMap } from '~/components/CompanyStoreMap';

export const Route = createFileRoute('/companies/$id')({
  component: CompanyDetailPage,
});

interface Company {
  id: string;
  name: string;
  logo: string;
  description?: string;
  overview?: string;
  stockSymbol?: string;
  storeLocationsUrl?: string;
  distributionCentersUrl?: string;
  menuUrl?: string;
}

interface MenuCategory {
  name: string;
  items: { name: string; price: string }[];
}

interface CompaniesData {
  companies: Company[];
}

function CompanyDetailPage() {
  const { id } = Route.useParams();
  const [companiesData, setCompaniesData] = useState<CompaniesData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [menuData, setMenuData] = useState<{ categories: MenuCategory[] } | null>(null);

  useEffect(() => {
    fetch('/companies.json')
      .then((r) => r.json())
      .then(setCompaniesData)
      .catch(() => setCompaniesData(null));
  }, []);

  const company = companiesData?.companies?.find((c) => c.id === id) ?? null;

  useEffect(() => {
    if (!company) return;
    const visible =
      activeTab === 'overview' ||
      (activeTab === 'stock' && company.stockSymbol) ||
      (activeTab === 'stores' && company.storeLocationsUrl) ||
      (activeTab === 'distribution' && company.distributionCentersUrl) ||
      (activeTab === 'menu' && company.menuUrl);
    if (!visible) setActiveTab('overview');
  }, [company?.id, activeTab, company?.stockSymbol, company?.storeLocationsUrl, company?.distributionCentersUrl, company?.menuUrl]);

  useEffect(() => {
    if (!company?.menuUrl) {
      setMenuData(null);
      return;
    }
    fetch(company.menuUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load menu'))))
      .then(setMenuData)
      .catch(() => setMenuData(null));
  }, [company?.menuUrl]);

  if (companiesData === null) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </section>
    );
  }

  if (!company) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/companies"
            className="text-foreground hover:text-foreground/80 font-medium mb-4 inline-block"
          >
            ← Back to Companies
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Company not found</h1>
          <p className="text-muted-foreground">No company with this ID.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/companies"
          className="text-foreground hover:text-foreground/80 font-medium mb-8 inline-block"
        >
          ← Back to Companies
        </Link>

        <Card className="overflow-hidden bg-foreground flex flex-row items-stretch gap-0 py-0 px-0">
          <div className="flex shrink-0 items-center justify-center rounded-l-xl bg-white/90 p-2 w-28 h-28 min-h-[7rem]">
            <img
              src={company.logo}
              alt={`${company.name} logo`}
              className="h-full w-full object-contain rounded-lg"
            />
          </div>
          <CardHeader className="flex-1 min-w-0 items-start justify-start text-left py-4 pl-3 pr-4 rounded-r-xl">
            <CardTitle className="text-white text-xl">
              {company.name}
            </CardTitle>
            {company.description && (
              <CardDescription className="text-white/80 text-sm mt-0.5">
                {company.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 rounded-xl p-1.5">
            <TabsTrigger value="overview" className="text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            {company.stockSymbol && (
              <TabsTrigger value="stock" className="text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-white">
                Stock
              </TabsTrigger>
            )}
            {company.storeLocationsUrl && (
              <TabsTrigger value="stores" className="text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-white">
                Store locations
              </TabsTrigger>
            )}
            {company.distributionCentersUrl && (
              <TabsTrigger value="distribution" className="text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-white">
                Distribution centers
              </TabsTrigger>
            )}
            {company.menuUrl && (
              <TabsTrigger value="menu" className="text-muted-foreground data-[state=active]:bg-foreground data-[state=active]:text-white">
                Menu
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="mt-2 rounded-xl bg-muted/30 p-6 text-left">
              <p className="text-foreground text-base leading-relaxed">
                {company.overview ?? company.description ?? 'No overview available for this company.'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            {company.stockSymbol ? (
              <div className="mt-2">
                <p className="text-muted-foreground text-sm mb-2">Stock price & graph</p>
                <StockChart symbol={company.stockSymbol} height={420} range="3mo" />
              </div>
            ) : (
              <p className="text-muted-foreground mt-2">This company does not have a public stock symbol.</p>
            )}
          </TabsContent>

          <TabsContent value="stores" className="mt-6">
            <div className="mt-2">
              <p className="text-muted-foreground text-sm mb-2">Store locations (Mapbox)</p>
              <CompanyStoreMap
                geoJsonUrl={company.storeLocationsUrl}
                emptyMessage="Store locations map is not available for this company."
              />
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="mt-6">
            <div className="mt-2">
              <p className="text-muted-foreground text-sm mb-2">Distribution centers (Mapbox)</p>
              <CompanyStoreMap
                geoJsonUrl={company.distributionCentersUrl}
                emptyMessage="Distribution centers map is not available for this company."
              />
            </div>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <div className="mt-2 rounded-xl bg-muted/30 overflow-hidden">
              {menuData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 font-semibold text-foreground w-16">No.</th>
                        <th className="px-4 py-3 font-semibold text-foreground">Item name</th>
                        <th className="px-4 py-3 font-semibold text-foreground text-right whitespace-nowrap w-28">Price</th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      {(() => {
                        let rowNo = 0;
                        return menuData.categories.map((cat) => (
                          <Fragment key={cat.name}>
                            <tr className="bg-muted/30">
                              <td colSpan={3} className="px-4 py-2 font-medium text-foreground">
                                {cat.name}
                              </td>
                            </tr>
                            {cat.items.map((item, idx) => {
                              rowNo += 1;
                              return (
                                <tr key={`${cat.name}-${idx}`} className="hover:bg-muted/20">
                                  <td className="px-4 py-2 text-muted-foreground">{rowNo}</td>
                                  <td className="px-4 py-2">{item.name}</td>
                                  <td className="px-4 py-2 text-right font-medium">{item.price}</td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              ) : company.menuUrl ? (
                <p className="p-6 text-muted-foreground text-sm">Loading menu…</p>
              ) : null}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </section>
  );
}
