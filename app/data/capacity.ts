// Manufacturing Capacity Data for Life Water Berhad

export interface PlantCapacity {
  name: string;
  status: 'Current' | 'Future';
  drinkingWater?: {
    lines: number;
    currentCapacity: number; // mil L
    utilization: number; // %
    currentOutput: number; // mil L
    futureCapacity?: number; // mil L
    futureAdditions?: string;
  };
  carbonatedDrinks?: {
    lines: number;
    capacity: number; // mil L
    utilization: number; // %
    currentOutput: number; // mil L
    expansion?: string;
  };
  packaging?: {
    function: string;
    currentState: string;
    futureRole?: string;
  };
}

export const plantCapacities: PlantCapacity[] = [
  // Drinking Water Plants
  {
    name: 'Sandakan Sibuga Plant 1',
    status: 'Current',
    drinkingWater: {
      lines: 3,
      currentCapacity: 294,
      utilization: 51,
      currentOutput: 150,
      futureCapacity: 294,
    },
    carbonatedDrinks: {
      lines: 1,
      capacity: 37,
      utilization: 45,
      currentOutput: 17,
      expansion: 'None announced',
    },
  },
  {
    name: 'KK IZ4 Plant',
    status: 'Current',
    drinkingWater: {
      lines: 2,
      currentCapacity: 95,
      utilization: 64,
      currentOutput: 61,
      futureCapacity: 95,
    },
  },
  {
    name: 'KK IZ8 Plant 1',
    status: 'Current',
    drinkingWater: {
      lines: 1,
      currentCapacity: 178,
      utilization: 76,
      currentOutput: 135,
      futureCapacity: 0, // Post-relocation
      futureAdditions: 'DW line to be relocated',
    },
    packaging: {
      function: 'PET preforms & caps',
      currentState: '4 preform machines, 1 cap machine',
      futureRole: 'Becomes dedicated packaging hub',
    },
  },
  {
    name: 'Keningau Plant',
    status: 'Current',
    drinkingWater: {
      lines: 1,
      currentCapacity: 59,
      utilization: 68,
      currentOutput: 40,
      futureCapacity: 59,
    },
  },
  {
    name: 'Sandakan Sibuga Plant 2',
    status: 'Future',
    drinkingWater: {
      lines: 1, // planned
      currentCapacity: 0,
      utilization: 0,
      currentOutput: 0,
      futureCapacity: 178,
      futureAdditions: 'New DW line (2H 2027)',
    },
  },
  {
    name: 'KK IZ8 Plant 2',
    status: 'Future',
    drinkingWater: {
      lines: 1, // relocated
      currentCapacity: 0,
      utilization: 0,
      currentOutput: 0,
      futureCapacity: 178,
      futureAdditions: 'Relocation from IZ8 P1',
    },
  },
  // Twinine Facility
  {
    name: 'Twinine Facility',
    status: 'Current',
    packaging: {
      function: 'Sauces & condiments',
      currentState: 'Single shift',
      futureRole: 'Scale to 1.5 shifts (+70%) by 1H 2026',
    },
  },
];

// Helper functions
export const getCapacityByName = (name: string): PlantCapacity | undefined => {
  return plantCapacities.find(p => p.name === name);
};

// Calculate totals
export const getDrinkingWaterTotals = () => {
  const current = plantCapacities
    .filter(p => p.status === 'Current' && p.drinkingWater)
    .reduce((sum, p) => sum + (p.drinkingWater?.currentCapacity || 0), 0);
  
  const future = plantCapacities
    .filter(p => p.drinkingWater)
    .reduce((sum, p) => sum + (p.drinkingWater?.futureCapacity || 0), 0);
  
  const currentOutput = plantCapacities
    .filter(p => p.status === 'Current' && p.drinkingWater)
    .reduce((sum, p) => sum + (p.drinkingWater?.currentOutput || 0), 0);
  
  return {
    currentCapacity: current, // 626 mil L
    futureCapacity: future, // 804 mil L
    currentOutput,
    growth: current > 0 ? ((future - current) / current) * 100 : 0, // ~28%
  };
};

export const getCarbonatedDrinksTotals = () => {
  const capacity = plantCapacities
    .filter(p => p.carbonatedDrinks)
    .reduce((sum, p) => sum + (p.carbonatedDrinks?.capacity || 0), 0);
  
  const output = plantCapacities
    .filter(p => p.carbonatedDrinks)
    .reduce((sum, p) => sum + (p.carbonatedDrinks?.currentOutput || 0), 0);
  
  const utilization = capacity > 0 ? (output / capacity) * 100 : 0;
  
  return {
    capacity, // 37 mil L
    currentOutput: output, // 17 mil L
    utilization,
  };
};

// Key insights
export const capacityInsights = {
  drinkingWater: {
    currentCapacity: 626, // mil L
    futureCapacity: 804, // mil L
    growth: 28.4, // %
    currentUtilization: 62, // weighted average
    futureOutputAt75Util: 603, // mil L (804 × 75%)
    currentOutput: 386, // mil L
    outputGrowth: 56.2, // % ((603 - 386) / 386)
  },
  carbonatedDrinks: {
    capacity: 37, // mil L
    currentOutput: 17, // mil L
    utilization: 45, // %
    note: 'Capacity-available but demand-constrained, offering optional upside without capex',
  },
  keyTakeaway: 'The Group has already completed the bulk of its drinking water capacity build-out, with utilisation at only 62%. Near-term growth will be driven by utilisation ramp-up, while the Sandakan Sibuga Plant 2 provides a clear medium-term step-up to over 800 million litres of annual capacity.',
};

