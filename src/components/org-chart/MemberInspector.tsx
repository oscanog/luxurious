import { useState, useEffect } from "react";
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
  ChevronRight,
  Pencil,
  MapPin,
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
  const [activeTab, setActiveTab] = useState<"info" | "security" | "address">(
    "info",
  );
  const [isResetting, setIsResetting] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password?: string;
    name: string;
  } | null>(null);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [directLimitInput, setDirectLimitInput] = useState("");
  const [isLimitSaving, setIsLimitSaving] = useState(false);

  const member = useQuery(
    api.network.getMember,
    memberId ? { memberId: memberId as Id<"networkMembers"> } : "skip",
  );
  const adminContext = useQuery(api.admin.getAdminContext);

  const resetPassword = useAction(api.networkMembers.resetMemberPassword);
  const updateEmail = useAction(api.admin.updateUserEmail);
  const deleteMember = useMutation(api.network.deleteMember);
  const updateStatus = useMutation(api.networkMembers.updateMemberStatus);
  const updateInvestmentDate = useMutation(
    api.networkMembers.updateMemberInvestmentDate,
  );
  const updateLocation = useMutation(api.networkMembers.updateMemberLocation);
  const setMemberDirectLimit = useMutation(api.network.setMemberDirectLimit);
  const joinMember = useAction(api.networkMembers.joinExistingMember);

  const assetLogs = useQuery(
    api.network.getMemberAssets,
    memberId ? { memberId: memberId as Id<"networkMembers"> } : "skip",
  );
  const addAsset = useMutation(api.network.addMemberAsset);
  const deleteAsset = useMutation(api.network.deleteMemberAsset);
  const updateAsset = useMutation(api.network.updateMemberAsset);

  const [assetPage, setAssetPage] = useState(0);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [newAssetValue, setNewAssetValue] = useState("");
  const [newAssetCurrency, setNewAssetCurrency] = useState("USD");
  const [isAssetSaving, setIsAssetSaving] = useState(false);

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editAssetValue, setEditAssetValue] = useState("");
  const [editAssetCurrency, setEditAssetCurrency] = useState("USD");
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    city: "",
    province: "",
    country: "",
    locationAddress: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (member) {
      setAddressForm({
        city: member.city || "",
        province: member.province || "",
        country: member.country || "",
        locationAddress: member.locationAddress || "",
        latitude: member.latitude,
        longitude: member.longitude,
      });
      setDirectLimitInput(
        String(member.directLimitOverride ?? member.effectiveDirectLimit ?? 3),
      );
    }
  }, [member]);

  const handleDeleteAsset = async () => {
    if (!deletingAssetId) return;
    try {
      await deleteAsset({ assetId: deletingAssetId as Id<"memberAssets"> });
      toast.success("Asset log deleted successfully");
      setDeletingAssetId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset log");
    }
  };

  const handleEditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetId || !editAssetValue.trim()) return;
    const value = parseFloat(editAssetValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid numeric value");
      return;
    }
    try {
      await updateAsset({
        assetId: editingAssetId as Id<"memberAssets">,
        value,
        currency: editAssetCurrency,
      });
      toast.success("Asset log updated successfully");
      setIsEditAssetOpen(false);
      setEditingAssetId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update asset log");
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !newAssetValue.trim()) return;
    const value = parseFloat(newAssetValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid numeric value");
      return;
    }
    setIsAssetSaving(true);
    try {
      await addAsset({
        memberId: memberId as Id<"networkMembers">,
        name: "Asset",
        value,
        currency: newAssetCurrency,
      });
      toast.success("Asset log added successfully");
      setIsAddAssetOpen(false);
      setNewAssetValue("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add asset");
    } finally {
      setIsAssetSaving(false);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTimeSinceJoined = (timestamp?: number): string | null => {
    if (!timestamp) return null;
    const diffMs = Date.now() - timestamp;
    if (diffMs < 0) return "Joined just now";

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Joined just now";
    if (diffMins < 60)
      return `Joined ${diffMins} min${diffMins > 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `Joined ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Joined ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isDateUpdating, setIsDateUpdating] = useState(false);

  if (!memberId || !member) return null;

  const handleInvestmentDateChange = async (dateStr: string) => {
    setIsDateUpdating(true);
    try {
      const timestamp = dateStr ? new Date(dateStr).getTime() : undefined;
      await updateInvestmentDate({
        memberId: memberId as Id<"networkMembers">,
        investmentStartedAt: timestamp,
      });
      toast.success("Investment start date updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update investment start date");
    } finally {
      setIsDateUpdating(false);
    }
  };

  const handleStatusChange = async (
    newStatus: "joined" | "invited" | "pending" | "to-invite",
  ) => {
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
  const totalDownlines =
    networkStats?.totalDownlines ?? member.totalDownlines ?? 0;
  const effectiveDirectLimit = member.effectiveDirectLimit ?? 3;
  const canManageMember = member.canManage !== false;
  const statusCounts = member.directStatusCounts ?? {
    joined: 0,
    invited: member.invitedCount ?? 0,
    pending: member.pendingCount ?? 0,
    "to-invite": 0,
  };

  const handleDirectLimitSave = async () => {
    const trimmed = directLimitInput.trim();
    const nextLimit = trimmed ? Number(trimmed) : null;
    if (
      nextLimit !== null &&
      (!Number.isFinite(nextLimit) || nextLimit < directChildrenCount)
    ) {
      toast.error("Limit must be at least current direct count");
      return;
    }

    setIsLimitSaving(true);
    try {
      await setMemberDirectLimit({
        memberId: memberId as Id<"networkMembers">,
        directLimitOverride: nextLimit,
      });
      toast.success("Direct limit updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update direct limit");
    } finally {
      setIsLimitSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResetPasswordOpen(false);
    setIsResetting(true);
    try {
      const result = await resetPassword({
        memberId: memberId as Id<"networkMembers">,
      });
      setCredentials({
        email: result.email,
        password: result.password,
        name: result.name,
      });
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
      await updateEmail({
        memberId: memberId as Id<"networkMembers">,
        newEmail,
      });
      toast.success("Email changed. User must sign in again.");
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
        mode: "reconnect", // Default to reconnect to avoid cascading deletions by mistake
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
    <div
      className={cn(
        "fixed right-4 top-24 bottom-4 w-96 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[32px] shadow-2xl z-[60] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300",
        !memberId && "hidden",
      )}
    >
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
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--border))] p-1 bg-[hsl(var(--muted)/0.1)]">
        <button
          onClick={() => setActiveTab("info")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all",
            activeTab === "info"
              ? "bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("address")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all",
            activeTab === "address"
              ? "bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          Address
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all",
            activeTab === "security"
              ? "bg-[hsl(var(--card))] text-red-500 shadow-sm"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          Security
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeTab === "info" ? (
          <>
            {!canManageMember && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] font-black uppercase tracking-widest block mb-1">
                  Read Only
                </span>
                <p className="text-xs font-semibold leading-relaxed">
                  You can view this member, but only Level 2 admins or owners
                  can edit it.
                </p>
              </div>
            )}
            {member.latestAsset && (
              <div className="p-4 rounded-2xl bg-[hsl(43_96%_48%/0.08)] border border-[hsl(43_96%_48%/0.2)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(43_96%_48%)] block mb-1">
                    Latest Asset
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[hsl(var(--foreground))]">
                      {member.latestAsset.currency}{" "}
                      {member.latestAsset.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] shrink-0">
                  {formatRelativeTime(member.latestAsset.createdAt)}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">
                Member Status
              </label>
              <div className="relative">
                <select
                  value={member.status}
                  disabled={isStatusUpdating || !canManageMember}
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
              <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">
                Investment Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={
                    member.investmentStartedAt
                      ? new Date(member.investmentStartedAt)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => handleInvestmentDateChange(e.target.value)}
                  disabled={isDateUpdating || !canManageMember}
                  className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 text-sm font-bold text-[hsl(var(--foreground))] outline-none appearance-none cursor-pointer focus:border-[hsl(var(--primary))] transition-all disabled:opacity-50 min-h-[52px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">
                Details
              </label>
              <InfoItem
                icon={<Mail size={16} />}
                label="Email"
                value={member.email || "No email"}
              />
              {(member.city || member.country) && (
                <InfoItem
                  icon={<MapPin size={16} />}
                  label="Location"
                  value={[member.city, member.province, member.country]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
              <InfoItem
                icon={<Globe size={16} />}
                label="Bonchat"
                value={member.bonchatUsername || "Not linked"}
              />
              <InfoItem
                icon={<Globe size={16} />}
                label="Yepbit"
                value={member.yepbitUsername || "Not linked"}
              />
            </div>

            <div className="p-4 rounded-2xl bg-[hsl(var(--primary)/0.03)] border border-[hsl(var(--primary)/0.1)]">
              <div className="flex items-center gap-2 mb-3">
                <Settings size={14} className="text-[hsl(var(--primary))]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">
                  Network Stats
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                    Direct
                  </p>
                  <p className="text-xl font-black mt-1">
                    {directChildrenCount}/{effectiveDirectLimit}
                  </p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                    Total
                  </p>
                  <p className="text-xl font-black mt-1">{totalDownlines}</p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                    Invited
                  </p>
                  <p className="text-xl font-black mt-1">
                    {statusCounts.invited || 0}
                  </p>
                </div>
                <div className="bg-[hsl(var(--card))] p-3 rounded-xl border border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase">
                    Pending
                  </p>
                  <p className="text-xl font-black mt-1">
                    {statusCounts.pending || 0}
                  </p>
                </div>
              </div>
              {adminContext?.canManageCapacity && (
                <div className="mt-4 pt-4 border-t border-[hsl(var(--border)/0.6)]">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-2">
                    Direct Limit
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={directChildrenCount}
                      value={directLimitInput}
                      onChange={(e) => setDirectLimitInput(e.target.value)}
                      className="min-w-0 flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-xs font-bold outline-none focus:border-[hsl(var(--primary))]"
                    />
                    <button
                      onClick={handleDirectLimitSave}
                      disabled={isLimitSaving}
                      className="px-4 py-3 rounded-xl bg-[hsl(var(--primary))] text-black text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                    >
                      {isLimitSaving ? "Saving" : "Save"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Asset Logs Section */}
            <div className="space-y-4 pt-4 border-t border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Asset History Logs
                </label>
                <button
                  onClick={() => setIsAddAssetOpen(!isAddAssetOpen)}
                  disabled={!canManageMember}
                  className="text-xs font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:underline"
                >
                  {isAddAssetOpen ? "Cancel" : "Add Asset"}
                </button>
              </div>

              {isAddAssetOpen && (
                <form
                  onSubmit={handleAddAsset}
                  className="p-4 rounded-2xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))] space-y-4"
                >
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">
                      Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 5000"
                      required
                      value={newAssetValue}
                      onChange={(e) => setNewAssetValue(e.target.value)}
                      className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-xs outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">
                        Currency
                      </label>
                      <select
                        value={newAssetCurrency}
                        onChange={(e) => setNewAssetCurrency(e.target.value)}
                        className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-xs outline-none cursor-pointer focus:border-[hsl(var(--primary))]"
                      >
                        <option value="USD">USD</option>
                        <option value="PHP">PHP</option>
                        <option value="EUR">EUR</option>
                        <option value="BTC">BTC</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isAssetSaving}
                      className="px-5 py-3 bg-[hsl(var(--primary))] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAssetSaving ? "Saving..." : "Save Log"}
                    </button>
                  </div>
                </form>
              )}

              {/* Paginated Asset List */}
              <div className="space-y-2">
                {!assetLogs || assetLogs.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] px-1 py-2 italic">
                    No assets recorded yet.
                  </p>
                ) : (
                  <>
                    {assetLogs
                      .slice(assetPage * 5, (assetPage + 1) * 5)
                      .map((log) => (
                        <div
                          key={log._id}
                          className="p-3.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-between text-xs group"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[hsl(var(--foreground))]">
                              {log.currency} {log.value.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">
                              {formatRelativeTime(log.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canManageMember && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingAssetId(log._id);
                                    setEditAssetValue(log.value.toString());
                                    setEditAssetCurrency(log.currency);
                                    setIsEditAssetOpen(true);
                                  }}
                                  className="p-1 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                  title="Edit Log"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => setDeletingAssetId(log._id)}
                                  className="p-1 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors"
                                  title="Delete Log"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Pagination Controls */}
                    {assetLogs.length > 5 && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          disabled={assetPage === 0}
                          onClick={() => setAssetPage(assetPage - 1)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-lg hover:text-[hsl(var(--foreground))] disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">
                          Page {assetPage + 1} of{" "}
                          {Math.ceil(assetLogs.length / 5)}
                        </span>
                        <button
                          disabled={(assetPage + 1) * 5 >= assetLogs.length}
                          onClick={() => setAssetPage(assetPage + 1)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded-lg hover:text-[hsl(var(--foreground))] disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}

                {member.investmentStartedAt && (
                  <div className="pt-3 mt-2 flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))] font-semibold border-t border-[hsl(var(--border)/0.5)]">
                    <span>
                      Start Date:{" "}
                      {new Date(
                        member.investmentStartedAt,
                      ).toLocaleDateString()}
                    </span>
                    <span className="text-[hsl(var(--primary))] font-bold">
                      {formatTimeSinceJoined(member.investmentStartedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === "address" ? (
          <AddressTabContent
            key={memberId}
            addressForm={addressForm}
            setAddressForm={setAddressForm}
            isGeocoding={isGeocoding}
            setIsGeocoding={setIsGeocoding}
            isAddressSaving={isAddressSaving}
            onSave={async (overrides) => {
              setIsAddressSaving(true);
              try {
                await updateLocation({
                  memberId: memberId as Id<"networkMembers">,
                  city: overrides?.city ?? addressForm.city ?? undefined,
                  province:
                    overrides?.province ?? addressForm.province ?? undefined,
                  country:
                    overrides?.country ?? addressForm.country ?? undefined,
                  locationAddress:
                    overrides?.locationAddress ??
                    addressForm.locationAddress ??
                    undefined,
                  latitude: overrides?.latitude ?? addressForm.latitude,
                  longitude: overrides?.longitude ?? addressForm.longitude,
                });
                toast.success("Location updated successfully!");
              } catch (e: any) {
                toast.error(e.message || "Failed to update location");
              } finally {
                setIsAddressSaving(false);
              }
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Admin Actions
                </span>
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Use these tools to manage member access. These actions affect
                the authentication layer.
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
                description="Update login email without changing password"
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

      <ConfirmDialog
        isOpen={!!deletingAssetId}
        title="Delete Asset Log"
        description="Are you sure you want to delete this asset log? This cannot be undone."
        variant="danger"
        onConfirm={handleDeleteAsset}
        onCancel={() => setDeletingAssetId(null)}
      />

      {isEditAssetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-base font-black uppercase tracking-wider mb-2">
                Edit Asset Log
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
                Update this logged asset value and currency.
              </p>

              <form onSubmit={handleEditAssetSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAssetValue}
                    onChange={(e) => setEditAssetValue(e.target.value)}
                    className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-xs outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">
                    Currency
                  </label>
                  <select
                    value={editAssetCurrency}
                    onChange={(e) => setEditAssetCurrency(e.target.value)}
                    className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-xs outline-none cursor-pointer focus:border-[hsl(var(--primary))]"
                  >
                    <option value="USD">USD</option>
                    <option value="PHP">PHP</option>
                    <option value="EUR">EUR</option>
                    <option value="BTC">BTC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-[hsl(var(--border))]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditAssetOpen(false);
                      setEditingAssetId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-xs font-black uppercase tracking-widest hover:bg-[hsl(var(--muted))] active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-black text-xs font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))]">
      <div className="text-[hsl(var(--muted-foreground))]">{icon}</div>
      <div>
        <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
          {label}
        </p>
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
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
        variant === "danger"
          ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--primary)/0.02)]",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          variant === "danger"
            ? "bg-red-500/10"
            : "bg-[hsl(var(--muted))] group-hover:bg-[hsl(var(--primary)/0.1)] group-hover:text-[hsl(var(--primary))]",
        )}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{label}</p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
          {description}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="text-[hsl(var(--muted-foreground)/0.5)]"
      />
    </button>
  );
}

function InspectorInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-sm font-semibold outline-none focus:border-[hsl(var(--primary))] transition-all"
      />
    </div>
  );
}

function InspectorSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string | React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1 relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block px-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-3 text-sm font-semibold outline-none focus:border-[hsl(var(--primary))] transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-[34px] pointer-events-none text-[hsl(var(--muted-foreground))]">
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  );
}

function AddressTabContent({
  addressForm,
  setAddressForm,
  isGeocoding,
  setIsGeocoding,
  isAddressSaving,
  onSave,
}: {
  addressForm: any;
  setAddressForm: React.Dispatch<React.SetStateAction<any>>;
  isGeocoding: boolean;
  setIsGeocoding: (val: boolean) => void;
  isAddressSaving: boolean;
  onSave: (overrides?: any) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(() =>
    addressForm.country === "Canada" ? "CA" : "PH",
  );

  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [barangay, setBarangay] = useState(() => {
    const parts = (addressForm.locationAddress || "")
      .split(",")
      .map((s: string) => s.trim());
    return parts[0] || "";
  });
  const [address1, setAddress1] = useState(() => {
    const parts = (addressForm.locationAddress || "")
      .split(",")
      .map((s: string) => s.trim());
    return parts[1] || "";
  });
  const [address2, setAddress2] = useState(() => {
    const parts = (addressForm.locationAddress || "")
      .split(",")
      .map((s: string) => s.trim());
    return parts.length >= 3 ? parts[2] || "" : "";
  });

  // Load JSON based on country
  useEffect(() => {
    const folder = selectedCountry === "CA" ? "ca" : "ph";
    fetch(`/data/${folder}/region.json`)
      .then((res) => res.json())
      .then(setRegions)
      .catch(() => setRegions([]));
    fetch(`/data/${folder}/province.json`)
      .then((res) => res.json())
      .then(setProvinces)
      .catch(() => setProvinces([]));
    fetch(`/data/${folder}/city.json`)
      .then((res) => res.json())
      .then(setCities)
      .catch(() => setCities([]));
  }, [selectedCountry]);

  // Match existing province to code
  useEffect(() => {
    if (addressForm.province && provinces.length > 0) {
      const p = provinces.find((p) => p.province_name === addressForm.province);
      if (p) {
        setSelectedProvince(p.province_code);
        setSelectedRegion(p.region_code);
      }
    }
  }, [addressForm.province, provinces]);

  // Match existing city to code
  useEffect(() => {
    if (addressForm.city && cities.length > 0) {
      const c = cities.find((c) => c.city_name === addressForm.city);
      if (c) setSelectedCity(c.city_code);
    }
  }, [addressForm.city, cities]);

  const filteredProvinces = provinces.filter(
    (p) => p.region_code === selectedRegion,
  );
  const filteredCities = cities.filter(
    (c) => c.province_code === selectedProvince,
  );

  return (
    <div className="space-y-6">
      <div className="flex bg-[hsl(var(--muted))] p-1 rounded-xl">
        <button
          onClick={() => {
            setSelectedCountry("PH");
            setSelectedRegion("");
            setSelectedProvince("");
            setSelectedCity("");
            setAddressForm((prev: any) => ({
              ...prev,
              country: "Philippines",
              province: "",
              city: "",
            }));
          }}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            selectedCountry === "PH"
              ? "bg-[hsl(var(--card))] shadow text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          🇵🇭 Philippines
        </button>
        <button
          onClick={() => {
            setSelectedCountry("CA");
            setSelectedRegion("");
            setSelectedProvince("");
            setSelectedCity("");
            setAddressForm((prev: any) => ({
              ...prev,
              country: "Canada",
              province: "",
              city: "",
            }));
          }}
          className={cn(
            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
            selectedCountry === "CA"
              ? "bg-[hsl(var(--card))] shadow text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
          )}
        >
          🇨🇦 Canada
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-[hsl(var(--primary)/0.05)] border border-[hsl(var(--primary)/0.1)]">
        <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))] block mb-1">
          Geographic Info
        </span>
        <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-relaxed">
          Select your address details. Dropdowns will cascade automatically.
        </p>
      </div>

      <div className="space-y-4">
        <InspectorSelect
          label="Region"
          value={selectedRegion}
          onChange={(v) => {
            setSelectedRegion(v);
            setSelectedProvince("");
            setSelectedCity("");
            setAddressForm((prev: any) => ({
              ...prev,
              province: "",
              city: "",
            }));
          }}
          options={regions.map((r) => ({
            value: r.region_code,
            label: r.region_name,
          }))}
          placeholder="Select Region"
        />

        <div className="grid grid-cols-2 gap-4">
          <InspectorSelect
            label="Province"
            value={selectedProvince}
            disabled={!selectedRegion}
            onChange={(v) => {
              setSelectedProvince(v);
              const p = provinces.find((x) => x.province_code === v);
              setAddressForm((prev: any) => ({
                ...prev,
                province: p?.province_name || "",
                city: "",
              }));
              setSelectedCity("");
            }}
            options={filteredProvinces.map((p) => ({
              value: p.province_code,
              label: p.province_name,
            }))}
            placeholder="Select Province"
          />
          <InspectorSelect
            label="City / Municipality"
            value={selectedCity}
            disabled={!selectedProvince}
            onChange={(v) => {
              setSelectedCity(v);
              const c = cities.find((x) => x.city_code === v);
              setAddressForm((prev: any) => ({
                ...prev,
                city: c?.city_name || "",
              }));
            }}
            options={filteredCities.map((c) => ({
              value: c.city_code,
              label: c.city_name,
            }))}
            placeholder="Select City"
          />
        </div>

        <InspectorInput
          label={
            <span>
              Barangay{" "}
              <i className="text-[9px] font-normal lowercase">(optional)</i>
            </span>
          }
          value={barangay}
          onChange={(v) => {
            setBarangay(v);
            const combined = [v, address1, address2].filter(Boolean).join(", ");
            setAddressForm((prev: any) => ({
              ...prev,
              locationAddress: combined,
            }));
          }}
          placeholder="e.g. Brgy. 1"
        />

        <div className="grid grid-cols-2 gap-4">
          <InspectorInput
            label={
              <span>
                Address 1{" "}
                <i className="text-[9px] font-normal lowercase">(optional)</i>
              </span>
            }
            value={address1}
            onChange={(v) => {
              setAddress1(v);
              const combined = [barangay, v, address2]
                .filter(Boolean)
                .join(", ");
              setAddressForm((prev: any) => ({
                ...prev,
                locationAddress: combined,
              }));
            }}
            placeholder="House/Lot No., Street"
          />
          <InspectorInput
            label={
              <span>
                Address 2{" "}
                <i className="text-[9px] font-normal lowercase">(optional)</i>
              </span>
            }
            value={address2}
            onChange={(v) => {
              setAddress2(v);
              const combined = [barangay, address1, v]
                .filter(Boolean)
                .join(", ");
              setAddressForm((prev: any) => ({
                ...prev,
                locationAddress: combined,
              }));
            }}
            placeholder="Subdivision, Building"
          />
        </div>
      </div>

      <div className="flex pt-2">
        <button
          type="button"
          onClick={async () => {
            // Resolve city/province from local dropdown state as source of truth
            const resolvedProvince =
              provinces.find((p) => p.province_code === selectedProvince)
                ?.province_name || addressForm.province;
            const resolvedCity =
              cities.find((c) => c.city_code === selectedCity)?.city_name ||
              addressForm.city;

            if (!resolvedCity || !resolvedProvince) {
              toast.error("Please select a City and Province first");
              return;
            }

            // Sync addressForm with resolved values
            setAddressForm((prev: any) => ({
              ...prev,
              city: resolvedCity,
              province: resolvedProvince,
            }));

            const locationAddress = [barangay, address1, address2]
              .filter(Boolean)
              .join(", ");

            const countryName =
              selectedCountry === "CA" ? "Canada" : "Philippines";

            // Cascading geocode queries: specific → broad. Always resolves a pin.
            const queries = [
              [barangay, resolvedCity, resolvedProvince, countryName]
                .filter(Boolean)
                .join(", "),
              [resolvedCity, resolvedProvince, countryName]
                .filter(Boolean)
                .join(", "),
              [resolvedProvince, countryName].filter(Boolean).join(", "),
            ];

            setIsGeocoding(true);
            let lat: number | undefined = undefined;
            let lon: number | undefined = undefined;

            try {
              for (const q of queries) {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
                );
                const data = await res.json();
                if (data && data.length > 0) {
                  lat = parseFloat(data[0].lat);
                  lon = parseFloat(data[0].lon);
                  break;
                }
              }

              if (lat != null && lon != null) {
                setAddressForm((p: any) => ({
                  ...p,
                  country: countryName,
                  latitude: lat,
                  longitude: lon,
                }));
              } else {
                toast.error(
                  "Could not resolve location. Please check your address.",
                );
                setIsGeocoding(false);
                return;
              }
            } catch (e) {
              toast.error(
                "Geocoding failed. Check your connection and try again.",
              );
              setIsGeocoding(false);
              return;
            } finally {
              setIsGeocoding(false);
            }

            onSave({
              country: countryName,
              city: resolvedCity,
              province: resolvedProvince,
              locationAddress,
              latitude: lat,
              longitude: lon,
            });
          }}
          disabled={isAddressSaving || isGeocoding}
          className="w-full py-3 bg-[hsl(var(--primary))] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-[hsl(var(--primary)/0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAddressSaving || isGeocoding ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <MapPin size={16} />
          )}
          {isGeocoding
            ? "Resolving Location..."
            : isAddressSaving
              ? "Saving..."
              : "Save Address"}
        </button>
      </div>
    </div>
  );
}
