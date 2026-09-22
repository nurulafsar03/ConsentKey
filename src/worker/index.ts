import { Hono } from 'hono';
import {
  registerUser,
  getGroupByInviteCode,
  getAllGroups,
  getGroupMembers,
  updateMemberLocation,
  addMessage,
  getMessages,
  createMagicLink,
  verifyMagicLink,
} from './db';
import { sendMagicLinkEmail } from './email';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
  MAGIC_LINK_FROM_EMAIL?: string; // e.g. "ConsentKey <onboarding@resend.dev>"
  PUBLIC_SITE_URL?: string; // e.g. "https://consentkey.<subdomain>.workers.dev"
}

const app = new Hono<{ Bindings: Env }>();

// ---- Health check ----
app.get('/api/health', (c) => c.json({ status: 'ok', backend: 'cloudflare-workers-d1' }));

// ---- Registration (creates user + group + member, sends magic link email) ----
app.post('/api/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, role, groupAction, groupName, groupCategory, inviteCode } = body || {};
    if (!name || !email) {
      return c.json({ error: 'Name and email are required for real registration' }, 400);
    }

    const result = await registerUser(c.env.DB, {
      name,
      email,
      role: role === 'admin' ? 'admin' : 'member',
      groupAction: groupAction === 'join' ? 'join' : 'create',
      groupName,
      groupCategory,
      inviteCode,
    });

    // Fire off the real magic-link verification email (best effort — never blocks registration).
    if (c.env.RESEND_API_KEY) {
      try {
        const token = await createMagicLink(c.env.DB, result.user.id, result.user.email);
        const siteUrl = c.env.PUBLIC_SITE_URL || new URL(c.req.url).origin;
        const magicLink = `${siteUrl}/api/verify?token=${token}`;
        const fromEmail = c.env.MAGIC_LINK_FROM_EMAIL || 'ConsentKey <onboarding@resend.dev>';
        const emailResult = await sendMagicLinkEmail({
          apiKey: c.env.RESEND_API_KEY,
          fromEmail,
          toEmail: result.user.email,
          toName: result.user.name,
          magicLink,
          circleName: result.group.name,
        });
        if (!emailResult.ok) {
          console.warn('Magic link email failed to send:', emailResult.error);
        }
      } catch (emailErr: any) {
        console.warn('Magic link email failed to send:', emailErr?.message);
      }
    } else {
      console.warn('RESEND_API_KEY not set — skipping magic link email.');
    }

    return c.json(result);
  } catch (err: any) {
    console.error('Registration failed:', err);
    return c.json({ error: err?.message || 'Failed to complete registration' }, 500);
  }
});

