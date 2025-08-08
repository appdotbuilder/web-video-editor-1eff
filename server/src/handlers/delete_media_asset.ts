import { db } from '../db';
import { mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type DeleteMediaAssetInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMediaAsset = async (input: DeleteMediaAssetInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the media asset exists
    const mediaAsset = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, input.id))
      .execute();

    if (mediaAsset.length === 0) {
      throw new Error('Media asset not found');
    }

    // Delete all timeline items that reference this media asset
    // This needs to be done first due to foreign key constraints
    await db.delete(timelineItemsTable)
      .where(eq(timelineItemsTable.media_asset_id, input.id))
      .execute();

    // Delete the media asset record
    const deleteResult = await db.delete(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Media asset deletion failed:', error);
    throw error;
  }
};