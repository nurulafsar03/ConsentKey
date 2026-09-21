import React from 'react';

interface ConsentKeyLogoProps {
  className?: string;
  size?: number | string;
  withPing?: boolean;
}

export const ConsentKeyLogo: React.FC<ConsentKeyLogoProps> = ({
  className = 'w-9 h-9',
  size,
  withPing = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="ckPinLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#195ab8" />
            <stop offset="100%" stopColor="#123e85" />
          </linearGradient>
          <linearGradient id="ckPinRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a7be8" />
            <stop offset="100%" stopColor="#1a5fc0" />
          </linearGradient>

          <linearGradient id="ckShieldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1856b3" />
            <stop offset="100%" stopColor="#123d82" />
          </linearGradient>
          <linearGradient id="ckShieldRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2e80ee" />
            <stop offset="100%" stopColor="#1d66cc" />
          </linearGradient>

          <linearGradient id="ckShackleLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#174f9e" />
            <stop offset="100%" stopColor="#103672" />
          </linearGradient>
          <linearGradient id="ckShackleRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c78dc" />
            <stop offset="100%" stopColor="#1858b4" />
          </linearGradient>

          <radialGradient id="ckKeyholeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="1" />
            <stop offset="35%" stopColor="#22c55e" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#16a34a" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
          </radialGradient>

          <filter id="ckShadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f2942" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* Left Broadcast Waves */}
        <g stroke="#5eb2f8" strokeWidth="18" strokeLinecap="round" fill="none">
          <path d="M 124 330 A 172 172 0 0 0 52 422" />
          <path d="M 98 306 A 218 218 0 0 0 14 424" strokeWidth="17" />
          <path d="M 74 286 A 264 264 0 0 0 -18 418" strokeWidth="16" opacity="0.9" />
        </g>

        {/* Right Broadcast Waves */}
        <g stroke="#5eb2f8" strokeWidth="18" strokeLinecap="round" fill="none">
          <path d="M 388 330 A 172 172 0 0 1 460 422" />
          <path d="M 414 306 A 218 218 0 0 1 498 424" strokeWidth="17" />
          <path d="M 438 286 A 264 264 0 0 1 530 418" strokeWidth="16" opacity="0.9" />
        </g>

        {/* Main Map Pin with Beveled Split */}
        <g filter="url(#ckShadow)">
          <path
            d="M 256 468 C 246 450 120 300 100 236 A 160 160 0 0 1 256 44 L 256 94 A 114 114 0 0 0 148 224 C 160 262 216 322 256 348 Z"
            fill="url(#ckPinLeft)"
          />
          <path
            d="M 256 468 C 266 450 392 300 412 236 A 160 160 0 0 0 256 44 L 256 94 A 114 114 0 0 1 364 224 C 352 262 296 322 256 348 Z"
            fill="url(#ckPinRight)"
          />
        </g>

        {/* Soft-Green Checkmark at Bottom Tip */}
        <path
          d="M 238 388 L 256 406 L 298 358"
          fill="none"
          stroke="#5eead4"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Padlock Shackle Top Arch */}
        <g filter="url(#ckShadow)">
          <path
            d="M 256 48 A 62 62 0 0 0 194 110 L 194 150 L 220 150 L 220 110 A 36 36 0 0 1 256 74 Z"
            fill="url(#ckShackleLeft)"
          />
          <path
            d="M 256 48 A 62 62 0 0 1 318 110 L 318 150 L 292 150 L 292 110 A 36 36 0 0 0 256 74 Z"
            fill="url(#ckShackleRight)"
          />
        </g>

        {/* Central Shield Body */}
        <g filter="url(#ckShadow)">
          <path
            d="M 256 138 L 174 152 C 168 153 164 157 164 163 L 164 228 C 164 274 212 320 256 338 Z"
            fill="url(#ckShieldLeft)"
          />
          <path
            d="M 256 138 L 338 152 C 344 153 348 157 348 163 L 348 228 C 348 274 300 320 256 338 Z"
            fill="url(#ckShieldRight)"
          />
        </g>

        {/* Glowing Neon Keyhole */}
        <circle cx="256" cy="226" r="46" fill="url(#ckKeyholeGlow)" />
        <path
          d="M 256 200 A 22 22 0 0 0 234 222 C 234 230 238 237 244 241 L 237 274 L 275 274 L 268 241 C 274 237 278 230 278 222 A 22 22 0 0 0 256 200 Z"
          fill="#071b30"
        />
      </svg>

      {withPing && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white" />
        </span>
      )}
    </div>
  );
};
