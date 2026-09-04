import type { ReactElement } from "react";
import type { CityLandmarkId } from "../../config/cityCatalog";

type LandmarkArtProps = {
  landmarkId: CityLandmarkId;
  className?: string;
};

const STROKE = "currentColor";
const FILL_MUTED = "rgba(255,255,255,0.12)";
const FILL_ACCENT = "rgba(232,149,140,0.35)";
const FILL_GOLD = "rgba(255,209,102,0.45)";

function ChennaiGopuram() {
  return (
    <g>
      <path d="M18 92h84" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path
        d="M60 18 L72 34 L68 34 L74 48 L70 48 L76 62 L70 62 L78 78 L42 78 L50 62 L44 62 L50 48 L46 48 L52 34 L48 34 Z"
        fill={FILL_ACCENT}
        stroke={STROKE}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="34" y="78" width="52" height="14" rx="2" fill={FILL_MUTED} stroke={STROKE} strokeWidth="1.2" />
      <path d="M42 78v-6h36v6" fill="none" stroke={STROKE} strokeWidth="1" opacity="0.5" />
      <circle cx="60" cy="24" r="2.2" fill={FILL_GOLD} />
    </g>
  );
}

function MumbaiGateway() {
  return (
    <g>
      <path d="M14 92h92" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path
        d="M34 92V52c0-8 12-14 26-14s26 6 26 14v40"
        fill={FILL_MUTED}
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M48 92V58c0-4 6-7 12-7s12 3 12 7v34"
        fill={FILL_ACCENT}
        stroke={STROKE}
        strokeWidth="1.3"
      />
      <path d="M60 30v8M56 34h8" stroke={FILL_GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="24" r="2" fill={FILL_GOLD} />
    </g>
  );
}

function BengaluruVidhanaSoudha() {
  return (
    <g>
      <path d="M16 92h88" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <rect x="24" y="58" width="72" height="34" rx="2" fill={FILL_MUTED} stroke={STROKE} strokeWidth="1.3" />
      <path d="M30 58V46h60v12" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1.2" />
      <path
        d="M60 20c10 8 16 14 18 22H42c2-8 8-14 18-22z"
        fill={FILL_ACCENT}
        stroke={STROKE}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M36 70h48M36 78h48M36 86h48" stroke={STROKE} strokeWidth="0.9" opacity="0.45" />
      <circle cx="60" cy="34" r="2.2" fill={FILL_GOLD} />
    </g>
  );
}

function HyderabadCharminar() {
  return (
    <g>
      <path d="M16 92h88" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <rect x="38" y="48" width="44" height="44" rx="2" fill={FILL_MUTED} stroke={STROKE} strokeWidth="1.4" />
      <path d="M60 48V36" stroke={STROKE} strokeWidth="1.2" />
      <circle cx="60" cy="32" r="3" fill={FILL_GOLD} />
      <rect x="46" y="58" width="10" height="18" rx="1" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1" />
      <rect x="64" y="58" width="10" height="18" rx="1" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1" />
      <rect x="28" y="40" width="8" height="28" rx="1.5" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1.1" />
      <rect x="84" y="40" width="8" height="28" rx="1.5" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1.1" />
      <rect x="26" y="36" width="12" height="6" rx="1" fill={FILL_GOLD} opacity="0.8" />
      <rect x="82" y="36" width="12" height="6" rx="1" fill={FILL_GOLD} opacity="0.8" />
    </g>
  );
}

function DelhiIndiaGate() {
  return (
    <g>
      <path d="M18 92h84" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path
        d="M34 92V50c0-6 10-12 26-12s26 6 26 12v42"
        fill={FILL_MUTED}
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M46 92V58c0-3 5-6 14-6s14 3 14 6v34"
        fill={FILL_ACCENT}
        stroke={STROKE}
        strokeWidth="1.2"
      />
      <path d="M60 26v10" stroke={FILL_GOLD} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="60" cy="22" r="2.2" fill={FILL_GOLD} />
      <path d="M52 38h16" stroke={STROKE} strokeWidth="1" opacity="0.5" />
    </g>
  );
}

function GenericCitySilhouette() {
  return (
    <g>
      <path d="M14 92h92" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <rect x="22" y="58" width="18" height="34" rx="2" fill={FILL_MUTED} stroke={STROKE} strokeWidth="1.2" />
      <rect x="44" y="48" width="14" height="44" rx="2" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1.2" />
      <rect x="62" y="54" width="16" height="38" rx="2" fill={FILL_MUTED} stroke={STROKE} strokeWidth="1.2" />
      <rect x="82" y="62" width="14" height="30" rx="2" fill={FILL_ACCENT} stroke={STROKE} strokeWidth="1.2" />
      <circle cx="51" cy="42" r="2" fill={FILL_GOLD} />
      <circle cx="70" cy="36" r="2.2" fill={FILL_GOLD} />
      <path d="M26 70h10M66 66h10M86 74h6" stroke={STROKE} strokeWidth="0.9" opacity="0.45" />
    </g>
  );
}

const LANDMARKS: Record<CityLandmarkId, () => ReactElement> = {
  chennai: ChennaiGopuram,
  mumbai: MumbaiGateway,
  bengaluru: BengaluruVidhanaSoudha,
  hyderabad: HyderabadCharminar,
  "delhi-ncr": DelhiIndiaGate,
  generic: GenericCitySilhouette,
};

export function CityLandmarkArt({ landmarkId, className }: LandmarkArtProps) {
  const Landmark = LANDMARKS[landmarkId];
  return (
    <svg
      className={className}
      viewBox="0 0 120 100"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <Landmark />
    </svg>
  );
}
