import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

type MobileRpcPayload = {
  name?: string;
  args?: Record<string, unknown>;
};

function readStringArg(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readOptionalStringArg(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readNullableStringArg(value: unknown) {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : undefined;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return "Convex RPC failed.";
}

http.route({
  path: "/mobile/auth/sign-in",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password) {
      return jsonResponse({ error: "Missing email or password." }, 400);
    }

    const email = String(body.email).trim().toLowerCase();
    const hasPasswordAccount = await ctx.runQuery(
      internal.mobileAuth.hasPasswordAccount,
      { email },
    );
    if (!hasPasswordAccount) {
      return jsonResponse({ error: "Email not found." }, 401);
    }

    const result = await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email,
        password: String(body.password),
        flow: "signIn",
      },
      calledBy: "mobile",
    }).catch(() => null);

    if (!result?.tokens) {
      return jsonResponse({ error: "Password does not match." }, 401);
    }

    return jsonResponse({ tokens: result.tokens });
  }),
});

http.route({
  path: "/mobile/auth/refresh",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = (await req.json()) as {
      refreshToken?: string;
    };
    if (!body.refreshToken) {
      return jsonResponse({ error: "Missing refreshToken." }, 400);
    }

    const result = await ctx.runAction(api.auth.signIn, {
      refreshToken: String(body.refreshToken),
      calledBy: "mobile-refresh",
    });

    if (!result.tokens) {
      return jsonResponse({ error: "Session refresh failed." }, 401);
    }

    return jsonResponse({ tokens: result.tokens });
  }),
});

http.route({
  path: "/mobile/auth/session",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return jsonResponse({ error: "Not authenticated." }, 401);
    }

    await ctx.runMutation(api.mobile.bootstrap, {});
    const status = await ctx.runQuery(api.mobile.status, {});
    return jsonResponse({ result: status });
  }),
});

http.route({
  path: "/mobile/auth/sign-out",
  method: "POST",
  handler: httpAction(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return jsonResponse({ result: { signedOut: true } });
    }
    await ctx.runAction(api.auth.signOut, {});
    return jsonResponse({ result: { signedOut: true } });
  }),
});

