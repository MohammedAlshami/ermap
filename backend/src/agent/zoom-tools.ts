import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/** Relative zoom: change by N levels from current. Avoids TS2589 by extending StructuredTool<any,any,any,string>. */
class SetZoomTool extends StructuredTool<any, any, any, string> {
  name = 'set_zoom';
  description = `Change map zoom by a number of levels from the user's CURRENT zoom. Use when the user says "zoom in", "zoom out", "zoom out a bit", "zoom in a bit", "zoom out by 2", "zoom in more", "see more of the map" (zoom out), "see less/closer" (zoom in). Pass delta: negative = zoom OUT (e.g. -1, -2), positive = zoom IN (e.g. 1, 2). "A bit" or "a little" = 1; "a lot" or "much" = 2 or 3. Returns JSON with the delta.`;
  schema = z.object({
    delta: z
      .number()
      .describe(
        'Change in zoom levels from current. Negative = zoom out (e.g. -1, -2). Positive = zoom in (e.g. 1, 2).',
      ),
  }) as z.ZodTypeAny;

  protected async _call(arg: { delta: number }): Promise<string> {
    const delta = Number(arg.delta);
    const clamped = Number.isNaN(delta) ? 0 : Math.max(-10, Math.min(10, Math.round(delta)));
    return JSON.stringify({ delta: clamped });
  }
}

export function createSetZoomTool(): SetZoomTool {
  return new SetZoomTool();
}
