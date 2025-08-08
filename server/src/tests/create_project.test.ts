import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, usersTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      username: 'testuser',
      email: 'test@example.com'
    })
    .returning()
    .execute();
  return result[0];
};

// Test input with all required fields
const createTestInput = (userId: number): CreateProjectInput => ({
  title: 'Test Project',
  description: 'A test video editing project',
  frame_rate: 24,
  resolution_width: 1280,
  resolution_height: 720,
  user_id: userId
});

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project with all fields', async () => {
    // Create prerequisite user
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await createProject(input);

    // Verify all fields are correctly set
    expect(result.title).toEqual('Test Project');
    expect(result.description).toEqual('A test video editing project');
    expect(result.status).toEqual('draft');
    expect(result.duration).toBeNull(); // Should be null initially
    expect(result.frame_rate).toEqual(24);
    expect(typeof result.frame_rate).toEqual('number'); // Verify numeric conversion
    expect(result.resolution_width).toEqual(1280);
    expect(result.resolution_height).toEqual(720);
    expect(result.user_id).toEqual(user.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a project with default values', async () => {
    const user = await createTestUser();
    const input: CreateProjectInput = {
      title: 'Minimal Project',
      user_id: user.id,
      frame_rate: 30, // Zod default applied
      resolution_width: 1920, // Zod default applied
      resolution_height: 1080 // Zod default applied
    };

    const result = await createProject(input);

    expect(result.title).toEqual('Minimal Project');
    expect(result.description).toBeNull(); // Should be null when not provided
    expect(result.frame_rate).toEqual(30);
    expect(result.resolution_width).toEqual(1920);
    expect(result.resolution_height).toEqual(1080);
    expect(result.status).toEqual('draft'); // Database default
  });

  it('should save project to database correctly', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await createProject(input);

    // Query the database to verify the project was saved
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    const savedProject = projects[0];
    
    expect(savedProject.title).toEqual('Test Project');
    expect(savedProject.description).toEqual('A test video editing project');
    expect(savedProject.status).toEqual('draft');
    expect(savedProject.duration).toBeNull();
    expect(parseFloat(savedProject.frame_rate)).toEqual(24); // Verify database storage as string
    expect(savedProject.resolution_width).toEqual(1280);
    expect(savedProject.resolution_height).toEqual(720);
    expect(savedProject.user_id).toEqual(user.id);
    expect(savedProject.created_at).toBeInstanceOf(Date);
    expect(savedProject.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const user = await createTestUser();
    const input: CreateProjectInput = {
      title: 'Project with null description',
      description: null,
      frame_rate: 30,
      resolution_width: 1920,
      resolution_height: 1080,
      user_id: user.id
    };

    const result = await createProject(input);

    expect(result.description).toBeNull();

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].description).toBeNull();
  });

  it('should throw error when user does not exist', async () => {
    const input = createTestInput(999); // Non-existent user ID

    await expect(createProject(input)).rejects.toThrow(/User with id 999 does not exist/i);
  });

  it('should handle different frame rates correctly', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);
    input.frame_rate = 60;

    const result = await createProject(input);

    expect(result.frame_rate).toEqual(60);
    expect(typeof result.frame_rate).toEqual('number');

    // Verify database storage
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(parseFloat(projects[0].frame_rate)).toEqual(60);
  });

  it('should handle different resolutions correctly', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);
    input.resolution_width = 3840;
    input.resolution_height = 2160;

    const result = await createProject(input);

    expect(result.resolution_width).toEqual(3840);
    expect(result.resolution_height).toEqual(2160);

    // Verify database storage
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects[0].resolution_width).toEqual(3840);
    expect(projects[0].resolution_height).toEqual(2160);
  });
});