http.route({
  path: "/mobile/query",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = (await req.json()) as MobileRpcPayload;
      if (!body.name) {
        return jsonResponse({ error: "Missing name." }, 400);
      }
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return jsonResponse({ error: "Not authenticated." }, 401);
      }

      await ctx.runMutation(api.mobile.bootstrap, {});

      let result: unknown;

      switch (body.name) {
        case "mobile:status":
          result = await ctx.runQuery(api.mobile.status, {});
          break;
        case "financials:listAccounts":
          result = await ctx.runQuery(api.financials.listAccounts, {});
          break;
        case "financials:getCashflow":
          result = await ctx.runQuery(api.financials.getCashflow, {});
          break;
        case "financials:listCurrencies":
          result = await ctx.runQuery(api.financials.listCurrencies, {});
          break;
        case "planning:getOverview":
          result = await ctx.runQuery(api.planning.getOverview, {});
          break;
        case "planning:getBudgets":
          result = await ctx.runQuery(api.planning.getBudgets, {});
          break;
        case "planning:getDebts":
          result = await ctx.runQuery(api.planning.getDebts, {});
          break;
        case "planning:getInstallments":
          result = await ctx.runQuery(api.planning.getInstallments, {});
          break;
        case "analytics:getStatistics":
          result = await ctx.runQuery(api.analytics.getStatistics, {});
          break;
        case "network:getDashboard":
          result = await ctx.runQuery(api.network.getDashboard, {});
          break;
        case "network:getTree":
          result = await ctx.runQuery(api.network.getTree, {});
          break;
        case "network:listMembers":
          result = await ctx.runQuery(api.network.listMembers, {
            status:
              body.args?.status === "joined" ||
              body.args?.status === "invited" ||
              body.args?.status === "pending" ||
              body.args?.status === "to-invite"
                ? body.args.status
                : undefined,
          });
          break;
        case "network:listMembersPaginated":
          result = await ctx.runQuery(api.network.listMembersPaginated, {
            status:
              body.args?.status === "joined" ||
              body.args?.status === "invited" ||
              body.args?.status === "pending" ||
              body.args?.status === "to-invite"
                ? body.args.status
                : undefined,
            search:
              typeof body.args?.search === "string" ? body.args.search : undefined,
            sortBy:
              body.args?.sortBy === "name" || body.args?.sortBy === "date"
                ? body.args.sortBy
                : undefined,
            sortOrder:
              body.args?.sortOrder === "asc" || body.args?.sortOrder === "desc"
                ? body.args.sortOrder
                : undefined,
            paginationOpts: {
              numItems:
                typeof body.args?.paginationOpts === "object" &&
                body.args.paginationOpts !== null &&
                typeof (body.args.paginationOpts as { numItems?: unknown }).numItems === "number"
                  ? (body.args.paginationOpts as { numItems: number }).numItems
                  : 10,
              cursor:
                typeof body.args?.paginationOpts === "object" &&
                body.args.paginationOpts !== null &&
                typeof (body.args.paginationOpts as { cursor?: unknown }).cursor === "string"
                  ? (body.args.paginationOpts as { cursor: string }).cursor
                  : null,
            },
          });
          break;
        case "network:getDeleteMemberImpact":
          result = await ctx.runQuery(api.network.getDeleteMemberImpact, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
          });
          break;
        case "networkMembers:checkEmailAvailability":
          result = await ctx.runQuery(api.networkMembers.checkEmailAvailability, {
            email: readStringArg(body.args?.email).trim().toLowerCase(),
          });
          break;
        case "notifications:getFeed":
          result = await ctx.runQuery(api.notifications.getFeed, {});
          break;
        case "notifications:getSummary":
          result = await ctx.runQuery(api.notifications.getSummary, {});
          break;
        case "promotions:listActive":
          result = await ctx.runQuery(api.notifications.listPromotions, {});
          break;
        case "profile:getMe":
          result = await ctx.runQuery(api.profile.getMe, {});
          break;
        case "profile:getRank":
          result = await ctx.runQuery(api.profile.getRank, {});
          break;
        case "invitations:list":
          result = await ctx.runQuery(api.invitations.list, {});
          break;
        case "planning:getSchedule":
          result = await ctx.runQuery(api.planning.getEvents, {});
          break;
        case "receipts:list":
          result = await ctx.runQuery(api.receipts.getReceipts, {});
          break;
        case "shopping:list":
          result = await ctx.runQuery(api.shopping.getItems, {});
          break;
        case "support:listTickets":
          result = await ctx.runQuery(api.support.getTickets, {});
          break;
        case "academy:list":
          result = await ctx.runQuery(api.academy.getLevels, {});
          break;
        case "academy:getLevels":
          result = await ctx.runQuery(api.academy.getLevels, {});
          break;
        case "academy:getLessons":
          result = await ctx.runQuery(api.academy.getLessons, {
            levelId: typeof body.args?.levelId === "string" ? (body.args.levelId as any) : "",
          });
          break;
        case "academy:get":
          result = await ctx.runQuery(api.academy.getLesson, {
            slug: typeof body.args?.slug === "string" ? body.args.slug : "",
          });
          break;
        case "admin:isAdmin":
          result = await ctx.runQuery(api.admin.isAdmin, {});
          break;
        case "admin:getAdminContext":
          result = await ctx.runQuery(api.admin.getAdminContext, {});
          break;
        case "admin:getPlatformStats":
          result = await ctx.runQuery(api.admin.getPlatformStats, {});
          break;
        case "admin:getUsers":
          result = await ctx.runQuery(api.admin.getUsers, {});
          break;
        case "admin:getAllTrades":
          result = await ctx.runQuery(api.admin.getAllTrades, {});
          break;
        case "aiSettings:getPublicSettings":
          result = await ctx.runQuery(api.aiSettings.getPublicSettings, {});
          break;
        case "aiSettings:getThreadMessages":
          result = await ctx.runQuery(api.aiSettings.getThreadMessages, {
            threadId: typeof body.args?.threadId === "string" ? (body.args.threadId as any) : "",
            limit: typeof body.args?.limit === "number" ? body.args.limit : undefined,
          });
          break;
        case "apkReleases:listActiveReleases":
          result = await ctx.runQuery(api.apkReleases.listActiveReleases, {});
          break;
        case "apkReleases:getLatestRelease":
          result = await ctx.runQuery(api.apkReleases.getLatestRelease, {});
          break;
        case "apkReleases:checkForUpdate":
          result = await ctx.runQuery(api.apkReleases.checkForUpdate, {
            currentBuildNumber: typeof body.args?.currentBuildNumber === "number" ? body.args.currentBuildNumber : 0,
          });
          break;
        case "transactions:listHistory":
          result = await ctx.runQuery(api.transactions.listHistory, {
            limit:
              typeof body.args?.limit === "number" ? body.args.limit : undefined,
          });
          break;
        case "presentations:list":
          result = await ctx.runQuery(api.presentations.list, {
            search: readOptionalStringArg(body.args?.search),
            sortBy:
              body.args?.sortBy === "updatedAt" || body.args?.sortBy === "title"
                ? body.args.sortBy
                : undefined,
            sortOrder:
              body.args?.sortOrder === "asc" || body.args?.sortOrder === "desc"
                ? body.args.sortOrder
                : undefined,
            includeArchived: body.args?.includeArchived === true ? true : undefined,
          });
          break;
        case "presentations:get":
          result = await ctx.runQuery(api.presentations.get, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "presentations:listTemplates":
          result = await ctx.runQuery(api.presentations.listTemplates, {
            category: readOptionalStringArg(body.args?.category),
          });
          break;
        case "socialFeed:getHomeFeed":
          result = await ctx.runQuery(api.socialFeed.getHomeFeed, {
            scope: (body.args?.scope === "all" || body.args?.scope === "mine" || body.args?.scope === "saved") ? body.args.scope : "all",
            hashtag: readOptionalStringArg(body.args?.hashtag),
            limit: typeof body.args?.limit === "number" ? body.args.limit : 15,
          });
          break;
        case "socialFeed:getMyActiveDraft":
          result = await ctx.runQuery(api.socialFeed.getMyActiveDraft, {});
          break;
        case "network:getMemberAssets":
          result = await ctx.runQuery(api.network.getMemberAssets, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
          });
          break;
        case "networkMembers:getAnalyticsStats":
          result = await ctx.runQuery(api.networkMembers.getAnalyticsStats, {
            rootMemberId: typeof body.args?.rootMemberId === "string" ? body.args.rootMemberId : undefined,
          });
          break;
        case "aiKnowledge:listDocuments":
          result = await ctx.runQuery(api.aiKnowledge.listDocuments, {});
          break;
        default:
          return jsonResponse({ error: `Unknown mobile query: ${body.name}` }, 404);
      }

      return jsonResponse({ result });
    } catch (error) {
      return jsonResponse({ error: readErrorMessage(error) }, 500);
    }
  }),
});

