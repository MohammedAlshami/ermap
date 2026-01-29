// Product flow definitions for Life Water Berhad logistics network

export interface FlowRoute {
  from: string; // Facility name
  to: string; // Facility name
  productType: 'Carbonated' | 'Water' | 'Condiments';
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

// Carbonated Drinks Flows
// Origin: Sandakan Sibuga Plant 1 (only carbonated source)
export const carbonatedFlows: FlowRoute[] = [
  {
    from: 'Sandakan Sibuga Plant 1',
    to: 'Sandakan Sibuga DC 1',
    productType: 'Carbonated',
    fromLat: 5.8450,
    fromLon: 118.0755,
    toLat: 5.8462,
    toLon: 118.0743,
  },
  {
    from: 'Sandakan Sibuga Plant 1',
    to: 'KK IZ2 DC',
    productType: 'Carbonated',
    fromLat: 5.8450,
    fromLon: 118.0755,
    toLat: 6.0719,
    toLon: 116.1762,
  },
  {
    from: 'Sandakan Sibuga Plant 1',
    to: 'Lahad Datu DC 2',
    productType: 'Carbonated',
    fromLat: 5.8450,
    fromLon: 118.0755,
    toLat: 5.0281,
    toLon: 118.3229,
  },
];

// Water Flows (shorter, decentralized routes from multiple plants)
export const waterFlows: FlowRoute[] = [
  // KK IZ4 Plant to nearby DCs
  {
    from: 'KK IZ4 Plant',
    to: 'KK IZ2 DC',
    productType: 'Water',
    fromLat: 6.0756,
    fromLon: 116.1873,
    toLat: 6.0719,
    toLon: 116.1762,
  },
  // KK IZ8 Plant 1 to nearby DCs
  {
    from: 'KK IZ8 Plant 1',
    to: 'KK IZ2 DC',
    productType: 'Water',
    fromLat: 6.0701,
    fromLon: 116.2046,
    toLat: 6.0719,
    toLon: 116.1762,
  },
  // Keningau Plant to nearby areas (interior)
  {
    from: 'Keningau Plant',
    to: 'KK IZ2 DC',
    productType: 'Water',
    fromLat: 5.3364,
    fromLon: 116.1672,
    toLat: 6.0719,
    toLon: 116.1762,
  },
  // Sandakan plants to Sandakan DC
  {
    from: 'Sandakan Sibuga Plant 1',
    to: 'Sandakan Sibuga DC 1',
    productType: 'Water',
    fromLat: 5.8450,
    fromLon: 118.0755,
    toLat: 5.8462,
    toLon: 118.0743,
  },
];

// Condiments Flows (Twinine Facility to existing DC network)
export const condimentFlows: FlowRoute[] = [
  {
    from: 'Twinine Facility',
    to: 'KK IZ2 DC',
    productType: 'Condiments',
    fromLat: 5.9780,
    fromLon: 116.0725,
    toLat: 6.0719,
    toLon: 116.1762,
  },
  {
    from: 'Twinine Facility',
    to: 'Sandakan Sibuga DC 1',
    productType: 'Condiments',
    fromLat: 5.9780,
    fromLon: 116.0725,
    toLat: 5.8462,
    toLon: 118.0743,
  },
  {
    from: 'Twinine Facility',
    to: 'Lahad Datu DC 1',
    productType: 'Condiments',
    fromLat: 5.9780,
    fromLon: 116.0725,
    toLat: 5.0269,
    toLon: 118.3245,
  },
];

// All flows combined
export const allFlows: FlowRoute[] = [
  ...carbonatedFlows,
  ...waterFlows,
  ...condimentFlows,
];

// Helper to get flows by product type
export const getFlowsByType = (productType: 'Carbonated' | 'Water' | 'Condiments'): FlowRoute[] => {
  return allFlows.filter(f => f.productType === productType);
};




