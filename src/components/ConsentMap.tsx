import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Member,
  DirectShareLink,
  SafeZone,
  LocationBreadcrumb,
  NavigationRoute,
  EmergencyAlert,
  MapLayerStyle,
} from '../types';
import { TranslationDict } from '../i18n/translations';
import {
  Crosshair,
  ShieldCheck,
  ShieldAlert,
  Battery,
  Gauge,
  Layers,
  MapPin,
  Route,
  AlertTriangle,
  X,
  Radio,
  Eye,
  EyeOff,
  Navigation,
  Compass,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  members: Member[];
  directShares?: DirectShareLink[];
  currentUserId: string;
  isAdminView: boolean;
  t: TranslationDict;
  safeZones?: SafeZone[];
  breadcrumbs?: LocationBreadcrumb[];
  activeRoute?: NavigationRoute | null;
  activeSos?: EmergencyAlert | null;
  focusedMemberId?: string | null;
  onCallMember?: (member: Member, isVideo?: boolean) => void;
  onChatMember?: (member: Member) => void;
  onSelectMember?: (member: Member) => void;
  onClearRoute?: () => void;
  onTriggerSos?: () => void;
  onManageSafeZones?: () => void;
  onOpenMapsIntelligence?: (target?: { lat: number; lng: number; name?: string }) => void;
}

interface MarkerRecord {
  marker: L.Marker;
  circle?: L.Circle;
  currentPos: [number, number];
  cancelCircleAnim?: () => void;
}

// Smoothly interpolate circle coordinates alongside CSS-transitioned marker icon
function animateCircle(
  circle: L.Circle,
  fromPos: [number, number],
  toPos: [number, number],
  duration = 800
): () => void {
  let isCancelled = false;
  let animFrameId: number;
  const startTime = performance.now();

  const step = (now: number) => {
    if (isCancelled) return;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth cubic bezier ease-out (similar to 0.25, 1, 0.5, 1)
    const ease = 1 - Math.pow(1 - progress, 3);
    const curLat = fromPos[0] + (toPos[0] - fromPos[0]) * ease;
    const curLng = fromPos[1] + (toPos[1] - fromPos[1]) * ease;
    circle.setLatLng([curLat, curLng]);

    if (progress < 1) {
      animFrameId = requestAnimationFrame(step);
    }
  };

  animFrameId = requestAnimationFrame(step);

  return () => {
    isCancelled = true;
    cancelAnimationFrame(animFrameId);
  };
}

