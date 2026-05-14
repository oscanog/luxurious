import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import { BadgeCheck, KeyRound, Save, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { getInitials } from "@/lib/utils";

type ProfileForm = {
  displayName: string;
  birthday: string;
  bonchatId: string;
  bonchatUsername: string;
  yepbitId: string;
  yepbitUsername: string;
};

export function ProfilePage() {
  const profile = useQuery(api.profile.getMe);
  const updateProfile = useMutation(api.profile.updateMe);
  const changePassword = useAction(api.profile.changePassword);
  const { signOut } = useAuthActions();

  const [draft, setDraft] = useState<ProfileForm | null>(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (profile === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-44 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[28px]" />
        <Skeleton className="h-72 rounded-[28px]" />
      </div>
    );
  }

  const form = draft ?? toProfileForm(profile);

  async function handleSaveProfile() {
    setIsSaving(true);
    try {
      const updated = await updateProfile(form);
      setDraft(toProfileForm(updated));
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password mismatch");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password changed. Sign in again.");
      await signOut();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password change failed");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  function updateField<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setDraft((current) => ({ ...(current ?? toProfileForm(profile)), [key]: value }));
  }

  const initials = getInitials(profile.displayName || profile.fullName || "Trader");

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <SurfaceCard className="overflow-hidden">
        <div
          className="p-6 sm:p-8"
          style={{
            background:
              "radial-gradient(circle at top left, hsl(43 96% 48% / 0.18), transparent 26%), radial-gradient(circle at bottom right, hsl(221 83% 53% / 0.18), transparent 32%)",
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-[30px] border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.86)] p-1">
                <div className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-[linear-gradient(135deg,hsl(43_96%_48%),hsl(221_83%_53%))] text-2xl font-black text-white">
                  {initials}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary)/0.14)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
                    <Sparkles size={13} />
                    {profile.rank.name}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary)/0.12)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--primary))]">
                    Frame {profile.avatar.frame}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
                  {profile.displayName}
                </h1>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{profile.email}</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  {profile.joinedDownlineCount} joined downlines • {profile.rank.rangeLabel}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
              <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Email Verify
                </p>
                <p className="mt-2 text-lg font-black text-[hsl(var(--foreground))]">
                  {profile.verification.emailVerified ? "Verified" : "Pending"}
                </p>
              </SurfaceCard>
              <SurfaceCard className="rounded-[24px] bg-[hsl(var(--background)/0.82)] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                  Phone Cert
                </p>
                <p className="mt-2 text-lg font-black text-[hsl(var(--foreground))]">
                  {profile.verification.phoneCertified ? "Certified" : "Pending"}
                </p>
              </SurfaceCard>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                Identity
              </p>
              <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Profile details</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ProfileField
              label="Display Name"
              value={form.displayName}
              onChange={(value) => updateField("displayName", value)}
            />
            <ProfileField label="Birthday" value={form.birthday} onChange={(value) => updateField("birthday", value)} />
            <ProfileField label="Bonchat ID" value={form.bonchatId} onChange={(value) => updateField("bonchatId", value)} />
            <ProfileField
              label="Bonchat Username"
              value={form.bonchatUsername}
              onChange={(value) => updateField("bonchatUsername", value)}
            />
            <ProfileField label="Yepbit ID" value={form.yepbitId} onChange={(value) => updateField("yepbitId", value)} />
            <ProfileField
              label="Yepbit Username"
              value={form.yepbitUsername}
              onChange={(value) => updateField("yepbitUsername", value)}
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSaveProfile()}
            disabled={isSaving}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save size={15} />
            {isSaving ? "Saving" : "Save profile"}
          </button>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
                <BadgeCheck size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Provisioning
                </p>
                <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Rank + avatar state</h2>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              <MetaRow label="Role">{profile.role}</MetaRow>
              <MetaRow label="Avatar source">{profile.avatar.storage}</MetaRow>
              <MetaRow label="Avatar filter">{profile.avatar.filter}</MetaRow>
              <MetaRow label="Provisioning">{profile.provisioning.adminProvisionedOnly ? "Admin only" : "Open"}</MetaRow>
            </dl>
          </SurfaceCard>

          <SurfaceCard className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                <KeyRound size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  Security
                </p>
                <h2 className="text-xl font-black text-[hsl(var(--foreground))]">Change password</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <ProfileField
                label="Current Password"
                type="password"
                value={passwords.currentPassword}
                onChange={(value) => setPasswords((current) => ({ ...current, currentPassword: value }))}
              />
              <ProfileField
                label="New Password"
                type="password"
                value={passwords.newPassword}
                onChange={(value) => setPasswords((current) => ({ ...current, newPassword: value }))}
              />
              <ProfileField
                label="Confirm Password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(value) => setPasswords((current) => ({ ...current, confirmPassword: value }))}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleChangePassword()}
              disabled={isUpdatingPassword}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[hsl(var(--secondary-foreground))] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <ShieldCheck size={15} />
              {isUpdatingPassword ? "Updating" : "Update password"}
            </button>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-sm text-[hsl(var(--foreground))] outline-none transition-colors focus:border-[hsl(var(--primary))]"
      />
    </label>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
      <dt className="text-[11px] font-black uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
        {label}
      </dt>
      <dd className="text-sm font-bold text-[hsl(var(--foreground))]">{children}</dd>
    </div>
  );
}

function toProfileForm(profile: {
  displayName: string;
  birthday: string | null;
  bonchatId: string | null;
  bonchatUsername: string | null;
  yepbitId: string | null;
  yepbitUsername: string | null;
}) {
  return {
    displayName: profile.displayName ?? "",
    birthday: profile.birthday ?? "",
    bonchatId: profile.bonchatId ?? "",
    bonchatUsername: profile.bonchatUsername ?? "",
    yepbitId: profile.yepbitId ?? "",
    yepbitUsername: profile.yepbitUsername ?? "",
  };
}
