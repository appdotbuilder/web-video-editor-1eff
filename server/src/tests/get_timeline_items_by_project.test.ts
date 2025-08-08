import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type GetTimelineItemsByProjectInput, type CreateUserInput, type CreateProjectInput, type CreateMediaAssetInput, type CreateTimelineItemInput } from '../schema';
import { getTimelineItemsByProject } from '../handlers/get_timeline_items_by_project';
import { eq } from 'drizzle-orm';

describe('getTimelineItemsByProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser: CreateUserInput = {
    username: 'testuser',
    email: 'test@example.com'
  };

  const testProject: CreateProjectInput = {
    title: 'Test Video Project',
    description: 'A test project for timeline items',
    frame_rate: 30,
    resolution_width: 1920,
    resolution_height: 1080,
    user_id: 1 // Will be set after user creation
  };

  const testVideoAsset: CreateMediaAssetInput = {
    filename: 'video_001.mp4',
    original_filename: 'my-video.mp4',
    file_path: '/media/video_001.mp4',
    file_size: 50000000, // 50MB
    mime_type: 'video/mp4',
    media_type: 'video',
    duration: 120.5, // 2 minutes 30.5 seconds
    width: 1920,
    height: 1080,
    user_id: 1 // Will be set after user creation
  };

  const testAudioAsset: CreateMediaAssetInput = {
    filename: 'audio_001.mp3',
    original_filename: 'background-music.mp3',
    file_path: '/media/audio_001.mp3',
    file_size: 5000000, // 5MB
    mime_type: 'audio/mp3',
    media_type: 'audio',
    duration: 180.25, // 3 minutes 25 seconds
    width: null,
    height: null,
    user_id: 1 // Will be set after user creation
  };

  it('should return empty array for project with no timeline items', async () => {
    // Create user and project
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: userResult[0].id,
        frame_rate: testProject.frame_rate.toString()
      })
      .returning()
      .execute();

    const input: GetTimelineItemsByProjectInput = {
      project_id: projectResult[0].id
    };

    const result = await getTimelineItemsByProject(input);

    expect(result).toEqual([]);
  });

  it('should fetch timeline items for a project ordered by track and start time', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: userResult[0].id,
        frame_rate: testProject.frame_rate.toString()
      })
      .returning()
      .execute();

    // Create media assets
    const videoAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testVideoAsset,
        user_id: userResult[0].id,
        file_size: testVideoAsset.file_size.toString(),
        duration: testVideoAsset.duration?.toString()
      })
      .returning()
      .execute();

    const audioAssetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testAudioAsset,
        user_id: userResult[0].id,
        file_size: testAudioAsset.file_size.toString(),
        duration: testAudioAsset.duration?.toString()
      })
      .returning()
      .execute();

    // Create timeline items in different orders to test sorting
    const timelineItem1: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: videoAssetResult[0].id,
      track_number: 1,
      start_time: 10.5,
      end_time: 25.75,
      media_start_offset: 5.0,
      volume: 0.8,
      opacity: 1.0,
      position_x: 100.25,
      position_y: 50.5,
      scale: 1.2,
      rotation: 15.0
    };

    const timelineItem2: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: audioAssetResult[0].id,
      track_number: 0, // Lower track number - should appear first
      start_time: 0.0,
      end_time: 30.0,
      media_start_offset: 0.0,
      volume: 0.6,
      opacity: null,
      position_x: null,
      position_y: null,
      scale: null,
      rotation: null
    };

    const timelineItem3: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: videoAssetResult[0].id,
      track_number: 1,
      start_time: 5.25, // Earlier start time on same track
      end_time: 10.0,
      media_start_offset: 0.0,
      volume: null,
      opacity: 0.75,
      position_x: 200.0,
      position_y: 150.0,
      scale: 0.8,
      rotation: -10.5
    };

    // Insert timeline items (not in order to test sorting)
    await db.insert(timelineItemsTable)
      .values([
        {
          project_id: timelineItem1.project_id,
          media_asset_id: timelineItem1.media_asset_id,
          track_number: timelineItem1.track_number,
          start_time: timelineItem1.start_time.toString(),
          end_time: timelineItem1.end_time.toString(),
          media_start_offset: timelineItem1.media_start_offset.toString(),
          volume: timelineItem1.volume?.toString() || null,
          opacity: timelineItem1.opacity?.toString() || null,
          position_x: timelineItem1.position_x?.toString() || null,
          position_y: timelineItem1.position_y?.toString() || null,
          scale: timelineItem1.scale?.toString() || null,
          rotation: timelineItem1.rotation?.toString() || null
        },
        {
          project_id: timelineItem2.project_id,
          media_asset_id: timelineItem2.media_asset_id,
          track_number: timelineItem2.track_number,
          start_time: timelineItem2.start_time.toString(),
          end_time: timelineItem2.end_time.toString(),
          media_start_offset: timelineItem2.media_start_offset.toString(),
          volume: timelineItem2.volume?.toString() || null,
          opacity: timelineItem2.opacity?.toString() || null,
          position_x: timelineItem2.position_x?.toString() || null,
          position_y: timelineItem2.position_y?.toString() || null,
          scale: timelineItem2.scale?.toString() || null,
          rotation: timelineItem2.rotation?.toString() || null
        },
        {
          project_id: timelineItem3.project_id,
          media_asset_id: timelineItem3.media_asset_id,
          track_number: timelineItem3.track_number,
          start_time: timelineItem3.start_time.toString(),
          end_time: timelineItem3.end_time.toString(),
          media_start_offset: timelineItem3.media_start_offset.toString(),
          volume: timelineItem3.volume?.toString() || null,
          opacity: timelineItem3.opacity?.toString() || null,
          position_x: timelineItem3.position_x?.toString() || null,
          position_y: timelineItem3.position_y?.toString() || null,
          scale: timelineItem3.scale?.toString() || null,
          rotation: timelineItem3.rotation?.toString() || null
        }
      ])
      .execute();

    const input: GetTimelineItemsByProjectInput = {
      project_id: projectResult[0].id
    };

    const result = await getTimelineItemsByProject(input);

    // Should return 3 timeline items
    expect(result).toHaveLength(3);

    // Verify ordering: first by track number, then by start time
    // Item 2 (track 0, start 0.0) should be first
    expect(result[0].track_number).toBe(0);
    expect(result[0].start_time).toBe(0.0);
    expect(result[0].media_asset_id).toBe(audioAssetResult[0].id);

    // Item 3 (track 1, start 5.25) should be second
    expect(result[1].track_number).toBe(1);
    expect(result[1].start_time).toBe(5.25);
    expect(result[1].media_asset_id).toBe(videoAssetResult[0].id);

    // Item 1 (track 1, start 10.5) should be third
    expect(result[2].track_number).toBe(1);
    expect(result[2].start_time).toBe(10.5);
    expect(result[2].media_asset_id).toBe(videoAssetResult[0].id);
  });

  it('should convert numeric fields correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: userResult[0].id,
        frame_rate: testProject.frame_rate.toString()
      })
      .returning()
      .execute();

    // Create media asset
    const assetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testVideoAsset,
        user_id: userResult[0].id,
        file_size: testVideoAsset.file_size.toString(),
        duration: testVideoAsset.duration?.toString()
      })
      .returning()
      .execute();

    // Create timeline item with various numeric values
    const timelineItem: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: assetResult[0].id,
      track_number: 0,
      start_time: 12.345,
      end_time: 67.890,
      media_start_offset: 2.5,
      volume: 0.75,
      opacity: 0.9,
      position_x: -100.5,
      position_y: 250.25,
      scale: 1.5,
      rotation: 45.75
    };

    await db.insert(timelineItemsTable)
      .values({
        project_id: timelineItem.project_id,
        media_asset_id: timelineItem.media_asset_id,
        track_number: timelineItem.track_number,
        start_time: timelineItem.start_time.toString(),
        end_time: timelineItem.end_time.toString(),
        media_start_offset: timelineItem.media_start_offset.toString(),
        volume: timelineItem.volume?.toString() || null,
        opacity: timelineItem.opacity?.toString() || null,
        position_x: timelineItem.position_x?.toString() || null,
        position_y: timelineItem.position_y?.toString() || null,
        scale: timelineItem.scale?.toString() || null,
        rotation: timelineItem.rotation?.toString() || null
      })
      .execute();

    const input: GetTimelineItemsByProjectInput = {
      project_id: projectResult[0].id
    };

    const result = await getTimelineItemsByProject(input);

    expect(result).toHaveLength(1);
    const item = result[0];

    // Verify all numeric conversions
    expect(typeof item.start_time).toBe('number');
    expect(item.start_time).toBe(12.345);

    expect(typeof item.end_time).toBe('number');
    expect(item.end_time).toBe(67.890);

    expect(typeof item.media_start_offset).toBe('number');
    expect(item.media_start_offset).toBe(2.5);

    expect(typeof item.volume).toBe('number');
    expect(item.volume).toBe(0.75);

    expect(typeof item.opacity).toBe('number');
    expect(item.opacity).toBe(0.9);

    expect(typeof item.position_x).toBe('number');
    expect(item.position_x).toBe(-100.5);

    expect(typeof item.position_y).toBe('number');
    expect(item.position_y).toBe(250.25);

    expect(typeof item.scale).toBe('number');
    expect(item.scale).toBe(1.5);

    expect(typeof item.rotation).toBe('number');
    expect(item.rotation).toBe(45.75);

    // Verify integer fields remain integers
    expect(typeof item.track_number).toBe('number');
    expect(item.track_number).toBe(0);
    expect(Number.isInteger(item.track_number)).toBe(true);
  });

  it('should handle null values correctly', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: userResult[0].id,
        frame_rate: testProject.frame_rate.toString()
      })
      .returning()
      .execute();

    // Create media asset
    const assetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testVideoAsset,
        user_id: userResult[0].id,
        file_size: testVideoAsset.file_size.toString(),
        duration: testVideoAsset.duration?.toString()
      })
      .returning()
      .execute();

    // Create timeline item with null optional fields
    const timelineItem: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: assetResult[0].id,
      track_number: 0,
      start_time: 0.0,
      end_time: 10.0,
      media_start_offset: 0.0,
      volume: null,
      opacity: null,
      position_x: null,
      position_y: null,
      scale: null,
      rotation: null
    };

    await db.insert(timelineItemsTable)
      .values({
        project_id: timelineItem.project_id,
        media_asset_id: timelineItem.media_asset_id,
        track_number: timelineItem.track_number,
        start_time: timelineItem.start_time.toString(),
        end_time: timelineItem.end_time.toString(),
        media_start_offset: timelineItem.media_start_offset.toString(),
        volume: null,
        opacity: null,
        position_x: null,
        position_y: null,
        scale: null,
        rotation: null
      })
      .execute();

    const input: GetTimelineItemsByProjectInput = {
      project_id: projectResult[0].id
    };

    const result = await getTimelineItemsByProject(input);

    expect(result).toHaveLength(1);
    const item = result[0];

    // Verify null values are preserved
    expect(item.volume).toBeNull();
    expect(item.opacity).toBeNull();
    expect(item.position_x).toBeNull();
    expect(item.position_y).toBeNull();
    expect(item.scale).toBeNull();
    expect(item.rotation).toBeNull();

    // Required fields should still have values
    expect(item.start_time).toBe(0.0);
    expect(item.end_time).toBe(10.0);
    expect(item.media_start_offset).toBe(0.0);
  });

  it('should include timeline item metadata', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    
    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: userResult[0].id,
        frame_rate: testProject.frame_rate.toString()
      })
      .returning()
      .execute();

    // Create media asset
    const assetResult = await db.insert(mediaAssetsTable)
      .values({
        ...testVideoAsset,
        user_id: userResult[0].id,
        file_size: testVideoAsset.file_size.toString(),
        duration: testVideoAsset.duration?.toString()
      })
      .returning()
      .execute();

    // Create timeline item
    const timelineItem: CreateTimelineItemInput = {
      project_id: projectResult[0].id,
      media_asset_id: assetResult[0].id,
      track_number: 0,
      start_time: 0.0,
      end_time: 10.0,
      media_start_offset: 0.0
    };

    await db.insert(timelineItemsTable)
      .values({
        project_id: timelineItem.project_id,
        media_asset_id: timelineItem.media_asset_id,
        track_number: timelineItem.track_number,
        start_time: timelineItem.start_time.toString(),
        end_time: timelineItem.end_time.toString(),
        media_start_offset: timelineItem.media_start_offset.toString()
      })
      .execute();

    const input: GetTimelineItemsByProjectInput = {
      project_id: projectResult[0].id
    };

    const result = await getTimelineItemsByProject(input);

    expect(result).toHaveLength(1);
    const item = result[0];

    // Verify all required fields are present
    expect(item.id).toBeDefined();
    expect(item.project_id).toBe(projectResult[0].id);
    expect(item.media_asset_id).toBe(assetResult[0].id);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent project', async () => {
    const input: GetTimelineItemsByProjectInput = {
      project_id: 99999 // Non-existent project ID
    };

    const result = await getTimelineItemsByProject(input);

    expect(result).toEqual([]);
  });
});