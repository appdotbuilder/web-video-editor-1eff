import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  createProjectInputSchema,
  getProjectsByUserInputSchema,
  updateProjectInputSchema,
  deleteProjectInputSchema,
  createMediaAssetInputSchema,
  getMediaAssetsByUserInputSchema,
  deleteMediaAssetInputSchema,
  createTimelineItemInputSchema,
  getTimelineItemsByProjectInputSchema,
  updateTimelineItemInputSchema,
  deleteTimelineItemInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createProject } from './handlers/create_project';
import { getProjectsByUser } from './handlers/get_projects_by_user';
import { updateProject } from './handlers/update_project';
import { deleteProject } from './handlers/delete_project';
import { createMediaAsset } from './handlers/create_media_asset';
import { getMediaAssetsByUser } from './handlers/get_media_assets_by_user';
import { deleteMediaAsset } from './handlers/delete_media_asset';
import { createTimelineItem } from './handlers/create_timeline_item';
import { getTimelineItemsByProject } from './handlers/get_timeline_items_by_project';
import { updateTimelineItem } from './handlers/update_timeline_item';
import { deleteTimelineItem } from './handlers/delete_timeline_item';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Project management
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjectsByUser: publicProcedure
    .input(getProjectsByUserInputSchema)
    .query(({ input }) => getProjectsByUser(input)),

  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  deleteProject: publicProcedure
    .input(deleteProjectInputSchema)
    .mutation(({ input }) => deleteProject(input)),

  // Media asset management
  createMediaAsset: publicProcedure
    .input(createMediaAssetInputSchema)
    .mutation(({ input }) => createMediaAsset(input)),

  getMediaAssetsByUser: publicProcedure
    .input(getMediaAssetsByUserInputSchema)
    .query(({ input }) => getMediaAssetsByUser(input)),

  deleteMediaAsset: publicProcedure
    .input(deleteMediaAssetInputSchema)
    .mutation(({ input }) => deleteMediaAsset(input)),

  // Timeline management
  createTimelineItem: publicProcedure
    .input(createTimelineItemInputSchema)
    .mutation(({ input }) => createTimelineItem(input)),

  getTimelineItemsByProject: publicProcedure
    .input(getTimelineItemsByProjectInputSchema)
    .query(({ input }) => getTimelineItemsByProject(input)),

  updateTimelineItem: publicProcedure
    .input(updateTimelineItemInputSchema)
    .mutation(({ input }) => updateTimelineItem(input)),

  deleteTimelineItem: publicProcedure
    .input(deleteTimelineItemInputSchema)
    .mutation(({ input }) => deleteTimelineItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();