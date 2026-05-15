import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

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

    const result = await ctx.runAction(api.auth.signIn, {
      provider: "password",
      params: {
        email: String(body.email),
        password: String(body.password),
        flow: "signIn",
      },
      calledBy: "mobile",
    });

    if (!result.tokens) {
      return jsonResponse({ error: "Invalid credentials." }, 401);
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
        case "academy:get":
          result = await ctx.runQuery(api.academy.getLesson, {
            slug: typeof body.args?.slug === "string" ? body.args.slug : "",
          });
          break;
        case "transactions:listHistory":
          result = await ctx.runQuery(api.transactions.listHistory, {
            limit:
              typeof body.args?.limit === "number" ? body.args.limit : undefined,
          });
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
