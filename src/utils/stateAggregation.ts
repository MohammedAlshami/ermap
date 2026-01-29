import { DistrictFeature } from './geojson';

export interface StateFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    stateCode: string;
    code_state: number;
  };
  geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon;
}

// State code to full name mapping
export const STATE_NAMES: Record<string, string> = {
  'JHR': 'Johor',
  'KDH': 'Kedah',
  'KTN': 'Kelantan',
  'MLK': 'Melaka',
  'NSN': 'Negeri Sembilan',
  'PHG': 'Pahang',
  'PRK': 'Perak',
  'PLS': 'Perlis',
  'PNG': 'Pulau Pinang',
  'SBH': 'Sabah',
  'SWK': 'Sarawak',
  'SGR': 'Selangor',
  'TRG': 'Terengganu',
  'KUL': 'WP Kuala Lumpur',
  'LBN': 'WP Labuan',
  'PJY': 'WP Putrajaya',
};

// State area in km²
export const STATE_AREAS: Record<string, number> = {
  'Sarawak': 124173.9,
  'Sabah': 74100.4,
  'Pahang': 35929.9,
  'Johor': 19088.1,
  'Kelantan': 15036.4,
  'Terengganu': 12957.3,
  'Kedah': 9466.2,
  'Selangor': 7907.8,
  'Negeri Sembilan': 6658.5,
  'Perak': 20875.7,
  'Melaka': 1670.2,
  'Pulau Pinang': 1059.2,
  'Perlis': 813.1,
  'WP Kuala Lumpur': 242.9,
  'WP Labuan': 94.0,
  'WP Putrajaya': 49.3,
};

/**
 * Aggregate districts into states by combining their polygons into MultiPolygon
 */
export function aggregateDistrictsToStates(districts: DistrictFeature[]): StateFeature[] {
  const stateMap = new Map<string, DistrictFeature[]>();

  // Group districts by state
  districts.forEach(district => {
    const stateCode = district.properties.state;
    if (!stateMap.has(stateCode)) {
      stateMap.set(stateCode, []);
    }
    stateMap.get(stateCode)!.push(district);
  });

  const states: StateFeature[] = [];

  stateMap.forEach((stateDistricts, stateCode) => {
    if (stateDistricts.length === 0) return;

    // Collect all polygon coordinates from districts in this state
    const allPolygons: number[][][] = [];

    stateDistricts.forEach(district => {
      const geometry = district.geometry;
      
      if (geometry.type === 'Polygon') {
        allPolygons.push(geometry.coordinates as number[][][]);
      } else if (geometry.type === 'MultiPolygon') {
        // MultiPolygon coordinates are already an array of polygons
        allPolygons.push(...(geometry.coordinates as number[][][][]));
      }
    });

    if (allPolygons.length === 0) return;

    const stateName = STATE_NAMES[stateCode] || stateCode;
    const codeState = stateDistricts[0].properties.code_state;

    // Create a MultiPolygon from all collected polygons
    const multiPolygon: GeoJSON.MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: allPolygons,
    };

    states.push({
      type: 'Feature',
      id: stateCode.toLowerCase(),
      properties: {
        name: stateName,
        stateCode: stateCode,
        code_state: codeState,
      },
      geometry: multiPolygon,
    });
  });

  return states;
}
