import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type CreateTimelineItemInput } from '../schema';
import { createTimelineItem } from '../handlers/create_timeline_item';
import { eq } from 'drizzle-orm';

describe('createTimelineItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a timeline item with all properties', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        description: 'A test project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Create prerequisite media asset
    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_video.mp4',
        original_filename: 'original_video.mp4',
        file_path: '/uploads/test_video.mp4',
        file_size: '1048576', // 1MB in bytes
        mime_type: 'video/mp4',
        media_type: 'video',
        duration: '120.500',
        width: 1920,
        height: 1080,
        user_id: userId
      })
      .returning()
      .execute();
    const mediaAssetId = mediaAssetResult[0].id;

    // Test input with all properties
    const testInput: CreateTimelineItemInput = {
      project_id: projectId,
      media_asset_id: mediaAssetId,
      track_number: 1,
      start_time: 10.5,
      end_time: 25.75,
      media_start_offset: 5.25,
      volume: 0.8,
      opacity: 0.9,
      position_x: 100.5,
      position_y: 200.25,
      scale: 1.5,
      rotation: 45.5
    };

    const result = await createTimelineItem(testInput);

    // Validate all fields
    expect(result.project_id).toEqual(projectId);
    expect(result.media_asset_id).toEqual(mediaAssetId);
    expect(result.track_number).toEqual(1);
    expect(result.start_time).toEqual(10.5);
    expect(result.end_time).toEqual(25.75);
    expect(result.media_start_offset).toEqual(5.25);
    expect(result.volume).toEqual(0.8);
    expect(result.opacity).toEqual(0.9);
    expect(result.position_x).toEqual(100.5);
    expect(result.position_y).toEqual(200.25);
    expect(result.scale).toEqual(1.5);
    expect(result.rotation).toEqual(45.5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate numeric types
    expect(typeof result.start_time).toBe('number');
    expect(typeof result.end_time).toBe('number');
    expect(typeof result.media_start_offset).toBe('number');
    expect(typeof result.volume).toBe('number');
    expect(typeof result.opacity).toBe('number');
    expect(typeof result.position_x).toBe('number');
    expect(typeof result.position_y).toBe('number');
    expect(typeof result.scale).toBe('number');
    expect(typeof result.rotation).toBe('number');
  });

  it('should create a timeline item with minimal properties and defaults', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_image.jpg',
        original_filename: 'original_image.jpg',
        file_path: '/uploads/test_image.jpg',
        file_size: '524288', // 512KB
        mime_type: 'image/jpeg',
        media_type: 'image',
        width: 1920,
        height: 1080,
        user_id: userId
      })
      .returning()
      .execute();
    const mediaAssetId = mediaAssetResult[0].id;

    // Test input with minimal properties (Zod applies defaults)
    const testInput: CreateTimelineItemInput = {
      project_id: projectId,
      media_asset_id: mediaAssetId,
      track_number: 0,
      start_time: 0,
      end_time: 10,
      media_start_offset: 0
    };

    const result = await createTimelineItem(testInput);

    // Validate required fields
    expect(result.project_id).toEqual(projectId);
    expect(result.media_asset_id).toEqual(mediaAssetId);
    expect(result.track_number).toEqual(0);
    expect(result.start_time).toEqual(0);
    expect(result.end_time).toEqual(10);
    expect(result.media_start_offset).toEqual(0); // Default value applied
    
    // Validate optional fields are null
    expect(result.volume).toBeNull();
    expect(result.opacity).toBeNull();
    expect(result.position_x).toBeNull();
    expect(result.position_y).toBeNull();
    expect(result.scale).toBeNull();
    expect(result.rotation).toBeNull();

    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save timeline item to database correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_audio.mp3',
        original_filename: 'original_audio.mp3',
        file_path: '/uploads/test_audio.mp3',
        file_size: '2097152', // 2MB
        mime_type: 'audio/mpeg',
        media_type: 'audio',
        duration: '180.333',
        user_id: userId
      })
      .returning()
      .execute();
    const mediaAssetId = mediaAssetResult[0].id;

    const testInput: CreateTimelineItemInput = {
      project_id: projectId,
      media_asset_id: mediaAssetId,
      track_number: 2,
      start_time: 15.125,
      end_time: 45.875,
      media_start_offset: 2.5,
      volume: 0.75
    };

    const result = await createTimelineItem(testInput);

    // Query database directly
    const timelineItems = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, result.id))
      .execute();

    expect(timelineItems).toHaveLength(1);
    const dbItem = timelineItems[0];
    
    expect(dbItem.project_id).toEqual(projectId);
    expect(dbItem.media_asset_id).toEqual(mediaAssetId);
    expect(dbItem.track_number).toEqual(2);
    expect(parseFloat(dbItem.start_time)).toEqual(15.125);
    expect(parseFloat(dbItem.end_time)).toEqual(45.875);
    expect(parseFloat(dbItem.media_start_offset)).toEqual(2.5);
    expect(parseFloat(dbItem.volume!)).toEqual(0.75);
    expect(dbItem.opacity).toBeNull();
    expect(dbItem.created_at).toBeInstanceOf(Date);
    expect(dbItem.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when project does not exist', async () => {
    // Create prerequisite user and media asset but not project
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test_video.mp4',
        original_filename: 'original_video.mp4',
        file_path: '/uploads/test_video.mp4',
        file_size: '1048576',
        mime_type: 'video/mp4',
        media_type: 'video',
        user_id: userId
      })
      .returning()
      .execute();
    const mediaAssetId = mediaAssetResult[0].id;

    const testInput: CreateTimelineItemInput = {
      project_id: 9999, // Non-existent project
      media_asset_id: mediaAssetId,
      track_number: 1,
      start_time: 0,
      end_time: 10,
      media_start_offset: 0
    };

    await expect(createTimelineItem(testInput))
      .rejects
      .toThrow(/project with id 9999 not found/i);
  });

  it('should throw error when media asset does not exist', async () => {
    // Create prerequisite user and project but not media asset
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const testInput: CreateTimelineItemInput = {
      project_id: projectId,
      media_asset_id: 9999, // Non-existent media asset
      track_number: 1,
      start_time: 0,
      end_time: 10,
      media_start_offset: 0
    };

    await expect(createTimelineItem(testInput))
      .rejects
      .toThrow(/media asset with id 9999 not found/i);
  });

  it('should handle complex timeline positioning correctly', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Complex Project',
        user_id: userId,
        frame_rate: '60.00',
        resolution_width: 3840,
        resolution_height: 2160
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const mediaAssetResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'complex_video.mp4',
        original_filename: 'complex_original.mp4',
        file_path: '/uploads/complex_video.mp4',
        file_size: '10485760', // 10MB
        mime_type: 'video/mp4',
        media_type: 'video',
        duration: '300.750',
        width: 3840,
        height: 2160,
        user_id: userId
      })
      .returning()
      .execute();
    const mediaAssetId = mediaAssetResult[0].id;

    // Test complex positioning with precision values
    const testInput: CreateTimelineItemInput = {
      project_id: projectId,
      media_asset_id: mediaAssetId,
      track_number: 5,
      start_time: 123.456,
      end_time: 234.789,
      media_start_offset: 12.345,
      volume: 0.12,
      opacity: 0.99,
      position_x: -150.75,
      position_y: 275.25,
      scale: 2.125,
      rotation: -90.5
    };

    const result = await createTimelineItem(testInput);

    // Validate precision is preserved
    expect(result.start_time).toEqual(123.456);
    expect(result.end_time).toEqual(234.789);
    expect(result.media_start_offset).toEqual(12.345);
    expect(result.volume).toEqual(0.12);
    expect(result.opacity).toEqual(0.99);
    expect(result.position_x).toEqual(-150.75);
    expect(result.position_y).toEqual(275.25);
    expect(result.scale).toEqual(2.125);
    expect(result.rotation).toEqual(-90.5);

    // Verify database storage maintains precision
    const dbItems = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.id, result.id))
      .execute();

    const dbItem = dbItems[0];
    expect(parseFloat(dbItem.start_time)).toEqual(123.456);
    expect(parseFloat(dbItem.end_time)).toEqual(234.789);
    expect(parseFloat(dbItem.volume!)).toEqual(0.12);
    expect(parseFloat(dbItem.position_x!)).toEqual(-150.75);
  });
});