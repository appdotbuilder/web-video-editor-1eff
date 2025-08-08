import { z } from 'zod';

// Enum for media asset types
export const mediaTypeEnum = z.enum(['video', 'image', 'audio']);
export type MediaType = z.infer<typeof mediaTypeEnum>;

// Enum for project status
export const projectStatusEnum = z.enum(['draft', 'in_progress', 'completed', 'archived']);
export type ProjectStatus = z.infer<typeof projectStatusEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: projectStatusEnum,
  duration: z.number().nullable(), // Duration in seconds
  frame_rate: z.number(), // Frames per second
  resolution_width: z.number().int(),
  resolution_height: z.number().int(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Media asset schema
export const mediaAssetSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number(), // Size in bytes
  mime_type: z.string(),
  media_type: mediaTypeEnum,
  duration: z.number().nullable(), // Duration in seconds for video/audio
  width: z.number().int().nullable(), // Width for images/videos
  height: z.number().int().nullable(), // Height for images/videos
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

// Timeline item schema (represents media on the project timeline)
export const timelineItemSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  media_asset_id: z.number(),
  track_number: z.number().int(), // Which track/layer the item is on
  start_time: z.number(), // Start time on timeline in seconds
  end_time: z.number(), // End time on timeline in seconds
  media_start_offset: z.number(), // Start offset within the media file
  volume: z.number().min(0).max(1).nullable(), // Volume level for audio/video (0-1)
  opacity: z.number().min(0).max(1).nullable(), // Opacity for video/images (0-1)
  position_x: z.number().nullable(), // X position for positioning
  position_y: z.number().nullable(), // Y position for positioning
  scale: z.number().positive().nullable(), // Scale factor
  rotation: z.number().nullable(), // Rotation in degrees
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimelineItem = z.infer<typeof timelineItemSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  username: z.string().min(1),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createProjectInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  frame_rate: z.number().positive().default(30),
  resolution_width: z.number().int().positive().default(1920),
  resolution_height: z.number().int().positive().default(1080),
  user_id: z.number()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const createMediaAssetInputSchema = z.object({
  filename: z.string().min(1),
  original_filename: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  mime_type: z.string().min(1),
  media_type: mediaTypeEnum,
  duration: z.number().positive().nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  user_id: z.number()
});

export type CreateMediaAssetInput = z.infer<typeof createMediaAssetInputSchema>;

export const createTimelineItemInputSchema = z.object({
  project_id: z.number(),
  media_asset_id: z.number(),
  track_number: z.number().int().nonnegative(),
  start_time: z.number().nonnegative(),
  end_time: z.number().positive(),
  media_start_offset: z.number().nonnegative().default(0),
  volume: z.number().min(0).max(1).nullable().optional(),
  opacity: z.number().min(0).max(1).nullable().optional(),
  position_x: z.number().nullable().optional(),
  position_y: z.number().nullable().optional(),
  scale: z.number().positive().nullable().optional(),
  rotation: z.number().nullable().optional()
}).refine(data => data.end_time > data.start_time, {
  message: "End time must be greater than start time",
  path: ["end_time"]
});

export type CreateTimelineItemInput = z.infer<typeof createTimelineItemInputSchema>;

// Input schemas for updating records
export const updateProjectInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: projectStatusEnum.optional(),
  duration: z.number().nullable().optional(),
  frame_rate: z.number().positive().optional(),
  resolution_width: z.number().int().positive().optional(),
  resolution_height: z.number().int().positive().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const updateTimelineItemInputSchema = z.object({
  id: z.number(),
  track_number: z.number().int().nonnegative().optional(),
  start_time: z.number().nonnegative().optional(),
  end_time: z.number().positive().optional(),
  media_start_offset: z.number().nonnegative().optional(),
  volume: z.number().min(0).max(1).nullable().optional(),
  opacity: z.number().min(0).max(1).nullable().optional(),
  position_x: z.number().nullable().optional(),
  position_y: z.number().nullable().optional(),
  scale: z.number().positive().nullable().optional(),
  rotation: z.number().nullable().optional()
});

export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemInputSchema>;

// Query parameter schemas
export const getProjectsByUserInputSchema = z.object({
  user_id: z.number()
});

export type GetProjectsByUserInput = z.infer<typeof getProjectsByUserInputSchema>;

export const getMediaAssetsByUserInputSchema = z.object({
  user_id: z.number(),
  media_type: mediaTypeEnum.optional()
});

export type GetMediaAssetsByUserInput = z.infer<typeof getMediaAssetsByUserInputSchema>;

export const getTimelineItemsByProjectInputSchema = z.object({
  project_id: z.number()
});

export type GetTimelineItemsByProjectInput = z.infer<typeof getTimelineItemsByProjectInputSchema>;

export const deleteProjectInputSchema = z.object({
  id: z.number()
});

export type DeleteProjectInput = z.infer<typeof deleteProjectInputSchema>;

export const deleteMediaAssetInputSchema = z.object({
  id: z.number()
});

export type DeleteMediaAssetInput = z.infer<typeof deleteMediaAssetInputSchema>;

export const deleteTimelineItemInputSchema = z.object({
  id: z.number()
});

export type DeleteTimelineItemInput = z.infer<typeof deleteTimelineItemInputSchema>;