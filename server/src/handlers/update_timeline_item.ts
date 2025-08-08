import { db } from '../db';
import { timelineItemsTable } from '../db/schema';
import { type UpdateTimelineItemInput, type TimelineItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTimelineItem = async (input: UpdateTimelineItemInput): Promise<TimelineItem> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.track_number !== undefined) {
      updateData['track_number'] = input.track_number;
    }
    if (input.start_time !== undefined) {
      updateData['start_time'] = input.start_time.toString();
    }
    if (input.end_time !== undefined) {
      updateData['end_time'] = input.end_time.toString();
    }
    if (input.media_start_offset !== undefined) {
      updateData['media_start_offset'] = input.media_start_offset.toString();
    }
    if (input.volume !== undefined) {
      updateData['volume'] = input.volume?.toString() || null;
    }
    if (input.opacity !== undefined) {
      updateData['opacity'] = input.opacity?.toString() || null;
    }
    if (input.position_x !== undefined) {
      updateData['position_x'] = input.position_x?.toString() || null;
    }
    if (input.position_y !== undefined) {
      updateData['position_y'] = input.position_y?.toString() || null;
    }
    if (input.scale !== undefined) {
      updateData['scale'] = input.scale?.toString() || null;
    }
    if (input.rotation !== undefined) {
      updateData['rotation'] = input.rotation?.toString() || null;
    }

    // Add updated_at timestamp
    updateData['updated_at'] = new Date();

    // Update the timeline item
    const result = await db.update(timelineItemsTable)
      .set(updateData)
      .where(eq(timelineItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Timeline item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers
    const timelineItem = result[0];
    return {
      ...timelineItem,
      start_time: parseFloat(timelineItem.start_time),
      end_time: parseFloat(timelineItem.end_time),
      media_start_offset: parseFloat(timelineItem.media_start_offset),
      volume: timelineItem.volume ? parseFloat(timelineItem.volume) : null,
      opacity: timelineItem.opacity ? parseFloat(timelineItem.opacity) : null,
      position_x: timelineItem.position_x ? parseFloat(timelineItem.position_x) : null,
      position_y: timelineItem.position_y ? parseFloat(timelineItem.position_y) : null,
      scale: timelineItem.scale ? parseFloat(timelineItem.scale) : null,
      rotation: timelineItem.rotation ? parseFloat(timelineItem.rotation) : null
    };
  } catch (error) {
    console.error('Timeline item update failed:', error);
    throw error;
  }
};