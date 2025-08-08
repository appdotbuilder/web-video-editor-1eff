import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions
export const mediaTypeEnum = pgEnum('media_type', ['video', 'image', 'audio']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'in_progress', 'completed', 'archived']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  status: projectStatusEnum('status').notNull().default('draft'),
  duration: numeric('duration', { precision: 10, scale: 3 }), // Duration in seconds, nullable
  frame_rate: numeric('frame_rate', { precision: 5, scale: 2 }).notNull().default('30.00'), // Frames per second
  resolution_width: integer('resolution_width').notNull().default(1920),
  resolution_height: integer('resolution_height').notNull().default(1080),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Media assets table
export const mediaAssetsTable = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  original_filename: text('original_filename').notNull(),
  file_path: text('file_path').notNull(),
  file_size: numeric('file_size', { precision: 15, scale: 0 }).notNull(), // Size in bytes
  mime_type: text('mime_type').notNull(),
  media_type: mediaTypeEnum('media_type').notNull(),
  duration: numeric('duration', { precision: 10, scale: 3 }), // Duration in seconds for video/audio, nullable
  width: integer('width'), // Width for images/videos, nullable
  height: integer('height'), // Height for images/videos, nullable
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Timeline items table (represents media on the project timeline)
export const timelineItemsTable = pgTable('timeline_items', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => projectsTable.id, { onDelete: 'cascade' }),
  media_asset_id: integer('media_asset_id').notNull().references(() => mediaAssetsTable.id, { onDelete: 'cascade' }),
  track_number: integer('track_number').notNull(), // Which track/layer the item is on
  start_time: numeric('start_time', { precision: 10, scale: 3 }).notNull(), // Start time on timeline in seconds
  end_time: numeric('end_time', { precision: 10, scale: 3 }).notNull(), // End time on timeline in seconds
  media_start_offset: numeric('media_start_offset', { precision: 10, scale: 3 }).notNull().default('0.000'), // Start offset within the media file
  volume: numeric('volume', { precision: 3, scale: 2 }), // Volume level for audio/video (0-1), nullable
  opacity: numeric('opacity', { precision: 3, scale: 2 }), // Opacity for video/images (0-1), nullable
  position_x: numeric('position_x', { precision: 10, scale: 2 }), // X position for positioning, nullable
  position_y: numeric('position_y', { precision: 10, scale: 2 }), // Y position for positioning, nullable
  scale: numeric('scale', { precision: 5, scale: 3 }), // Scale factor, nullable
  rotation: numeric('rotation', { precision: 6, scale: 2 }), // Rotation in degrees, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  projects: many(projectsTable),
  mediaAssets: many(mediaAssetsTable)
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [projectsTable.user_id],
    references: [usersTable.id]
  }),
  timelineItems: many(timelineItemsTable)
}));

export const mediaAssetsRelations = relations(mediaAssetsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [mediaAssetsTable.user_id],
    references: [usersTable.id]
  }),
  timelineItems: many(timelineItemsTable)
}));

export const timelineItemsRelations = relations(timelineItemsTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [timelineItemsTable.project_id],
    references: [projectsTable.id]
  }),
  mediaAsset: one(mediaAssetsTable, {
    fields: [timelineItemsTable.media_asset_id],
    references: [mediaAssetsTable.id]
  })
}));

// TypeScript types for table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;

export type MediaAsset = typeof mediaAssetsTable.$inferSelect;
export type NewMediaAsset = typeof mediaAssetsTable.$inferInsert;

export type TimelineItem = typeof timelineItemsTable.$inferSelect;
export type NewTimelineItem = typeof timelineItemsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  projects: projectsTable,
  mediaAssets: mediaAssetsTable,
  timelineItems: timelineItemsTable
};