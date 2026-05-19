import { useState, useEffect } from "react";
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
  const [emailSent, setEmailSent] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmailSent(false);
      setShowConfirmClose(false);
    }
  }, [isOpen]);

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
      setEmailSent(true);
      toast.success("Email sent successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (onSendEmail && !emailSent) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  if (showConfirmClose) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[32px] w-full max-w-xs shadow-2xl p-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-[hsl(var(--foreground))]">Credentials Not Sent</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 leading-relaxed">
              You haven't sent the credentials via email yet. Are you sure you want to close?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowConfirmClose(false);
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-destructive text-destructive-foreground font-bold hover:opacity-90 transition-opacity text-sm"
            >
              Yes, Close
            </button>
            <button
              onClick={() => setShowConfirmClose(false)}
              className="w-full py-3 rounded-2xl border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] font-bold hover:bg-[hsl(var(--muted))] transition-colors text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#131d31] border border-slate-800 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <Check size={24} />
        </div>
        <div>
          <h4 className="text-xl font-bold text-white">Account Created</h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Success! <span className="text-white font-bold">{name}</span> has been registered. Share these credentials with them:
          </p>
        </div>
        
        <div className="p-5 rounded-[24px] bg-[#0f172a]/60 border border-slate-800 text-left space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Username</label>
            <span className="font-mono text-sm font-bold text-amber-400 block truncate">{email}</span>
          </div>
          <div className="h-[1px] bg-slate-800" />
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Password</label>
            <span className="font-mono text-sm font-bold text-amber-400 block truncate">{password || "—"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {onSendEmail && (
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="w-full py-3 rounded-2xl border border-amber-500/40 hover:border-amber-500/80 bg-transparent text-amber-500 hover:text-amber-400 font-bold transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send via Email
            </button>
          )}
          <button
            onClick={() => copyToClipboard(`Username: ${email}\nPassword: ${password || ""}`)}
            className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Copy size={16} />
            Copy Credentials
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm text-slate-400 hover:text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
