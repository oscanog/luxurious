import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export function LoginPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);
    formData.set("flow", "signIn");
    try {
      await signIn("password", formData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(msg);
      toast.error("Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, hsl(221 83% 53% / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, hsl(43 96% 48% / 0.12) 0%, transparent 50%)",
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] mx-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-10 shadow-[0_20px_50px_-38px_hsl(215_44%_70%)]"
      >
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
            style={{ background: "#2563eb" }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <span className="relative z-10 text-white font-extrabold text-xl tracking-tight">L</span>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[hsl(var(--foreground))]">
            Luxurious
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Admin access only — sign in to continue
          </p>
        </div>

        {/* Gold divider */}
        <div
          className="h-px mb-8"
          style={{ background: "linear-gradient(to right, transparent, hsl(43 96% 48% / 0.6), transparent)" }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@luxurious.trade"
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
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
            className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "hsl(43 96% 48%)"
                : "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))",
              boxShadow: loading ? "none" : "0 4px 20px hsl(43 96% 48% / 0.35)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          No account? Contact your system administrator.
        </p>
      </div>
    </div>
  );
}
