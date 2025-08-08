import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create users with unique usernames', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same username
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testuser', // Same username
      email: 'different@example.com' // Different email
    };

    await expect(createUser(duplicateUsernameInput))
      .rejects.toThrow(/unique/i);
  });

  it('should create users with unique emails', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'test@example.com' // Same email
    };

    await expect(createUser(duplicateEmailInput))
      .rejects.toThrow(/unique/i);
  });

  it('should create multiple users with unique credentials', async () => {
    const user1Input: CreateUserInput = {
      username: 'user1',
      email: 'user1@example.com'
    };

    const user2Input: CreateUserInput = {
      username: 'user2',
      email: 'user2@example.com'
    };

    // Create both users
    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    // Verify both exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);

    // Verify unique IDs
    expect(user1.id).not.toEqual(user2.id);

    // Verify correct data
    const storedUsers = allUsers.sort((a, b) => a.id - b.id);
    expect(storedUsers[0].username).toEqual('user1');
    expect(storedUsers[0].email).toEqual('user1@example.com');
    expect(storedUsers[1].username).toEqual('user2');
    expect(storedUsers[1].email).toEqual('user2@example.com');
  });

  it('should handle special characters in username and email', async () => {
    const specialInput: CreateUserInput = {
      username: 'test_user-123',
      email: 'test.email+tag@sub-domain.example.co.uk'
    };

    const result = await createUser(specialInput);

    expect(result.username).toEqual('test_user-123');
    expect(result.email).toEqual('test.email+tag@sub-domain.example.co.uk');

    // Verify it's persisted correctly
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].username).toEqual('test_user-123');
    expect(users[0].email).toEqual('test.email+tag@sub-domain.example.co.uk');
  });
});