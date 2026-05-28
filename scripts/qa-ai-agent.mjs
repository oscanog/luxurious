import { ConvexHttpClient } from "convex/browser";

const [email, password, ...promptParts] = process.argv.slice(2);
const prompts =
  promptParts.length > 0
    ? promptParts.join(" ").split("|||").map((prompt) => prompt.trim()).filter(Boolean)
    : [
        "How much are the asset logs of Florence Nogoy?",
        "I mean the latest asset only.",
        "si maylyn ba magkano latest?",
      ];

if (!email || !password) {
  console.error("Usage: node scripts/qa-ai-agent.mjs <email> <password> [prompt ||| prompt]");
  process.exit(1);
}

const client = new ConvexHttpClient("https://polished-eagle-138.convex.cloud");

const signIn = await client.action("auth:signIn", {
  provider: "password",
  params: {
    flow: "signIn",
    email,
    password,
  },
});

const token = signIn?.tokens?.token;
if (!token) {
  throw new Error("Sign-in did not return an auth token.");
}

client.setAuth(token);

const me = await client.query("profile:getMe", {});
const isAdmin = await client.query("admin:isAdmin", {});

if (prompts.includes("--list-users")) {
  const users = await client.query("admin:getUsers", {});
  console.log(
    JSON.stringify(
      {
        ok: true,
        user: {
          email: me.email,
          role: me.role,
          isAdmin,
          displayName: me.displayName,
        },
        users: users.map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role ?? "member",
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

let threadId;
const turns = [];

for (const prompt of prompts) {
  const result = await client.action("aiAgent:sendMessage", {
    ...(threadId ? { threadId } : {}),
    message: prompt,
  });
  threadId = result.threadId;
  turns.push({
    prompt,
    content: result.content,
    model: result.model,
    activity: result.activity,
  });
}

console.log(
  JSON.stringify(
    {
      ok: true,
      user: {
        email: me.email,
        role: me.role,
        isAdmin,
        displayName: me.displayName,
      },
      threadId,
      turns,
    },
    null,
    2,
  ),
);
