import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export type DetectionType = 'buildings' | 'trees' | 'both';

/** Run AI detection in the user's drawn polygon area. Returns instruction for frontend to fetch satellite image and call detection API. */
class DetectInDrawnAreaTool extends StructuredTool<any, any, any, string> {
  name = 'detect_in_drawn_area';
  description = `Run AI detection (buildings and/or trees) inside the polygon the user has drawn on the map. Call this ONLY when the user has drawn at least one polygon (check [Drawn polygons] in the message) and asks to "detect buildings", "detect trees", "find buildings here", "find trees in this area", "run building detection", "run tree detection", or "detect both". Pass detection_type: "buildings" for building detection only, "trees" for tree detection only, "both" for both. If the user did NOT draw a polygon first, tell them to draw a polygon on the map first, then ask again.`;
  schema = z.object({
    detection_type: z
      .enum(['buildings', 'trees', 'both'])
      .describe(
        'What to detect: "buildings" (building segmentation), "trees" (tree segmentation), or "both" (run both and show results).',
      ),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    detection_type: DetectionType;
  }): Promise<string> {
    return JSON.stringify({
      run_detection: true,
      detection_type: arg.detection_type,
    });
  }
}

export function createDetectInDrawnAreaTool(): DetectInDrawnAreaTool {
  return new DetectInDrawnAreaTool();
}
