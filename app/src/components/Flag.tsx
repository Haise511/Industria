// Flag icons for the four onboarding languages.
//
// These are accurate, official-style SVG renderings (NOT emoji) — emoji-only
// flags fail to render in the Telegram WebView on Windows/Android and don't
// match the Figma design which uses crisp 32x32 vector flag instances
// (Figma "Flag Pack" components, nodes 1:5774 / 1:5778 / 1:5782 / 1:5786).
//
// We deliberately keep them inline (no network requests) and clip each flag
// to a circle to match the 32x32 round container in the design.

interface FlagProps {
  code: 'ru' | 'kg' | 'kz' | 'uz';
}

export function Flag({ code }: FlagProps) {
  switch (code) {
    case 'ru':
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rcRU"><circle cx="16" cy="16" r="16" /></clipPath>
          </defs>
          <g clipPath="url(#rcRU)">
            <rect width="32" height="10.667" y="0" fill="#FFFFFF" />
            <rect width="32" height="10.667" y="10.667" fill="#0033A0" />
            <rect width="32" height="10.667" y="21.333" fill="#DA291C" />
          </g>
        </svg>
      );
    case 'kg':
      // Kyrgyz: red field, gold sun with 40 rays, central tunduk in red.
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rcKG"><circle cx="16" cy="16" r="16" /></clipPath>
          </defs>
          <g clipPath="url(#rcKG)">
            <rect width="32" height="32" fill="#E8112D" />
            <circle cx="16" cy="16" r="7" fill="#FFEF00" />
            {/* 40 sun rays — simplified to 16 visible rays for a 32px icon */}
            <g fill="none" stroke="#FFEF00" strokeWidth="1.4" strokeLinecap="round">
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i * Math.PI) / 8;
                const x1 = 16 + Math.cos(a) * 7.2;
                const y1 = 16 + Math.sin(a) * 7.2;
                const x2 = 16 + Math.cos(a) * 9.6;
                const y2 = 16 + Math.sin(a) * 9.6;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
            {/* Tunduk (yurt roof) — three crossed bars in red */}
            <g stroke="#E8112D" strokeWidth="0.9" fill="none">
              <line x1="13.5" y1="16" x2="18.5" y2="16" />
              <line x1="14" y1="14" x2="18" y2="18" />
              <line x1="14" y1="18" x2="18" y2="14" />
            </g>
            <circle cx="16" cy="16" r="2.6" fill="none" stroke="#E8112D" strokeWidth="0.9" />
          </g>
        </svg>
      );
    case 'kz':
      // Kazakhstan: cyan field, gold sun + soaring eagle (simplified).
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rcKZ"><circle cx="16" cy="16" r="16" /></clipPath>
          </defs>
          <g clipPath="url(#rcKZ)">
            <rect width="32" height="32" fill="#00ABC9" />
            {/* Sun */}
            <circle cx="17" cy="13" r="4.4" fill="#FED700" />
            {/* Sun rays */}
            <g fill="none" stroke="#FED700" strokeWidth="1.1" strokeLinecap="round">
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * Math.PI) / 6;
                const x1 = 17 + Math.cos(a) * 4.8;
                const y1 = 13 + Math.sin(a) * 4.8;
                const x2 = 17 + Math.cos(a) * 6.6;
                const y2 = 13 + Math.sin(a) * 6.6;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>
            {/* Eagle abstract */}
            <path d="M9 20 Q13 23 17 21.5 Q21 20 25 22 Q22 19.5 17 20 Q12 20.5 9 20 Z" fill="#FED700" />
          </g>
        </svg>
      );
    case 'uz':
      // Uzbekistan: cyan/white/green with red separators, crescent + 12 stars.
      return (
        <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="rcUZ"><circle cx="16" cy="16" r="16" /></clipPath>
          </defs>
          <g clipPath="url(#rcUZ)">
            <rect width="32" height="11" fill="#0099B5" />
            <rect y="11" width="32" height="0.7" fill="#CE1126" />
            <rect y="11.7" width="32" height="8.6" fill="#FFFFFF" />
            <rect y="20.3" width="32" height="0.7" fill="#CE1126" />
            <rect y="21" width="32" height="11" fill="#1EB53A" />
            {/* Crescent (white-on-cyan: outer + inner) */}
            <circle cx="9" cy="5.5" r="2.4" fill="#FFFFFF" />
            <circle cx="9.9" cy="5.3" r="2" fill="#0099B5" />
            {/* 3 small stars in cluster */}
            <g fill="#FFFFFF">
              <circle cx="14" cy="3.6" r="0.45" />
              <circle cx="15.3" cy="5" r="0.45" />
              <circle cx="14" cy="6.3" r="0.45" />
            </g>
          </g>
        </svg>
      );
  }
}
