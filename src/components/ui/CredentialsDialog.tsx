import { useState } from "react";
import { Check, Copy, Mail, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface CredentialsDialogProps {
  isOpen: boolean;
  name: string;
  email: string;
  password?: string;
  onClose: () => void;
  onSendEmail?: () => Promise<void>;
}

export function CredentialsDialog({
  isOpen,
  name,
  email,
  password,
  onClose,
  onSendEmail,
}: CredentialsDialogProps) {
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSendEmail = async () => {
    if (!onSendEmail) return;
    setIsSending(true);
    try {
      await onSendEmail();
      toast.success("Email sent successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <Check size={32} />
        </div>
        <div>
          <h4 className="text-2xl font-bold text-[hsl(var(--foreground))]">Success</h4>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Credentials generated for {name}
          </p>
        </div>
        
        <div className="p-5 rounded-[24px] bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border))] text-left space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">Email</label>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold truncate text-[hsl(var(--foreground))]">{email}</span>
              <button onClick={() => copyToClipboard(email)} className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                <Copy size={14} />
              </button>
            </div>
          </div>
          {password && (
            <>
              <div className="h-[1px] bg-[hsl(var(--border))]" />
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] block mb-1">Temporary Password</label>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">{password}</span>
                  <button onClick={() => copyToClipboard(password)} className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {onSendEmail && (
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="w-full py-3 rounded-2xl border-2 border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] text-[hsl(var(--primary))] font-bold hover:bg-[hsl(var(--primary)/0.1)] transition-colors flex items-center justify-center gap-2"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              Send via Email
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[hsl(var(--primary))] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary)/0.2)]"
          >
            Close & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