http.route({
  path: "/mobile/mutation",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = (await req.json()) as MobileRpcPayload;
      if (!body.name) {
        return jsonResponse({ error: "Missing name." }, 400);
      }
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return jsonResponse({ error: "Not authenticated." }, 401);
      }

      let result: unknown;

      switch (body.name) {
        case "mobile:bootstrap":
          result = await ctx.runMutation(api.mobile.bootstrap, {});
          break;
        case "financials:createAccount":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.financials.createAccount, {
            name: readStringArg(body.args?.name),
            institution: readStringArg(body.args?.institution),
            type: body.args?.type as
              | "savings"
              | "cash"
              | "credit"
              | "checking"
              | "investment",
            openingBalance:
              typeof body.args?.openingBalance === "number" ? body.args.openingBalance : 0,
            currencyCode:
              typeof body.args?.currencyCode === "string" ? body.args.currencyCode : undefined,
          });
          break;
        case "transactions:createIncome":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.transactions.createIncome, {
            amount: typeof body.args?.amount === "number" ? body.args.amount : 0,
            category: readStringArg(body.args?.category, "Other"),
            note: typeof body.args?.note === "string" ? body.args.note : undefined,
            occurredAt: typeof body.args?.occurredAt === "number" ? body.args.occurredAt : undefined,
          });
          break;
        case "transactions:createExpense":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.transactions.createExpense, {
            amount: typeof body.args?.amount === "number" ? body.args.amount : 0,
            category: readStringArg(body.args?.category, "Other"),
            note: typeof body.args?.note === "string" ? body.args.note : undefined,
            occurredAt: typeof body.args?.occurredAt === "number" ? body.args.occurredAt : undefined,
          });
          break;
        case "profile:updateMe":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.profile.updateMe, {
            displayName:
              typeof body.args?.displayName === "string" ? body.args.displayName : undefined,
            birthday: typeof body.args?.birthday === "string" ? body.args.birthday : undefined,
            bonchatId: typeof body.args?.bonchatId === "string" ? body.args.bonchatId : undefined,
            bonchatUsername:
              typeof body.args?.bonchatUsername === "string"
                ? body.args.bonchatUsername
                : undefined,
            yepbitId: typeof body.args?.yepbitId === "string" ? body.args.yepbitId : undefined,
            yepbitUsername:
              typeof body.args?.yepbitUsername === "string"
                ? body.args.yepbitUsername
                : undefined,
          });
          break;
        case "profile:generateAvatarUploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.profile.generateAvatarUploadUrl, {});
          break;
        case "profile:updateAvatar":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.profile.updateAvatar, {
            filter:
              body.args?.filter === "gold" ||
              body.args?.filter === "cool" ||
              body.args?.filter === "mono"
                ? body.args.filter
                : "natural",
            mirrored: body.args?.mirrored === true,
            offsetX: typeof body.args?.offsetX === "number" ? body.args.offsetX : 0,
            offsetY: typeof body.args?.offsetY === "number" ? body.args.offsetY : 0,
            rotationQuarterTurns:
              typeof body.args?.rotationQuarterTurns === "number"
                ? body.args.rotationQuarterTurns
                : 0,
            scale: typeof body.args?.scale === "number" ? body.args.scale : 1,
            storageId: typeof body.args?.storageId === "string" ? (body.args.storageId as any) : undefined,
          });
          break;
        case "profile:changePassword":
          result = await ctx.runAction(api.profile.changePassword, {
            currentPassword:
              typeof body.args?.currentPassword === "string" ? body.args.currentPassword : "",
            newPassword:
              typeof body.args?.newPassword === "string" ? body.args.newPassword : "",
          });
          break;
        case "invitations:create":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.invitations.create, {
            email: readStringArg(body.args?.email),
          });
          break;
        case "invitations:revoke":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.invitations.revoke, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "shopping:create":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.shopping.addItem, {
            name: readStringArg(body.args?.text),
            quantity: "1",
            category: "Other",
            priority: body.args?.priority === "high" || body.args?.priority === "medium" ? body.args.priority : "low",
          });
          break;
        case "shopping:toggle":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.shopping.toggleItem, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
            isChecked: body.args?.isChecked === true,
          });
          break;
        case "shopping:delete":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.shopping.removeItem, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "network:inviteMember":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.inviteMember, {
            name: readStringArg(body.args?.name),
            roleTitle: readStringArg(body.args?.roleTitle),
            bonchatUsername: readOptionalStringArg(body.args?.bonchatUsername),
            yepbitUsername: readOptionalStringArg(body.args?.yepbitUsername),
          });
          break;
        case "network:updateMemberSocials":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.updateMemberSocials, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            bonchatUsername: readNullableStringArg(body.args?.bonchatUsername),
            yepbitUsername: readNullableStringArg(body.args?.yepbitUsername),
            bonchatId: readNullableStringArg(body.args?.bonchatId),
            yepbitId: readNullableStringArg(body.args?.yepbitId),
          });
          break;
        case "network:reassignMemberParent":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.reassignMemberParent, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            newParentMemberId:
              typeof body.args?.newParentMemberId === "string"
                ? (body.args.newParentMemberId as any)
                : null,
          });
          break;
        case "network:deleteMember":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.deleteMember, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            mode: body.args?.mode === "cascade" ? "cascade" : "reconnect",
            newParentMemberId:
              typeof body.args?.newParentMemberId === "string"
                ? (body.args.newParentMemberId as any)
                : body.args?.newParentMemberId === null
                  ? null
                  : undefined,
          });
          break;
        case "network:setMemberDirectLimit":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.setMemberDirectLimit, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            directLimitOverride:
              typeof body.args?.directLimitOverride === "number"
                ? body.args.directLimitOverride
                : null,
          });
          break;
        case "network:backfillOrgAccessMetadata":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.backfillOrgAccessMetadata, {});
          break;
        case "networkMembers:addMember":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runAction(api.networkMembers.addMember, {
            type: body.args?.type === "to-invite" ? "to-invite" : "joined",
            parentId: typeof body.args?.parentId === "string" ? (body.args.parentId as any) : "",
            firstName: readStringArg(body.args?.firstName),
            lastName: readStringArg(body.args?.lastName),
            middleName:
              typeof body.args?.middleName === "string" ? body.args.middleName : undefined,
            email: typeof body.args?.email === "string" ? body.args.email : undefined,
            phone: typeof body.args?.phone === "string" ? body.args.phone : undefined,
            bonchatId:
              typeof body.args?.bonchatId === "string" ? body.args.bonchatId : undefined,
            bonchatUsername:
              typeof body.args?.bonchatUsername === "string"
                ? body.args.bonchatUsername
                : undefined,
            yepbitId:
              typeof body.args?.yepbitId === "string" ? body.args.yepbitId : undefined,
            yepbitUsername:
              typeof body.args?.yepbitUsername === "string"
                ? body.args.yepbitUsername
                : undefined,
            birthday:
              typeof body.args?.birthday === "string" ? body.args.birthday : undefined,
            currentWork:
              typeof body.args?.currentWork === "string" ? body.args.currentWork : undefined,
            investmentStartedAt:
              typeof body.args?.investmentStartedAt === "number"
                ? body.args.investmentStartedAt
                : undefined,
          });
          break;
        case "networkMembers:resetMemberPassword":
          result = await ctx.runAction(api.networkMembers.resetMemberPassword, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
          });
          break;
        case "networkMembers:updateMemberEmail":
          result = await ctx.runAction(api.networkMembers.updateMemberEmail, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            newEmail: readStringArg(body.args?.newEmail),
          });
          break;
        case "networkMembers:joinExistingMember":
          result = await ctx.runAction(api.networkMembers.joinExistingMember, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            email: readStringArg(body.args?.email),
          });
          break;
        case "support:createTicket":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.support.createTicket, {
            subject: readStringArg(body.args?.subject, "Support Ticket"),
            message: readStringArg(body.args?.body),
            priority: "medium",
          });
          break;
        case "notifications:markAllRead":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.notifications.markAllRead, {});
          break;
        case "notifications:registerDeviceToken":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.notifications.registerDeviceToken, {
            installationId:
              typeof body.args?.installationId === "string" ? body.args.installationId : "",
            token: typeof body.args?.token === "string" ? body.args.token : "",
            platform: typeof body.args?.platform === "string" ? body.args.platform : "",
            provider: typeof body.args?.provider === "string" ? body.args.provider : "",
            environment:
              typeof body.args?.environment === "string" ? body.args.environment : "",
          });
          break;
        case "receipts:uploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.receipts.generateUploadUrl, {});
          break;
        case "receipts:save":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.receipts.saveReceipt, {
            storageId: typeof body.args?.storageId === "string" ? (body.args.storageId as any) : "",
          });
          break;
        case "email:sendEmail":
          result = await ctx.runAction(api.email.sendEmail, {
            to: readStringArg(body.args?.to),
            subject: readStringArg(body.args?.subject),
            text: readStringArg(body.args?.text),
          });
          break;
        case "presentations:create":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.create, {
            title: readStringArg(body.args?.title, "Untitled Presentation"),
            description: readOptionalStringArg(body.args?.description),
            templateId:
              typeof body.args?.templateId === "string"
                ? (body.args.templateId as any)
                : undefined,
            slideWidth:
              typeof body.args?.slideWidth === "number" ? body.args.slideWidth : undefined,
            slideHeight:
              typeof body.args?.slideHeight === "number" ? body.args.slideHeight : undefined,
          });
          break;
        case "presentations:update":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.update, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
            title: readOptionalStringArg(body.args?.title),
            description: readOptionalStringArg(body.args?.description),
            tags: Array.isArray(body.args?.tags) ? (body.args!.tags as string[]) : undefined,
            slides: Array.isArray(body.args?.slides) ? (body.args!.slides as any) : undefined,
          });
          break;
        case "presentations:duplicate":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.duplicate, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "presentations:archive":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.archive, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "presentations:hardDelete":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.hardDelete, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "presentations:generateUploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.generateUploadUrl, {});
          break;
        case "presentations:saveThumbnail":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.presentations.saveThumbnail, {
            presentationId:
              typeof body.args?.presentationId === "string"
                ? (body.args.presentationId as any)
                : "",
            slideId: readOptionalStringArg(body.args?.slideId),
            storageId:
              typeof body.args?.storageId === "string" ? (body.args.storageId as any) : "",
          });
          break;
        case "academy:upsertLevel":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.academy.upsertLevel, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : undefined,
            order: typeof body.args?.order === "number" ? body.args.order : 1,
            title: readStringArg(body.args?.title),
            subtitle: readStringArg(body.args?.subtitle),
            color: readStringArg(body.args?.color),
            description: readStringArg(body.args?.description),
          });
          break;
        case "academy:deleteLevel":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.academy.deleteLevel, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "academy:upsertLesson":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.academy.upsertLesson, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : undefined,
            levelId: typeof body.args?.levelId === "string" ? (body.args.levelId as any) : "",
            order: typeof body.args?.order === "number" ? body.args.order : 1,
            slug: readStringArg(body.args?.slug),
            title: readStringArg(body.args?.title),
            duration: readStringArg(body.args?.duration),
            content: readStringArg(body.args?.content),
          });
          break;
        case "academy:deleteLesson":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.academy.deleteLesson, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
          });
          break;
        case "admin:resetBalance":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.admin.resetBalance, {
            userId: typeof body.args?.userId === "string" ? (body.args.userId as any) : "",
            amount: typeof body.args?.amount === "number" ? body.args.amount : 100000.0,
          });
          break;
        case "admin:setAdminStatus":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.admin.setAdminStatus, {
            userId: typeof body.args?.userId === "string" ? (body.args.userId as any) : "",
            status: body.args?.status === true || body.args?.isAdmin === true,
          });
          break;
        case "admin:setAdminLevel":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.admin.setAdminLevel, {
            userId: typeof body.args?.userId === "string" ? (body.args.userId as any) : "",
            adminLevel:
              body.args?.adminLevel === 2 ? 2 : body.args?.adminLevel === 1 ? 1 : 0,
          });
          break;
        case "aiAgent:sendMessage":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runAction(api.aiAgent.sendMessage, {
            threadId:
              typeof body.args?.threadId === "string"
                ? (body.args.threadId as any)
                : undefined,
            message: readStringArg(body.args?.message),
          });
          break;
        case "apkReleases:generateUploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.apkReleases.generateUploadUrl, {});
          break;
        case "apkReleases:publishRelease":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.apkReleases.publishRelease, {
            version: readStringArg(body.args?.version),
            buildNumber: typeof body.args?.buildNumber === "number" ? body.args.buildNumber : 1,
            releaseNotes: readStringArg(body.args?.releaseNotes),
            storageId: typeof body.args?.storageId === "string" ? (body.args.storageId as any) : "",
            fileSize: typeof body.args?.fileSize === "number" ? body.args.fileSize : 0,
            fileName: readStringArg(body.args?.fileName),
          });
          break;
        case "apkReleases:deleteRelease":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.apkReleases.deleteRelease, {
            id: typeof body.args?.id === "string" ? (body.args.id as any) : "",
            hardDelete: body.args?.hardDelete === true || body.args?.hardDelete === undefined,
          });
          break;
        case "socialFeed:toggleLike":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.toggleLike, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
          });
          break;
        case "socialFeed:toggleSave":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.toggleSave, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
          });
          break;
        case "socialFeed:createDraft":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.createDraft, {});
          break;
        case "socialFeed:updateDraft":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.updateDraft, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
            caption: readOptionalStringArg(body.args?.caption),
            visibility: (body.args?.visibility === "public" || body.args?.visibility === "private") ? body.args.visibility : undefined,
          });
          break;
        case "socialFeed:discardDraft":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.discardDraft, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
          });
          break;
        case "socialFeed:generateMediaUploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.generateMediaUploadUrl, {});
          break;
        case "socialFeed:attachDraftMedia":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.attachDraftMedia, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
            storageId: typeof body.args?.storageId === "string" ? (body.args.storageId as any) : "",
            kind: (body.args?.kind === "image" || body.args?.kind === "video") ? body.args.kind : "image",
            mimeType: typeof body.args?.mimeType === "string" ? body.args.mimeType : "application/octet-stream",
            fileName: typeof body.args?.fileName === "string" ? body.args.fileName : "upload",
          });
          break;
        case "socialFeed:removeDraftMedia":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.removeDraftMedia, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
            assetId: typeof body.args?.assetId === "string" ? (body.args.assetId as any) : "",
          });
          break;
        case "socialFeed:publishDraft":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.socialFeed.publishDraft, {
            postId: typeof body.args?.postId === "string" ? (body.args.postId as any) : "",
          });
          break;
        case "network:addMemberAsset":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.addMemberAsset, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            name: typeof body.args?.name === "string" ? body.args.name : "Asset",
            value: typeof body.args?.value === "number" ? body.args.value : 0,
            currency: typeof body.args?.currency === "string" ? body.args.currency : "USD",
          });
          break;
        case "network:deleteMemberAsset":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.deleteMemberAsset, {
            assetId: typeof body.args?.assetId === "string" ? (body.args.assetId as any) : "",
          });
          break;
        case "network:updateMemberAsset":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.network.updateMemberAsset, {
            assetId: typeof body.args?.assetId === "string" ? (body.args.assetId as any) : "",
            value: typeof body.args?.value === "number" ? body.args.value : 0,
            currency: typeof body.args?.currency === "string" ? body.args.currency : "USD",
          });
          break;
        case "networkMembers:updateMemberInvestmentDate":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.networkMembers.updateMemberInvestmentDate, {
            memberId: typeof body.args?.memberId === "string" ? (body.args.memberId as any) : "",
            investmentStartedAt: typeof body.args?.investmentStartedAt === "number" ? body.args.investmentStartedAt : undefined,
          });
          break;
        case "aiKnowledge:generateUploadUrl":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.aiKnowledge.generateUploadUrl, {});
          break;
        case "aiKnowledge:deleteDocument":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runMutation(api.aiKnowledge.deleteDocument, {
            documentId: typeof body.args?.documentId === "string" ? (body.args.documentId as any) : "",
          });
          break;
        case "aiKnowledgeActions:ingestUploadedPdf":
          await ctx.runMutation(api.mobile.bootstrap, {});
          result = await ctx.runAction(api.aiKnowledgeActions.ingestUploadedPdf, {
            title: typeof body.args?.title === "string" ? body.args.title : "",
            fileName: typeof body.args?.fileName === "string" ? body.args.fileName : "",
            mimeType: typeof body.args?.mimeType === "string" ? body.args.mimeType : "",
            fileSize: typeof body.args?.fileSize === "number" ? body.args.fileSize : 0,
            storageId: typeof body.args?.storageId === "string" ? (body.args.storageId as any) : "",
            extractedText: typeof body.args?.extractedText === "string" ? body.args.extractedText : undefined,
          });
          break;
        default:
          return jsonResponse({ error: `Unknown mobile mutation: ${body.name}` }, 404);
      }

      return jsonResponse({ result });
    } catch (error) {
      return jsonResponse({ error: readErrorMessage(error) }, 500);
    }
  }),
});

export default http;
