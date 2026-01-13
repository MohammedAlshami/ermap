// Replacement cost analysis for Life Water Berhad infrastructure

export interface ReplacementCostItem {
  asset: string;
  units: string;
  costPerUnit: string;
  totalCost: string;
}

export interface ReplacementCostCategory {
  category: string;
  items: ReplacementCostItem[];
  subtotal: string;
}

export const manufacturingReplacementCost: ReplacementCostCategory = {
  category: 'Manufacturing',
  items: [
    {
      asset: 'Bottled water production line',
      units: '4–5 lines',
      costPerUnit: '15–25m',
      totalCost: '75–100m',
    },
    {
      asset: 'Carbonated drinks line',
      units: '1 line',
      costPerUnit: '25–35m',
      totalCost: '25–35m',
    },
    {
      asset: 'PET preform + cap lines',
      units: '1 integrated hub',
      costPerUnit: '30–40m',
      totalCost: '30–40m',
    },
    {
      asset: 'Condiments plant (Twinine-equivalent)',
      units: '1 facility',
      costPerUnit: '10–15m',
      totalCost: '10–15m',
    },
  ],
  subtotal: '~RM140–190m',
};

export const logisticsReplacementCost: ReplacementCostCategory = {
  category: 'Distribution & Logistics',
  items: [
    {
      asset: 'Distribution centres / warehouses',
      units: '5–6',
      costPerUnit: '5–10m',
      totalCost: '30–50m',
    },
    {
      asset: 'Delivery trucks (medium-duty)',
      units: '90',
      costPerUnit: '180k–250k',
      totalCost: '16–22m',
    },
    {
      asset: 'Cold/ambient handling, racking, systems',
      units: '—',
      costPerUnit: '—',
      totalCost: '8–12m',
    },
  ],
  subtotal: '~RM55–80m',
};

export const totalReplacementCost = {
  total: 'RM200–270 million',
  excludes: [
    'Time (5–8 years to build retailer relationships)',
    'Driver availability',
    'Route optimisation learning curve',
    'Sabah-specific operational know-how',
  ],
  framing: 'Life Water\'s current market position embeds over RM200m of replacement value that does not sit on the balance sheet — and would take years, not quarters, to replicate.',
};



