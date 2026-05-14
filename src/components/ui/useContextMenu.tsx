import { useCallback, useState } from "react";
import { ContextMenu, ContextMenuItem } from "./ContextMenu";

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, items });
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
