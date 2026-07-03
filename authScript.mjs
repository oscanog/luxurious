import fetch from "node-fetch";

async function run() {
  const body = JSON.stringify({
    provider: "password",
    args: {
        flow: "signUp",
        email: "erwin.almendrala@gmail.com",
        password: "erwinbeth1234",
    }
  });

  try {
      const res = await fetch("https://polished-eagle-138.convex.cloud/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body
      });
      const text = await res.text();
      console.log(res.status, text);
  } catch (e) {
      console.log("fallback error", e);
  }
}
run();
