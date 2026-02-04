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

/** Turn optional description (plain text or HTML) into descriptionHtml. */
function toDescriptionHtml(description?: string | null): string {
  if (description == null || String(description).trim() === '') return '<p></p>';
  const s = String(description).trim();
  return s.startsWith('<') ? s : `<p>${s.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
}

/** Add-slide tool implemented without tool() to avoid TS2589 deep type instantiation. */
class AddSlideTool extends StructuredTool<any, any, any, string> {
  name = 'add_slide';
  description = `Add a new slide. You MUST pass title, layer_ids, current_slides_json, and description (short text or HTML for the slide body—required). Layer ids: ${VALID_LAYER_IDS.join(', ')}. Returns the updated slides array as JSON string.`;
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
    description: z
      .string()
      .describe('Required. Short description text (or HTML) for the slide body.'),
  }) as z.ZodTypeAny;

  protected async _call(
    arg: {
      title: string;
      layer_ids: string[];
      current_slides_json: string;
      description: string;
    },
  ): Promise<string> {
    const { title, layer_ids, current_slides_json, description } = arg;
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
      descriptionHtml: toDescriptionHtml(description),
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
  description: z
    .string()
    .describe('Required. Short description text (or HTML) for the slide body.'),
});

/** Add multiple slides at once. Use when the user asks for several slides or a slideshow plan. */
class AddSlidesTool extends StructuredTool<any, any, any, string> {
  name = 'add_slides';
  description = `Add multiple slides in one call. Pass slides_to_add (array of { title, layer_ids, description } for each slide) and current_slides_json. Each slide MUST have title, layer_ids, and description (required). Layer ids: ${VALID_LAYER_IDS.join(', ')}. Returns the updated slides array as JSON string.`;
  schema = z.object({
    slides_to_add: z
      .array(slideToAddSchema)
      .min(1)
      .describe(
        'Array of slides to add. Each must have title, layer_ids, and description.',
      ),
    current_slides_json: z
      .string()
      .describe('Current slides array as JSON string'),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    slides_to_add: Array<{ title: string; layer_ids: string[]; description: string }>;
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
        descriptionHtml: toDescriptionHtml(item?.description),
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

/** Edit a slide by index: optionally change title, description, and/or layer_ids. */
class EditSlideTool extends StructuredTool<any, any, any, string> {
  name = 'edit_slide';
  description = `Edit ONE existing slide by its 0-based index. CRITICAL: Pass current_slides_json as the COMPLETE array of ALL current slides from the message. Pass slide_index, current_slides_json (full array), and any of: title, description (plain text or HTML for the slide body), layer_ids. When the user asks to change the description or add text to a slide, you MUST pass the description parameter with the new text. Omitted fields keep the current value. Returns the full updated slides array.`;
  schema = z.object({
    slide_index: z
      .number()
      .int()
      .min(0)
      .describe('0-based index of the slide to edit'),
    current_slides_json: z
      .string()
      .describe(
        'The FULL array of ALL current slides as JSON (copy from [Current slides] in the message). Must be the complete list, not just the slide being edited.',
      ),
    title: z
      .string()
      .optional()
      .describe('New title for the slide (omit to keep current)'),
    description: z
      .string()
      .optional()
      .describe(
        'New description for the slide body. When the user asks to change, add, or modify the description, you MUST pass this parameter with the new text. Omit only if not changing the description.',
      ),
    layer_ids: z
      .array(z.string())
      .optional()
      .describe(
        `New layer ids for the slide (omit to keep current). Only use: ${VALID_LAYER_IDS.join(', ')}`,
      ),
  }) as z.ZodTypeAny;

  protected async _call(arg: {
    slide_index: number;
    current_slides_json: string;
    title?: string;
    description?: string;
    layer_ids?: string[];
  }): Promise<string> {
    const { slide_index, current_slides_json, title, description, layer_ids } = arg;
    const slides = parseSlides(current_slides_json);
    const idx =
      typeof slide_index === 'number' && Number.isInteger(slide_index)
        ? slide_index
        : -1;
    if (idx < 0 || idx >= slides.length) {
      return JSON.stringify(slides);
    }
    const slide = slides[idx]!;
    const newTitle =
      title !== undefined
        ? (String(title).trim() || slide.title)
        : slide.title;
    const newDescriptionHtml =
      description !== undefined
        ? toDescriptionHtml(description)
        : (slide.descriptionHtml ?? '<p></p>');
    const newLayerEntries =
      layer_ids !== undefined
        ? (Array.isArray(layer_ids) ? layer_ids : [])
            .filter((id) => VALID_LAYER_IDS.includes(String(id).trim()))
            .map((layerId) => ({
              layerId: String(layerId).trim(),
              type: 'markers' as const,
            }))
        : slide.layerEntries;
    const updated = slides.map((s, i) =>
      i === idx
        ? {
            ...s,
            title: newTitle,
            descriptionHtml: newDescriptionHtml,
            layerEntries: newLayerEntries,
          }
        : s,
    );
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

export function createEditSlideTool(): EditSlideTool {
  return new EditSlideTool();
}
