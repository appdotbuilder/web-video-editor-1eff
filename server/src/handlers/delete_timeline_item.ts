import { db } from '../db';
import { timelineItemsTable } from '../db/schema';
import { type DeleteTimelineItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteTimelineItem(input: DeleteTimelineItemInput): Promise<{ success: boolean }> {
  try {
    // Delete the timeline item
    const result = await db.delete(timelineItemsTable)
      .where(eq(timelineItemsTable.id, input.id))
      .execute();

    // Check if any rows were affected (item existed)
    const success = (result.rowCount ?? 0) > 0;

    return { success };
  } catch (error) {
    console.error('Timeline item deletion failed:', error);
    throw error;
  }
}