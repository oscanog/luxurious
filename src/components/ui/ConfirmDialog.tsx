import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">{title}</h3>
            <button onClick={onCancel} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors p-1">
              <X size={20} />
            </button>
          </div>
          <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed mb-4">
            {description}
          </p>
          {children && <div className="mb-8">{children}</div>}
          <div className="flex gap-3 justify-end mt-8">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl font-bold text-[hsl(var(--foreground))] bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground)/0.2)] transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-white transition-colors",
                variant === "danger" 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-[hsl(var(--primary))] hover:opacity-90"
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
