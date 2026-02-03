// Manufacturing Plants and Distribution Centers for Life Water Berhad

export interface Facility {
  name: string;
  type: 'Manufacturing' | 'DC';
  status: 'Current' | 'Future';
  lat: number;
  lon: number;
  primaryFunction?: string;
  role?: string;
  districts?: string[];
  fleetCount?: number; // Number of trucks allocated to this DC
}

// Manufacturing Plants
export const manufacturingPlants: Facility[] = [
  {
    name: 'Sandakan Sibuga Plant 1',
    type: 'Manufacturing',
    status: 'Current',
    lat: 5.8380,
    lon: 118.1170,
    primaryFunction: 'Water_Carbonated_Fruit',
  },
  {
    name: 'KK IZ4 Plant',
    type: 'Manufacturing',
    status: 'Current',
    lat: 5.9300,
    lon: 116.0500,
    primaryFunction: 'Water',
  },
  {
    name: 'KK IZ8 Plant 1',
    type: 'Manufacturing',
    status: 'Current',
    lat: 5.9350,
    lon: 116.0600,
    primaryFunction: 'Water_Packaging',
  },
  {
    name: 'Keningau Plant',
    type: 'Manufacturing',
    status: 'Current',
    lat: 5.3370,
    lon: 116.1600,
    primaryFunction: 'Water',
  },
  {
    name: 'Twinine Facility',
    type: 'Manufacturing',
    status: 'Current',
    lat: 5.9800,
    lon: 116.1100,
    primaryFunction: 'Condiments',
  },
  {
    name: 'Sandakan Sibuga Plant 2',
    type: 'Manufacturing',
    status: 'Future',
    lat: 5.8500,
    lon: 118.1300,
    primaryFunction: 'Water',
  },
  {
    name: 'KK IZ8 Plant 2',
    type: 'Manufacturing',
    status: 'Future',
    lat: 5.9400,
    lon: 116.0700,
    primaryFunction: 'Water_Relocation',
  },
];

// Distribution Centers with fleet allocation
export const distributionCenters: Facility[] = [
  {
    name: 'Sandakan Sibuga DC 1',
    type: 'DC',
    status: 'Current',
    lat: 5.8462,
    lon: 118.0743,
    role: 'Central_Hub_Fleet_Depot',
    districts: ['Sandakan', 'Telupid', 'Beluran', 'Kinabatangan', 'Tongod'],
    fleetCount: 30, // Central hub, carbonated drinks redistribution, fleet depot
  },
  {
    name: 'Sandakan Sibuga DC 2',
    type: 'DC',
    status: 'Future',
    lat: 5.8474,
    lon: 118.0731,
    role: 'Expansion_Fleet_Depot',
    districts: ['Sandakan', 'Telupid', 'Beluran'],
    fleetCount: 0, // Future expansion
  },
  {
    name: 'KK IZ2 DC',
    type: 'DC',
    status: 'Current',
    lat: 6.0719,
    lon: 116.1762,
    role: 'West_Coast_Warehouse',
    districts: ['Kota Kinabalu', 'Penampang', 'Papar', 'Putatan', 'Tuaran'],
    fleetCount: 22, // Highest population density, retail intensity
  },
  {
    name: 'Lahad Datu DC 1',
    type: 'DC',
    status: 'Current',
    lat: 5.0269,
    lon: 118.3245,
    role: 'Eastern_Sales_Warehouse',
    districts: ['Lahad Datu', 'Kunak'],
    fleetCount: 0, // Shared with DC 2
  },
  {
    name: 'Lahad Datu DC 2',
    type: 'DC',
    status: 'Current',
    lat: 5.0281,
    lon: 118.3229,
    role: 'Carbonated_Drinks_Hub',
    districts: ['Lahad Datu', 'Kunak', 'Semporna', 'Tawau'],
    fleetCount: 18, // Eastern Sabah coverage + carbonated drinks hub
  },
  {
    name: 'Tawau DC',
    type: 'DC',
    status: 'Future',
    lat: 4.3052,
    lon: 117.9056,
    role: 'Tawau_Demand_Hub',
    districts: ['Tawau', 'Semporna'],
    fleetCount: 0, // Future expansion
  },
];

// All facilities combined
export const allFacilities: Facility[] = [...manufacturingPlants, ...distributionCenters];

// Helper to get facility by name
export const getFacilityByName = (name: string): Facility | undefined => {
  return allFacilities.find(f => f.name === name);
};

// Helper to get carbonated drinks source
export const getCarbonatedSource = (): Facility | undefined => {
  return manufacturingPlants.find(p => p.name === 'Sandakan Sibuga Plant 1');
};

// Helper to get Twinine facility
export const getTwinineFacility = (): Facility | undefined => {
  return manufacturingPlants.find(p => p.name === 'Twinine Facility');
};


