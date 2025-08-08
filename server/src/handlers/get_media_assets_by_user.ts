import { db } from '../db';
import { mediaAssetsTable } from '../db/schema';
import { type GetMediaAssetsByUserInput, type MediaAsset } from '../schema';
import { eq, and } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getMediaAssetsByUser = async (input: GetMediaAssetsByUserInput): Promise<MediaAsset[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(mediaAssetsTable.user_id, input.user_id));
    
    // Add media_type filter if provided
    if (input.media_type) {
      conditions.push(eq(mediaAssetsTable.media_type, input.media_type));
    }

    // Build and execute query with all conditions applied at once
    const results = await db.select()
      .from(mediaAssetsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(asset => ({
      ...asset,
      file_size: parseFloat(asset.file_size),
      duration: asset.duration ? parseFloat(asset.duration) : null
    }));
  } catch (error) {
    console.error('Failed to fetch media assets by user:', error);
    throw error;
  }
};