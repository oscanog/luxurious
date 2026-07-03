import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://polished-eagle-138.convex.cloud");

async function run() {
  console.log("Triggering Convex Auth signUp via action...");
  try {
    const result = await client.action("auth:signIn", {
      provider: "password",
      params: {
        flow: "signUp",
        email: "erwin.almendrala@gmail.com",
        password: "erwinbeth1234",
      }
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("SignUp Error:", error);
  }
}
run();
