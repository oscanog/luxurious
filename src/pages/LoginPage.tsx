import { useAuthActions } from "@convex-dev/auth/react";
import { Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [showTerms, setShowTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("lux_saved_email");
    const savedPassword = localStorage.getItem("lux_saved_password");
    const savedRemember = localStorage.getItem("lux_saved_remember") === "true";
    if (savedRemember) {
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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
      if (rememberMe) {
        localStorage.setItem("lux_saved_email", email);
        localStorage.setItem("lux_saved_password", password);
        localStorage.setItem("lux_saved_remember", "true");
      } else {
        localStorage.removeItem("lux_saved_email");
        localStorage.removeItem("lux_saved_password");
        localStorage.removeItem("lux_saved_remember");
      }
    } catch (error) {
      setError("Invalid email or password. Please try again.");
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
          <img 
            src="/luxurious_logo.png" 
            alt="Luxurious Logo" 
            className="mb-4 h-16 w-16 object-contain"
          />
          <h1 className="text-[28px] font-extrabold tracking-tight text-[hsl(var(--foreground))]">
            Luxurious
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] text-center">
            Easy tracking and management for our crypto trading
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
              placeholder="name@domain.com"
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
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pl-4 pr-11 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-0 accent-[hsl(var(--primary))]"
              />
              <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                Remember Password
              </span>
            </label>
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

        <p className="mt-6 text-center text-xs">
          <button
            type="button"
            onClick={() => setShowTerms(true)}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-all font-semibold underline cursor-pointer"
          >
            Privacy & Terms
          </button>
        </p>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <h2 className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight mb-2">
              Privacy Policy & Terms of Service
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6">
              Last Updated: May 17, 2026 • Version 2.1 (Production Release)
            </p>

            <div className="flex-1 overflow-y-auto pr-2 text-sm text-[hsl(var(--muted-foreground))] space-y-4 font-medium leading-relaxed max-h-[50vh] scrollbar-thin">
              <section>
                <h3 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
                  1. Crypto Trading Simulation Disclaimer
                </h3>
                <p>
                  Luxurious provides a <strong>100% simulated, virtual-only trading environment</strong>. All portfolio balances (including initial balances up to $1,000,000), transaction histories, trading signals, and price charts are simulated and use dummy currencies or virtual USD. Under no circumstances does this application handle real money, real fiat currency, or live blockchain-based assets.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
                  2. Affiliate Network & Downline Transparency
                </h3>
                <p>
                  By establishing a profile, you agree to join our organizational sponsor hierarchy. Your profile registration email, rank status, and member level may be visible to your designated sponsor (upline) and platform administrators to facilitate real-time performance analytics, commissions tracking, and downline support.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
                  3. Member Testimonials & Content Guidelines
                </h3>
                <p>
                  Users can write, post, and publish "Member Testimonials" visible to all registered workspace users. You warrant that all published feedback, media, and copy do not contain misleading financial advice, offensive language, or copyrighted materials. Administrators reserve the right to prune, audit, or completely flag any posts violating code of conduct guidelines.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
                  4. Presentation Studio & Intellectual Property
                </h3>
                <p>
                  Our Presentation Studio, editor canvases, and slides features utilize proprietary vector rendering utilities. All built-in design elements, templates, and layouts are the exclusive property of Luxurious. You are granted a limited, personal, non-transferable license to create and export presentations solely for in-network educational and planning purposes.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black text-[hsl(var(--foreground))] uppercase tracking-wider mb-2">
                  5. Device Security & Version Integrity
                </h3>
                <p>
                  Our mobile application integrates secure background telemetry to query production APK release endpoints for instant updates. Session authentication tokens, device platforms, and client configurations are processed strictly to ensure continuous, high-performance service execution.
                </p>
              </section>
            </div>

            <div className="mt-6 pt-6 border-t border-[hsl(var(--border))] flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="h-5 w-5 rounded-md border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-0 focus:ring-offset-0 accent-[hsl(var(--primary))]"
                />
                <span className="text-xs font-bold text-[hsl(var(--foreground))] select-none">
                  I accept the Terms of Service & certify my simulated-trading status
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTermsChecked(true);
                    setShowTerms(false);
                  }}
                  className="rounded-2xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[hsl(var(--primary)/0.25)] hover:scale-105 active:scale-95 transition-all"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
