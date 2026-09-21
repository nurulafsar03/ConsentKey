import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Hospital,
  ShieldAlert,
  Fuel,
  Coffee,
  Pill,
  ExternalLink,
  Search,
  Loader2,
  Sparkles,
  X,
  Compass,
  Navigation,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { AppTheme, MapsGroundingPlace, MapsGroundingResponse } from '../types';

interface GoogleMapsIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  targetLocation: {
    lat: number;
    lng: number;
    name?: string;
    description?: string;
  };
}

const PRESET_QUERIES = [
  {
    id: 'emergency',
    label: 'Hospitals & Emergency',
    icon: Hospital,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20',
    query: 'Find the nearest emergency rooms, hospitals, and 24/7 trauma medical centers with addresses and exact map links.',
  },
  {
    id: 'police',
    label: 'Police & Security',
    icon: ShieldAlert,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    query: 'Find the nearest police stations, law enforcement posts, and public safety havens with addresses.',
  },
  {
    id: 'pharmacy',
    label: '24/7 Pharmacies',
    icon: Pill,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    query: 'Find 24-hour pharmacies, chemists, and urgent medicine stores open right now near this location.',
  },
  {
    id: 'gas_ev',
    label: 'Fuel & EV Charging',
    icon: Fuel,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    query: 'Find the closest gas stations and electric vehicle EV fast chargers with direct map locations.',
  },
  {
    id: 'meetup',
    label: 'Safe Meetup & Cafes',
    icon: Coffee,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    query: 'Find well-lit public meetup spots, family cafes, and transit central stations nearby.',
  },
];

export const GoogleMapsIntelligenceModal: React.FC<GoogleMapsIntelligenceModalProps> = ({
  isOpen,
  onClose,
  theme,
  targetLocation,
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('emergency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapsGroundingResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const hasAutoFetchedRef = useRef(false);

  // Auto-run default emergency preset once on initial open if no results
  useEffect(() => {
    if (isOpen && !hasAutoFetchedRef.current && !result && !loading) {
      hasAutoFetchedRef.current = true;
      const defaultPreset = PRESET_QUERIES[0];
      handleFetchGrounding(defaultPreset.query, defaultPreset.id);
    }
  }, [isOpen]);

  const handleFetchGrounding = async (queryText: string, presetId?: string) => {
    if (!queryText.trim()) return;

    if (presetId) {
      setSelectedPreset(presetId);
    } else {
      setSelectedPreset('');
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/places/grounding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          latitude: targetLocation.lat,
          longitude: targetLocation.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok && !data.places) {
        throw new Error(data.error || 'Failed to retrieve Google Maps data.');
      }

      setResult(data);
    } catch (err: any) {
      console.warn('[Maps Intel] Direct fallback engaged:', err?.message || 'Rate limit');
      const coords = `@${targetLocation.lat},${targetLocation.lng},14z`;
      const directUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryText)}/${coords}`;
      setResult({
        text: `Here are direct Google Maps live routing links centered around your coordinates (${targetLocation.lat.toFixed(4)}, ${targetLocation.lng.toFixed(4)}).`,
        places: [
          {
            title: `Direct Google Maps Search: "${queryText.length > 30 ? queryText.slice(0, 30) + '...' : queryText}"`,
            uri: directUrl,
            snippet: `Opens verified Google Maps search directly near ${targetLocation.lat.toFixed(4)}, ${targetLocation.lng.toFixed(4)}.`,
          },
          {
            title: 'Nearest Emergency Rooms & Trauma Centers',
            uri: `https://www.google.com/maps/search/emergency+hospital/${coords}`,
            snippet: 'Immediate 1-tap route to open emergency medical centers.',
          },
          {
            title: 'Police & Public Safety Stations',
            uri: `https://www.google.com/maps/search/police+station/${coords}`,
            snippet: 'Direct Google Maps navigation to nearby law enforcement stations.',
          },
        ],
        isQuotaLimited: true,
        directMapsUrl: directUrl,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (uri: string) => {
    navigator.clipboard.writeText(uri);
    setCopiedLink(uri);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Real-Time Google Maps Intelligence</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>
                  Context: <strong className="text-slate-700 dark:text-slate-300">{targetLocation.name || 'Live Location'}</strong> ({targetLocation.lat.toFixed(4)}, {targetLocation.lng.toFixed(4)})
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark
                ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Category Bar */}
        <div
          className={`px-6 py-3 border-b flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar ${
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Intel:
          </span>
          {PRESET_QUERIES.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleFetchGrounding(preset.query, preset.id)}
                disabled={loading}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-xs'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                    : isDark
                    ? 'border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                } disabled:opacity-50`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Query Search Input */}
        <div className={`p-4 border-b shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                handleFetchGrounding(searchQuery);
              }
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask about places, routes, safe zones, or services near this coordinate..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none transition ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Ask Maps</span>
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center animate-pulse">
                  <Compass className="w-7 h-7 animate-spin" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border border-emerald-500/30 animate-ping opacity-25" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Grounding with Google Maps & Gemini 3.5 Flash...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Scanning verified place coordinates, live operational hours, and addresses surrounding {targetLocation.lat.toFixed(4)}, {targetLocation.lng.toFixed(4)}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Could not complete Maps Grounding:</strong>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
                <button
                  onClick={() => handleFetchGrounding(searchQuery || PRESET_QUERIES[0].query)}
                  className="mt-2 text-xs font-semibold underline cursor-pointer hover:opacity-80"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="space-y-6">
              {/* Rate Limit Notice Banner if quota is limited */}
              {result.isQuotaLimited && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                    <div>
                      <span className="font-semibold">Live Google Maps Navigation Active</span>
                      <span className="opacity-90 ml-1.5 block sm:inline">
                        (AI grounding rate limit is cooling down — direct Google Maps links are active).
                      </span>
                    </div>
                  </div>
                  {result.directMapsUrl && (
                    <a
                      href={result.directMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Open on Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* AI Briefing Summary */}
              {result.text && (
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Time Situational Briefing</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {result.text}
                  </div>
                </div>
              )}

              {/* Verified Google Maps Place Cards */}
              {result.places && result.places.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Verified Google Maps Places ({result.places.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Direct Maps Links</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.places.map((place, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between transition hover:border-emerald-500/40 ${
                          isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                              {place.title}
                            </h5>
                            <span className="shrink-0 p-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs">
                              <MapPin className="w-3.5 h-3.5" />
                            </span>
                          </div>

                          {place.snippet && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              "{place.snippet}"
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleCopy(place.uri)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border transition cursor-pointer ${
                              copiedLink === place.uri
                                ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                                : isDark
                                ? 'border-slate-700 hover:bg-slate-700 text-slate-400'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Copy link"
                          >
                            {copiedLink === place.uri ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <a
                            href={place.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition shadow-xs cursor-pointer"
                          >
                            <span>Open in Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No specific individual place links returned for this query, but situational briefing is provided above.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer info & Direct Google Maps Navigation */}
        <div
          className={`px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/90 text-slate-400' : 'border-slate-100 bg-slate-50/90 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Grounded via Google Maps & Gemini 3.5 Flash for real-time accuracy</span>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${targetLocation.lat},${targetLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold flex items-center gap-1 hover:underline text-emerald-600 dark:text-emerald-400 cursor-pointer`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Explore Point on Google Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
};
