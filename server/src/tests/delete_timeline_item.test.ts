import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type DeleteTimelineItemInput } from '../schema';
import { deleteTimelineItem } from '../handlers/delete_timeline_item';
import { eq } from 'drizzle-orm';

describe('deleteTimelineItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing timeline item', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        description: 'A test project',
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080,
        user_id: user[0].id
      })
      .returning()
      .execute();

    const mediaAsset = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_video.mp4',
        original_filename: 'test_video.mp4',
        file_path: '/uploads/test_video.mp4',
        file_size: '1048576',
        mime_type: 'video/mp4',
        media_type: 'video',
        duration: '60.000',
        width: 1920,
        height: 1080,
        user_id: user[0].id
      })
      .returning()
      .execute();

    const timelineItem = await db.insert(timelineItemsTable)
      .values({
        project_id: project[0].id,
        media_asset_id: mediaAsset[0].id,
        track_number: 1,
        start_time: '10.000',
        end_time: '20.000',
        media_start_offset: '0.000'
      })
      .returning()
      .execute();

    const input: DeleteTimelineItemInput = {
      id: timelineItem[0].id
    };

    // Delete the timeline item
    const result = await deleteTimelineItem(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify item was deleted from database
    const deletedItem = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, timelineItem[0].id))
      .execute();

    expect(deletedItem).toHaveLength(0);
  });

  it('should return false when timeline item does not exist', async () => {
    const input: DeleteTimelineItemInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTimelineItem(input);

    // Should return success: false for non-existent item
    expect(result.success).toBe(false);
  });

  it('should handle deletion of timeline item with all optional properties set', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser2',
        email: 'test2@example.com'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        title: 'Test Project 2',
        description: 'Another test project',
        frame_rate: '24.00',
        resolution_width: 1280,
        resolution_height: 720,
        user_id: user[0].id
      })
      .returning()
      .execute();

    const mediaAsset = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_audio.mp3',
        original_filename: 'test_audio.mp3',
        file_path: '/uploads/test_audio.mp3',
        file_size: '2097152',
        mime_type: 'audio/mpeg',
        media_type: 'audio',
        duration: '120.000',
        user_id: user[0].id
      })
      .returning()
      .execute();

    const timelineItem = await db.insert(timelineItemsTable)
      .values({
        project_id: project[0].id,
        media_asset_id: mediaAsset[0].id,
        track_number: 2,
        start_time: '5.000',
        end_time: '25.000',
        media_start_offset: '2.500',
        volume: '0.75',
        opacity: '0.90',
        position_x: '100.50',
        position_y: '200.25',
        scale: '1.200',
        rotation: '45.00'
      })
      .returning()
      .execute();

    const input: DeleteTimelineItemInput = {
      id: timelineItem[0].id
    };

    // Delete the timeline item
    const result = await deleteTimelineItem(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify item was deleted from database
    const deletedItem = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, timelineItem[0].id))
      .execute();

    expect(deletedItem).toHaveLength(0);
  });

  it('should not affect other timeline items when deleting one', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser3',
        email: 'test3@example.com'
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        title: 'Multi-Item Project',
        description: 'Project with multiple timeline items',
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080,
        user_id: user[0].id
      })
      .returning()
      .execute();

    const mediaAsset = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_image.jpg',
        original_filename: 'test_image.jpg',
        file_path: '/uploads/test_image.jpg',
        file_size: '524288',
        mime_type: 'image/jpeg',
        media_type: 'image',
        width: 1920,
        height: 1080,
        user_id: user[0].id
      })
      .returning()
      .execute();

    // Create multiple timeline items
    const timelineItem1 = await db.insert(timelineItemsTable)
      .values({
        project_id: project[0].id,
        media_asset_id: mediaAsset[0].id,
        track_number: 1,
        start_time: '0.000',
        end_time: '10.000',
        media_start_offset: '0.000'
      })
      .returning()
      .execute();

    const timelineItem2 = await db.insert(timelineItemsTable)
      .values({
        project_id: project[0].id,
        media_asset_id: mediaAsset[0].id,
        track_number: 1,
        start_time: '10.000',
        end_time: '20.000',
        media_start_offset: '0.000'
      })
      .returning()
      .execute();

    const input: DeleteTimelineItemInput = {
      id: timelineItem1[0].id
    };

    // Delete the first timeline item
    const result = await deleteTimelineItem(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify first item was deleted
    const deletedItem = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, timelineItem1[0].id))
      .execute();

    expect(deletedItem).toHaveLength(0);

    // Verify second item still exists
    const remainingItem = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, timelineItem2[0].id))
      .execute();

    expect(remainingItem).toHaveLength(1);
    expect(remainingItem[0].id).toBe(timelineItem2[0].id);
  });
});