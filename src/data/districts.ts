// District coverage mapping for Life Water distribution centers
// Maps DC names to actual GeoJSON district names in Sabah

export interface DistrictCoverage {
  dcName: string;
  districts: string[]; // Actual district names from GeoJSON
  centerLat: number;
  centerLon: number;
}

// Coverage zones for each DC - using actual GeoJSON district names
export const districtCoverage: DistrictCoverage[] = [
  {
    dcName: 'Sandakan Sibuga DC 1',
    districts: ['Sandakan', 'Telupid', 'Beluran', 'Kinabatangan', 'Tongod'],
    centerLat: 5.8462,
    centerLon: 118.0743,
  },
  {
    dcName: 'Sandakan Sibuga DC 2',
    districts: ['Sandakan', 'Telupid', 'Beluran'],
    centerLat: 5.8474,
    centerLon: 118.0731,
  },
  {
    dcName: 'KK IZ2 DC',
    districts: ['Kota Kinabalu', 'Penampang', 'Papar', 'Putatan', 'Tuaran'],
    centerLat: 6.0719,
    centerLon: 116.1762,
  },
  {
    dcName: 'Lahad Datu DC 1',
    districts: ['Lahad Datu', 'Kunak'],
    centerLat: 5.0269,
    centerLon: 118.3245,
  },
  {
    dcName: 'Lahad Datu DC 2',
    districts: ['Lahad Datu', 'Kunak', 'Semporna', 'Tawau'],
    centerLat: 5.0281,
    centerLon: 118.3229,
  },
  {
    dcName: 'Tawau DC',
    districts: ['Tawau', 'Semporna'],
    centerLat: 4.3052,
    centerLon: 117.9056,
  },
];

// Get districts served by a DC
export const getDistrictsForDC = (dcName: string): string[] => {
  const coverage = districtCoverage.find(c => c.dcName === dcName);
  return coverage?.districts || [];
};

