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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
            body.args?.status === "pending"
              ? body.args.status
              : undefined,
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
  }),
});

http.route({
  path: "/mobile/mutation",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
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
          name: String(body.args?.name ?? ""),
          institution: String(body.args?.institution ?? ""),
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
          category: String(body.args?.category ?? "Other"),
          note: typeof body.args?.note === "string" ? body.args.note : undefined,
          occurredAt: typeof body.args?.occurredAt === "number" ? body.args.occurredAt : undefined,
        });
        break;
      case "transactions:createExpense":
        await ctx.runMutation(api.mobile.bootstrap, {});
        result = await ctx.runMutation(api.transactions.createExpense, {
          amount: typeof body.args?.amount === "number" ? body.args.amount : 0,
          category: String(body.args?.category ?? "Other"),
          note: typeof body.args?.note === "string" ? body.args.note : undefined,
          occurredAt: typeof body.args?.occurredAt === "number" ? body.args.occurredAt : undefined,
        });
        break;
      default:
        return jsonResponse({ error: `Unknown mobile mutation: ${body.name}` }, 404);
    }

    return jsonResponse({ result });
  }),
});

export default http;
