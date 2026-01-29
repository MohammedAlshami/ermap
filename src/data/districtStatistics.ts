// District Statistics data types and helper functions

export interface DistrictStatistic {
  district: string;
  state?: string;
  [key: string]: any; // Allow for various statistic columns
}

export interface ProcessedDistrictStatistic {
  district: string;
  statistics: Record<string, number | string>;
  // Common statistics that might be in the file
  population?: number;
  area?: number;
  density?: number;
  [key: string]: any;
}

/**
 * Process raw district statistics data
 */
export function processDistrictStatistics(
  rawData: DistrictStatistic[]
): ProcessedDistrictStatistic[] {
  return rawData.map((row) => {
    const processed: ProcessedDistrictStatistic = {
      district: row.district || row.District || row.DISTRICT || '',
      statistics: {},
    };

    // Extract all numeric and string values as statistics
    Object.keys(row).forEach((key) => {
      if (key.toLowerCase() !== 'district' && key.toLowerCase() !== 'state') {
        const value = row[key];
        if (typeof value === 'number' || !isNaN(parseFloat(String(value)))) {
          processed.statistics[key] = parseFloat(String(value));
        } else if (typeof value === 'string') {
          processed.statistics[key] = value;
        }
      }
    });

    // Try to identify common statistics
    const lowerKeys = Object.keys(row).map((k) => k.toLowerCase());
    if (lowerKeys.includes('population') || lowerKeys.includes('pop')) {
      processed.population = parseFloat(String(row.population || row.Population || row.POP || 0));
    }
    if (lowerKeys.includes('area')) {
      processed.area = parseFloat(String(row.area || row.Area || row.AREA || 0));
    }
    if (lowerKeys.includes('density')) {
      processed.density = parseFloat(String(row.density || row.Density || row.DENSITY || 0));
    }

    return processed;
  });
}

/**
 * Get statistics summary
 */
export function getDistrictStatisticsSummary(
  data: ProcessedDistrictStatistic[]
): {
  totalDistricts: number;
  totalPopulation?: number;
  totalArea?: number;
  averageDensity?: number;
} {
  const summary = {
    totalDistricts: data.length,
    totalPopulation: 0,
    totalArea: 0,
    averageDensity: 0,
  };

  let densityCount = 0;
  data.forEach((district) => {
    if (district.population) summary.totalPopulation! += district.population;
    if (district.area) summary.totalArea! += district.area;
    if (district.density) {
      summary.averageDensity! += district.density;
      densityCount++;
    }
  });

  if (densityCount > 0) {
    summary.averageDensity = summary.averageDensity! / densityCount;
  }

  return summary;
}

/**
 * Get statistic value for a district
 */
export function getDistrictStatistic(
  data: ProcessedDistrictStatistic[],
  districtName: string,
  statisticKey: string
): number | string | undefined {
  const district = data.find(
    (d) => d.district.toLowerCase() === districtName.toLowerCase()
  );
  return district?.statistics[statisticKey];
}

/**
 * Get all available statistic keys
 */
export function getStatisticKeys(data: ProcessedDistrictStatistic[]): string[] {
  const keys = new Set<string>();
  data.forEach((district) => {
    Object.keys(district.statistics).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
}
