/**
 * Convert a binary segmentation mask to GeoJSON polygons (coordinates only).
 * Uses connected components and returns each component as a polygon in map coordinates.
 */

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }>;
}

/**
 * Find connected components (4-connectivity) and return each as { minX, minY, maxX, maxY }.
 */
function maskToBoundingBoxes(
  mask: number[],
  width: number,
  height: number,
): Array<{ minX: number; minY: number; maxX: number; maxY: number }> {
  const visited = new Uint8Array(mask.length);
  const boxes: Array<{ minX: number; minY: number; maxX: number; maxY: number }> = [];

  function at(x: number, y: number): number {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return mask[y * width + x] ?? 0;
  }

  function visit(x: number, y: number): { minX: number; minY: number; maxX: number; maxY: number } {
    const stack: [number, number][] = [[x, y]];
    let minX = x;
    let minY = y;
    let maxX = x;
    let maxY = y;
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const i = cy * width + cx;
      if (visited[i] || at(cx, cy) !== 1) continue;
      visited[i] = 1;
      if (cx < minX) minX = cx;
      if (cy < minY) minY = cy;
      if (cx > maxX) maxX = cx;
      if (cy > maxY) maxY = cy;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return { minX, minY, maxX, maxY };
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (mask[i] === 1 && !visited[i]) {
        boxes.push(visit(x, y));
      }
    }
  }
  return boxes;
}

/**
 * Convert pixel bounding box to GeoJSON polygon coordinates.
 * Image: (0,0) = top-left = (minLng, maxLat), (width, height) = (maxLng, minLat).
 */
function pixelBoxToPolygon(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  width: number,
  height: number,
  bbox: [number, number, number, number],
): number[][][] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const toLng = (px: number) => minLng + (px / width) * (maxLng - minLng);
  const toLat = (py: number) => maxLat - (py / height) * (maxLat - minLat);
  const ring: [number, number][] = [
    [toLng(minX), toLat(minY)],
    [toLng(maxX), toLat(minY)],
    [toLng(maxX), toLat(maxY)],
    [toLng(minX), toLat(maxY)],
    [toLng(minX), toLat(minY)],
  ];
  return [ring];
}

/**
 * Convert a binary mask (width x height) to a GeoJSON FeatureCollection
 * using the map bbox for coordinate transform.
 */
export function maskToGeoJSON(
  mask: number[],
  width: number,
  height: number,
  bbox: [number, number, number, number],
): GeoJSONFeatureCollection {
  const boxes = maskToBoundingBoxes(mask, width, height);
  const features = boxes.map((b) => ({
    type: 'Feature' as const,
    properties: {} as Record<string, unknown>,
    geometry: {
      type: 'Polygon' as const,
      coordinates: pixelBoxToPolygon(b.minX, b.minY, b.maxX, b.maxY, width, height, bbox),
    },
  }));
  return { type: 'FeatureCollection', features };
}
