import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import type { SlideDto } from '../chat/dto/chat-body.dto';

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

function parseSlides(currentSlidesJson: string): SlideDto[] {
  if (!currentSlidesJson?.trim()) return [];
  try {
    const parsed = JSON.parse(currentSlidesJson.trim()) as unknown;
    return Array.isArray(parsed) ? (parsed as SlideDto[]) : [];
  } catch {
    return [];
  }
}

/** Add-slide tool implemented without tool() to avoid TS2589 deep type instantiation. */
class AddSlideTool extends StructuredTool<any, any, any, string> {
  name = 'add_slide';
  description = `Add a new slide to the map slideshow. Use when the user asks to add a slide, create a slide, or "add a slide with X and Y layers". Pass the slide title, an array of layer_ids (use only these exact ids: ${VALID_LAYER_IDS.join(', ')}), and the current_slides_json (current slides as JSON string). Returns the updated slides array as JSON string.`;
  schema = z.object({
    title: z.string().describe('Title of the new slide'),
    layer_ids: z
      .array(z.string())
      .describe(
        `Layer ids to show on this slide. Only use: ${VALID_LAYER_IDS.join(', ')}`,
      ),
    current_slides_json: z
      .string()
      .describe('Current slides array as JSON string'),
  }) as z.ZodTypeAny;

  protected async _call(
    arg: { title: string; layer_ids: string[]; current_slides_json: string },
  ): Promise<string> {
    const { title, layer_ids, current_slides_json } = arg;
    const slides = parseSlides(current_slides_json);
    const layerIds = Array.isArray(layer_ids) ? layer_ids : [];
    const validIds = layerIds.filter((id) =>
      VALID_LAYER_IDS.includes(String(id).trim()),
    );
    const layerEntries = validIds.map((layerId) => ({
      layerId: String(layerId).trim(),
      type: 'markers' as const,
    }));
    const newSlide: SlideDto = {
      id: `slide-${Date.now()}`,
      title: String(title ?? 'New slide').trim() || 'New slide',
      layerEntries,
      descriptionHtml: '<p></p>',
      contentPosition: 'bottom-center',
    };
    const updated = [...slides, newSlide];
    return JSON.stringify(updated);
  }
}

const slideToAddSchema = z.object({
  title: z.string().describe('Title of the slide'),
  layer_ids: z
    .array(z.string())
    .describe(
      `Layer ids to show on this slide. Only use: ${VALID_LAYER_IDS.join(', ')}`,
    ),
});

/** Add multiple slides at once. Use when the user asks for several slides or a slideshow plan. */
class AddSlidesTool extends StructuredTool<any, any, any, string> {
  name = 'add_slides';
  description = `Add multiple slides to the map slideshow in one call. Use when the user asks to add several slides, create a slideshow, or "add 3 slides with ...". Pass slides_to_add (array of { title, layer_ids } for each slide) and current_slides_json. Layer ids must be from: ${VALID_LAYER_IDS.join(', ')}. Returns the updated slides array as JSON string.`;
  schema = z.object({
    slides_to_add: z
      .array(slideToAddSchema)
      .min(1)
      .describe(
        'Array of slides to add. Each has title and layer_ids (array of layer id strings).',
      ),
    current_slides_json: z
      .string()
      .describe('Current slides array as JSON string'),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    slides_to_add: Array<{ title: string; layer_ids: string[] }>;
    current_slides_json: string;
  }): Promise<string> {
    const { slides_to_add, current_slides_json } = arg;
    let slides = parseSlides(current_slides_json);
    const toAdd = Array.isArray(slides_to_add) ? slides_to_add : [];
    for (const item of toAdd) {
      const title = String(item?.title ?? 'New slide').trim() || 'New slide';
      const layerIds = Array.isArray(item?.layer_ids) ? item.layer_ids : [];
      const validIds = layerIds.filter((id) =>
        VALID_LAYER_IDS.includes(String(id).trim()),
      );
      const layerEntries = validIds.map((layerId) => ({
        layerId: String(layerId).trim(),
        type: 'markers' as const,
      }));
      const newSlide: SlideDto = {
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title,
        layerEntries,
        descriptionHtml: '<p></p>',
        contentPosition: 'bottom-center',
      };
      slides = [...slides, newSlide];
    }
    return JSON.stringify(slides);
  }
}

/** Remove-slide tool implemented without tool() to avoid TS2589 deep type instantiation. */
class RemoveSlideTool extends StructuredTool<any, any, any, string> {
  name = 'remove_slide';
  description = `Remove a slide from the slideshow by its 0-based index. Use when the user asks to remove a slide, delete a slide, or "remove the first/second/last slide". Pass slide_index (0-based) and current_slides_json. Returns the updated slides array as JSON string.`;
  schema = z.object({
    slide_index: z
      .number()
      .int()
      .min(0)
      .describe('0-based index of the slide to remove'),
    current_slides_json: z
      .string()
      .describe('Current slides array as JSON string'),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    slide_index: number;
    current_slides_json: string;
  }): Promise<string> {
    const { slide_index, current_slides_json } = arg;
    const slides = parseSlides(current_slides_json);
    const idx =
      typeof slide_index === 'number' && Number.isInteger(slide_index)
        ? slide_index
        : -1;
    if (idx < 0 || idx >= slides.length) {
      return JSON.stringify(slides);
    }
    const updated = slides.filter((_, i) => i !== idx);
    return JSON.stringify(updated);
  }
}

export function createAddSlideTool(): AddSlideTool {
  return new AddSlideTool();
}

export function createAddSlidesTool(): AddSlidesTool {
  return new AddSlidesTool();
}

export function createRemoveSlideTool(): RemoveSlideTool {
  return new RemoveSlideTool();
}
