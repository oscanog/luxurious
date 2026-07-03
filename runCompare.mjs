import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL || "https://polished-eagle-138.convex.cloud");

// We can't call internal functions from the client. Let's use a different approach.
// Instead, let's just query the dashboard endpoint directly via the Convex CLI.
console.log("Use: npx convex run teams:compareUsers '{...}'");
