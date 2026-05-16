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
  Copy,
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

type Step = "type" | "identity" | "contact" | "platform" | "success";

export function AddMemberStepper({ parentId, isOpen, onClose, onSuccess }: AddMemberStepperProps) {
  const [step, setStep] = useState<Step>("type");
  const [memberType, setMemberType] = useState<"joined" | "to-invite">("joined");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roleTitle: "Member",
    birthday: "",
    bonchatId: "",
    yepbitId: "",
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
        setFormData(prev => ({ ...prev, ...parsed.formData }));
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
      setStep("platform");
    }
  };

  const handleBack = () => {
    if (step === "identity") setStep("type");
    else if (step === "contact") setStep("identity");
    else if (step === "platform") setStep("contact");
  };

  const handleSubmit = async () => {
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
        yepbitId: formData.yepbitId || undefined,
        type: memberType as any,
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

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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
                Step {step === "type" ? 1 : step === "identity" ? 2 : step === "contact" ? 3 : step === "platform" ? 4 : 5} of 5
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
                />
                {formData.birthday && calculateAge(formData.birthday) && (
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 ml-1">
                    Age: {calculateAge(formData.birthday)} years
                  </p>
                )}
              </div>
              <InputGroup 
                label="Role Title" 
                value={formData.roleTitle} 
                onChange={v => setFormData(p => ({ ...p, roleTitle: v }))}
              />
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
              />
              <InputGroup 
                label="Phone Number" 
                type="tel" 
                icon={<Phone size={16} />}
                value={formData.phone} 
                onChange={v => setFormData(p => ({ ...p, phone: v }))}
                onPaste={() => smartPaste("phone")}
              />
            </div>
          )}

          {step === "platform" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup 
                label="Bonchat ID" 
                icon={<Globe size={16} />}
                value={formData.bonchatId} 
                onChange={v => setFormData(p => ({ ...p, bonchatId: v }))}
                onPaste={() => smartPaste("bonchatId")}
              />
              <InputGroup 
                label="Yepbit ID" 
                icon={<Globe size={16} />}
                value={formData.yepbitId} 
                onChange={v => setFormData(p => ({ ...p, yepbitId: v }))}
                onPaste={() => smartPaste("yepbitId")}
              />
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
              {step === "platform" ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>Complete & Send <Send size={18} /></>
                  )}
                </button>
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
  onPaste 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string;
  icon?: React.ReactNode;
  onPaste?: () => void;
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
          className={cn(
            "w-full rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] py-3.5 pr-4 text-sm font-semibold outline-none transition-all focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)]",
            icon ? "pl-11" : "pl-4"
          )}
        />
      </div>
    </div>
  );
}
