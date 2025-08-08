import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { mediaAssetsTable, usersTable } from '../db/schema';
import { type CreateMediaAssetInput } from '../schema';
import { createMediaAsset } from '../handlers/create_media_asset';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com'
};

// Base test input for video media asset
const testVideoInput: CreateMediaAssetInput = {
  filename: 'test_video.mp4',
  original_filename: 'My Test Video.mp4',
  file_path: '/uploads/media/test_video.mp4',
  file_size: 1024000, // 1MB
  mime_type: 'video/mp4',
  media_type: 'video',
  duration: 120.5, // 2 minutes and 30 seconds
  width: 1920,
  height: 1080,
  user_id: 1
};

// Test input for image media asset
const testImageInput: CreateMediaAssetInput = {
  filename: 'test_image.jpg',
  original_filename: 'My Test Image.jpg',
  file_path: '/uploads/media/test_image.jpg',
  file_size: 512000, // 512KB
  mime_type: 'image/jpeg',
  media_type: 'image',
  duration: null,
  width: 800,
  height: 600,
  user_id: 1
};

// Test input for audio media asset
const testAudioInput: CreateMediaAssetInput = {
  filename: 'test_audio.mp3',
  original_filename: 'My Test Audio.mp3',
  file_path: '/uploads/media/test_audio.mp3',
  file_size: 256000, // 256KB
  mime_type: 'audio/mpeg',
  media_type: 'audio',
  duration: 180.25, // 3 minutes
  width: null,
  height: null,
  user_id: 1
};

describe('createMediaAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    return result[0];
  };

  it('should create a video media asset', async () => {
    const user = await createTestUser();
    const input = { ...testVideoInput, user_id: user.id };

    const result = await createMediaAsset(input);

    // Basic field validation
    expect(result.filename).toEqual('test_video.mp4');
    expect(result.original_filename).toEqual('My Test Video.mp4');
    expect(result.file_path).toEqual('/uploads/media/test_video.mp4');
    expect(result.file_size).toEqual(1024000);
    expect(typeof result.file_size).toEqual('number');
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.media_type).toEqual('video');
    expect(result.duration).toEqual(120.5);
    expect(typeof result.duration).toEqual('number');
    expect(result.width).toEqual(1920);
    expect(result.height).toEqual(1080);
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an image media asset', async () => {
    const user = await createTestUser();
    const input = { ...testImageInput, user_id: user.id };

    const result = await createMediaAsset(input);

    expect(result.filename).toEqual('test_image.jpg');
    expect(result.original_filename).toEqual('My Test Image.jpg');
    expect(result.media_type).toEqual('image');
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.duration).toBeNull();
    expect(result.width).toEqual(800);
    expect(result.height).toEqual(600);
    expect(result.file_size).toEqual(512000);
    expect(typeof result.file_size).toEqual('number');
  });

  it('should create an audio media asset', async () => {
    const user = await createTestUser();
    const input = { ...testAudioInput, user_id: user.id };

    const result = await createMediaAsset(input);

    expect(result.filename).toEqual('test_audio.mp3');
    expect(result.original_filename).toEqual('My Test Audio.mp3');
    expect(result.media_type).toEqual('audio');
    expect(result.mime_type).toEqual('audio/mpeg');
    expect(result.duration).toEqual(180.25);
    expect(typeof result.duration).toEqual('number');
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.file_size).toEqual(256000);
    expect(typeof result.file_size).toEqual('number');
  });

  it('should save media asset to database', async () => {
    const user = await createTestUser();
    const input = { ...testVideoInput, user_id: user.id };

    const result = await createMediaAsset(input);

    // Query using proper drizzle syntax
    const mediaAssets = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, result.id))
      .execute();

    expect(mediaAssets).toHaveLength(1);
    const savedAsset = mediaAssets[0];
    
    expect(savedAsset.filename).toEqual('test_video.mp4');
    expect(savedAsset.original_filename).toEqual('My Test Video.mp4');
    expect(savedAsset.file_path).toEqual('/uploads/media/test_video.mp4');
    expect(parseFloat(savedAsset.file_size)).toEqual(1024000);
    expect(savedAsset.mime_type).toEqual('video/mp4');
    expect(savedAsset.media_type).toEqual('video');
    expect(parseFloat(savedAsset.duration!)).toEqual(120.5);
    expect(savedAsset.width).toEqual(1920);
    expect(savedAsset.height).toEqual(1080);
    expect(savedAsset.user_id).toEqual(user.id);
    expect(savedAsset.created_at).toBeInstanceOf(Date);
    expect(savedAsset.updated_at).toBeInstanceOf(Date);
  });

  it('should handle media asset without dimensions', async () => {
    const user = await createTestUser();
    const input: CreateMediaAssetInput = {
      filename: 'document.pdf',
      original_filename: 'My Document.pdf',
      file_path: '/uploads/media/document.pdf',
      file_size: 102400,
      mime_type: 'application/pdf',
      media_type: 'image', // Treating as image for test purposes
      duration: null,
      width: null,
      height: null,
      user_id: user.id
    };

    const result = await createMediaAsset(input);

    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.file_size).toEqual(102400);
    expect(typeof result.file_size).toEqual('number');
  });

  it('should handle media asset without duration', async () => {
    const user = await createTestUser();
    const input: CreateMediaAssetInput = {
      ...testImageInput,
      user_id: user.id,
      duration: undefined // Test with undefined duration
    };

    const result = await createMediaAsset(input);

    expect(result.duration).toBeNull();
    expect(result.width).toEqual(800);
    expect(result.height).toEqual(600);
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testVideoInput, user_id: 999 }; // Non-existent user

    await expect(createMediaAsset(input)).rejects.toThrow(/User with id 999 does not exist/i);
  });

  it('should handle large file sizes correctly', async () => {
    const user = await createTestUser();
    const input: CreateMediaAssetInput = {
      ...testVideoInput,
      user_id: user.id,
      file_size: 5000000000 // 5GB
    };

    const result = await createMediaAsset(input);

    expect(result.file_size).toEqual(5000000000);
    expect(typeof result.file_size).toEqual('number');

    // Verify it's stored correctly in database
    const savedAsset = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, result.id))
      .execute();

    expect(parseFloat(savedAsset[0].file_size)).toEqual(5000000000);
  });

  it('should handle fractional durations correctly', async () => {
    const user = await createTestUser();
    const input: CreateMediaAssetInput = {
      ...testVideoInput,
      user_id: user.id,
      duration: 123.456 // Precision that works with numeric(10, 3)
    };

    const result = await createMediaAsset(input);

    expect(result.duration).toEqual(123.456);
    expect(typeof result.duration).toEqual('number');

    // Verify it's stored correctly in database
    const savedAsset = await db.select()
      .from(mediaAssetsTable)
      .where(eq(mediaAssetsTable.id, result.id))
      .execute();

    expect(parseFloat(savedAsset[0].duration!)).toEqual(123.456);
  });
});