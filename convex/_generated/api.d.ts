/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academy from "../academy.js";
import type * as admin from "../admin.js";
import type * as aiAgent from "../aiAgent.js";
import type * as aiContext from "../aiContext.js";
import type * as aiCrypto from "../aiCrypto.js";
import type * as aiDbEmbeddingActions from "../aiDbEmbeddingActions.js";
import type * as aiDbEmbeddings from "../aiDbEmbeddings.js";
import type * as aiEmbeddings from "../aiEmbeddings.js";
import type * as aiKnowledge from "../aiKnowledge.js";
import type * as aiKnowledgeActions from "../aiKnowledgeActions.js";
import type * as aiPgvector from "../aiPgvector.js";
import type * as aiSecrets from "../aiSecrets.js";
import type * as aiSettings from "../aiSettings.js";
import type * as analytics from "../analytics.js";
import type * as apkReleases from "../apkReleases.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as financials from "../financials.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as invitations from "../invitations.js";
import type * as milestones from "../milestones.js";
import type * as mobile from "../mobile.js";
import type * as mobileAuth from "../mobileAuth.js";
import type * as mobileHelpers from "../mobileHelpers.js";
import type * as network from "../network.js";
import type * as networkMembers from "../networkMembers.js";
import type * as notifications from "../notifications.js";
import type * as orgAccess from "../orgAccess.js";
import type * as participation from "../participation.js";
import type * as planning from "../planning.js";
import type * as presentations from "../presentations.js";
import type * as profile from "../profile.js";
import type * as receipts from "../receipts.js";
import type * as schedules from "../schedules.js";
import type * as seed from "../seed.js";
import type * as seedTemplates from "../seedTemplates.js";
import type * as seed_academy from "../seed_academy.js";
import type * as shopping from "../shopping.js";
import type * as signals from "../signals.js";
import type * as simulation from "../simulation.js";
import type * as socialFeed from "../socialFeed.js";
import type * as support from "../support.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  academy: typeof academy;
  admin: typeof admin;
  aiAgent: typeof aiAgent;
  aiContext: typeof aiContext;
  aiCrypto: typeof aiCrypto;
  aiDbEmbeddingActions: typeof aiDbEmbeddingActions;
  aiDbEmbeddings: typeof aiDbEmbeddings;
  aiEmbeddings: typeof aiEmbeddings;
  aiKnowledge: typeof aiKnowledge;
  aiKnowledgeActions: typeof aiKnowledgeActions;
  aiPgvector: typeof aiPgvector;
  aiSecrets: typeof aiSecrets;
  aiSettings: typeof aiSettings;
  analytics: typeof analytics;
  apkReleases: typeof apkReleases;
  auth: typeof auth;
  crons: typeof crons;
  email: typeof email;
  financials: typeof financials;
  http: typeof http;
  init: typeof init;
  invitations: typeof invitations;
  milestones: typeof milestones;
  mobile: typeof mobile;
  mobileAuth: typeof mobileAuth;
  mobileHelpers: typeof mobileHelpers;
  network: typeof network;
  networkMembers: typeof networkMembers;
  notifications: typeof notifications;
  orgAccess: typeof orgAccess;
  participation: typeof participation;
  planning: typeof planning;
  presentations: typeof presentations;
  profile: typeof profile;
  receipts: typeof receipts;
  schedules: typeof schedules;
  seed: typeof seed;
  seedTemplates: typeof seedTemplates;
  seed_academy: typeof seed_academy;
  shopping: typeof shopping;
  signals: typeof signals;
  simulation: typeof simulation;
  socialFeed: typeof socialFeed;
  support: typeof support;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
