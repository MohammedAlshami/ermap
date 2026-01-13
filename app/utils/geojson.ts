// Utility to load and filter Sabah districts from GeoJSON

export interface DistrictFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    code_state: number;
    state: string;
  };
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][][] | number[][][];
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  crs?: any;
  features: DistrictFeature[];
}

// Load and filter Sabah districts
export const getSabahDistricts = async (): Promise<DistrictFeature[]> => {
  try {
    const response = await fetch('/malaysia.district.geojson');
    const data: GeoJSONData = await response.json();
    
    // Filter for Sabah (code_state: 12 or state: "SBH")
    const sabahDistricts = data.features.filter(
      (feature) => feature.properties.code_state === 12 || feature.properties.state === 'SBH'
    );
    
    return sabahDistricts;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return [];
  }
};

// Get district by name (case-insensitive, handles variations)
export const getDistrictByName = (
  districts: DistrictFeature[],
  name: string
): DistrictFeature | undefined => {
  const normalizedName = name.toLowerCase().trim();
  return districts.find(
    (d) => d.properties.name.toLowerCase().trim() === normalizedName
  );
};

// Get districts by names array
export const getDistrictsByNames = (
  districts: DistrictFeature[],
  names: string[]
): DistrictFeature[] => {
  return names
    .map((name) => getDistrictByName(districts, name))
    .filter((d): d is DistrictFeature => d !== undefined);
};

// Load all districts (not just Sabah) for cross-state districts
export const getAllDistricts = async (): Promise<DistrictFeature[]> => {
  try {
    const response = await fetch('/malaysia.district.geojson');
    const data: GeoJSONData = await response.json();
    return data.features;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return [];
  }
};

