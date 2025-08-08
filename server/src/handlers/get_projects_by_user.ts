import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type GetProjectsByUserInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectsByUser = async (input: GetProjectsByUserInput): Promise<Project[]> => {
  try {
    // Query projects for the specific user
    const results = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.user_id, input.user_id))
      .execute();

    // Convert numeric fields back to numbers for proper typing
    return results.map(project => ({
      ...project,
      duration: project.duration ? parseFloat(project.duration) : null,
      frame_rate: parseFloat(project.frame_rate)
    }));
  } catch (error) {
    console.error('Failed to fetch projects by user:', error);
    throw error;
  }
};