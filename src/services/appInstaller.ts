// Singleton App Installer & Downloader Service
// Supports automatic download on "I Agree" for members,
// and manual download from website.
import { getPublicAppBaseUrl } from '../utils/url';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export const appInstaller = {
  getDeferredPrompt: (): BeforeInstallPromptEvent | null => {
    return globalDeferredPrompt;
  },

  subscribeToPrompt: (callback: (prompt: BeforeInstallPromptEvent | null) => void): (() => void) => {
    promptListeners.add(callback);
    callback(globalDeferredPrompt);
    return () => {
      promptListeners.delete(callback);
    };
  },

  isInstalled: (): boolean => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandalone;
  },

  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  },

  // Precache application assets for offline capability
  precacheApp: async () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('consentkey-offline-shell-v1');
        await cache.addAll([
          '/',
          '/index.html',
          '/icon.svg',
          '/apple-touch-icon.png',
          '/pwa-192x192.png',
          '/pwa-512x512.png',
        ]);
      } catch {
        // Silent catch for sandboxed environments
      }
    }
  },

  // Generates and triggers download of the standalone WebApp launcher for local device
  downloadAppPackageFile: (filename = 'ConsentKey-WebApp.html') => {
    if (typeof window === 'undefined') return;

    const origin = getPublicAppBaseUrl();
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>ConsentKey - Consent-Based Live Location</title>
  <meta name="theme-color" content="#090d16">
  <link rel="icon" type="image/svg+xml" href="${origin}/icon.svg">
  <style>
    body {
      margin: 0;
      background-color: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 8px;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .btn {
      display: block;
      background: linear-gradient(135deg, #10b981, #0d9488);
      color: white;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 20px;
      border-radius: 14px;
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
      transition: transform 0.15s ease;
    }
    .btn:hover {
      transform: translateY(-1px);
    }
    .note {
      margin-top: 16px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ConsentKey Installed</div>
    <h1>Launching ConsentKey</h1>
    <p>Your consent-first live location and secure comms application is ready on this device.</p>
    <a href="${origin}/" class="btn">Open ConsentKey App</a>
    <div class="note">24h consent-protected browser memory active.</div>
  </div>
  <script>
    // Automatic instant launch
    setTimeout(function() {
      window.location.href = "${origin}/";
    }, 400);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Member flow: automatically triggers app installation / download upon pressing "I Agree"
  triggerAutomaticMemberDownload: async (): Promise<{
    installed: boolean;
    method: 'native_prompt' | 'auto_download' | 'ios_guide';
  }> => {
    // 1. Precache shell
    await appInstaller.precacheApp();

    // 2. If browser has captured beforeinstallprompt, trigger prompt immediately!
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          return { installed: true, method: 'native_prompt' };
        }
      } catch {
        // Fallback to direct download
      }
    }

    // 3. If iOS Safari, WebKit does not allow programmatic install prompt
    if (appInstaller.isIOS()) {
      return { installed: false, method: 'ios_guide' };
    }

    // 4. On Desktop / Chromium / Other: Automatically download the standalone WebApp package to device
    appInstaller.downloadAppPackageFile('ConsentKey-WebApp.html');
    return { installed: true, method: 'auto_download' };
  },

  // Manual flow: triggers installation / download from website to local device
  triggerManualAdminDownload: async (): Promise<{
    installed: boolean;
    method: 'native_prompt' | 'manual_download' | 'ios_guide';
  }> => {
    await appInstaller.precacheApp();

    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          return { installed: true, method: 'native_prompt' };
        }
      } catch {
        // Fallback to manual download
      }
    }

    if (appInstaller.isIOS()) {
      return { installed: false, method: 'ios_guide' };
    }

    appInstaller.downloadAppPackageFile('ConsentKey-Admin-Console.html');
    return { installed: true, method: 'manual_download' };
  },
};
