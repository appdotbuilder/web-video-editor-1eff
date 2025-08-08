import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // First, check if the project exists
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.id))
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateFields: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateFields.title = input.title;
    }

    if (input.description !== undefined) {
      updateFields.description = input.description;
    }

    if (input.status !== undefined) {
      updateFields.status = input.status;
    }

    if (input.duration !== undefined) {
      updateFields.duration = input.duration?.toString() || null;
    }

    if (input.frame_rate !== undefined) {
      updateFields.frame_rate = input.frame_rate.toString();
    }

    if (input.resolution_width !== undefined) {
      updateFields.resolution_width = input.resolution_width;
    }

    if (input.resolution_height !== undefined) {
      updateFields.resolution_height = input.resolution_height;
    }

    // Update the project
    const result = await db.update(projectsTable)
      .set(updateFields)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      duration: project.duration ? parseFloat(project.duration) : null,
      frame_rate: parseFloat(project.frame_rate)
    };
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};