const TILE_CONFIGS: Record<MapLayerStyle, { url: string; subdomains?: string; maxZoom: number; className?: string }> = {
  streets: {
    // OpenStreetMap Standard - 100% free, public, zero API key, zero watermark
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
  },
  dark: {
    // OpenStreetMap with clean dark CSS filter - 100% free, zero API key, no watermark
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    className: 'dark-tiles-invert',
  },
  satellite: {
    // Esri World Imagery - 100% free satellite imagery, zero API key
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
};

export const ConsentMap: React.FC<Props> = ({
  members,
  directShares = [],
  currentUserId,
  isAdminView,
  t,
  safeZones = [],
  breadcrumbs = [],
  activeRoute = null,
  activeSos = null,
  focusedMemberId = null,
  onCallMember,
  onChatMember,
  onSelectMember,
  onClearRoute,
  onTriggerSos,
  onManageSafeZones,
  onOpenMapsIntelligence,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Dedicated Layer Groups
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const safeZonesLayerRef = useRef<L.LayerGroup | null>(null);
  const breadcrumbsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const sosLayerRef = useRef<L.LayerGroup | null>(null);

  const markersMapRef = useRef<Map<string, MarkerRecord>>(new Map());
  const hasInitialFitRef = useRef<boolean>(false);
  const lastAdminViewRef = useRef<boolean>(isAdminView);

  const { isDark } = useTheme();

  // Map Feature Toggles - Defaults to current theme style
  const [mapStyle, setMapStyle] = useState<MapLayerStyle>(isDark ? 'dark' : 'streets');
  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);

  // Sync map style when app theme toggles
  useEffect(() => {
    setMapStyle(isDark ? 'dark' : 'streets');
  }, [isDark]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 51.5074;
    const initialLng = -0.1278;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false, // We render modern custom zoom controls
      attributionControl: false,
    });

    // Add initial clean, colorful tile layer
    const cfg = TILE_CONFIGS.streets;
    const tileLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains || 'abc',
      maxZoom: cfg.maxZoom,
      className: cfg.className,
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Zoom listeners to prevent transform transition glitches
    map.on('zoomstart', () => {
      mapContainerRef.current?.classList.add('map-zooming');
    });
    map.on('zoomend', () => {
      mapContainerRef.current?.classList.remove('map-zooming');
    });

    // Mount Layer Groups
    safeZonesLayerRef.current = L.layerGroup().addTo(map);
    breadcrumbsLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    sosLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size observer to ensure Leaflet renders correctly whenever displayed
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      for (const record of markersMapRef.current.values()) {
        if (record.cancelCircleAnim) record.cancelCircleAnim();
      }
      markersMapRef.current.clear();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const cfg = TILE_CONFIGS[mapStyle];
    const newLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains || 'abc',
      maxZoom: cfg.maxZoom,
      className: cfg.className,
    }).addTo(map);

    // Ensure markers and overlays stay on top of new tile layer
    newLayer.bringToBack();
    currentTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Reset initial fit when toggling perspective
  useEffect(() => {
    if (lastAdminViewRef.current !== isAdminView) {
      hasInitialFitRef.current = false;
      lastAdminViewRef.current = isAdminView;
    }
  }, [isAdminView]);

  // Render Safe Zones / Geofences Overlay
  useEffect(() => {
    const layer = safeZonesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showSafeZones || safeZones.length === 0) return;

    safeZones.forEach((zone) => {
      // Semi-transparent radius circle with dashed border
      const circle = L.circle([zone.lat, zone.lng], {
        radius: zone.radiusMeters,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.12,
        weight: 1.8,
        dashArray: '4, 6',
      }).addTo(layer);

      // Category Icon Marker at center of Safe Zone
      const zoneIcon = L.divIcon({
        className: 'safe-zone-center-icon',
        html: `
          <div style="background-color: ${zone.color}25; border-color: ${zone.color};" class="flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg backdrop-blur-sm -translate-x-1/2 -translate-y-1/2">
            <span style="color: ${zone.color};" class="text-xs font-black">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const zoneMarker = L.marker([zone.lat, zone.lng], { icon: zoneIcon }).addTo(layer);

      const zonePopup = `
        <div style="font-family: inherit; color: #f8fafc; min-width: 170px;" class="p-1">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background-color: ${zone.color};"></span>
            <strong style="font-size: 13px;">${zone.name}</strong>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Safe Zone • ${zone.radiusMeters}m radius</p>
          <div style="margin-top: 6px; font-size: 10px; color: #10b981; font-weight: bold;">
            ✓ Geofence Alerts Active
          </div>
        </div>
      `;
      circle.bindPopup(zonePopup);
      zoneMarker.bindPopup(zonePopup);
    });
  }, [safeZones, showSafeZones]);

  // Render Movement Breadcrumb Trails
  useEffect(() => {
    const layer = breadcrumbsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showTrails || breadcrumbs.length === 0) return;

    // Group breadcrumbs by member
    const grouped = new Map<string, [number, number][]>();
    breadcrumbs.forEach((b) => {
      if (!grouped.has(b.memberId)) grouped.set(b.memberId, []);
      grouped.get(b.memberId)?.push([b.lat, b.lng]);
    });

    grouped.forEach((coords) => {
      if (coords.length > 1) {
        L.polyline(coords, {
          color: '#10b981',
          weight: 3,
          opacity: 0.65,
          dashArray: '3, 6',
          lineCap: 'round',
        }).addTo(layer);
      }
    });
  }, [breadcrumbs, showTrails]);

  // Render Active Navigation Route / ETA Polyline
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!activeRoute) return;

    const routePolyline = L.polyline([activeRoute.from, activeRoute.to], {
      color: '#06b6d4',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 8',
    }).addTo(layer);

    // Fit map to route view
    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(routePolyline.getBounds(), {
        padding: [80, 80],
        maxZoom: 15,
      });
    }
  }, [activeRoute]);

  // Render Emergency SOS Distress Wave
  useEffect(() => {
    const layer = sosLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!activeSos || activeSos.status !== 'active') return;

    // Pulsing danger circle around distress location
    L.circle([activeSos.lat, activeSos.lng], {
      radius: 350,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.25,
      weight: 2,
    }).addTo(layer);

    // Auto-pan to emergency distress location
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeSos.lat, activeSos.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [activeSos]);

  // Fly to Member when focusedMemberId changes
  useEffect(() => {
    if (!focusedMemberId || !mapInstanceRef.current) return;
    const target = members.find((m) => m.id === focusedMemberId);
    if (target && target.lat && target.lng) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 15, {
        animate: true,
        duration: 1.2,
      });
      // Open popup if marker exists
      const record = markersMapRef.current.get(`member-${target.id}`);
      if (record) {
        record.marker.openPopup();
      }
    }
  }, [focusedMemberId, members]);

  // Synchronize Live Member Markers with Smooth CSS Transitions & Accuracy Circle Animation
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const currentKeys = new Set<string>();
    const bounds: [number, number][] = [];

    // Filter members based on role view
    const visibleMembers = members.filter((member) => {
      if (isAdminView) {
        return member.isConsentGiven && member.isSharingLocation;
      }
      return member.id === currentUserId && member.isSharingLocation;
    });

    visibleMembers.forEach((member) => {
      if (!member.lat || !member.lng) return;

      const key = `member-${member.id}`;
      currentKeys.add(key);
      const targetPos: [number, number] = [member.lat, member.lng];
      bounds.push(targetPos);

      // Activity state
      const isDriving = (member.speed || 0) > 15;
      const isWalking = (member.speed || 0) > 0 && !isDriving;
      const activityIcon = isDriving ? '🚗' : isWalking ? '🚶' : '🏠';

      const existing = markersMapRef.current.get(key);

      if (existing) {
        // Smoothly animate marker using Leaflet setLatLng + CSS transform transition
        existing.marker.setLatLng(targetPos);

        if (existing.circle) {
          if (existing.cancelCircleAnim) existing.cancelCircleAnim();
          existing.cancelCircleAnim = animateCircle(
            existing.circle,
            existing.currentPos,
            targetPos,
            800
          );
          existing.circle.setRadius(member.accuracy || 20);
        }
        existing.currentPos = targetPos;
      } else {
        // Create custom HTML avatar marker
        const customIcon = L.divIcon({
          className: 'custom-member-marker smooth-marker-transition',
          html: `
            <div class="relative group cursor-pointer" style="width: 44px; height: 44px;">
              <div class="absolute -inset-1 rounded-full bg-emerald-500/30 animate-pulse"></div>
              <img 
                src="${member.avatar}" 
                alt="${member.name}" 
                class="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-xl"
              />
              <div class="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-700 shadow font-bold">
                ${activityIcon}
              </div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-950/90 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/40 shadow whitespace-nowrap">
                ${member.name.split(' ')[0]}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const marker = L.marker(targetPos, { icon: customIcon }).addTo(markersLayerRef.current);

        // Accuracy Circle
        const circle = L.circle(targetPos, {
          radius: member.accuracy || 20,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(markersLayerRef.current);

        // Interactive Popup
        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 font-sans text-slate-100 min-w-[210px]';
        popupContent.innerHTML = `
          <div class="flex items-center gap-2.5 pb-2 border-b border-slate-700/60">
            <img src="${member.avatar}" class="w-9 h-9 rounded-full object-cover border border-emerald-400" />
            <div>
              <div class="font-bold text-xs text-white">${member.name}</div>
              <div class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live GPS Active</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 my-2 text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded-lg">
            <div class="flex items-center gap-1">
              <span class="text-slate-400">⚡ Battery:</span>
              <strong class="${(member.battery || 100) < 20 ? 'text-rose-400 font-black' : 'text-slate-200'}">
                ${member.battery || 100}%
              </strong>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-slate-400">⚡ Speed:</span>
              <strong class="text-slate-200">${member.speed || 0} km/h</strong>
            </div>
            <div class="flex items-center gap-1 col-span-2">
              <span class="text-slate-400">🎯 Accuracy:</span>
              <strong class="text-slate-200">±${member.accuracy || 12}m</strong>
            </div>
          </div>
          <div class="flex items-center gap-1.5 pt-1">
            <button id="btn-call-${member.id}" class="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="${t.voiceCall}">
              <span>📞 Voice</span>
            </button>
            <button id="btn-video-${member.id}" class="flex-1 py-1.5 px-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="Video Call">
              <span>📹 Video</span>
            </button>
            <button id="btn-msg-${member.id}" class="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-cyan-600 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="Direct Message">
              <span>💬 Chat</span>
            </button>
            <button id="btn-route-${member.id}" class="py-1.5 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="Get Directions">
              <span>🧭</span>
            </button>
            <button id="btn-intel-${member.id}" class="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="Real-Time Google Maps Intel & Safe Havens">
              <span>📍 Intel</span>
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const callBtn = document.getElementById(`btn-call-${member.id}`);
          if (callBtn) {
            callBtn.onclick = () => {
              marker.closePopup();
              onCallMember?.(member, false);
            };
          }
          const videoBtn = document.getElementById(`btn-video-${member.id}`);
          if (videoBtn) {
            videoBtn.onclick = () => {
              marker.closePopup();
              onCallMember?.(member, true);
            };
          }
          const msgBtn = document.getElementById(`btn-msg-${member.id}`);
          if (msgBtn) {
            msgBtn.onclick = () => {
              marker.closePopup();
              onChatMember?.(member);
            };
          }
          const routeBtn = document.getElementById(`btn-route-${member.id}`);
          if (routeBtn) {
            routeBtn.onclick = () => {
              marker.closePopup();
              onSelectMember?.(member);
            };
          }
          const intelBtn = document.getElementById(`btn-intel-${member.id}`);
          if (intelBtn) {
            intelBtn.onclick = () => {
              marker.closePopup();
              if (member.lat && member.lng) {
                onOpenMapsIntelligence?.({ lat: member.lat, lng: member.lng, name: member.name });
              }
            };
          }
        });

        markersMapRef.current.set(key, {
          marker,
          circle,
          currentPos: targetPos,
        });
      }
    });

    // Remove inactive markers
    for (const [key, record] of markersMapRef.current.entries()) {
      if (!currentKeys.has(key)) {
        if (record.cancelCircleAnim) record.cancelCircleAnim();
        record.marker.remove();
        if (record.circle) record.circle.remove();
        markersMapRef.current.delete(key);
      }
    }

    // Initial fit
    if (bounds.length > 0 && !hasInitialFitRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [60, 60],
        maxZoom: 15,
      });
      hasInitialFitRef.current = true;
    }
  }, [members, directShares, currentUserId, isAdminView, t, onCallMember, onSelectMember]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const active = members.filter((m) =>
      isAdminView ? m.isConsentGiven && m.isSharingLocation : m.id === currentUserId && m.isSharingLocation
    );
    if (active.length > 0 && active[0].lat && active[0].lng) {
      mapInstanceRef.current.flyTo([active[0].lat, active[0].lng], 14, { animate: true, duration: 1 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const activeCount = members.filter((m) => m.isConsentGiven && m.isSharingLocation).length;

  return (
    <div className={`relative w-full h-[480px] md:h-[580px] rounded-3xl overflow-hidden border shadow-md transition ${
      isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200/90 bg-white'
    }`}>
      {/* Leaflet Map DOM Target */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Top-Left Status Pill */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className={`pointer-events-auto flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border shadow-md text-xs font-semibold ${
          isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200/90 text-slate-700'
        }`}>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <ShieldCheck className="w-4 h-4" />
            <span>{isAdminView ? t.adminPortal : t.memberView}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
            {activeCount} {t.sharingCount}
          </span>
        </div>

        {/* Safe Zones Indicator Chip */}
        {safeZones.length > 0 && (
          <button
            onClick={onManageSafeZones}
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-semibold transition cursor-pointer shadow-md ${
              isDark
                ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white/95 hover:bg-slate-50 border-slate-200/90 text-slate-700'
            }`}
            title={t.safeZonesTitle}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{safeZones.length} {t.safeZonesChip}</span>
          </button>
        )}
      </div>

      {/* Floating Top-Right Tool Controls (Layer, Geofences, Trails, SOS, Recenter) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Google Maps Intelligence Button */}
        {onOpenMapsIntelligence && (
          <button
            onClick={() => {
              const activeMember = members.find((m) => m.id === focusedMemberId && m.lat && m.lng);
              const fallbackMember = members.find((m) => m.lat && m.lng);
              const target = activeMember
                ? { lat: activeMember.lat!, lng: activeMember.lng!, name: activeMember.name }
                : fallbackMember
                ? { lat: fallbackMember.lat!, lng: fallbackMember.lng!, name: fallbackMember.name }
                : { lat: 37.7749, lng: -122.4194, name: 'Current View' };
              onOpenMapsIntelligence(target);
            }}
            className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-800/80'
                : 'bg-emerald-50/95 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title="Real-Time Google Maps Intelligence (Hospitals, Safe Havens & Transit)"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold hidden sm:inline">Maps Intel</span>
          </button>
        )}

        {/* Layer Style Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
              isDark
                ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-white/95 hover:bg-slate-50 text-slate-700 border-slate-200/90'
            }`}
            title="Switch Map Tiles"
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold capitalize hidden sm:inline">{mapStyle}</span>
          </button>

          {isLayerMenuOpen && (
            <div className={`absolute right-0 mt-2 w-44 backdrop-blur-md border rounded-2xl shadow-xl p-1.5 z-30 space-y-1 ${
              isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
            }`}>
              <button
                onClick={() => {
                  setMapStyle('streets');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer ${
                  mapStyle === 'streets'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🗺️ {t.mapStreets}</span>
                {mapStyle === 'streets' && <span>✓</span>}
              </button>
              <button
                onClick={() => {
                  setMapStyle('dark');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer ${
                  mapStyle === 'dark'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🌙 {t.mapDark}</span>
                {mapStyle === 'dark' && <span>✓</span>}
              </button>
              <button
                onClick={() => {
                  setMapStyle('satellite');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-between cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>🛰️ {t.mapSatellite}</span>
                {mapStyle === 'satellite' && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Toggle Safe Zones Layer */}
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition cursor-pointer ${
            showSafeZones
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
              : isDark
              ? 'bg-slate-900/95 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              : 'bg-white/95 text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title={t.safeZonesChip}
        >
          <MapPin className="w-4 h-4" />
        </button>

        {/* Toggle Breadcrumb Trails Layer */}
        <button
          onClick={() => setShowTrails(!showTrails)}
          className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition cursor-pointer ${
            showTrails
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-cyan-600/20'
              : isDark
              ? 'bg-slate-900/95 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              : 'bg-white/95 text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title="Trails"
        >
          <Route className="w-4 h-4" />
        </button>

        {/* SOS Emergency Broadcast Trigger */}
        {onTriggerSos && (
          <button
            onClick={onTriggerSos}
            className="p-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-md shadow-rose-500/20 backdrop-blur-md transition cursor-pointer flex items-center gap-1 animate-pulse"
            title="SOS"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-black hidden md:inline">SOS</span>
          </button>
        )}

        {/* Recenter Button */}
        <button
          id="btn-map-recenter"
          onClick={handleRecenter}
          className={`p-2.5 rounded-2xl border shadow-md backdrop-blur-md transition cursor-pointer ${
            isDark
              ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-300 border-slate-800'
              : 'bg-white/95 hover:bg-slate-50 text-slate-700 border-slate-200/90'
          }`}
          title={t.recenterMap}
        >
          <Crosshair className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
      </div>

      {/* Floating Zoom Controls (Custom Sleek Design) */}
      <div className="absolute right-4 bottom-14 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base font-bold shadow-md backdrop-blur-md transition cursor-pointer ${
            isDark
              ? 'bg-slate-900/95 hover:bg-slate-800 text-white border-slate-800'
              : 'bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-200/90'
          }`}
          title={t.zoomIn}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-base font-bold shadow-md backdrop-blur-md transition cursor-pointer ${
            isDark
              ? 'bg-slate-900/95 hover:bg-slate-800 text-white border-slate-800'
              : 'bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-200/90'
          }`}
          title={t.zoomOut}
        >
          −
        </button>
      </div>

      {/* Active Navigation Route Floating Bottom Bar */}
      {activeRoute && (
        <div className="absolute top-16 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div className={`pointer-events-auto backdrop-blur-md px-4 py-2.5 rounded-2xl border shadow-xl flex items-center gap-3 text-xs ${
            isDark
              ? 'bg-slate-900/95 border-cyan-800 text-white'
              : 'bg-white/95 border-cyan-300 text-slate-900'
          }`}>
            <div className={`w-7 h-7 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-cyan-950/80 border-cyan-700 text-cyan-400' : 'bg-cyan-100 border-cyan-300 text-cyan-700'
            }`}>
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>{t.directionsTo} {activeRoute.targetMemberName}</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">• {activeRoute.distanceKm} km</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                ETA: ~{activeRoute.estimatedMinutes} {t.minDriveTransit}
              </p>
            </div>
            {onClearRoute && (
              <button
                onClick={onClearRoute}
                className={`ml-2 p-1.5 rounded-lg transition cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={t.clearRoute}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Emergency Active SOS Top Banner */}
      {activeSos && activeSos.status === 'active' && (
        <div className="absolute top-16 left-4 right-4 z-20 pointer-events-none flex justify-center animate-bounce">
          <div className="pointer-events-auto bg-rose-600 backdrop-blur-md px-4 py-2 rounded-2xl border border-rose-400 text-white shadow-xl flex items-center gap-2.5 text-xs font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{t.sosDistressActive} ({activeSos.senderName})</span>
          </div>
        </div>
      )}

      {/* Privacy Notice Banner at Map Footer */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex justify-center">
        <div className={`pointer-events-auto max-w-xl backdrop-blur-md px-4 py-1.5 rounded-full border text-[11px] flex items-center gap-2 shadow-md ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-slate-300'
            : 'bg-white/95 border-slate-200 text-slate-600'
        }`}>
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="truncate">
            {isAdminView ? t.onlyAdminCanSee : t.noQuestionsAsked}
          </span>
        </div>
      </div>
    </div>
  );
};
