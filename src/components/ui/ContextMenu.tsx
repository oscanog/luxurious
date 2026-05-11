import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    // Adjust position if menu goes off screen
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const padding = 10;
      let nextX = x;
      let nextY = y;

      if (x + rect.width > window.innerWidth - padding) {
        nextX = x - rect.width;
      }
      if (y + rect.height > window.innerHeight - padding) {
        nextY = y - rect.height;
      }
      
      setPosition({ x: nextX, y: nextY });
    }
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[999] min-w-[160px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in duration-100"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          disabled={item.disabled}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-colors ${
            item.disabled 
              ? "opacity-50 cursor-not-allowed" 
              : item.variant === "danger"
                ? "text-red-500 hover:bg-red-500/10"
                : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
          }`}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// Hook for using context menu
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const ContextMenuComponent = contextMenu ? (
    <ContextMenu 
      x={contextMenu.x} 
      y={contextMenu.y} 
      items={contextMenu.items} 
      onClose={closeContextMenu} 
    />
  ) : null;

  return { handleContextMenu, ContextMenuComponent, closeContextMenu };
}
