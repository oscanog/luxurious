import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  getMobileProfileByUserId,
  getMobileProfileForViewerOrThrow,
} from "./mobileHelpers";

const addMemberArgs = {
  type: v.union(v.literal("joined"), v.literal("to-invite")),
  parentId: v.id("networkMembers"),
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  bonchatId: v.optional(v.string()),
  bonchatUsername: v.optional(v.string()),
  yepbitId: v.optional(v.string()),
  yepbitUsername: v.optional(v.string()),
  birthday: v.optional(v.string()),
  currentWork: v.optional(v.string()),
  investmentStartedAt: v.optional(v.number()),
} as const;

function buildMemberName(args: {
  firstName: string;
  middleName?: string;
  lastName: string;
}) {
  return [args.firstName, args.middleName, args.lastName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

function randomDigits(length: number) {
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += Math.floor(Math.random() * 10).toString();
  }
  return value;
}

function randomLetters(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function generateTemporaryPassword() {
  return `LTG${randomDigits(4)}${randomLetters(4)}`;
}

export const updateSocialIds = mutation({
  args: {
    memberId: v.id("networkMembers"),
    bonchatId: v.optional(v.string()),
    bonchatUsername: v.optional(v.string()),
    yepbitId: v.optional(v.string()),
    yepbitUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileForViewerOrThrow(ctx);

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    if (member.profileId !== profile._id) {
      throw new Error("Unauthorized");
    }

    const { memberId, ...updates } = args;
    await ctx.db.patch(memberId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const createMemberRecord = internalMutation({
  args: {
    viewerUserId: v.id("users"),
    authUserId: v.optional(v.id("users")),
    ...addMemberArgs,
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileByUserId(ctx, args.viewerUserId);
    if (!profile) {
      throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
    }

    const parent = await ctx.db.get("networkMembers", args.parentId);
    if (!parent || parent.profileId !== profile._id) {
      throw new Error("Parent node not found");
    }

    const existingChildren = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_parentMemberId", (q) =>
        q.eq("profileId", profile._id).eq("parentMemberId", args.parentId),
      )
      .take(7);

    if (existingChildren.length >= 6) {
      throw new Error("Node already has 6 direct downlines.");
    }

    const now = Date.now();
    const name = buildMemberName(args);

    const memberId = await ctx.db.insert("networkMembers", {
      profileId: profile._id,
      userId: args.authUserId,
      parentMemberId: args.parentId,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      middleName: args.middleName?.trim() || undefined,
      name,
      roleTitle: args.type === "joined" ? "Active Member" : "Prospect",
      status: args.type === "joined" ? "joined" : "to-invite",
      isViewer: false,
      sortOrder: existingChildren.length,
      joinedAt: args.type === "joined" ? now : undefined,
      email: args.email?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      bonchatId: args.bonchatId?.trim() || undefined,
      bonchatUsername: args.bonchatUsername?.trim() || undefined,
      yepbitId: args.yepbitId?.trim() || undefined,
      yepbitUsername: args.yepbitUsername?.trim() || undefined,
      birthday: args.birthday,
      currentWork: args.currentWork?.trim() || undefined,
      investmentStartedAt: args.investmentStartedAt,
      createdAt: now,
      updatedAt: now,
    });

    if (args.authUserId) {
      const authUser = await ctx.db.get(args.authUserId);
      if (!authUser) {
        throw new Error("Created auth user missing.");
      }

      await ctx.db.patch(authUser._id, {
        role: "member",
        uplineId: args.viewerUserId,
        lastUplineId: authUser.uplineId ?? null,
      });

      const existingProfile = await getMobileProfileByUserId(ctx, authUser._id);
      if (!existingProfile) {
        await ctx.db.insert("mobileProfiles", {
          userId: authUser._id,
          viewerKey: `auth_${authUser._id}`,
          displayName: name,
          preferredCurrencyCode: "USD",
          birthday: args.birthday,
          bonchatId: args.bonchatId?.trim() || undefined,
          bonchatUsername: args.bonchatUsername?.trim() || undefined,
          yepbitId: args.yepbitId?.trim() || undefined,
          yepbitUsername: args.yepbitUsername?.trim() || undefined,
          avatarFilter: "natural",
          avatarMirror: false,
          avatarOffsetX: 0,
          avatarOffsetY: 0,
          avatarRotationQuarterTurns: 0,
          avatarScale: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { memberId };
  },
});

export const validateAddMemberTarget = internalQuery({
  args: {
    viewerUserId: v.id("users"),
    parentId: v.id("networkMembers"),
  },
  handler: async (ctx, args) => {
    const profile = await getMobileProfileByUserId(ctx, args.viewerUserId);
    if (!profile) {
      throw new Error("Mobile profile missing. Call mobile:bootstrap first.");
    }

    const parent = await ctx.db.get("networkMembers", args.parentId);
    if (!parent || parent.profileId !== profile._id) {
      throw new Error("Parent node not found");
    }

    const existingChildren = await ctx.db
      .query("networkMembers")
      .withIndex("by_profileId_and_parentMemberId", (q) =>
        q.eq("profileId", profile._id).eq("parentMemberId", args.parentId),
      )
      .take(7);

    if (existingChildren.length >= 6) {
      throw new Error("Node already has 6 direct downlines.");
    }

    return { profileId: profile._id };
  },
});

export const checkEmailAvailability = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await getMobileProfileForViewerOrThrow(ctx);

    const normalizedEmail = args.email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { exists: false };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();

    return {
      exists: existingUser !== null,
    };
  },
});

export const addMember = action({
  args: addMemberArgs,
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    if (!viewerUserId) {
      throw new Error("Not authenticated");
    }

    if (args.type === "joined" && !args.email?.trim()) {
      throw new Error("Email required for joined member.");
    }

    await ctx.runQuery(internal.networkMembers.validateAddMemberTarget, {
      viewerUserId,
      parentId: args.parentId,
    });

    let authUserId: Id<"users"> | undefined;
    let credentials: { username: string; password: string } | null = null;

    if (args.type === "joined") {
      const email = args.email!.trim().toLowerCase();
      const emailAvailability: { exists: boolean } = await ctx.runQuery(
        api.networkMembers.checkEmailAvailability,
        { email },
      );
      if (emailAvailability.exists) {
        throw new Error("Email already used.");
      }

      const password = generateTemporaryPassword();
      const created = await createAccount(ctx, {
        provider: "password",
        account: {
          id: email,
          secret: password,
        },
        profile: {
          name: buildMemberName(args),
          email,
          phone: args.phone?.trim() || undefined,
          role: "member",
        },
        shouldLinkViaEmail: false,
      });
      authUserId = created.user._id;
      credentials = {
        username: email,
        password,
      };
    }

    const result: { memberId: Id<"networkMembers"> } = await ctx.runMutation(
      internal.networkMembers.createMemberRecord,
      {
        viewerUserId,
        authUserId,
        ...args,
      },
    );

    return {
      memberId: result.memberId,
      credentials,
    };
  },
});
