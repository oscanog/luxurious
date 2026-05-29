import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { type Node } from "@xyflow/react";
import { type OrgFlowData } from "../../pages/dashboard/OrgChartPage";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon paths in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LeafletMapViewProps {
  nodes: Node<OrgFlowData>[];
  onSelectNode: (id: string) => void;
  selectedId: string | null;
}

// Custom hook to fit bounds on load
function getMarkerIcon(status: string, isViewer: boolean, isSelected: boolean, name: string, imageUrl?: string, theme?: string) {
  const isDark = theme === "dark";
  let bgColor = isDark ? "#374151" : "hsl(217 19% 27%)"; // to-invite default
  
  if (isViewer) {
    bgColor = isDark ? "#FFD700" : "hsl(43 96% 48%)";
  } else {
    switch (status) {
      case "joined":
        bgColor = isDark ? "#273B7A" : "hsl(221 83% 53%)";
        break;
      case "invited":
        bgColor = isDark ? "#FFD700" : "hsl(43 96% 48%)";
        break;
      case "pending":
        bgColor = isDark ? "#4B5563" : "hsl(215 16% 47%)";
        break;
      case "to-invite":
        bgColor = isDark ? "#374151" : "hsl(217 19% 27%)";
        break;
    }
  }

  const scale = isSelected ? 1.3 : 1;
  const avatarSize = 36 * scale;
  const pinWidth = Math.max(avatarSize, 60); // min width for label
  const pinHeight = avatarSize + 30 * scale;

  const firstName = (name || "Unknown").split(" ")[0];
  const initials = (name || "?").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  
  const avatarHtml = imageUrl 
    ? `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: ${14 * scale}px; font-weight: 900; color: white;">${initials}</div>`;

  return L.divIcon({
    className: "bg-transparent border-none",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: ${pinWidth}px; height: ${pinHeight}px; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4)); transition: transform 0.2s ease-in-out;" class="${isSelected ? 'scale-110 z-50' : ''}">
        
        <!-- Name Label -->
        <div style="background: white; color: black; padding: 2px 8px; border-radius: 4px; font-size: ${10 * scale}px; font-weight: bold; margin-bottom: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); white-space: nowrap;">
          ${firstName}
        </div>
        
        <!-- Avatar Circle -->
        <div style="width: ${avatarSize}px; height: ${avatarSize}px; border-radius: 50%; background: ${bgColor}; border: ${3 * scale}px solid ${bgColor}; display: flex; justify-content: center; align-items: center; overflow: hidden; z-index: 2; box-sizing: border-box;">
          ${avatarHtml}
        </div>
        
        <!-- Pin Stem -->
        <div style="width: ${4 * scale}px; height: ${10 * scale}px; background: ${bgColor}; margin-top: -2px; z-index: 1;"></div>
        
        <!-- Shadow Anchor -->
        <div style="width: ${12 * scale}px; height: ${4 * scale}px; background: rgba(0,0,0,0.4); border-radius: 50%; margin-top: -2px; z-index: 0;"></div>

      </div>
    `,
    iconSize: [pinWidth, pinHeight],
    iconAnchor: [pinWidth / 2, pinHeight],
    popupAnchor: [0, -pinHeight + 10],
  });
}
function MapFitter({ nodes, selectedId }: { nodes: Node<OrgFlowData>[], selectedId: string | null }) {
  const map = useMap();
  
  useEffect(() => {
    const validCoords = nodes
      .filter(n => n.data.member?.latitude != null && n.data.member?.longitude != null)
      .map(n => [n.data.member.latitude!, n.data.member.longitude!] as [number, number]);
      
    if (validCoords.length > 0 && !selectedId) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, nodes, selectedId]);

  useEffect(() => {
    if (selectedId) {
      const node = nodes.find(n => n.id === selectedId);
      if (node && node.data.member?.latitude != null && node.data.member?.longitude != null) {
        map.flyTo([node.data.member.latitude, node.data.member.longitude], 15, { duration: 1.5 });
      }
    }
  }, [selectedId, map, nodes]);

  return null;
}

function FitBoundsControl({ nodes }: { nodes: Node<OrgFlowData>[] }) {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5 p-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg rounded-[18px]">
      <button 
        onClick={() => {
          map.fitBounds([[4.5, 116.5], [21.5, 127]], { padding: [20, 20], maxZoom: 14 });
        }}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-bold hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))]"
        title="Fit Philippines"
      >
        <span>🇵🇭</span>
        <span className="hidden sm:inline">PH</span>
      </button>
      <button 
        onClick={() => {
          map.fitBounds([[41.6, -141], [83.1, -52.6]], { padding: [20, 20], maxZoom: 14 });
        }}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-bold hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))]"
        title="Fit Canada"
      >
        <span>🇨🇦</span>
        <span className="hidden sm:inline">CA</span>
      </button>
      <button 
        onClick={() => {
          const validCoords = nodes
            .filter(n => n.data.member?.latitude != null && n.data.member?.longitude != null)
            .map(n => [n.data.member.latitude!, n.data.member.longitude!] as [number, number]);
            
          if (validCoords.length > 0) {
            const bounds = L.latLngBounds(validCoords);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
          }
        }}
        className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-bold hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--foreground))]"
        title="Fit All Nodes"
      >
        <span>🌍</span>
        <span className="hidden sm:inline">World</span>
      </button>
    </div>
  );
}

export default function LeafletMapView({ nodes, onSelectNode, selectedId }: LeafletMapViewProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Basic theme detection
    const isDark = document.documentElement.classList.contains("dark") || 
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "dark" : "light");
  }, []);

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const markers = useMemo(() => {
    return nodes
      .filter(n => n.data.member?.latitude != null && n.data.member?.longitude != null)
      .map((node) => {
        const { id, data } = node;
        const { name, roleTitle, status, member } = data;
        const isSelected = selectedId === id;
        
        return (
          <Marker 
            key={id} 
            position={[member.latitude!, member.longitude!]}
            icon={getMarkerIcon(status, data.isViewer, isSelected, name, (member as any).image || (member as any).avatar, theme)}
            eventHandlers={{
              click: () => onSelectNode(id)
            }}
          >
            <Tooltip direction="top" offset={[0, -32]} opacity={1} className="luxurious-tooltip">
              <div className="flex flex-col gap-0.5 items-center justify-center">
                <span className="font-bold text-[hsl(var(--foreground))] whitespace-nowrap">{name}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))] whitespace-nowrap">{roleTitle}</span>
              </div>
            </Tooltip>
            <Popup className="luxurious-popup">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <div className="font-bold text-base leading-tight text-[hsl(var(--foreground))]">
                  {name}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  {roleTitle}
                </div>
                
                <div className="mt-2 pt-2 border-t border-[hsl(var(--border)/0.5)]">
                  <div className="text-xs text-[hsl(var(--foreground))]">
                    {member.city && member.country ? `${member.city}, ${member.country}` : (member.country || "Location Unspecified")}
                  </div>
                  {member.latestAsset && (
                    <div className="mt-2 p-2 rounded bg-[hsl(43_96%_48%/0.1)] border border-[hsl(43_96%_48%/0.2)]">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[hsl(43_96%_48%)] block">Latest Asset</span>
                      <span className="font-bold">{member.latestAsset.currency} {member.latestAsset.value.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      });
  }, [nodes, onSelectNode, selectedId]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        style={{ height: "100%", width: "100%", background: theme === "dark" ? "#0f172a" : "#f1f5f9" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={50}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 36 : count < 50 ? 42 : 48;
            return L.divIcon({
              html: `<div style="background-color: ${theme === 'dark' ? '#273B7A' : 'hsl(221 83% 53%)'}; color: white; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.5); font-weight: 900; font-size: ${count < 10 ? 14 : 16}px; transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">${count}</div>`,
              className: "bg-transparent border-none",
              iconSize: [size, size],
            });
          }}
        >
          {markers}
        </MarkerClusterGroup>
        
        <MapFitter nodes={nodes} selectedId={selectedId} />
        <FitBoundsControl nodes={nodes} />
      </MapContainer>
      
      {/* Add custom CSS for the popup to match luxurious theme */}
      <style>{`
        .luxurious-popup .leaflet-popup-content-wrapper {
          background-color: hsl(var(--card));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .luxurious-popup .leaflet-popup-tip {
          background-color: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-top: none;
          border-left: none;
        }
        .luxurious-tooltip {
          background-color: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
          padding: 8px 12px !important;
        }
        .luxurious-tooltip::before {
          border-top-color: hsl(var(--border)) !important;
        }
        .dark .leaflet-container {
          background-color: #0f172a;
        }
      `}</style>
    </div>
  );
}
