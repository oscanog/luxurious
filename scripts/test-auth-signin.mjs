import { ConvexHttpClient } from "convex/browser";

const [email, password = "password123"] = process.argv.slice(2);

if (!email) {
  console.error("Usage: node scripts/test-auth-signin.mjs <email> [password]");
  process.exit(1);
}

const client = new ConvexHttpClient("https://polished-eagle-138.convex.cloud");

try {
  const result = await client.action("auth:signIn", {
    provider: "password",
    params: {
      flow: "signIn",
      email,
      password,
    },
  });

  console.log(JSON.stringify({ ok: true, email, result }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        email,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
