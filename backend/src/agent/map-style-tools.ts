import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export type MapStyleValue = 'standard' | 'satellite';

/** Set map style (standard = streets/light, satellite = satellite imagery). Avoids TS2589 by extending StructuredTool<any,any,any,string>. */
class SetMapStyleTool extends StructuredTool<any, any, any, string> {
  name = 'set_map_style';
  description = `Change the BASE map style (how the map looks underneath). NOT for adding data layers—use select_layer for that. Use style "satellite" when the user says: satellite, satellite imagery, satellite view, satellite map, aerial view, use satellite imagery, make the map satellite. Use style "standard" for: street map, standard map, normal map, switch back. Pass style parameter only. Returns JSON with the chosen style.`;
  schema = z.object({
    style: z
      .enum(['standard', 'satellite'])
      .describe(
        'Either "standard" (streets/light map) or "satellite" (satellite imagery)',
      ),
  }) as z.ZodTypeAny;

  protected async _call(arg: { style: MapStyleValue }): Promise<string> {
    const { style } = arg;
    const value =
      style === 'satellite' || style === 'standard' ? style : 'standard';
    return JSON.stringify({ style: value });
  }
}

export function createSetMapStyleTool(): SetMapStyleTool {
  return new SetMapStyleTool();
}
