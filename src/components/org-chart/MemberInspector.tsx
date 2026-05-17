import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { 
  X, 
  Mail, 
  Shield, 
  Key, 
  Trash2, 
  Mail as MailIcon,
  Globe,
  Settings,
  ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { InputDialog } from "../ui/InputDialog";
import { CredentialsDialog } from "../ui/CredentialsDialog";

interface MemberInspectorProps {
  memberId: string | null;
  networkStats?: {
    directChildrenCount: number;
    totalDownlines: number;
  } | null;
  onClose: () => void;
}

export function MemberInspector({
  memberId,
  networkStats,
  onClose,
}: MemberInspectorProps) {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isResetting, setIsResetting] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password?: string; name: string } | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const member = useQuery(api.network.getMember, memberId ? { memberId: memberId as Id<"networkMembers"> } : "skip");
  
  const resetPassword = useAction(api.networkMembers.resetMemberPassword);
  const updateEmail = useAction(api.networkMembers.updateMemberEmail);
  const deleteMember = useMutation(api.network.deleteMember);
  const updateStatus = useMutation(api.networkMembers.updateMemberStatus);
  const joinMember = useAction(api.networkMembers.joinExistingMember);

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  if (!memberId || !member) return null;

  const handleStatusChange = async (newStatus: "joined" | "invited" | "pending" | "to-invite") => {
    if (newStatus === member.status) return;

    if (newStatus === "joined" && !member.userId) {
      // member has no linked account
      setIsJoinDialogOpen(true);
      return;
    }

    setIsStatusUpdating(true);
    try {
      await updateStatus({
        memberId: memberId as Id<"networkMembers">,
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleJoinMemberConfirm = async (email: string) => {
    setIsJoinDialogOpen(false);
    setIsStatusUpdating(true);
    try {
      const result = await joinMember({
        memberId: memberId as Id<"networkMembers">,
        email,
      });
      if (result.success && result.credentials) {
        setCredentials({
          email: result.credentials.username,
          password: result.credentials.password,
          name: member.name,
        });
        toast.success("Member successfully joined & user account created!");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to join member");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const directChildrenCount =
    networkStats?.directChildrenCount ?? member.directChildrenCount ?? 0;
  const totalDownlines = networkStats?.totalDownlines ?? member.totalDownlines ?? 0;

  const handleResetPassword = async () => {
    setIsResetPasswordOpen(false);
    setIsResetting(true);
    try {
      const result = await resetPassword({ memberId: memberId as Id<"networkMembers"> });
      setCredentials({ email: result.email, password: result.password, name: result.name });
      toast.success("Password reset successful");
    } catch (e: any) {
      toast.error(e.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleChangeEmail = async (newEmail: string) => {
    setIsChangeEmailOpen(false);
    if (!newEmail || newEmail === member.email) return;

    setIsChangingEmail(true);
    try {
      const result = await updateEmail({ 
        memberId: memberId as Id<"networkMembers">, 
        newEmail 
      });
      setCredentials({ email: result.newEmail, password: result.password, name: result.name });
      toast.success("Email updated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to update email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleteOpen(false);
    setIsDeleting(true);
    try {
      await deleteMember({ 
        memberId: memberId as Id<"networkMembers">, 
        mode: "reconnect" // Default to reconnect to avoid cascading deletions by mistake
      });
      toast.success("Member deleted");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete member");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn(
      "fixed right-4 top-24 bottom-4 w-96 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300",
      !memberId && "hidden"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted)/0.2)]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))] font-black text-lg">
            {member.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">{member.name}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] mt-1">
              {member.roleTitle}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] p-1 bg-[hsl(var(--muted)/0.1)]">
        <button 
          onClick={() => setActiveTab("info")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all",
            activeTab === "info" ? "bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all",
            activeTab === "security" ? "bg-[hsl(var(--card))] text-red-500 shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          )}
        >
          Security
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeTab === "info" ? (
          <>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">Member Status</label>
              <div className="relative">
                <select 
                  value={member.status} 
                  disabled={isStatusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 pr-10 text-sm font-bold text-[hsl(var(--foreground))] outline-none appearance-none cursor-pointer focus:border-[hsl(var(--primary))] transition-all disabled:opacity-50"
                >
                  <option value="joined">Joined</option>
                  <option value="invited">Invited</option>
                  <option value="pending">Pending</option>
                  <option value="to-invite">To-Invite</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">Details</label>
              <InfoItem icon={<Mail size={16} />} label="Email" value={member.email || "No email"} />
              <InfoItem icon={<Globe size={16} />} label="Bonchat" value={member.bonchatUsername || "Not linked"} />
              <InfoItem icon={<Globe size={16} />} label="Yepbit" value={member.yepbitUsername || "Not linked"} />
            </div>

            <div className="p-4 rounded-2xl bg-[hsl(var(--primary)/0.03)] border border-[hsl(var(--primary)/0.1)]">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-[hsl(var(--primary))]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">Network Stats</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Direct</p>
                  <p className="text-xl font-black mt-1">{directChildrenCount}</p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Total</p>
                  <p className="text-xl font-black mt-1">{totalDownlines}</p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Invited</p>
                  <p className="text-xl font-black mt-1">{member.invitedCount || 0}</p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">Pending</p>
                  <p className="text-xl font-black mt-1">{member.pendingCount || 0}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin Actions</span>
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Use these tools to manage member access. These actions affect the authentication layer.
              </p>
            </div>

            <div className="space-y-3">
              <SecurityButton 
                icon={<Key size={18} />} 
                label="Reset Password" 
                description="Generates a new temporary password"
                onClick={() => setIsResetPasswordOpen(true)}
                loading={isResetting}
              />
              <SecurityButton 
                icon={<MailIcon size={18} />} 
                label="Change Email" 
                description="Update login and notification email"
                onClick={() => setIsChangeEmailOpen(true)}
                loading={isChangingEmail}
              />
              <SecurityButton 
                icon={<Trash2 size={18} />} 
                label="Delete Member" 
                description="Permanently purge member from system"
                variant="danger"
                onClick={() => setIsDeleteOpen(true)}
                loading={isDeleting}
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isResetPasswordOpen}
        title="Reset Password"
        description={`Are you sure you want to reset the password for ${member.name}? The user will be logged out immediately.`}
        onConfirm={handleResetPassword}
        onCancel={() => setIsResetPasswordOpen(false)}
      />

      <InputDialog
        isOpen={isChangeEmailOpen}
        title="Change Email"
        label="New Email Address"
        defaultValue={member.email || ""}
        placeholder="user@example.com"
        validate={(v) => {
          if (!v) return "Email is required";
          if (v === member.email) return "Email is unchanged";
          if (!/^\S+@\S+\.\S+$/.test(v)) return "Invalid email format";
          return null;
        }}
        onConfirm={handleChangeEmail}
        onCancel={() => setIsChangeEmailOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Member"
        description={`CRITICAL: Are you sure you want to DELETE ${member.name}? All personal data and linked accounts will be purged. This cannot be undone.`}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <CredentialsDialog
        isOpen={!!credentials}
        name={credentials?.name || ""}
        email={credentials?.email || ""}
        password={credentials?.password}
        onClose={() => setCredentials(null)}
      />

      <InputDialog
        isOpen={isJoinDialogOpen}
        title="Join Member"
        label="Enter Email for Credentials"
        defaultValue={member.email || ""}
        placeholder="user@example.com"
        validate={(v) => {
          if (!v) return "Email is required";
          if (!/^\S+@\S+\.\S+$/.test(v)) return "Invalid email format";
          return null;
        }}
        onConfirm={handleJoinMemberConfirm}
        onCancel={() => setIsJoinDialogOpen(false)}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))]">
      <div className="text-[hsl(var(--muted-foreground))]">{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function SecurityButton({ 
  icon, 
  label, 
  description, 
  onClick, 
  loading, 
  variant = "default" 
}: { 
  icon: React.ReactNode; 
  label: string; 
  description: string; 
  onClick: () => void; 
  loading?: boolean;
  variant?: "default" | "danger" 
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
        variant === "danger" 
          ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400" 
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--primary)/0.02)]"
      )}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
        variant === "danger" ? "bg-red-500/10" : "bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--primary)/0.1)] group-hover:text-[hsl(var(--primary))]"
      )}>
        {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{label}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">{description}</p>
      </div>
      <ChevronRight size={16} className="text-[hsl(var(--muted-foreground)/0.5)]" />
    </button>
  );
}
