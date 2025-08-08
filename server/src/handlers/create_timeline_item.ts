import { db } from '../db';
import { timelineItemsTable, projectsTable, mediaAssetsTable } from '../db/schema';
import { type CreateTimelineItemInput, type TimelineItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createTimelineItem = async (input: CreateTimelineItemInput): Promise<TimelineItem> => {
  try {
    // Validate that the project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Validate that the media asset exists
    const mediaAsset = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, input.media_asset_id))
      .execute();

    if (mediaAsset.length === 0) {
      throw new Error(`Media asset with id ${input.media_asset_id} not found`);
    }

    // Insert timeline item record with proper numeric conversions
    const result = await db.insert(timelineItemsTable)
      .values({
        project_id: input.project_id,
        media_asset_id: input.media_asset_id,
        track_number: input.track_number,
        start_time: input.start_time.toString(), // Convert number to string for numeric column
        end_time: input.end_time.toString(), // Convert number to string for numeric column
        media_start_offset: (input.media_start_offset ?? 0).toString(), // Convert number to string for numeric column
        volume: input.volume?.toString() || null, // Convert number to string for numeric column
        opacity: input.opacity?.toString() || null, // Convert number to string for numeric column
        position_x: input.position_x?.toString() || null, // Convert number to string for numeric column
        position_y: input.position_y?.toString() || null, // Convert number to string for numeric column
        scale: input.scale?.toString() || null, // Convert number to string for numeric column
        rotation: input.rotation?.toString() || null // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const timelineItem = result[0];
    return {
      ...timelineItem,
      start_time: parseFloat(timelineItem.start_time), // Convert string back to number
      end_time: parseFloat(timelineItem.end_time), // Convert string back to number
      media_start_offset: parseFloat(timelineItem.media_start_offset), // Convert string back to number
      volume: timelineItem.volume ? parseFloat(timelineItem.volume) : null, // Convert string back to number
      opacity: timelineItem.opacity ? parseFloat(timelineItem.opacity) : null, // Convert string back to number
      position_x: timelineItem.position_x ? parseFloat(timelineItem.position_x) : null, // Convert string back to number
      position_y: timelineItem.position_y ? parseFloat(timelineItem.position_y) : null, // Convert string back to number
      scale: timelineItem.scale ? parseFloat(timelineItem.scale) : null, // Convert string back to number
      rotation: timelineItem.rotation ? parseFloat(timelineItem.rotation) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Timeline item creation failed:', error);
    throw error;
  }
};