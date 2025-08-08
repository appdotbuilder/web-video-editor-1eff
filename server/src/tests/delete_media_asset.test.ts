import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, mediaAssetsTable, projectsTable, timelineItemsTable } from '../db/schema';
import { type DeleteMediaAssetInput, type CreateUserInput, type CreateMediaAssetInput, type CreateProjectInput, type CreateTimelineItemInput } from '../schema';
import { deleteMediaAsset } from '../handlers/delete_media_asset';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

const testMediaAsset: CreateMediaAssetInput = {
  filename: 'test-video.mp4',
  original_filename: 'original-video.mp4',
  file_path: '/uploads/test-video.mp4',
  file_size: 1024000,
  mime_type: 'video/mp4',
  media_type: 'video',
  duration: 120.5,
  width: 1920,
  height: 1080,
  user_id: 1 // Will be set dynamically in tests
};

const testProject: CreateProjectInput = {
  title: 'Test Project',
  description: 'A test project',
  frame_rate: 30,
  resolution_width: 1920,
  resolution_height: 1080,
  user_id: 1 // Will be set dynamically in tests
};

const testTimelineItem: CreateTimelineItemInput = {
  project_id: 1, // Will be set dynamically in tests
  media_asset_id: 1, // Will be set dynamically in tests
  track_number: 0,
  start_time: 0,
  end_time: 10.5,
  media_start_offset: 0,
  volume: 1.0,
  opacity: 1.0,
  position_x: 0,
  position_y: 0,
  scale: 1.0,
  rotation: 0
};

describe('deleteMediaAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a media asset successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test media asset
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testMediaAsset,
        user_id: userId,
        file_size: testMediaAsset.file_size.toString(),
        duration: testMediaAsset.duration?.toString()
      })
      .returning()
      .execute();

    const mediaAssetId = mediaAssetResult[0].id;

    const deleteInput: DeleteMediaAssetInput = {
      id: mediaAssetId
    };

    // Delete the media asset
    const result = await deleteMediaAsset(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify media asset is deleted from database
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, mediaAssetId))
      .execute();

    expect(mediaAssets).toHaveLength(0);
  });

  it('should delete associated timeline items when deleting media asset', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: testProject.title,
        description: testProject.description,
        frame_rate: testProject.frame_rate.toString(),
        resolution_width: testProject.resolution_width,
        resolution_height: testProject.resolution_height,
        user_id: userId
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create test media asset
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testMediaAsset,
        user_id: userId,
        file_size: testMediaAsset.file_size.toString(),
        duration: testMediaAsset.duration?.toString()
      })
      .returning()
      .execute();

    const mediaAssetId = mediaAssetResult[0].id;

    // Create timeline item that references the media asset
    const timelineItemResult = await db.insert(timelineItemsTable)
      .values({
        project_id: projectId,
        media_asset_id: mediaAssetId,
        track_number: testTimelineItem.track_number,
        start_time: testTimelineItem.start_time.toString(),
        end_time: testTimelineItem.end_time.toString(),
        media_start_offset: testTimelineItem.media_start_offset.toString(),
        volume: testTimelineItem.volume?.toString(),
        opacity: testTimelineItem.opacity?.toString(),
        position_x: testTimelineItem.position_x?.toString(),
        position_y: testTimelineItem.position_y?.toString(),
        scale: testTimelineItem.scale?.toString(),
        rotation: testTimelineItem.rotation?.toString()
      })
      .returning()
      .execute();

    const timelineItemId = timelineItemResult[0].id;

    // Verify timeline item exists before deletion
    const timelineItemsBefore = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.media_asset_id, mediaAssetId))
      .execute();

    expect(timelineItemsBefore).toHaveLength(1);

    const deleteInput: DeleteMediaAssetInput = {
      id: mediaAssetId
    };

    // Delete the media asset
    const result = await deleteMediaAsset(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify media asset is deleted
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, mediaAssetId))
      .execute();

    expect(mediaAssets).toHaveLength(0);

    // Verify associated timeline items are also deleted
    const timelineItemsAfter = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.media_asset_id, mediaAssetId))
      .execute();

    expect(timelineItemsAfter).toHaveLength(0);
  });

  it('should handle multiple timeline items referencing the same media asset', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: testProject.title,
        description: testProject.description,
        frame_rate: testProject.frame_rate.toString(),
        resolution_width: testProject.resolution_width,
        resolution_height: testProject.resolution_height,
        user_id: userId
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create test media asset
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testMediaAsset,
        user_id: userId,
        file_size: testMediaAsset.file_size.toString(),
        duration: testMediaAsset.duration?.toString()
      })
      .returning()
      .execute();

    const mediaAssetId = mediaAssetResult[0].id;

    // Create multiple timeline items that reference the same media asset
    await db.insert(timelineItemsTable)
      .values([
        {
          project_id: projectId,
          media_asset_id: mediaAssetId,
          track_number: 0,
          start_time: '0.000',
          end_time: '10.500',
          media_start_offset: '0.000'
        },
        {
          project_id: projectId,
          media_asset_id: mediaAssetId,
          track_number: 1,
          start_time: '15.000',
          end_time: '25.500',
          media_start_offset: '5.000'
        },
        {
          project_id: projectId,
          media_asset_id: mediaAssetId,
          track_number: 2,
          start_time: '30.000',
          end_time: '40.000',
          media_start_offset: '10.000'
        }
      ])
      .execute();

    // Verify all timeline items exist before deletion
    const timelineItemsBefore = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.media_asset_id, mediaAssetId))
      .execute();

    expect(timelineItemsBefore).toHaveLength(3);

    const deleteInput: DeleteMediaAssetInput = {
      id: mediaAssetId
    };

    // Delete the media asset
    const result = await deleteMediaAsset(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify media asset is deleted
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, mediaAssetId))
      .execute();

    expect(mediaAssets).toHaveLength(0);

    // Verify all associated timeline items are deleted
    const timelineItemsAfter = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.media_asset_id, mediaAssetId))
      .execute();

    expect(timelineItemsAfter).toHaveLength(0);
  });

  it('should throw an error when trying to delete non-existent media asset', async () => {
    const deleteInput: DeleteMediaAssetInput = {
      id: 99999 // Non-existent ID
    };

    // Attempt to delete non-existent media asset
    await expect(deleteMediaAsset(deleteInput)).rejects.toThrow(/Media asset not found/i);
  });

  it('should handle deletion of media asset with no timeline items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test media asset without any timeline items
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testMediaAsset,
        user_id: userId,
        file_size: testMediaAsset.file_size.toString(),
        duration: testMediaAsset.duration?.toString()
      })
      .returning()
      .execute();

    const mediaAssetId = mediaAssetResult[0].id;

    const deleteInput: DeleteMediaAssetInput = {
      id: mediaAssetId
    };

    // Delete the media asset
    const result = await deleteMediaAsset(deleteInput);

    // Verify result
    expect(result.success).toBe(true);

    // Verify media asset is deleted from database
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, mediaAssetId))
      .execute();

    expect(mediaAssets).toHaveLength(0);
  });
});