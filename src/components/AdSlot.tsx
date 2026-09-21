import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Move, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import { AdCampaign, AdPlacement } from '../types';
import { StorageService } from '../services/storage';

interface Props {
  placement: AdPlacement;
  campaigns: AdCampaign[];
  isDark?: boolean;
  onUpdatePosition?: (id: string, pos: { x: number; y: number }) => void;
}

export const AdSlot: React.FC<Props> = ({ placement, campaigns, isDark = true, onUpdatePosition }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeCampaign, setActiveCampaign] = useState<AdCampaign | null>(null);

  // Floating Draggable Position & Window State
  const [floatPos, setFloatPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 420) : 24,
    y: typeof window !== 'undefined' ? Math.max(90, window.innerHeight - 380) : 100,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });

  // Sync saved position when active campaign changes
  useEffect(() => {
    if (activeCampaign?.floatPosition) {
      setFloatPos(activeCampaign.floatPosition);
    }
  }, [activeCampaign?.id, activeCampaign?.floatPosition]);

  // Global mouse/touch move listener for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const deltaX = clientX - dragStartRef.current.mouseX;
      const deltaY = clientY - dragStartRef.current.mouseY;
      const newX = Math.max(8, Math.min(window.innerWidth - 120, dragStartRef.current.startX + deltaX));
      const newY = Math.max(8, Math.min(window.innerHeight - 80, dragStartRef.current.startY + deltaY));
      setFloatPos({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      setIsDragging(false);
      if (activeCampaign) {
        setFloatPos((finalPos) => {
          StorageService.updateAdCampaignPosition(activeCampaign.id, finalPos);
          onUpdatePosition?.(activeCampaign.id, finalPos);
          return finalPos;
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, activeCampaign, onUpdatePosition]);

  const handleStartDrag = (clientX: number, clientY: number) => {
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: floatPos.x,
      startY: floatPos.y,
    };
    setIsDragging(true);
  };

  // Find enabled campaign for this slot with valid embed or banner and active calendar period
  useEffect(() => {
    const now = Date.now();
    const validCampaign = campaigns.find(
      (c) => {
        if (!c.enabled || c.placement !== placement) return false;
        // Check calendar validity period (e.g. 1 month, 2 months, 6 months, 1 year, or custom)
        if (c.startDate && now < c.startDate) return false;
        if (c.endDate && now > c.endDate) return false;
        return c.embedCode?.trim().length > 0 || (c.type === 'custom_banner' && c.bannerImageUrl?.trim().length > 0);
      }
    );

    if (!validCampaign) {
      setActiveCampaign(null);
      setIsVisible(false);
      return;
    }

    setActiveCampaign(validCampaign);

    // Handle timing controls
    if (validCampaign.timingMode === 'always') {
      setIsVisible(true);
    } else if (validCampaign.timingMode === 'delay_seconds') {
      setIsVisible(false);
      const delayMs = (validCampaign.displayIntervalSeconds || 3) * 1000;
      const t = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);
      return () => clearTimeout(t);
    } else if (validCampaign.timingMode === 'interval') {
      // Show periodically
      setIsVisible(true);
      const intervalMs = (validCampaign.displayIntervalSeconds || 30) * 1000;
      const durationMs = (validCampaign.durationSeconds || 10) * 1000;

      const timer = setInterval(() => {
        setIsVisible(true);
        if (durationMs > 0) {
          setTimeout(() => {
            setIsVisible(false);
          }, durationMs);
        }
      }, intervalMs);

      return () => clearInterval(timer);
    }
  }, [campaigns, placement]);

  // Handle auto-dismiss duration if configured
  useEffect(() => {
    if (isVisible && activeCampaign && activeCampaign.durationSeconds > 0 && activeCampaign.timingMode !== 'interval') {
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
      }, activeCampaign.durationSeconds * 1000);
      return () => clearTimeout(dismissTimer);
    }
  }, [isVisible, activeCampaign]);

  // Safely execute embedded HTML / AdSense scripts inside container
  useEffect(() => {
    if (!isVisible || !activeCampaign || !containerRef.current) return;

    if (activeCampaign.type === 'adsense' || activeCampaign.type === 'embed_html') {
      const container = containerRef.current;
      container.innerHTML = '';

      // Parse HTML and recreate script tags so browsers execute them
      const range = document.createRange();
      const fragment = range.createContextualFragment(activeCampaign.embedCode);
      
      // Execute any nested <script> tags safely
      const scripts = fragment.querySelectorAll('script');
      container.appendChild(fragment);

      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [isVisible, activeCampaign]);

  // If no embed code or ad is active, render completely normal without taking space
  if (!isVisible || !activeCampaign) {
    return null;
  }

  // Size styling helper
  const getSizeStyles = () => {
    switch (activeCampaign.size) {
      case '728x90':
        return 'w-[728px] h-[90px] max-w-full';
      case '300x250':
        return 'w-[300px] h-[250px]';
      case '320x50':
        return 'w-[320px] h-[50px]';
      case '468x60':
        return 'w-[468px] h-[60px] max-w-full';
      case '160x600':
        return 'w-[160px] h-[600px]';
      case 'responsive':
      default:
        return 'w-full max-w-4xl min-h-[50px]';
    }
  };

  // 1. TOP BANNER
  if (placement === 'top_banner') {
    return (
      <div className={`w-full flex items-center justify-center p-2 relative z-30 transition-all duration-300 border-b ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
      }`}>
        <div className="relative flex items-center justify-center overflow-hidden">
          {/* Ad badge & Close */}
          <div className="absolute top-1 right-1 flex items-center gap-1.5 z-20">
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/50 text-slate-400">
              Sponsored
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-md bg-black/40 hover:bg-black/70 text-slate-300 hover:text-white transition cursor-pointer"
              title="Hide Ad"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {activeCampaign.type === 'custom_banner' && activeCampaign.bannerImageUrl ? (
            <a
              href={activeCampaign.bannerTargetUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`block overflow-hidden rounded-lg shadow-sm ${getSizeStyles()}`}
            >
              <img
                src={activeCampaign.bannerImageUrl}
                alt={activeCampaign.bannerAltText || activeCampaign.name}
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <div ref={containerRef} className={`flex items-center justify-center overflow-hidden ${getSizeStyles()}`} />
          )}
        </div>
      </div>
    );
  }

  // 2. BOTTOM BAR
  if (placement === 'bottom_bar') {
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center p-2 border-t shadow-2xl backdrop-blur-md transition-all duration-300 ${
        isDark ? 'bg-slate-950/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="relative flex items-center justify-center">
          <div className="absolute -top-3 right-0 flex items-center gap-1.5 z-20">
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-slate-300">
              Ad
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-md transition cursor-pointer border border-slate-700"
              title="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeCampaign.type === 'custom_banner' && activeCampaign.bannerImageUrl ? (
            <a
              href={activeCampaign.bannerTargetUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`block overflow-hidden rounded-xl shadow-md ${getSizeStyles()}`}
            >
              <img
                src={activeCampaign.bannerImageUrl}
                alt={activeCampaign.bannerAltText || activeCampaign.name}
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <div ref={containerRef} className={`flex items-center justify-center overflow-hidden ${getSizeStyles()}`} />
          )}
        </div>
      </div>
    );
  }

  // 3. POPUP INTERSTITIAL / MODAL AD
  if (placement === 'popup_interstitial') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className={`relative max-w-lg w-full rounded-3xl p-5 border shadow-2xl overflow-hidden text-center flex flex-col items-center ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Sponsored Announcement
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ad Content */}
          <div className="w-full flex items-center justify-center my-2 overflow-hidden">
            {activeCampaign.type === 'custom_banner' && activeCampaign.bannerImageUrl ? (
              <a
                href={activeCampaign.bannerTargetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl overflow-hidden shadow-lg group relative"
              >
                <img
                  src={activeCampaign.bannerImageUrl}
                  alt={activeCampaign.bannerAltText || activeCampaign.name}
                  className="w-full h-auto max-h-[360px] object-cover group-hover:scale-102 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-extrabold flex items-center gap-1.5 shadow-xl">
                    <span>Visit Partner</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </a>
            ) : (
              <div ref={containerRef} className="w-full flex items-center justify-center min-h-[150px]" />
            )}
          </div>

          {/* Close button with timer note */}
          <div className="mt-3 flex items-center justify-between w-full text-xs text-slate-400">
            <span>
              {activeCampaign.durationSeconds > 0
                ? `Closes automatically in ${activeCampaign.durationSeconds}s`
                : 'Click close or background to resume'}
            </span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              Continue to ConsentKey
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. DRAGGABLE FREE-FLOATING ON-SCREEN AD WIDGET
  if (placement === 'draggable_float') {
    return (
      <div
        style={{
          position: 'fixed',
          left: `${floatPos.x}px`,
          top: `${floatPos.y}px`,
          zIndex: 45,
          touchAction: 'none',
        }}
        className={`rounded-2xl border shadow-2xl transition-all select-none max-w-[92vw] ${
          isDragging ? 'shadow-cyan-500/30 scale-[1.01] ring-2 ring-cyan-500/50' : ''
        } ${isDark ? 'bg-slate-900/95 border-slate-700/80 text-white backdrop-blur-md' : 'bg-white/95 border-slate-300 text-slate-900 backdrop-blur-md'}`}
      >
        {/* Drag Handle & Control Header */}
        <div
          onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches[0]) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className={`px-3 py-2 border-b flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing rounded-t-2xl ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="Click and drag to drop this ad anywhere on the screen"
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5 text-cyan-400" />
            <Move className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              Drag Anywhere
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 rounded-md hover:bg-black/20 text-slate-400 hover:text-white transition cursor-pointer"
              title={isMinimized ? 'Expand Ad' : 'Minimize Ad'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }}
              className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Close Floating Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ad Body (Collapsible) */}
        {!isMinimized && (
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            {activeCampaign.type === 'custom_banner' && activeCampaign.bannerImageUrl ? (
              <a
                href={activeCampaign.bannerTargetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`block overflow-hidden rounded-xl shadow-sm ${getSizeStyles()}`}
              >
                <img
                  src={activeCampaign.bannerImageUrl}
                  alt={activeCampaign.bannerAltText || activeCampaign.name}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <div ref={containerRef} className={`overflow-hidden rounded-xl ${getSizeStyles()}`} />
            )}
          </div>
        )}
      </div>
    );
  }

  // 5. SIDEBAR PLACEMENT
  return (
    <div className={`p-3 rounded-2xl border my-3 relative overflow-hidden ${
      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sponsored</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-200 p-0.5"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      {activeCampaign.type === 'custom_banner' && activeCampaign.bannerImageUrl ? (
        <a
          href={activeCampaign.bannerTargetUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden shadow-xs hover:opacity-90 transition"
        >
          <img
            src={activeCampaign.bannerImageUrl}
            alt={activeCampaign.bannerAltText || activeCampaign.name}
            className="w-full h-auto object-cover"
          />
        </a>
      ) : (
        <div ref={containerRef} className="w-full flex items-center justify-center" />
      )}
    </div>
  );
};
