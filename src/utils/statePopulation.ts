import * as XLSX from 'xlsx';
import { STATE_AREAS, STATE_NAMES } from './stateAggregation';

export interface StatePopulationData {
  stateName: string;
  stateCode: string;
  population: number;
  area: number;
  density: number; // people per km²
}

// Normalize state names for matching
function normalizeStateName(name: string): string {
  const normalized = name.trim();
  
  // Handle special cases and abbreviations first
  const specialCases: Record<string, string> = {
    // Common abbreviations
    'W.P Kuala Lumpur': 'WP Kuala Lumpur',
    'W.P. Kuala Lumpur': 'WP Kuala Lumpur',
    'WP Kuala Lumpur': 'WP Kuala Lumpur',
    'W.P KL': 'WP Kuala Lumpur',
    'WP KL': 'WP Kuala Lumpur',
    'KL': 'WP Kuala Lumpur',
    'Kuala Lumpur': 'WP Kuala Lumpur',
    
    'W.P Labuan': 'WP Labuan',
    'W.P. Labuan': 'WP Labuan',
    'WP Labuan': 'WP Labuan',
    'Labuan': 'WP Labuan',
    
    'W.P Putrajaya': 'WP Putrajaya',
    'W.P. Putrajaya': 'WP Putrajaya',
    'WP Putrajaya': 'WP Putrajaya',
    'Putrajaya': 'WP Putrajaya',
    
    // Other state variations
    'Penang': 'Pulau Pinang',
    'Pulau Pinang': 'Pulau Pinang',
    'P. Pinang': 'Pulau Pinang',
    'Malacca': 'Melaka',
    'Melaka': 'Melaka',
    'N. Sembilan': 'Negeri Sembilan',
    'Negeri Sembilan': 'Negeri Sembilan',
  };
  
  // Check direct mapping
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }
  
  // Check case-insensitive mapping
  for (const [key, value] of Object.entries(specialCases)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return value;
    }
  }
  
  // Direct mapping to STATE_NAMES values
  if (Object.values(STATE_NAMES).includes(normalized)) {
    return normalized;
  }
  
  // Try to find by partial match (case-insensitive)
  for (const fullName of Object.values(STATE_NAMES)) {
    if (fullName.toLowerCase() === normalized.toLowerCase()) {
      return fullName;
    }
  }
  
  // Try to find by code
  if (STATE_NAMES[normalized]) {
    return STATE_NAMES[normalized];
  }
  
  return normalized;
}

/**
 * Read district statistics Excel and aggregate by state
 */
export async function getStatePopulationsFromExcel(filePath: string): Promise<StatePopulationData[]> {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Use object format (default) which returns array of objects with column names as keys
    const data = XLSX.utils.sheet_to_json<any>(sheet);
    
    if (data.length === 0) {
      console.warn('No data found in Excel file');
      return [];
    }
    
    // Get column names from first row
    const firstRow = data[0];
    const headerKeys = Object.keys(firstRow);
    
    // Try to find state and population columns
    let stateColName = '';
    let populationColName = '';
    
    // Look for common column names
    for (const key of headerKeys) {
      const keyLower = String(key).toLowerCase();
      if (!stateColName && (keyLower.includes('state') || keyLower.includes('negeri'))) {
        stateColName = key;
      }
      if (!populationColName && (keyLower.includes('population') || keyLower.includes('populasi') || keyLower.includes('pop'))) {
        populationColName = key;
      }
    }
    
    // If we can't find by name, try to infer from data
    if (!stateColName || !populationColName) {
      // Try first few rows to find patterns
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i];
        if (row) {
          for (const [key, value] of Object.entries(row)) {
            const valueStr = String(value || '').toLowerCase();
            // Check if it looks like a state name
            if (!stateColName && Object.values(STATE_NAMES).some(s => s.toLowerCase().includes(valueStr) || valueStr.includes(s.toLowerCase()))) {
              stateColName = key;
            }
            // Check if it looks like a number (population)
            if (!populationColName && !isNaN(Number(value)) && Number(value) > 1000) {
              populationColName = key;
            }
          }
        }
      }
    }
    
    if (!stateColName || !populationColName) {
      console.error('Could not find state or population columns in Excel file');
      console.log('Available columns:', headerKeys);
      console.log('Sample row:', data[0]);
      return [];
    }
    
    // Aggregate population by state
    const statePopulations = new Map<string, number>();
    
    console.log('Processing Excel data - first 5 rows:');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(`Row ${i}:`, data[i]);
    }
    console.log(`State column: "${stateColName}", Population column: "${populationColName}"`);
    
    for (const row of data) {
      if (!row) continue;
      
      const stateValue = String(row[stateColName] || '').trim();
      const populationValue = row[populationColName];
      
      if (!stateValue || !populationValue) continue;
      
      const normalizedState = normalizeStateName(stateValue);
      const population = Number(populationValue);
      
      if (isNaN(population) || population <= 0) continue;
      
      // Add to state total
      const current = statePopulations.get(normalizedState) || 0;
      statePopulations.set(normalizedState, current + population);
    }
    
    console.log('Aggregated state populations:', Array.from(statePopulations.entries()));
    
    // Convert to StatePopulationData array
    const result: StatePopulationData[] = [];
    
    statePopulations.forEach((population, stateName) => {
      const area = STATE_AREAS[stateName];
      if (!area) {
        console.warn(`No area data found for state: ${stateName}`);
        return;
      }
      
      const density = population / area;
      
      // Find state code
      let stateCode = '';
      for (const [code, name] of Object.entries(STATE_NAMES)) {
        if (name === stateName) {
          stateCode = code;
          break;
        }
      }
      
      result.push({
        stateName,
        stateCode,
        population: Math.round(population),
        area,
        density: Math.round(density * 100) / 100, // Round to 2 decimal places
      });
    });
    
    return result.sort((a, b) => b.population - a.population);
  } catch (error) {
    console.error('Error reading state populations from Excel:', error);
    return [];
  }
}
