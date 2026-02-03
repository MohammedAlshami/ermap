// Speedmart store data types and helper functions

export interface SpeedmartStore {
  name?: string;
  address?: string;
  district?: string;
  state?: string;
  lat?: number;
  lon?: number;
  longitude?: number;
  latitude?: number;
  [key: string]: any; // Allow for various columns
}

export interface ProcessedSpeedmartStore {
  name: string;
  address: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  [key: string]: any;
}

/**
 * Process raw Speedmart store data
 */
export function processSpeedmartStores(rawData: SpeedmartStore[]): ProcessedSpeedmartStore[] {
  return rawData
    .map((row) => {
      // Extract coordinates - try different column name variations
      const lat =
        row.lat ||
        row.latitude ||
        row.Lat ||
        row.Latitude ||
        row.LAT ||
        row.LATITUDE;
      const lon =
        row.lon ||
        row.longitude ||
        row.Lon ||
        row.Longitude ||
        row.LON ||
        row.LONGITUDE;

      // Skip if no coordinates
      if (lat === undefined || lon === undefined) {
        return null;
      }

      const processed: ProcessedSpeedmartStore = {
        name:
          row.name ||
          row.Name ||
          row.NAME ||
          row.store ||
          row.Store ||
          row.STORE ||
          'Unknown Store',
        address:
          row.address ||
          row.Address ||
          row.ADDRESS ||
          row.location ||
          row.Location ||
          row.LOCATION ||
          '',
        district:
          row.district ||
          row.District ||
          row.DISTRICT ||
          row.city ||
          row.City ||
          row.CITY ||
          '',
        state: row.state || row.State || row.STATE || 'Sabah',
        lat: parseFloat(String(lat)),
        lon: parseFloat(String(lon)),
      };

      // Copy any additional properties
      Object.keys(row).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          !['name', 'address', 'district', 'state', 'lat', 'lon', 'latitude', 'longitude'].includes(
            lowerKey
          )
        ) {
          processed[key] = row[key];
        }
      });

      return processed;
    })
    .filter((store): store is ProcessedSpeedmartStore => store !== null);
}

/**
 * Get stores by district
 */
export function getStoresByDistrict(
  stores: ProcessedSpeedmartStore[]
): Record<string, ProcessedSpeedmartStore[]> {
  const grouped: Record<string, ProcessedSpeedmartStore[]> = {};
  stores.forEach((store) => {
    const district = store.district || 'Unknown';
    if (!grouped[district]) {
      grouped[district] = [];
    }
    grouped[district].push(store);
  });
  return grouped;
}

/**
 * Get stores summary
 */
export function getSpeedmartSummary(stores: ProcessedSpeedmartStore[]): {
  totalStores: number;
  districts: string[];
  storesByDistrict: Record<string, number>;
} {
  const districts = new Set<string>();
  const storesByDistrict: Record<string, number> = {};

  stores.forEach((store) => {
    const district = store.district || 'Unknown';
    districts.add(district);
    storesByDistrict[district] = (storesByDistrict[district] || 0) + 1;
  });

  return {
    totalStores: stores.length,
    districts: Array.from(districts).sort(),
    storesByDistrict,
  };
}

/**
 * Search stores by name or address
 */
export function searchStores(
  stores: ProcessedSpeedmartStore[],
  query: string
): ProcessedSpeedmartStore[] {
  const lowerQuery = query.toLowerCase();
  return stores.filter(
    (store) =>
      store.name.toLowerCase().includes(lowerQuery) ||
      store.address.toLowerCase().includes(lowerQuery) ||
      store.district.toLowerCase().includes(lowerQuery)
  );
}
