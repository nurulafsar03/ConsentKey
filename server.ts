import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client lazily
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Cache for grounding responses to avoid burning Gemini API rate limits
  const groundingCache = new Map<string, { timestamp: number; data: any }>();
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Helper to generate direct fallback Google Maps places when quota limit is hit
  const buildFallbackPlaces = (query: string, lat?: number, lng?: number) => {
    const hasCoords = typeof lat === 'number' && typeof lng === 'number';
    const coordsStr = hasCoords ? `@${lat},${lng},14z` : '';
    const directSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/${coordsStr}`;

    const emergencyUrl = `https://www.google.com/maps/search/emergency+hospital/${coordsStr}`;
    const policeUrl = `https://www.google.com/maps/search/police+station/${coordsStr}`;
    const pharmacyUrl = `https://www.google.com/maps/search/24hr+pharmacy/${coordsStr}`;

    return {
      text: hasCoords
        ? `Here are direct Google Maps live routing and search links centered around (${lat.toFixed(4)}, ${lng.toFixed(4)}).`
        : `Here are direct Google Maps live search links for "${query}".`,
      places: [
        {
          title: `Direct Google Maps Search: "${query.length > 30 ? query.slice(0, 30) + '...' : query}"`,
          uri: directSearchUrl,
          snippet: hasCoords
            ? `Opens Google Maps directly with real-time results near lat ${lat.toFixed(4)}, lng ${lng.toFixed(4)}.`
            : `Search "${query}" directly on Google Maps.`,
        },
        {
          title: 'Nearest Emergency Rooms & Hospitals',
          uri: emergencyUrl,
          snippet: 'Direct 1-tap Google Maps directions to the nearest hospital trauma and emergency centers.',
        },
        {
          title: 'Police & Emergency Response Stations',
          uri: policeUrl,
          snippet: 'Direct 1-tap Google Maps navigation to nearby law enforcement and emergency response hubs.',
        },
        {
          title: '24/7 Urgent Pharmacies',
          uri: pharmacyUrl,
          snippet: 'Find open pharmacies and urgent healthcare dispensaries nearby.',
        },
      ],
      isQuotaLimited: true,
      directMapsUrl: directSearchUrl,
    };
  };

  // Google Maps Grounding endpoint using gemini-3.5-flash with cache & 429 graceful fallback
  app.post('/api/places/grounding', async (req, res) => {
    try {
      const { query, latitude, longitude } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required.' });
      }

      const latNum = typeof latitude === 'number' ? latitude : undefined;
      const lngNum = typeof longitude === 'number' ? longitude : undefined;

      // Check in-memory cache
      const cacheKey = `${latNum ? latNum.toFixed(2) : 'none'}_${lngNum ? lngNum.toFixed(2) : 'none'}_${query.trim().toLowerCase()}`;
      const cached = groundingCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return res.json(cached.data);
      }

      const ai = getGeminiClient();

      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (latNum !== undefined && lngNum !== undefined) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: latNum,
              longitude: lngNum,
            },
          },
        };
      }

      // Call gemini-3.5-flash with googleMaps tool
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: query,
        config,
      });

      const text = response.text || '';
      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata || {};
      const groundingChunks = (groundingMetadata as any).groundingChunks || [];

      // Extract places and URLs from groundingChunks
      const places: Array<{ title: string; uri: string; snippet?: string }> = [];

      for (const chunk of groundingChunks) {
        if (chunk.maps) {
          places.push({
            title: chunk.maps.title || 'Google Maps Location',
            uri: chunk.maps.uri || '',
            snippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0] || undefined,
          });
        }
      }

      // If Gemini returned text but no specific chunk places, offer direct query fallback link
      if (places.length === 0 && latNum !== undefined && lngNum !== undefined) {
        places.push({
          title: `View "${query.length > 25 ? query.slice(0, 25) + '...' : query}" on Google Maps`,
          uri: `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${latNum},${lngNum},14z`,
          snippet: 'Open live Google Maps navigation for this search.',
        });
      }

      const resultPayload = {
        text,
        places,
        groundingMetadata,
        directMapsUrl: latNum !== undefined && lngNum !== undefined
          ? `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${latNum},${lngNum},14z`
          : `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
      };

      // Store in cache
      groundingCache.set(cacheKey, { timestamp: Date.now(), data: resultPayload });

      return res.json(resultPayload);
    } catch (error: any) {
      const isQuota =
        error?.status === 429 ||
        error?.code === 429 ||
        String(error?.message).includes('429') ||
        String(error?.message).includes('RESOURCE_EXHAUSTED') ||
        String(error?.message).includes('quota');

      // Use gentle console log instead of unhandled console.error
      if (isQuota) {
        console.warn('[Google Maps Grounding] Rate limit / quota reached. Delivering direct Google Maps live links.');
      } else {
        console.warn('[Google Maps Grounding] Fallback activated:', error?.message || 'Notice');
      }

      const { query, latitude, longitude } = req.body || {};
      const fallbackPayload = buildFallbackPlaces(query || 'safe haven places', latitude, longitude);
      return res.json(fallbackPayload);
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', mapsGroundingEnabled: true });
  });

  // Direct source code ZIP export endpoint
  app.get('/api/download-zip', (_req, res) => {
    import('child_process').then(({ execFile }) => {
      const pyCode = [
        'import os, zipfile',
        'EXCLUDE_DIRS = {"node_modules", "dist", ".git", ".system_generated", ".aistudio", ".cache"}',
        'EXCLUDE_FILES = {"package-lock.json", ".DS_Store"}',
        'out_path = "/tmp/consentkey-source.zip"',
        'with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zipf:',
        '    for root, dirs, files in os.walk("."):',
        '        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]',
        '        for file in files:',
        '            if file in EXCLUDE_FILES or file.endswith(".zip") or file.endswith(".log"):',
        '                continue',
        '            path = os.path.join(root, file)',
        '            arcname = os.path.relpath(path, ".")',
        '            zipf.write(path, arcname)',
      ].join('\n');

      execFile('python3', ['-c', pyCode], (err) => {
        if (err) {
          console.error('Failed to generate ZIP archive:', err);
          return res.status(500).json({ error: 'Failed to generate source zip' });
        }
        res.setHeader('Content-Type', 'application/zip');
        res.download('/tmp/consentkey-source.zip', 'consentkey-source.zip');
      });
    });
  });

  // Vite middleware for development vs production
  if (process.env.NODE_ENV !== 'production') {
    // Intercept /@vite/client to serve a clean, silent client stub without WebSocket or HMR noise
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.send(`import "/node_modules/vite/dist/client/env.mjs";
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    document.head.appendChild(style);
  }
  style.textContent = content;
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext(ownerPath) {
  return {
    accept() {},
    prune() {},
    dispose() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
    data: {}
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://localhost");
  return \`\${pathname}?\${queryToInject}\${search ? "&" + search.slice(1) : ""}\${hash || ""}\`;
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
