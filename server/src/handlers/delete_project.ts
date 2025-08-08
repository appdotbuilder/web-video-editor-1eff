import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type DeleteProjectInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteProject(input: DeleteProjectInput): Promise<{ success: boolean }> {
  try {
    // Delete the project - timeline items will be automatically deleted due to cascade
    const result = await db.delete(projectsTable)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    // Check if project was found and deleted
    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Project deletion failed:', error);
    throw error;
  }
}