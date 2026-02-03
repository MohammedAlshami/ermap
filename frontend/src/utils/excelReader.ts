import * as XLSX from 'xlsx';

// Sabah state name variations
const SABAH_NAMES = ['Sabah', 'SABAH', 'sabah'];

// Sabah coordinate bounds (approximate)
const SABAH_BOUNDS = {
  minLat: 4.0,
  maxLat: 7.5,
  minLon: 115.0,
  maxLon: 119.5,
};

/**
 * Read an Excel file from the public folder
 */
export async function readExcelFile(filePath: string): Promise<XLSX.WorkBook> {
  try {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return workbook;
  } catch (error) {
    console.error(`Error reading Excel file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Convert Excel sheet to JSON array
 */
export function sheetToJson<T = any>(workbook: XLSX.WorkBook, sheetName?: string): T[] {
  const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName || 'first sheet'}`);
  }
  return XLSX.utils.sheet_to_json<T>(sheet);
}

/**
 * Check if a value indicates Sabah state
 */
export function isSabahState(value: any): boolean {
  if (typeof value !== 'string') return false;
  return SABAH_NAMES.includes(value.trim());
}

/**
 * Check if coordinates are within Sabah bounds
 */
export function isInSabahBounds(lat: number, lon: number): boolean {
  return (
    lat >= SABAH_BOUNDS.minLat &&
    lat <= SABAH_BOUNDS.maxLat &&
    lon >= SABAH_BOUNDS.minLon &&
    lon <= SABAH_BOUNDS.maxLon
  );
}

/**
 * Filter data for Sabah by state column
 */
export function filterBySabahState<T extends Record<string, any>>(
  data: T[],
  stateColumn: string
): T[] {
  return data.filter((row) => {
    const stateValue = row[stateColumn];
    return isSabahState(stateValue);
  });
}

/**
 * Filter data for Sabah by coordinates
 */
export function filterBySabahCoordinates<T extends Record<string, any>>(
  data: T[],
  latColumn: string,
  lonColumn: string
): T[] {
  return data.filter((row) => {
    const lat = parseFloat(row[latColumn]);
    const lon = parseFloat(row[lonColumn]);
    if (isNaN(lat) || isNaN(lon)) return false;
    return isInSabahBounds(lat, lon);
  });
}

/**
 * Read and filter Excel file for Sabah data
 */
export async function readSabahDataFromExcel<T = any>(
  filePath: string,
  options: {
    stateColumn?: string;
    latColumn?: string;
    lonColumn?: string;
    sheetName?: string;
  } = {}
): Promise<T[]> {
  const workbook = await readExcelFile(filePath);
  let data = sheetToJson<T>(workbook, options.sheetName);

  // Filter by state if state column is provided
  if (options.stateColumn) {
    data = filterBySabahState(data, options.stateColumn);
  }

  // Filter by coordinates if coordinate columns are provided
  if (options.latColumn && options.lonColumn) {
    data = filterBySabahCoordinates(data, options.latColumn, options.lonColumn);
  }

  return data;
}
