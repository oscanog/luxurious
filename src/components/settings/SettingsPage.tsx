import { User, Lock, Bell, Shield, ChevronRight } from "lucide-react";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
      style={{ boxShadow: "0 2px 8px hsl(0 0% 0% / 0.04)" }}>
      <div className="px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] block mb-1.5">
        {label}
      </label>
      <div className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)] px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))] cursor-not-allowed select-none">
        {value}
      </div>
    </div>
  );
}

function PasswordField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] block mb-1.5">
        {label}
      </label>
      <input type="password" placeholder={placeholder}
        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.2)] transition-all" />
    </div>
  );
}

function SettingRow({ icon: Icon, label, description, badge }: { icon: React.ElementType; label: string; description: string; badge?: string }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[hsl(var(--border))] last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[hsl(var(--muted))]">
        <Icon size={16} className="text-[hsl(var(--muted-foreground))]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{label}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      {badge && (
        <span className="px-2 py-0.5 rounded-xl text-[11px] font-bold" style={{ background: "hsl(43 96% 48% / 0.12)", color: "hsl(43 96% 40%)" }}>
          {badge}
        </span>
      )}
      <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))] shrink-0" />
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl space-y-5">
      {/* Admin avatar banner */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex items-center gap-5"
        style={{ background: "linear-gradient(135deg, hsl(221 83% 53% / 0.06), hsl(43 96% 48% / 0.04))" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(221 83% 53%))", boxShadow: "0 6px 20px hsl(43 96% 48% / 0.35)" }}>
          AD
        </div>
        <div>
          <p className="text-lg font-extrabold text-[hsl(var(--foreground))]">Administrator</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">admin@luxurious.trade</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold"
            style={{ background: "hsl(43 96% 48% / 0.12)", color: "hsl(43 96% 40%)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(43 96% 48%)" }} />
            Master Admin
          </span>
        </div>
      </div>

      {/* Profile (read-only) */}
      <SectionCard title="Profile Information">
        <div className="grid grid-cols-2 gap-4">
          <ReadonlyField label="Display Name" value="Administrator" />
          <ReadonlyField label="Role" value="Master Admin" />
        </div>
        <ReadonlyField label="Email Address" value="admin@luxurious.trade" />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Profile details are managed by the system administrator. Contact support to update.
        </p>
      </SectionCard>

      {/* Change password (UI only) */}
      <SectionCard title="Change Password">
        <PasswordField label="Current Password" placeholder="••••••••" />
        <PasswordField label="New Password" placeholder="Min. 8 characters" />
        <PasswordField label="Confirm New Password" placeholder="Repeat new password" />
        <button className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, hsl(43 96% 48%), hsl(43 96% 38%))", boxShadow: "0 4px 16px hsl(43 96% 48% / 0.3)" }}
          onClick={(e) => e.preventDefault()}>
          Update Password
        </button>
      </SectionCard>

      {/* System settings */}
      <SectionCard title="System Settings">
        <SettingRow icon={Bell} label="Email Notifications" description="Receive alerts when new members join" badge="Coming Soon" />
        <SettingRow icon={Shield} label="Two-Factor Authentication" description="Add an extra layer of security" badge="Coming Soon" />
        <SettingRow icon={Lock} label="Session Management" description="View and revoke active sessions" badge="Coming Soon" />
        <SettingRow icon={User} label="Audit Log" description="View all admin actions and changes" badge="Coming Soon" />
      </SectionCard>
    </div>
  );
}
