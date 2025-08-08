import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, mediaAssetsTable, timelineItemsTable } from '../db/schema';
import { type DeleteProjectInput } from '../schema';
import { deleteProject } from '../handlers/delete_project';
import { eq } from 'drizzle-orm';

describe('deleteProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a project successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        description: 'A test project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080,
        status: 'draft'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: DeleteProjectInput = {
      id: projectId
    };

    // Delete the project
    const result = await deleteProject(input);

    expect(result.success).toBe(true);

    // Verify project was deleted from database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(0);
  });

  it('should delete project and cascade delete timeline items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Test Project',
        description: 'A test project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080,
        status: 'draft'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create test media asset
    const mediaResult = await db.insert(mediaAssetsTable)
      .values({
        filename: 'test.mp4',
        original_filename: 'original.mp4',
        file_path: '/uploads/test.mp4',
        file_size: '1000000',
        mime_type: 'video/mp4',
        media_type: 'video',
        duration: '60.000',
        width: 1920,
        height: 1080,
        user_id: userId
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    // Create timeline items
    await db.insert(timelineItemsTable)
      .values([
        {
          project_id: projectId,
          media_asset_id: mediaId,
          track_number: 0,
          start_time: '0.000',
          end_time: '10.000',
          media_start_offset: '0.000'
        },
        {
          project_id: projectId,
          media_asset_id: mediaId,
          track_number: 1,
          start_time: '5.000',
          end_time: '15.000',
          media_start_offset: '0.000'
        }
      ])
      .execute();

    const input: DeleteProjectInput = {
      id: projectId
    };

    // Delete the project
    const result = await deleteProject(input);

    expect(result.success).toBe(true);

    // Verify project was deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(0);

    // Verify timeline items were cascade deleted
    const timelineItems = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.project_id, projectId))
      .execute();

    expect(timelineItems).toHaveLength(0);

    // Verify media asset still exists (should not be deleted)
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, mediaId))
      .execute();

    expect(mediaAssets).toHaveLength(1);
  });

  it('should throw error when project does not exist', async () => {
    const input: DeleteProjectInput = {
      id: 999999 // Non-existent project ID
    };

    await expect(deleteProject(input)).rejects.toThrow(/not found/i);
  });

  it('should handle multiple timeline items with different properties', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Complex Project',
        description: 'A project with complex timeline',
        user_id: userId,
        frame_rate: '24.00',
        resolution_width: 3840,
        resolution_height: 2160,
        status: 'in_progress'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create multiple media assets
    const mediaResults = await db.insert(mediaAssetsTable)
      .values([
        {
          filename: 'video.mp4',
          original_filename: 'source_video.mp4',
          file_path: '/uploads/video.mp4',
          file_size: '5000000',
          mime_type: 'video/mp4',
          media_type: 'video',
          duration: '120.000',
          width: 3840,
          height: 2160,
          user_id: userId
        },
        {
          filename: 'audio.mp3',
          original_filename: 'background_music.mp3',
          file_path: '/uploads/audio.mp3',
          file_size: '8000000',
          mime_type: 'audio/mp3',
          media_type: 'audio',
          duration: '180.000',
          user_id: userId
        }
      ])
      .returning()
      .execute();

    const videoId = mediaResults[0].id;
    const audioId = mediaResults[1].id;

    // Create complex timeline items with various properties
    await db.insert(timelineItemsTable)
      .values([
        {
          project_id: projectId,
          media_asset_id: videoId,
          track_number: 0,
          start_time: '0.000',
          end_time: '30.000',
          media_start_offset: '10.000',
          opacity: '1.00',
          position_x: '100.00',
          position_y: '50.00',
          scale: '1.500',
          rotation: '45.00'
        },
        {
          project_id: projectId,
          media_asset_id: audioId,
          track_number: 1,
          start_time: '5.000',
          end_time: '35.000',
          media_start_offset: '0.000',
          volume: '0.80'
        },
        {
          project_id: projectId,
          media_asset_id: videoId,
          track_number: 2,
          start_time: '25.000',
          end_time: '60.000',
          media_start_offset: '20.000',
          opacity: '0.50',
          scale: '0.750'
        }
      ])
      .execute();

    const input: DeleteProjectInput = {
      id: projectId
    };

    // Delete the project
    const result = await deleteProject(input);

    expect(result.success).toBe(true);

    // Verify all timeline items were deleted
    const timelineItems = await db.select()
      .from(timelineItemsTable)
      .where(eq(timelineItemsTable.project_id, projectId))
      .execute();

    expect(timelineItems).toHaveLength(0);

    // Verify media assets still exist
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .execute();

    expect(mediaAssets).toHaveLength(2);
  });

  it('should delete project with no timeline items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create empty project (no timeline items)
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Empty Project',
        user_id: userId,
        frame_rate: '30.00',
        resolution_width: 1920,
        resolution_height: 1080,
        status: 'draft'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    const input: DeleteProjectInput = {
      id: projectId
    };

    // Delete the empty project
    const result = await deleteProject(input);

    expect(result.success).toBe(true);

    // Verify project was deleted
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(0);
  });
});