// ---- Magic link verification ----
app.get('/api/verify', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.text('Missing verification token.', 400);

  const result = await verifyMagicLink(c.env.DB, token);
  const siteUrl = c.env.PUBLIC_SITE_URL || new URL(c.req.url).origin;

  const page = (title: string, message: string, ok: boolean) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{background:#1e293b;padding:32px 40px;border-radius:16px;text-align:center;max-width:420px}
h1{color:${ok ? '#34d399' : '#f87171'}}
a{color:#34d399}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="${siteUrl}">Return to ConsentKey</a></p></div></body></html>`;

  if (!result.ok) {
    return c.html(page('Verification failed', result.reason || 'Something went wrong.', false), 400);
  }
  return c.html(page('Email verified ✅', 'Your ConsentKey account is now fully verified.', true));
});

// ---- Groups ----
app.get('/api/groups', async (c) => {
  try {
    const groups = await getAllGroups(c.env.DB);
    return c.json(groups);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

app.post('/api/groups/join', async (c) => {
  try {
    const { inviteCode, user } = await c.req.json();
    if (!inviteCode || !user) {
      return c.json({ error: 'inviteCode and user profile are required' }, 400);
    }
    const group = await getGroupByInviteCode(c.env.DB, inviteCode);
    if (!group) return c.json({ error: 'Group with this invite code not found' }, 404);

    const registered = await registerUser(c.env.DB, {
      name: user.name,
      email: user.email,
      role: 'member',
      groupAction: 'join',
      inviteCode,
    });
    return c.json(registered);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

app.get('/api/groups/:id/members', async (c) => {
  try {
    const members = await getGroupMembers(c.env.DB, c.req.param('id'));
    return c.json(members);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

app.post('/api/groups/:id/location', async (c) => {
  try {
    const { memberId, lat, lng, speed, battery, accuracy, isSharingLocation } = await c.req.json();
    if (!memberId || typeof lat !== 'number' || typeof lng !== 'number') {
      return c.json({ error: 'memberId, lat, and lng are required' }, 400);
    }
    const updated = await updateMemberLocation(c.env.DB, memberId, {
      lat,
      lng,
      speed,
      battery,
      accuracy,
      isSharingLocation,
    });
    if (!updated) return c.json({ error: 'Member not found' }, 404);
    return c.json(updated);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

app.get('/api/groups/:id/messages', async (c) => {
  try {
    const messages = await getMessages(c.env.DB, c.req.param('id'));
    return c.json(messages);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

app.post('/api/groups/:id/messages', async (c) => {
  try {
    const { senderId, senderName, senderRole, type, text, audioBlobUrl, audioDurationSeconds } =
      await c.req.json();
    if (!senderId || !senderName) {
      return c.json({ error: 'senderId and senderName are required' }, 400);
    }
    const message = await addMessage(c.env.DB, c.req.param('id'), {
      senderId,
      senderName,
      senderRole: senderRole || 'member',
      type: type || 'text',
      text,
      audioBlobUrl,
      audioDurationSeconds,
    });
    return c.json(message);
  } catch (err: any) {
    return c.json({ error: err?.message }, 500);
  }
});

// ---- Google Maps grounding via Gemini REST API (no Node SDK needed on Workers) ----
app.post('/api/places/grounding', async (c) => {
  const { query, latitude, longitude } = await c.req.json().catch(() => ({}) as any);

  const fallback = () => {
    const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
    const coordsStr = hasCoords ? `@${latitude},${longitude},14z` : '';
    const q = query || 'safe haven places';
    const directSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(q)}/${coordsStr}`;
    return c.json({
      text: `Here are direct Google Maps search links for "${q}".`,
      places: [
        { title: `Search "${q}" on Google Maps`, uri: directSearchUrl, snippet: 'Open live Google Maps.' },
        {
          title: 'Nearest Emergency Rooms & Hospitals',
          uri: `https://www.google.com/maps/search/emergency+hospital/${coordsStr}`,
        },
        {
          title: 'Police & Emergency Response Stations',
          uri: `https://www.google.com/maps/search/police+station/${coordsStr}`,
        },
      ],
      isQuotaLimited: true,
      directMapsUrl: directSearchUrl,
    });
  };

  if (!c.env.GEMINI_API_KEY || !query) return fallback();

  try {
    const config: any = { tools: [{ googleMaps: {} }] };
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = { retrievalConfig: { latLng: { latitude, longitude } } };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: query }] }], ...config }),
      }
    );

    if (!res.ok) return fallback();

    const data: any = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const places = chunks
      .filter((ch: any) => ch.maps)
      .map((ch: any) => ({
        title: ch.maps.title || 'Google Maps Location',
        uri: ch.maps.uri || '',
        snippet: ch.maps.placeAnswerSources?.reviewSnippets?.[0],
      }));

    if (places.length === 0) return fallback();

    return c.json({
      text,
      places,
      groundingMetadata: candidate?.groundingMetadata,
      directMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
    });
  } catch (err) {
    return fallback();
  }
});

// ---- Fallback: anything that isn't an /api/* route falls through to the ----
// ---- built static site (needed because run_worker_first is `true`, ----
// ---- meaning EVERY request hits this Worker before assets are checked). ----
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
