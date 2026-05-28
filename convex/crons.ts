import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh AI database embeddings",
  { hours: 1 },
  internal.aiDbEmbeddingActions.backfillBatch,
  { limitPerTable: 20 },
);

export default crons;
