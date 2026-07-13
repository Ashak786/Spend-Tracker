import React from 'react';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 48, className = '' }: LogoIconProps) {
  const [useFallback, setUseFallback] = React.useState(false);

  if (!useFallback) {
    return (
      <img
        src="https://lh3.googleusercontent.com/d/1nm8tjDQZ2x4j_ZOjtcwRdtqMpIOhsDUJ"
        alt="SpendWisely Logo"
        className={`${className} object-contain rounded-xl`}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ width: size, height: size }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients matching the user's uploaded logo colors */}
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="logoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="60%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* OWL SILHOUETTE BODY (Deep Blue) */}
      <path
        d="M 40,55 
           C 35,25 50,15 65,22 
           C 80,30 120,30 135,22 
           C 150,15 165,25 160,55 
           C 155,90 155,140 140,165 
           C 125,190 75,190 60,165 
           C 45,140 45,90 40,55 Z"
        fill="url(#logoBlueGrad)"
        filter="url(#subtleShadow)"
      />

      {/* ORANGE EYEBROW / FOREHEAD TRIM */}
      <path
        d="M 47,45 
           C 55,30 75,32 90,42 
           C 100,48 100,48 110,42 
           C 125,32 145,30 153,45 
           C 155,50 145,55 135,50 
           C 120,42 110,50 100,58 
           C 90,50 80,42 65,50 
           C 55,55 45,50 47,45 Z"
        fill="url(#logoOrangeGrad)"
      />

      {/* OWL FACE EYE BACKGROUNDS (White patches) */}
      <circle cx="72" cy="70" r="26" fill="#FFFFFF" />
      <circle cx="128" cy="70" r="26" fill="#FFFFFF" />

      {/* OWL EYE OUTLINE (Blue) */}
      <circle cx="72" cy="70" r="20" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="4.5" />
      <circle cx="128" cy="70" r="20" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="4.5" />

      {/* PUPILS (Blue) */}
      <circle cx="72" cy="70" r="13" fill="#1E3A8A" />
      <circle cx="128" cy="70" r="13" fill="#1E3A8A" />

      {/* EYE REFLECTIONS (White circles matching the cute highlights in the brand logo) */}
      <circle cx="68" cy="65" r="4.5" fill="#FFFFFF" />
      <circle cx="124" cy="65" r="4.5" fill="#FFFFFF" />
      <circle cx="77" cy="74" r="2" fill="#FFFFFF" />
      <circle cx="133" cy="74" r="2" fill="#FFFFFF" />

      {/* BEAK (Orange) */}
      <path
        d="M 93,76 L 107,76 L 100,99 Z"
        fill="url(#logoOrangeGrad)"
      />

      {/* WHITE CHEST EMBLEM AREA */}
      <path
        d="M 60,110 
           C 60,95 140,95 140,110 
           C 140,135 125,165 100,165 
           C 75,165 60,135 60,110 Z"
        fill="#FFFFFF"
      />

      {/* RIGHT ORANGE WING / SIDE BODY ACCENT */}
      <path
        d="M 140,110
           C 152,110 162,130 152,155
           C 142,175 120,175 120,175
           C 120,175 135,160 140,140
           C 143,125 140,110 140,110 Z"
        fill="url(#logoOrangeGrad)"
      />

      {/* RISING TREND ARROW (Passing behind Rupee symbol) */}
      <g>
        <path
          d="M 45,165 L 142,68"
          stroke="url(#arrowGrad)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* ARROW HEAD */}
        <path
          d="M 124,65 L 152,61 L 148,89 Z"
          fill="url(#logoOrangeGrad)"
        />
      </g>

      {/* RUPEE SYMBOL (₹) inside chest (Deep Blue, centered beautifully) */}
      <text
        x="100"
        y="143"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="36"
        fill="#1E3A8A"
        textAnchor="middle"
      >
        ₹
      </text>
    </svg>
  );
}

interface LogoFullProps {
  size?: number;
  className?: string;
}

export function LogoFull({ size = 48, className = '' }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <div className="p-1 bg-white/45 dark:bg-slate-900/40 rounded-2xl border border-white/65 dark:border-white/5 shadow-xs transition-transform duration-300 hover:rotate-3 shrink-0">
        <LogoIcon size={size} />
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none uppercase font-display flex items-center gap-1.5">
          <span className="text-blue-900 dark:text-white">SPEND</span>
          <span className="text-orange-500 dark:text-orange-400">WISELY</span>
        </h1>
        <span className="text-[9px] sm:text-[10px] font-black text-blue-600 dark:text-orange-400/90 uppercase tracking-[0.25em] leading-none mt-1.5">
          Smart Spend Tracker
        </span>
      </div>
    </div>
  );
}
