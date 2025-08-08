import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable } from '../db/schema';
import { type GetProjectsByUserInput } from '../schema';
import { getProjectsByUser } from '../handlers/get_projects_by_user';
import { eq } from 'drizzle-orm';

describe('getProjectsByUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return projects for a specific user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create test projects for the user
    await db.insert(projectsTable)
      .values([
        {
          title: 'Project 1',
          description: 'First test project',
          status: 'draft',
          frame_rate: '24.00',
          resolution_width: 1920,
          resolution_height: 1080,
          user_id: user.id
        },
        {
          title: 'Project 2',
          description: 'Second test project',
          status: 'in_progress',
          duration: '120.500',
          frame_rate: '30.00',
          resolution_width: 3840,
          resolution_height: 2160,
          user_id: user.id
        }
      ])
      .execute();

    const input: GetProjectsByUserInput = {
      user_id: user.id
    };

    const result = await getProjectsByUser(input);

    // Should return 2 projects
    expect(result).toHaveLength(2);
    
    // Check first project
    const project1 = result.find(p => p.title === 'Project 1');
    expect(project1).toBeDefined();
    expect(project1!.description).toEqual('First test project');
    expect(project1!.status).toEqual('draft');
    expect(project1!.frame_rate).toEqual(24);
    expect(typeof project1!.frame_rate).toBe('number');
    expect(project1!.resolution_width).toEqual(1920);
    expect(project1!.resolution_height).toEqual(1080);
    expect(project1!.duration).toBeNull();
    expect(project1!.user_id).toEqual(user.id);
    expect(project1!.created_at).toBeInstanceOf(Date);
    expect(project1!.updated_at).toBeInstanceOf(Date);

    // Check second project
    const project2 = result.find(p => p.title === 'Project 2');
    expect(project2).toBeDefined();
    expect(project2!.description).toEqual('Second test project');
    expect(project2!.status).toEqual('in_progress');
    expect(project2!.duration).toEqual(120.5);
    expect(typeof project2!.duration).toBe('number');
    expect(project2!.frame_rate).toEqual(30);
    expect(typeof project2!.frame_rate).toBe('number');
    expect(project2!.resolution_width).toEqual(3840);
    expect(project2!.resolution_height).toEqual(2160);
    expect(project2!.user_id).toEqual(user.id);
  });

  it('should return empty array for user with no projects', async () => {
    // Create test user without projects
    const userResult = await db.insert(usersTable)
      .values({
        username: 'emptyuser',
        email: 'empty@example.com'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    const input: GetProjectsByUserInput = {
      user_id: user.id
    };

    const result = await getProjectsByUser(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetProjectsByUserInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getProjectsByUser(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return projects for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];

    // Create projects for both users
    await db.insert(projectsTable)
      .values([
        {
          title: 'User 1 Project',
          description: 'Project for user 1',
          status: 'draft',
          frame_rate: '24.00',
          user_id: user1.id
        },
        {
          title: 'User 2 Project A',
          description: 'First project for user 2',
          status: 'completed',
          frame_rate: '30.00',
          user_id: user2.id
        },
        {
          title: 'User 2 Project B',
          description: 'Second project for user 2',
          status: 'archived',
          frame_rate: '60.00',
          user_id: user2.id
        }
      ])
      .execute();

    // Query projects for user 1
    const input1: GetProjectsByUserInput = {
      user_id: user1.id
    };

    const result1 = await getProjectsByUser(input1);
    expect(result1).toHaveLength(1);
    expect(result1[0].title).toEqual('User 1 Project');
    expect(result1[0].user_id).toEqual(user1.id);

    // Query projects for user 2
    const input2: GetProjectsByUserInput = {
      user_id: user2.id
    };

    const result2 = await getProjectsByUser(input2);
    expect(result2).toHaveLength(2);
    expect(result2.every(p => p.user_id === user2.id)).toBe(true);
    
    const titles = result2.map(p => p.title).sort();
    expect(titles).toEqual(['User 2 Project A', 'User 2 Project B']);
  });

  it('should handle all project statuses correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'statususer',
        email: 'status@example.com'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create projects with all different statuses
    await db.insert(projectsTable)
      .values([
        {
          title: 'Draft Project',
          status: 'draft',
          frame_rate: '24.00',
          user_id: user.id
        },
        {
          title: 'In Progress Project',
          status: 'in_progress',
          frame_rate: '30.00',
          user_id: user.id
        },
        {
          title: 'Completed Project',
          status: 'completed',
          frame_rate: '60.00',
          user_id: user.id
        },
        {
          title: 'Archived Project',
          status: 'archived',
          frame_rate: '25.00',
          user_id: user.id
        }
      ])
      .execute();

    const input: GetProjectsByUserInput = {
      user_id: user.id
    };

    const result = await getProjectsByUser(input);

    expect(result).toHaveLength(4);
    
    const statuses = result.map(p => p.status).sort();
    expect(statuses).toEqual(['archived', 'completed', 'draft', 'in_progress']);
    
    // Verify each project has correct status
    expect(result.find(p => p.title === 'Draft Project')?.status).toEqual('draft');
    expect(result.find(p => p.title === 'In Progress Project')?.status).toEqual('in_progress');
    expect(result.find(p => p.title === 'Completed Project')?.status).toEqual('completed');
    expect(result.find(p => p.title === 'Archived Project')?.status).toEqual('archived');
  });

  it('should correctly convert numeric fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'numericuser',
        email: 'numeric@example.com'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create project with various numeric values
    await db.insert(projectsTable)
      .values({
        title: 'Numeric Test Project',
        duration: '1234.567',
        frame_rate: '29.97',
        resolution_width: 1920,
        resolution_height: 1080,
        user_id: user.id
      })
      .execute();

    const input: GetProjectsByUserInput = {
      user_id: user.id
    };

    const result = await getProjectsByUser(input);

    expect(result).toHaveLength(1);
    const project = result[0];
    
    // Verify numeric conversions
    expect(typeof project.duration).toBe('number');
    expect(project.duration).toEqual(1234.567);
    expect(typeof project.frame_rate).toBe('number');
    expect(project.frame_rate).toEqual(29.97);
    
    // Integer fields should remain integers
    expect(typeof project.resolution_width).toBe('number');
    expect(project.resolution_width).toEqual(1920);
    expect(typeof project.resolution_height).toBe('number');
    expect(project.resolution_height).toEqual(1080);
  });
});