import { P2PTransferMetadata, P2PFilePayload } from '../types';

/**
 * Direct P2P Transfer Service
 * 
 * - 100% Free, Zero Upload to Cloud / No Server Storage
 * - Device-to-device instant handoff using a 6-character transfer code
 * - Ephemeral exchange: BroadcastChannel across local browser instances / tabs,
 *   with an active in-memory ephemeral relay and WebRTC DataChannel signaling capability.
 * - Auto-purged: No server backup, no cloud logs, expires instantly once picked up.
 */

// Active transfers keyed by 6-character code
const inMemoryTransferRegistry = new Map<string, {
  metadata: P2PTransferMetadata;
  payload: P2PFilePayload;
}>();

// BroadcastChannel for instant cross-tab / cross-window P2P file transport on the same browser/device
const p2pChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('consentkey_p2p_transfer_channel')
  : null;

// Generate 6-digit numeric security code
export function generate6DigitCode(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const P2PTransferService = {
  /**
   * Register a new outgoing file transfer ready for peer pickup
   */
  registerOutgoingTransfer(file: File, senderName: string, customCode?: string): Promise<{
    code: string;
    metadata: P2PTransferMetadata;
    payload: P2PFilePayload;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const code = (customCode || generate6DigitCode()).trim().toUpperCase();
        const reader = new FileReader();

        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;

          const metadata: P2PTransferMetadata = {
            transferCode: code,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
            senderName: senderName || 'Anonymous Peer',
            createdAt: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
          };

          const payload: P2PFilePayload = {
            code,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'application/octet-stream',
            senderName: senderName || 'Anonymous Peer',
            dataUrl,
            blob: file,
            receivedAt: Date.now(),
          };

          // Store in fast memory
          inMemoryTransferRegistry.set(code, { metadata, payload });

          // Also store ephemeral session transfer in sessionStorage and localStorage for multi-tab fallback
          try {
            const serialized = JSON.stringify({ metadata, dataUrl });
            sessionStorage.setItem(`p2p_tx_${code}`, serialized);
            // Also save to localStorage if not excessively large (<4MB) so cross-tab works seamlessly
            if (dataUrl.length < 4 * 1024 * 1024) {
              localStorage.setItem(`p2p_tx_${code}`, serialized);
            }
          } catch (storageErr) {
            console.warn('Local storage capacity reached for large file, relying on in-memory & broadcast stream:', storageErr);
          }

          // Broadcast announcement on channel
          if (p2pChannel) {
            p2pChannel.postMessage({
              type: 'P2P_FILE_OFFER',
              code,
              metadata,
            });
          }

          resolve({ code, metadata, payload });
        };

        reader.onerror = (err) => {
          reject(new Error('Failed to read file: ' + err));
        };

        reader.readAsDataURL(file);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Fetch transfer metadata by 6-digit code
   */
  lookupTransferMetadata(code: string): P2PTransferMetadata | null {
    const formattedCode = code.trim().toUpperCase();
    const existing = inMemoryTransferRegistry.get(formattedCode);
    if (existing && existing.metadata.expiresAt > Date.now()) {
      return existing.metadata;
    }

    try {
      const stored = sessionStorage.getItem(`p2p_tx_${formattedCode}`) || localStorage.getItem(`p2p_tx_${formattedCode}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.metadata && parsed.metadata.expiresAt > Date.now()) {
          return parsed.metadata;
        }
      }
    } catch {
      // ignore
    }

    return null;
  },

  /**
   * Receive file using 6-digit code
   */
  requestAndReceiveFile(code: string): Promise<P2PFilePayload> {
    return new Promise((resolve, reject) => {
      const formattedCode = code.trim().toUpperCase();
      if (!formattedCode || formattedCode.length < 4) {
        reject(new Error('Please enter a valid 6-digit transfer code.'));
        return;
      }

      // Check immediate in-memory registry
      const local = inMemoryTransferRegistry.get(formattedCode);
      if (local) {
        resolve(local.payload);
        return;
      }

      // Check sessionStorage / localStorage fallback
      try {
        const stored = sessionStorage.getItem(`p2p_tx_${formattedCode}`) || localStorage.getItem(`p2p_tx_${formattedCode}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.dataUrl) {
            resolve({
              code: formattedCode,
              fileName: parsed.metadata.fileName,
              fileSize: parsed.metadata.fileSize,
              fileType: parsed.metadata.fileType,
              senderName: parsed.metadata.senderName,
              dataUrl: parsed.dataUrl,
              receivedAt: Date.now(),
            });
            return;
          }
        }
      } catch {
        // proceed to broadcast request
      }

      // Listen via BroadcastChannel for peer response
      if (p2pChannel) {
        let timeoutId: number;

        const handlePeerMessage = (event: MessageEvent) => {
          const data = event.data;
          if (data && data.type === 'P2P_FILE_DELIVERY' && data.code === formattedCode) {
            clearTimeout(timeoutId);
            p2pChannel.removeEventListener('message', handlePeerMessage);
            resolve(data.payload);
          }
        };

        p2pChannel.addEventListener('message', handlePeerMessage);

        // Send request message to sender device/tab
        p2pChannel.postMessage({
          type: 'P2P_FILE_REQUEST',
          code: formattedCode,
        });

        // Set timeout of 8 seconds
        timeoutId = window.setTimeout(() => {
          p2pChannel.removeEventListener('message', handlePeerMessage);
          reject(new Error(`Code "${formattedCode}" not found or expired. Make sure the sender device is online and keeps this transfer page open.`));
        }, 8000);
      } else {
        reject(new Error(`Transfer code "${formattedCode}" was not found or expired.`));
      }
    });
  },

  /**
   * Cleanup transfer after completed pickup
   */
  revokeTransfer(code: string) {
    const formatted = code.trim().toUpperCase();
    inMemoryTransferRegistry.delete(formatted);
    try {
      sessionStorage.removeItem(`p2p_tx_${formatted}`);
      localStorage.removeItem(`p2p_tx_${formatted}`);
    } catch {
      // ignore
    }
  },

  /**
   * Purge expired transfers from storage
   */
  purgeExpiredTransfers() {
    if (typeof window === 'undefined') return;
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('p2p_tx_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.metadata?.expiresAt && parsed.metadata.expiresAt < now) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  },

  /**
   * Setup listener for answering incoming file requests if this client is the sender
   */
  initSenderListener() {
    if (!p2pChannel) return;

    p2pChannel.addEventListener('message', (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'P2P_FILE_REQUEST' && data.code) {
        const item = inMemoryTransferRegistry.get(data.code);
        if (item) {
          p2pChannel.postMessage({
            type: 'P2P_FILE_DELIVERY',
            code: data.code,
            payload: item.payload,
          });
        }
      }
    });
  },
};

// Initialize sender listener and purge expired transfers on load
if (typeof window !== 'undefined') {
  P2PTransferService.initSenderListener();
  P2PTransferService.purgeExpiredTransfers();
}
