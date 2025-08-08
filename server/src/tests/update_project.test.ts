import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable } from '../db/schema';
import { type UpdateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  let testUserId: number;
  let testProjectId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        title: 'Original Project',
        description: 'Original description',
        status: 'draft',
        duration: '120.500',
        frame_rate: '24.00',
        resolution_width: 1280,
        resolution_height: 720,
        user_id: testUserId
      })
      .returning()
      .execute();

    testProjectId = projectResult[0].id;
  });

  afterEach(resetDB);

  it('should update project title only', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      title: 'Updated Project Title'
    };

    const result = await updateProject(input);

    expect(result.id).toBe(testProjectId);
    expect(result.title).toBe('Updated Project Title');
    expect(result.description).toBe('Original description'); // Should remain unchanged
    expect(result.status).toBe('draft'); // Should remain unchanged
    expect(result.duration).toBe(120.5); // Should remain unchanged
    expect(result.frame_rate).toBe(24);
    expect(result.resolution_width).toBe(1280);
    expect(result.resolution_height).toBe(720);
    expect(result.user_id).toBe(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple project fields', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      title: 'New Title',
      description: 'New description',
      status: 'in_progress',
      duration: 180.750,
      frame_rate: 30,
      resolution_width: 1920,
      resolution_height: 1080
    };

    const result = await updateProject(input);

    expect(result.id).toBe(testProjectId);
    expect(result.title).toBe('New Title');
    expect(result.description).toBe('New description');
    expect(result.status).toBe('in_progress');
    expect(result.duration).toBe(180.75);
    expect(typeof result.duration).toBe('number');
    expect(result.frame_rate).toBe(30);
    expect(typeof result.frame_rate).toBe('number');
    expect(result.resolution_width).toBe(1920);
    expect(result.resolution_height).toBe(1080);
    expect(result.user_id).toBe(testUserId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when provided', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      description: null
    };

    const result = await updateProject(input);

    expect(result.id).toBe(testProjectId);
    expect(result.description).toBeNull();
    expect(result.title).toBe('Original Project'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set duration to null when provided', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      duration: null
    };

    const result = await updateProject(input);

    expect(result.id).toBe(testProjectId);
    expect(result.duration).toBeNull();
    expect(result.title).toBe('Original Project'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update project status', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      status: 'completed'
    };

    const result = await updateProject(input);

    expect(result.id).toBe(testProjectId);
    expect(result.status).toBe('completed');
    expect(result.title).toBe('Original Project'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      title: 'Database Updated Title',
      status: 'archived',
      frame_rate: 60
    };

    await updateProject(input);

    // Query the database directly to verify changes
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].title).toBe('Database Updated Title');
    expect(projects[0].status).toBe('archived');
    expect(parseFloat(projects[0].frame_rate)).toBe(60);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent project', async () => {
    const input: UpdateProjectInput = {
      id: 99999,
      title: 'This should fail'
    };

    await expect(updateProject(input)).rejects.toThrow(/Project with id 99999 not found/i);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    const originalTimestamp = originalProject[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateProjectInput = {
      id: testProjectId,
      title: 'Updated for timestamp test'
    };

    const result = await updateProject(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should handle fractional frame rates correctly', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      frame_rate: 23.976
    };

    const result = await updateProject(input);

    // Database rounds to 2 decimal places due to numeric(5, 2) precision
    expect(result.frame_rate).toBe(23.98);
    expect(typeof result.frame_rate).toBe('number');

    // Verify in database - should be rounded to 2 decimal places
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    expect(parseFloat(projects[0].frame_rate)).toBe(23.98);
  });

  it('should handle fractional duration correctly', async () => {
    const input: UpdateProjectInput = {
      id: testProjectId,
      duration: 456.789
    };

    const result = await updateProject(input);

    expect(result.duration).toBe(456.789);
    expect(typeof result.duration).toBe('number');

    // Verify in database
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProjectId))
      .execute();

    expect(parseFloat(projects[0].duration!)).toBeCloseTo(456.789, 3);
  });
});