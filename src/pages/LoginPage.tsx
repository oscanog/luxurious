import { useAuthActions } from "@convex-dev/auth/react";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ThemeMode } from "@/lib/theme";

export function LoginPage({
  themeMode,
  onToggleTheme,
}: {
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("flow", "signIn");

    try {
      await signIn("password", formData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid credentials. Please try again.";
      setError(message);
      toast.error("Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))]">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, hsl(221 83% 53% / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(43 96% 48% / 0.12) 0%, transparent 50%)",
        }}
      />

      <button
        type="button"
        onClick={onToggleTheme}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.86)] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[hsl(var(--foreground))] backdrop-blur"
      >
        {themeMode === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
      </button>

      <div className="relative z-10 mx-4 w-full max-w-[420px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 shadow-[0_20px_50px_-38px_hsl(215_44%_70%)]">
        <div className="mb-8 flex flex-col items-center">
          <div
            className="relative mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: "#2563eb" }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <span className="relative z-10 text-xl font-extrabold tracking-tight text-white">L</span>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[hsl(var(--foreground))]">
            Luxurious
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Mobile-familiar desktop workspace
          </p>
        </div>

        <div
          className="mb-8 h-px"
          style={{ background: "linear-gradient(to right, transparent, hsl(43 96% 48% / 0.6), transparent)" }}
        />

        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@luxurious.trade"
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: loading
                ? "hsl(43 96% 48%)"
                : "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))",
              boxShadow: loading ? "none" : "0 4px 20px hsl(43 96% 48% / 0.35)",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          Same account. Same network flow. Bigger screen.
        </p>
      </div>
    </div>
  );
}
