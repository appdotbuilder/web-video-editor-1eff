import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, mediaAssetsTable } from '../db/schema';
import { type GetMediaAssetsByUserInput } from '../schema';
import { getMediaAssetsByUser } from '../handlers/get_media_assets_by_user';

// Test setup data
const testUser1 = {
  username: 'testuser1',
  email: 'user1@example.com'
};

const testUser2 = {
  username: 'testuser2', 
  email: 'user2@example.com'
};

const testVideoAsset = {
  filename: 'video1.mp4',
  original_filename: 'My Video.mp4',
  file_path: '/uploads/video1.mp4',
  file_size: '52428800', // 50MB as string for numeric column
  mime_type: 'video/mp4',
  media_type: 'video' as const,
  duration: '120.500', // 2 minutes as string for numeric column
  width: 1920,
  height: 1080
};

const testImageAsset = {
  filename: 'image1.jpg',
  original_filename: 'My Image.jpg', 
  file_path: '/uploads/image1.jpg',
  file_size: '2097152', // 2MB as string
  mime_type: 'image/jpeg',
  media_type: 'image' as const,
  duration: null,
  width: 1920,
  height: 1080
};

const testAudioAsset = {
  filename: 'audio1.mp3',
  original_filename: 'My Audio.mp3',
  file_path: '/uploads/audio1.mp3',
  file_size: '8388608', // 8MB as string
  mime_type: 'audio/mpeg',
  media_type: 'audio' as const,
  duration: '180.750', // 3 minutes as string
  width: null,
  height: null
};

describe('getMediaAssetsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no media assets', async () => {
    // Create user but no media assets
    const userResult = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user = userResult[0];
    
    const input: GetMediaAssetsByUserInput = {
      user_id: user.id
    };

    const result = await getMediaAssetsByUser(input);

    expect(result).toEqual([]);
  });

  it('should return all media assets for a user', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create multiple media assets for the user
    await db.insert(mediaAssetsTable)
      .values([
        { ...testVideoAsset, user_id: user.id },
        { ...testImageAsset, user_id: user.id },
        { ...testAudioAsset, user_id: user.id }
      ])
      .execute();

    const input: GetMediaAssetsByUserInput = {
      user_id: user.id
    };

    const result = await getMediaAssetsByUser(input);

    expect(result).toHaveLength(3);
    
    // Check that numeric fields are converted correctly
    const videoAsset = result.find(asset => asset.media_type === 'video');
    expect(videoAsset).toBeDefined();
    expect(typeof videoAsset!.file_size).toBe('number');
    expect(videoAsset!.file_size).toBe(52428800);
    expect(typeof videoAsset!.duration).toBe('number');
    expect(videoAsset!.duration).toBe(120.5);
    expect(videoAsset!.filename).toBe('video1.mp4');
    expect(videoAsset!.original_filename).toBe('My Video.mp4');
    expect(videoAsset!.mime_type).toBe('video/mp4');
    expect(videoAsset!.width).toBe(1920);
    expect(videoAsset!.height).toBe(1080);
    expect(videoAsset!.user_id).toBe(user.id);
    expect(videoAsset!.created_at).toBeInstanceOf(Date);
    expect(videoAsset!.updated_at).toBeInstanceOf(Date);

    const imageAsset = result.find(asset => asset.media_type === 'image');
    expect(imageAsset).toBeDefined();
    expect(typeof imageAsset!.file_size).toBe('number');
    expect(imageAsset!.file_size).toBe(2097152);
    expect(imageAsset!.duration).toBe(null);
    expect(imageAsset!.filename).toBe('image1.jpg');

    const audioAsset = result.find(asset => asset.media_type === 'audio');
    expect(audioAsset).toBeDefined();
    expect(typeof audioAsset!.file_size).toBe('number');
    expect(audioAsset!.file_size).toBe(8388608);
    expect(typeof audioAsset!.duration).toBe('number');
    expect(audioAsset!.duration).toBe(180.75);
    expect(audioAsset!.width).toBe(null);
    expect(audioAsset!.height).toBe(null);
  });

  it('should filter media assets by media type', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create multiple media assets for the user
    await db.insert(mediaAssetsTable)
      .values([
        { ...testVideoAsset, user_id: user.id },
        { ...testImageAsset, user_id: user.id },
        { ...testAudioAsset, user_id: user.id }
      ])
      .execute();

    // Test filtering by video type
    const videoInput: GetMediaAssetsByUserInput = {
      user_id: user.id,
      media_type: 'video'
    };

    const videoResults = await getMediaAssetsByUser(videoInput);
    expect(videoResults).toHaveLength(1);
    expect(videoResults[0].media_type).toBe('video');
    expect(videoResults[0].filename).toBe('video1.mp4');

    // Test filtering by image type
    const imageInput: GetMediaAssetsByUserInput = {
      user_id: user.id,
      media_type: 'image'
    };

    const imageResults = await getMediaAssetsByUser(imageInput);
    expect(imageResults).toHaveLength(1);
    expect(imageResults[0].media_type).toBe('image');
    expect(imageResults[0].filename).toBe('image1.jpg');

    // Test filtering by audio type
    const audioInput: GetMediaAssetsByUserInput = {
      user_id: user.id,
      media_type: 'audio'
    };

    const audioResults = await getMediaAssetsByUser(audioInput);
    expect(audioResults).toHaveLength(1);
    expect(audioResults[0].media_type).toBe('audio');
    expect(audioResults[0].filename).toBe('audio1.mp3');
  });

  it('should only return media assets for the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();
    
    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create media assets for both users
    await db.insert(mediaAssetsTable)
      .values([
        { ...testVideoAsset, user_id: user1.id },
        { ...testImageAsset, user_id: user1.id },
        { ...testAudioAsset, user_id: user2.id }
      ])
      .execute();

    // Get assets for user1
    const user1Input: GetMediaAssetsByUserInput = {
      user_id: user1.id
    };

    const user1Results = await getMediaAssetsByUser(user1Input);
    expect(user1Results).toHaveLength(2);
    expect(user1Results.every(asset => asset.user_id === user1.id)).toBe(true);
    expect(user1Results.some(asset => asset.media_type === 'video')).toBe(true);
    expect(user1Results.some(asset => asset.media_type === 'image')).toBe(true);
    expect(user1Results.some(asset => asset.media_type === 'audio')).toBe(false);

    // Get assets for user2
    const user2Input: GetMediaAssetsByUserInput = {
      user_id: user2.id
    };

    const user2Results = await getMediaAssetsByUser(user2Input);
    expect(user2Results).toHaveLength(1);
    expect(user2Results[0].user_id).toBe(user2.id);
    expect(user2Results[0].media_type).toBe('audio');
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetMediaAssetsByUserInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getMediaAssetsByUser(input);
    expect(result).toEqual([]);
  });

  it('should return empty array when filtering by media type with no matching assets', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create only video assets
    await db.insert(mediaAssetsTable)
      .values([
        { ...testVideoAsset, user_id: user.id }
      ])
      .execute();

    // Filter by image type (which doesn't exist)
    const input: GetMediaAssetsByUserInput = {
      user_id: user.id,
      media_type: 'image'
    };

    const result = await getMediaAssetsByUser(input);
    expect(result).toEqual([]);
  });
});