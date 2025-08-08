import { db } from '../db';
import { timelineItemsTable, mediaAssetsTable } from '../db/schema';
import { type GetTimelineItemsByProjectInput, type TimelineItem } from '../schema';
import { eq } from 'drizzle-orm';
import { asc } from 'drizzle-orm';

export async function getTimelineItemsByProject(input: GetTimelineItemsByProjectInput): Promise<TimelineItem[]> {
  try {
    // Query timeline items for the project with related media asset information
    // Order by track number first, then by start time within each track
    const results = await db.select()
      .from(timelineItemsTable)
      .innerJoin(mediaAssetsTable, eq(timelineItemsTable.media_asset_id, mediaAssetsTable.id))
      .where(eq(timelineItemsTable.project_id, input.project_id))
      .orderBy(
        asc(timelineItemsTable.track_number),
        asc(timelineItemsTable.start_time)
      )
      .execute();

    // Convert numeric fields back to numbers and return timeline items
    return results.map(result => {
      const timelineItem = result.timeline_items;
      
      return {
        ...timelineItem,
        // Convert numeric fields to numbers
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
    });
  } catch (error) {
    console.error('Failed to fetch timeline items for project:', error);
    throw error;
  }
}