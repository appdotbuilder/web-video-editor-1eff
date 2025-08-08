import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type UpdateTimelineItemInput } from '../schema';
import { updateTimelineItem } from '../handlers/update_timeline_item';
import { eq } from 'drizzle-orm';

describe('updateTimelineItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createTestData = async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create media asset
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/uploads/test.mp4',
        file_size: '1024000',
        mime_type: 'video/mp4',
        media_type: 'video',
        duration: '10.500',
        width: 1920,
        height: 1080,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create timeline item
    const timelineItemResult = await db.insert(timelineItemsTable)
      .values({
        project_id: projectResult[0].id,
        media_asset_id: mediaAssetResult[0].id,
        track_number: 1,
        start_time: '0.000',
        end_time: '5.000',
        media_start_offset: '0.000',
        volume: '0.8',
        opacity: '1.0'
      })
      .returning()
      .execute();

    return {
      user: userResult[0],
      project: projectResult[0],
      mediaAsset: mediaAssetResult[0],
      timelineItem: timelineItemResult[0]
    };
  };

  it('should update basic timeline properties', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      track_number: 2,
      start_time: 1.5,
      end_time: 6.5
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.id).toEqual(testData.timelineItem.id);
    expect(result.track_number).toEqual(2);
    expect(result.start_time).toEqual(1.5);
    expect(result.end_time).toEqual(6.5);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify unchanged fields remain the same
    expect(result.project_id).toEqual(testData.timelineItem.project_id);
    expect(result.media_asset_id).toEqual(testData.timelineItem.media_asset_id);
    expect(parseFloat(testData.timelineItem.media_start_offset)).toEqual(result.media_start_offset);
  });

  it('should update audio and visual properties', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      volume: 0.6,
      opacity: 0.7,
      position_x: 100.5,
      position_y: 200.25,
      scale: 1.5,
      rotation: 45.0
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.volume).toEqual(0.6);
    expect(result.opacity).toEqual(0.7);
    expect(result.position_x).toEqual(100.5);
    expect(result.position_y).toEqual(200.25);
    expect(result.scale).toEqual(1.5);
    expect(result.rotation).toEqual(45.0);
  });

  it('should handle null values for optional fields', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      volume: null,
      opacity: null,
      position_x: null,
      position_y: null,
      scale: null,
      rotation: null
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.volume).toBeNull();
    expect(result.opacity).toBeNull();
    expect(result.position_x).toBeNull();
    expect(result.position_y).toBeNull();
    expect(result.scale).toBeNull();
    expect(result.rotation).toBeNull();
  });

  it('should update only specified fields', async () => {
    const testData = await createTestData();
    const originalVolume = parseFloat(testData.timelineItem.volume!);

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      track_number: 3
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.track_number).toEqual(3);
    // Volume should remain unchanged
    expect(result.volume).toEqual(originalVolume);
    expect(result.start_time).toEqual(parseFloat(testData.timelineItem.start_time));
    expect(result.end_time).toEqual(parseFloat(testData.timelineItem.end_time));
  });

  it('should update media start offset', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      media_start_offset: 2.5
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.media_start_offset).toEqual(2.5);
  });

  it('should save changes to database', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      track_number: 5,
      start_time: 2.0,
      end_time: 8.0,
      volume: 0.9
    };

    await updateTimelineItem(updateInput);

    // Query database to verify changes were persisted
    const timelineItems = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, testData.timelineItem.id))
      .execute();

    expect(timelineItems).toHaveLength(1);
    const savedItem = timelineItems[0];
    
    expect(savedItem.track_number).toEqual(5);
    expect(parseFloat(savedItem.start_time)).toEqual(2.0);
    expect(parseFloat(savedItem.end_time)).toEqual(8.0);
    expect(parseFloat(savedItem.volume!)).toEqual(0.9);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when timeline item does not exist', async () => {
    const updateInput: UpdateTimelineItemInput = {
      id: 999999, // Non-existent ID
      track_number: 1
    };

    await expect(updateTimelineItem(updateInput)).rejects.toThrow(/Timeline item with id 999999 not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    const testData = await createTestData();

    const updateInput: UpdateTimelineItemInput = {
      id: testData.timelineItem.id,
      start_time: 1.123,
      end_time: 5.456,
      position_x: 100.75,
      scale: 1.250
    };

    const result = await updateTimelineItem(updateInput);

    expect(result.start_time).toEqual(1.123);
    expect(result.end_time).toEqual(5.456);
    expect(result.position_x).toEqual(100.75);
    expect(result.scale).toEqual(1.250);
  });
});