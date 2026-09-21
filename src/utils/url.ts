/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the public base URL for QR codes, mobile invites, and share links.
 * When developing inside Google AI Studio, window.location.origin can resolve to
 * 'https://aistudio.google.com'. When scanned by a phone, Google gives a 403 Forbidden
 * because the phone browser is not authenticated to AI Studio.
 *
 * This helper ensures the QR code always points to the publicly accessible app URL.
 */
export function getPublicAppBaseUrl(): string {
  const customDomain = 'https://consentkey.online';
  const publicDeploymentUrl = 'https://ais-pre-rud3jjqfzfw3psh7i7gale-893823088937.europe-west2.run.app';

  if (typeof window === 'undefined') {
    return customDomain;
  }

  try {
    const origin = window.location.origin;

    // If running on custom domain or production
    if (origin && origin.includes('consentkey.online')) {
      return origin;
    }

    // Check if origin is an internal Google AI Studio URL or invalid
    if (
      !origin ||
      origin === 'null' ||
      origin.includes('aistudio.google.com') ||
      origin.includes('studio.google.com') ||
      origin.includes('google.com')
    ) {
      return customDomain || publicDeploymentUrl;
    }

    return origin;
  } catch {
    return customDomain;
  }
}
