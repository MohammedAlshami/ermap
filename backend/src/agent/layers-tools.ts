import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const VALID_LAYER_IDS = [
  'malaysia',
  'malaysia_district',
  'education_centers',
  'family_mart',
  'power_data',
  'sabah_hotels',
  'sabah_speedmart',
  'global_landslide_catalog',
];

function parseStringArray(json: string): string[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json.trim()) as unknown;
    return Array.isArray(parsed)
      ? (parsed as string[]).filter((id) => typeof id === 'string' && VALID_LAYER_IDS.includes(id.trim()))
      : [];
  } catch {
    return [];
  }
}

/** Select (add) a layer on the map. Avoids TS2589 by extending StructuredTool<any,any,any,string>. */
class SelectLayerTool extends StructuredTool<any, any, any, string> {
  name = 'select_layer';
  description = `Add a layer to the map so it is visible. Use when the user asks to "show X", "add X layer", "select X", or "turn on X". Pass layer_id (one of: ${VALID_LAYER_IDS.join(', ')}) and current_selected_layer_ids (current visible layer ids as JSON array string). Returns updated selected layer ids as JSON array string.`;
  schema = z.object({
    layer_id: z
      .string()
      .describe(`Layer to show. Must be one of: ${VALID_LAYER_IDS.join(', ')}`),
    current_selected_layer_ids: z
      .string()
      .describe('Current selected layer ids as JSON array string, e.g. ["malaysia"]'),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    layer_id: string;
    current_selected_layer_ids: string;
  }): Promise<string> {
    const { layer_id, current_selected_layer_ids } = arg;
    const id = String(layer_id ?? '').trim();
    if (!VALID_LAYER_IDS.includes(id)) {
      return JSON.stringify(parseStringArray(current_selected_layer_ids));
    }
    const current = parseStringArray(current_selected_layer_ids);
    const set = new Set(current);
    set.add(id);
    return JSON.stringify([...set]);
  }
}

/** Remove a layer from the map. Avoids TS2589 by extending StructuredTool<any,any,any,string>. */
class RemoveLayerTool extends StructuredTool<any, any, any, string> {
  name = 'remove_layer';
  description = `Remove a layer from the map so it is hidden. Use when the user asks to "hide X", "remove X layer", "deselect X", or "turn off X". Pass layer_id (one of: ${VALID_LAYER_IDS.join(', ')}) and current_selected_layer_ids (current visible layer ids as JSON array string). Returns updated selected layer ids as JSON array string.`;
  schema = z.object({
    layer_id: z
      .string()
      .describe(`Layer to hide. Must be one of: ${VALID_LAYER_IDS.join(', ')}`),
    current_selected_layer_ids: z
      .string()
      .describe('Current selected layer ids as JSON array string'),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    layer_id: string;
    current_selected_layer_ids: string;
  }): Promise<string> {
    const { layer_id, current_selected_layer_ids } = arg;
    const id = String(layer_id ?? '').trim();
    const current = parseStringArray(current_selected_layer_ids);
    const set = new Set(current);
    set.delete(id);
    return JSON.stringify([...set]);
  }
}

export function createSelectLayerTool(): SelectLayerTool {
  return new SelectLayerTool();
}

export function createRemoveLayerTool(): RemoveLayerTool {
  return new RemoveLayerTool();
}
