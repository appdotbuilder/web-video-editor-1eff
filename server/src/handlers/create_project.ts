import { db } from '../db';
import { projectsTable, usersTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // First, verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert project record with proper numeric conversions
    const result = await db.insert(projectsTable)
      .values({
        title: input.title,
        description: input.description || null,
        frame_rate: input.frame_rate.toString(), // Convert number to string for numeric column
        resolution_width: input.resolution_width,
        resolution_height: input.resolution_height,
        user_id: input.user_id
        // status defaults to 'draft', duration defaults to null
        // created_at and updated_at are automatically set
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      frame_rate: parseFloat(project.frame_rate), // Convert string back to number
      duration: project.duration ? parseFloat(project.duration) : null // Handle nullable numeric
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};