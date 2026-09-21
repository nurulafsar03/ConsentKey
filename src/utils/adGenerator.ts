/**
 * Ad Generator Utility
 * Automatically generates standalone, responsive HTML frame embed codes
 * supporting custom images, HTML5 video, YouTube embeds, and rich text cards.
 */

export interface CreativeOptions {
  mediaType: 'image' | 'video' | 'youtube' | 'text_card';
  mediaUrl: string; // image url, mp4 video url, or youtube url
  headline: string;
  body: string;
  badge?: string;
  ctaText?: string;
  ctaUrl?: string;
  themeColor?: string; // e.g. #06b6d4
  bgColor?: string; // e.g. #0f172a
  textColor?: string; // e.g. #f8fafc
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showControls?: boolean;
  aspectRatio?: 'auto' | '16:9' | '4:3' | '1:1';
}

/**
 * Extracts clean YouTube video embed URL from regular youtube.com or youtu.be links
 */
export function formatYouTubeEmbedUrl(url: string, autoplay: boolean = true, muted: boolean = true): string {
  try {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
    } else if (url.includes('watch?v=')) {
      const parsed = new URL(url);
      videoId = parsed.searchParams.get('v') || '';
    } else if (url.includes('/embed/')) {
      const parts = url.split('/embed/');
      videoId = parts[1]?.split('?')[0]?.split('&')[0] || '';
    } else {
      videoId = url.trim();
    }

    if (!videoId) return url;
    const params = new URLSearchParams();
    params.set('rel', '0');
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('mute', '1'); // browsers require mute for autoplay
    }
    if (muted) params.set('mute', '1');
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return url;
  }
}

/**
 * Generates pure standalone HTML frame embed code
 */
export function generateHtmlFrameEmbedCode(options: CreativeOptions): string {
  const {
    mediaType,
    mediaUrl,
    headline,
    body,
    badge = 'SPONSORED',
    ctaText = 'Visit Website',
    ctaUrl = '#',
    themeColor = '#06b6d4',
    bgColor = '#0f172a',
    textColor = '#f8fafc',
    autoplay = true,
    muted = true,
    loop = true,
    showControls = true,
  } = options;

  const id = `ad_frame_${Date.now().toString(36)}`;

  let mediaHtml = '';

  if (mediaType === 'image' && mediaUrl) {
    mediaHtml = `
      <div class="media-container" style="position:relative; width:100%; max-height:280px; overflow:hidden; border-radius:12px 12px 0 0;">
        <img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(headline || 'Ad')}" style="width:100%; height:100%; object-fit:cover; display:block;" />
      </div>
    `;
  } else if (mediaType === 'video' && mediaUrl) {
    const autoplayAttr = autoplay ? 'autoplay' : '';
    const mutedAttr = muted ? 'muted' : '';
    const loopAttr = loop ? 'loop' : '';
    const controlsAttr = showControls ? 'controls' : '';
    mediaHtml = `
      <div class="media-container" style="position:relative; width:100%; max-height:300px; background:#000; overflow:hidden; border-radius:12px 12px 0 0;">
        <video src="${escapeHtml(mediaUrl)}" ${autoplayAttr} ${mutedAttr} ${loopAttr} ${controlsAttr} playsinline style="width:100%; max-height:280px; object-fit:cover; display:block;"></video>
      </div>
    `;
  } else if (mediaType === 'youtube' && mediaUrl) {
    const embedUrl = formatYouTubeEmbedUrl(mediaUrl, autoplay, muted);
    mediaHtml = `
      <div class="video-ratio" style="position:relative; width:100%; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px 12px 0 0; background:#000;">
        <iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(headline || 'Video')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"></iframe>
      </div>
    `;
  }

  const badgeHtml = badge
    ? `<span style="display:inline-block; font-size:10px; font-weight:800; letter-spacing:0.05em; text-transform:uppercase; padding:3px 8px; border-radius:9999px; background:${themeColor}25; color:${themeColor}; border:1px solid ${themeColor}40; margin-bottom:8px;">${escapeHtml(badge)}</span>`
    : '';

  const ctaButtonHtml = ctaText && ctaUrl
    ? `
      <a href="${escapeHtml(ctaUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:12px; font-weight:700; text-decoration:none; padding:8px 18px; border-radius:10px; background:${themeColor}; color:#000; box-shadow:0 4px 14px ${themeColor}40; transition:transform 0.2s, opacity 0.2s;">
        <span>${escapeHtml(ctaText)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
    `
    : '';

  return `<!-- ConsentKey Interactive Ad Frame -->
<div id="${id}" class="consentkey-ad-frame" style="font-family:system-ui, -apple-system, sans-serif; box-sizing:border-box; width:100%; max-width:440px; margin:0 auto; background:${bgColor}; color:${textColor}; border:1px solid rgba(255,255,255,0.12); border-radius:16px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.35); text-align:left;">
  ${mediaHtml}
  <div style="padding:14px 16px;">
    ${badgeHtml}
    ${headline ? `<h3 style="margin:0 0 6px 0; font-size:15px; font-weight:700; color:${textColor}; line-height:1.35;">${escapeHtml(headline)}</h3>` : ''}
    ${body ? `<p style="margin:0 0 12px 0; font-size:12px; line-height:1.5; color:${textColor}b3;">${escapeHtml(body)}</p>` : ''}
    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
      <span style="font-size:10px; opacity:0.6; color:${textColor};">Sponsored by Partner</span>
      ${ctaButtonHtml}
    </div>
  </div>
</div>`.trim();
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
