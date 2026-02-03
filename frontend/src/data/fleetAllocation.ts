// Fleet allocation for Life Water Berhad - 90 trucks total

export interface FleetAllocation {
  dcName: string;
  trucks: number;
  rationale: string;
}

export const fleetAllocation: FleetAllocation[] = [
  {
    dcName: 'Sandakan Sibuga DC 1',
    trucks: 30,
    rationale: 'Central hub, carbonated drinks redistribution, fleet depot',
  },
  {
    dcName: 'KK IZ2 DC',
    trucks: 22,
    rationale: 'Highest population density, retail intensity',
  },
  {
    dcName: 'Lahad Datu DC 2',
    trucks: 18,
    rationale: 'Eastern Sabah coverage + carbonated drinks hub',
  },
  {
    dcName: 'Keningau (Interior)',
    trucks: 10,
    rationale: 'Interior routes, lower density but longer distances',
  },
  {
    dcName: 'Buffer / Float / Peak demand',
    trucks: 10,
    rationale: 'Maintenance, seasonal peaks, redundancy',
  },
];

export const totalFleetSize = 90;

// Get fleet count for a DC by name
export const getFleetCountForDC = (dcName: string): number => {
  const allocation = fleetAllocation.find(f => f.dcName === dcName);
  return allocation?.trucks || 0;
};

// Get total allocated trucks (excluding buffer)
export const getTotalAllocatedTrucks = (): number => {
  return fleetAllocation
    .filter(f => f.dcName !== 'Buffer / Float / Peak demand')
    .reduce((sum, f) => sum + f.trucks, 0);
};



