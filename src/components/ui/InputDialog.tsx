import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  validate?: (value: string) => string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputDialog({
  isOpen,
  title,
  label,
  placeholder = "",
  defaultValue = "",
  validate,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">{title}</h3>
            <button onClick={onCancel} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-2 mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] ml-1">
              {label}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-[18px] border bg-[hsl(var(--card))] py-3.5 px-4 text-sm font-semibold outline-none transition-all focus:ring-4",
                error 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-500" 
                  : "border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.1)]"
              )}
            />
            {error && (
              <p className="text-xs text-red-500 font-bold ml-1 animate-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl font-bold text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground)/0.2)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-[hsl(var(--primary))] hover:opacity-90 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
