import { db } from '../db';
import { mediaAssetsTable, usersTable } from '../db/schema';
import { type CreateMediaAssetInput, type MediaAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const createMediaAsset = async (input: CreateMediaAssetInput): Promise<MediaAsset> => {
  try {
    // Verify that the user exists to prevent foreign key constraint violations
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert media asset record
    const result = await db.insert(mediaAssetsTable)
      .values({
        filename: input.filename,
        original_filename: input.original_filename,
        file_path: input.file_path,
        file_size: input.file_size.toString(), // Convert number to string for numeric column
        mime_type: input.mime_type,
        media_type: input.media_type,
        duration: input.duration ? input.duration.toString() : null, // Convert number to string for numeric column
        width: input.width || null, // Integer column - no conversion needed
        height: input.height || null, // Integer column - no conversion needed
        user_id: input.user_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const mediaAsset = result[0];
    return {
      ...mediaAsset,
      file_size: parseFloat(mediaAsset.file_size), // Convert string back to number
      duration: mediaAsset.duration ? parseFloat(mediaAsset.duration) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Media asset creation failed:', error);
    throw error;
  }
};