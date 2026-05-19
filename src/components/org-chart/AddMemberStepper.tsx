import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Check, 
  Send,
  Zap,
  UserPlus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { CredentialsDialog } from "../ui/CredentialsDialog";

interface AddMemberStepperProps {
  parentId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "type" | "identity" | "contact" | "platform" | "work" | "summary" | "success";

export function AddMemberStepper({ parentId, isOpen, onClose, onSuccess }: AddMemberStepperProps) {
  const [step, setStep] = useState<Step>("type");
  const [memberType, setMemberType] = useState<"joined" | "to-invite">("joined");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "member" as "admin" | "member",
    birthday: "",
    bonchatId: "",
    bonchatUsername: "",
    yepbitId: "",
    yepbitUsername: "",
    currentWork: "",
    investmentStartedAt: "",
  });
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteMember = useAction(api.networkMembers.addMember);

  // Auto-save logic
  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(`draft_onboarding_${parentId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const restoredFormData = { ...parsed.formData };
        if (restoredFormData.roleTitle) {
          restoredFormData.role = restoredFormData.roleTitle.toLowerCase() === "admin" ? "admin" : "member";
          delete restoredFormData.roleTitle;
        }
        setFormData(prev => ({ ...prev, ...restoredFormData }));
        setStep(parsed.step);
        setMemberType(parsed.memberType);
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, [isOpen, parentId]);

  useEffect(() => {
    if (step !== "success" && isOpen) {
      localStorage.setItem(`draft_onboarding_${parentId}`, JSON.stringify({ formData, step, memberType }));
    }
  }, [formData, step, memberType, parentId, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === "type") setStep("identity");
    else if (step === "identity") {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        toast.error("First Name and Last Name are required");
        return;
      }
      setStep("contact");
    }
    else if (step === "contact") {
      if (memberType === "joined" && !formData.email.trim()) {
        toast.error("Email is required for Full Members");
        return;
      }
      if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        toast.error("Invalid email format");
        return;
      }
      if (memberType === "joined") {
        setStep("platform");
      } else {
        setStep("work");
      }
    }
    else if (step === "platform") {
      setStep("work");
    }
    else if (step === "work") {
      if (memberType === "joined" && !formData.investmentStartedAt) {
        toast.error("Investment Start Date is required");
        return;
      }
      setStep("summary");
    }
  };

  const handleBack = () => {
    if (step === "identity") setStep("type");
    else if (step === "contact") setStep("identity");
    else if (step === "platform") setStep("contact");
    else if (step === "work") {
      if (memberType === "joined") {
        setStep("platform");
      } else {
        setStep("contact");
      }
    }
    else if (step === "summary") setStep("work");
  };

  const handleSubmit = async () => {
    if (memberType === "joined" && !formData.investmentStartedAt) {
      toast.error("Investment Start Date is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await inviteMember({
        parentId: parentId as any,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        birthday: formData.birthday || undefined,
        bonchatId: formData.bonchatId || undefined,
        bonchatUsername: formData.bonchatUsername || undefined,
        yepbitId: formData.yepbitId || undefined,
        yepbitUsername: formData.yepbitUsername || undefined,
        type: memberType as any,
        role: formData.role,
        currentWork: formData.currentWork || undefined,
        investmentStartedAt: formData.investmentStartedAt ? new Date(formData.investmentStartedAt).getTime() : undefined,
      });

      if (result.credentials) {
        setCredentials({ 
          email: result.credentials.username, 
          password: result.credentials.password 
        });
        setStep("success");
        localStorage.removeItem(`draft_onboarding_${parentId}`);
        onSuccess?.();
      } else {
        toast.success("Member added successfully");
        onClose();
        localStorage.removeItem(`draft_onboarding_${parentId}`);
        onSuccess?.();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const smartPaste = async (field: keyof typeof formData) => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData(prev => ({ ...prev, [field]: text.trim() }));
      toast.success(`Pasted into ${field}`);
    } catch (e) {
      toast.error("Clipboard access denied");
    }
  };

  const calculateAge = (birthdayStr: string) => {
    if (!birthdayStr) return null;
    const birthday = new Date(birthdayStr);
    if (isNaN(birthday.getTime())) return null;
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    return age > 0 ? age : null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted)/0.2)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center text-white shadow-lg shadow-[hsl(var(--primary)/0.2)]">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-sm">Add New Member</h3>
              <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                {step === "type" ? "select flow" : step === "success" ? "Success" : (
                  memberType === "joined" 
                    ? `Step ${step === "identity" ? 1 : step === "contact" ? 2 : step === "platform" ? 3 : step === "work" ? 4 : 5} of 5`
                    : `Step ${step === "identity" ? 1 : step === "contact" ? 2 : step === "work" ? 3 : 4} of 4`
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {step === "type" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-8">
                <h4 className="text-xl font-bold">What are we adding?</h4>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Choose the type of membership to start with.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button 
                  onClick={() => setMemberType("joined")}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all text-center",
                    memberType === "joined" 
                      ? "bg-[hsl(var(--primary)/0.05)] border-[hsl(var(--primary))] shadow-xl" 
                      : "bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.3)]"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors", memberType === "joined" ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]")}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Full Member</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 uppercase tracking-wider">Ready to trade</p>
                  </div>
                </button>
                <button 
                  onClick={() => setMemberType("to-invite")}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all text-center",
                    memberType === "to-invite" 
                      ? "bg-[hsl(var(--primary)/0.05)] border-[hsl(var(--primary))] shadow-xl" 
                      : "bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.3)]"
                  )}
                >
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-colors", memberType === "to-invite" ? "bg-[hsl(var(--primary))] text-white" : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]")}>
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Prospect</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 uppercase tracking-wider">In-discussion</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "identity" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  label="First Name" 
                  value={formData.firstName} 
                  onChange={v => setFormData(p => ({ ...p, firstName: v }))}
                  onPaste={() => smartPaste("firstName")}
                />
                <InputGroup 
                  label="Last Name" 
                  value={formData.lastName} 
                  onChange={v => setFormData(p => ({ ...p, lastName: v }))}
                  onPaste={() => smartPaste("lastName")}
                />
              </div>
              <div>
                <InputGroup 
                  label="Birthday" 
                  type="date" 
                  value={formData.birthday} 
                  onChange={v => setFormData(p => ({ ...p, birthday: v }))}
                  placeholder="(optional)"
                />
                {formData.birthday && calculateAge(formData.birthday) && (
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 ml-1">
                    Age: {calculateAge(formData.birthday)} years
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] ml-1">Role Title</label>
                <div className="relative">
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as "admin" | "member" }))}
                    className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[18px] p-4 pr-10 text-sm font-semibold text-[hsl(var(--foreground))] outline-none appearance-none cursor-pointer focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] transition-all"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[hsl(var(--muted-foreground))]">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "contact" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup 
                label="Email Address" 
                type="email" 
                icon={<Mail size={16} />}
                value={formData.email} 
                onChange={v => setFormData(p => ({ ...p, email: v }))}
                onPaste={() => smartPaste("email")}
                placeholder={memberType === "to-invite" ? "(optional)" : undefined}
              />
              <InputGroup 
                label="Phone Number" 
                type="tel" 
                icon={<Phone size={16} />}
                value={formData.phone} 
                onChange={v => setFormData(p => ({ ...p, phone: v }))}
                onPaste={() => smartPaste("phone")}
                placeholder="(optional)"
              />
            </div>
          )}

          {step === "platform" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  label="Bonchat ID" 
                  icon={<Globe size={16} />}
                  value={formData.bonchatId} 
                  onChange={v => setFormData(p => ({ ...p, bonchatId: v }))}
                  onPaste={() => smartPaste("bonchatId")}
                  placeholder="(optional)"
                />
                <InputGroup 
                  label="Bonchat Username" 
                  value={formData.bonchatUsername} 
                  onChange={v => setFormData(p => ({ ...p, bonchatUsername: v }))}
                  onPaste={() => smartPaste("bonchatUsername")}
                  placeholder="(optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                  label="Yepbit ID" 
                  icon={<Globe size={16} />}
                  value={formData.yepbitId} 
                  onChange={v => setFormData(p => ({ ...p, yepbitId: v }))}
                  onPaste={() => smartPaste("yepbitId")}
                  placeholder="(optional)"
                />
                <InputGroup 
                  label="Yepbit Username" 
                  value={formData.yepbitUsername} 
                  onChange={v => setFormData(p => ({ ...p, yepbitUsername: v }))}
                  onPaste={() => smartPaste("yepbitUsername")}
                  placeholder="(optional)"
                />
              </div>
            </div>
          )}

          {step === "work" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {memberType === "joined" && (
                <InputGroup 
                  label="Investment Start Date *"
                  type="date"
                  value={formData.investmentStartedAt} 
                  onChange={v => setFormData(p => ({ ...p, investmentStartedAt: v }))}
                />
              )}
              <InputGroup 
                label="Work Occupation" 
                value={formData.currentWork} 
                onChange={v => setFormData(p => ({ ...p, currentWork: v }))}
                onPaste={() => smartPaste("currentWork")}
                placeholder="(optional)"
              />
            </div>
          )}

          {step === "summary" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-h-[360px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem label="First Name" value={formData.firstName} />
                <SummaryItem label="Last Name" value={formData.lastName} />
                <SummaryItem label="Birthday" value={formData.birthday} />
                <SummaryItem label="Role Title" value={formData.role === "admin" ? "Admin" : "Member"} />
                <SummaryItem label="Email" value={formData.email} />
                <SummaryItem label="Phone" value={formData.phone} />
                {memberType === "joined" && (
                  <>
                    <SummaryItem label="Bonchat ID" value={formData.bonchatId} />
                    <SummaryItem label="Bonchat Username" value={formData.bonchatUsername} />
                    <SummaryItem label="Yepbit ID" value={formData.yepbitId} />
                    <SummaryItem label="Yepbit Username" value={formData.yepbitUsername} />
                  </>
                )}
                <SummaryItem label="Work Occupation" value={formData.currentWork} />
                {memberType === "joined" && (
                  <SummaryItem label="Investment Start Date" value={formData.investmentStartedAt} />
                )}
              </div>

              {memberType === "joined" && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex flex-col gap-1 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Credentials Notice</span>
                  <span>Manual email send of credentials generated is not done yet. Please note down credentials on the next screen.</span>
                </div>
              )}
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <h4 className="text-2xl font-bold">Welcome Aboard!</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Member has been added to the network.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-[hsl(var(--muted)/0.2)] border-t border-[hsl(var(--border))] flex items-center gap-3">
          {step === "success" ? (
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)]"
            >
              Finish Onboarding
            </button>
          ) : (
            <>
              {step !== "type" && (
                <button
                  onClick={handleBack}
                  className="h-12 w-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {step === "summary" ? (
                <div className="flex-1 flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 h-12 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-bold hover:bg-[hsl(var(--muted))] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-2xl bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>Create</>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 h-12 rounded-2xl bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)] flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <CredentialsDialog
        isOpen={!!credentials}
        name={`${formData.firstName} ${formData.lastName}`}
        email={credentials?.email || ""}
        password={credentials?.password}
        onClose={() => {
          setCredentials(null);
          onClose();
          onSuccess?.();
        }}
        onSendEmail={async () => {
          await new Promise(r => setTimeout(r, 1500)); // Stub for api.email.sendEmail
        }}
      />
    </div>
  );
}

function InputGroup({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  icon,
  onPaste,
  placeholder
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string;
  icon?: React.ReactNode;
  onPaste?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] ml-1">{label}</label>
        {onPaste && (
          <button 
            onClick={onPaste}
            className="text-[10px] font-bold text-[hsl(var(--primary))] hover:underline"
          >
            Paste
          </button>
        )}
      </div>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]">{icon}</div>}
        <input 
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3.5 pr-4 text-sm font-semibold outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] placeholder:italic placeholder:text-[hsl(var(--muted-foreground)/0.5)]",
            icon ? "pl-11" : "pl-4"
          )}
        />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[hsl(var(--muted)/0.15)] p-3.5 rounded-xl border border-[hsl(var(--border))]">
      <span className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">{label}</span>
      <span className="text-xs font-bold text-[hsl(var(--foreground))]">{value || "—"}</span>
    </div>
  );
}
