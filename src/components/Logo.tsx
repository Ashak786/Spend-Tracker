import React from 'react';
import { motion } from 'motion/react';

interface LogoIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function LogoIcon({ size = 48, className = '', animate = true }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ width: size, height: size }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2E8A99" />
          <stop offset="100%" stopColor="#0B4F5C" />
        </linearGradient>
        <linearGradient id="greenArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#15803D" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#86EFAC" />
        </linearGradient>
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="30%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer circular arrows - rotating subtly if animate is true */}
      <motion.g
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '100px 100px' }}
      >
        {/* Top/Right Arrow Arc */}
        <path
          d="M 55,145 A 70,70 0 0,1 140,55"
          stroke="url(#tealGrad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Top/Right Arrow Head */}
        <path
          d="M 125,50 L 148,50 L 142,75 Z"
          fill="#2E8A99"
        />

        {/* Bottom/Left Arrow Arc */}
        <path
          d="M 145,55 A 70,70 0 0,1 60,145"
          stroke="url(#tealGrad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Bottom/Left Arrow Head */}
        <path
          d="M 75,150 L 52,150 L 58,125 Z"
          fill="#2E8A99"
        />
      </motion.g>

      {/* Bar Chart Bars with nice slide up animations */}
      <g>
        {/* Bar 1 (Left): Dark Green */}
        <motion.rect
          x="68"
          y="110"
          width="16"
          height="35"
          rx="3"
          fill="#166534"
          initial={animate ? { scaleY: 0, originY: '145px' } : undefined}
          animate={animate ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        />
        
        {/* Bar 2 (Middle): Medium Green */}
        <motion.rect
          x="88"
          y="90"
          width="16"
          height="55"
          rx="3"
          fill="#15803D"
          initial={animate ? { scaleY: 0, originY: '145px' } : undefined}
          animate={animate ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        />

        {/* Bar 3 (Right): Light Green */}
        <motion.rect
          x="108"
          y="70"
          width="16"
          height="75"
          rx="3"
          fill="#22C55E"
          initial={animate ? { scaleY: 0, originY: '145px' } : undefined}
          animate={animate ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        />
      </g>

      {/* Rising Arrow path with drawing/fade transition */}
      <g>
        <motion.path
          d="M 55,130 L 85,95 L 125,55"
          stroke="url(#greenArrowGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={animate ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeInOut' }}
        />
        {/* Arrow Head */}
        <motion.path
          d="M 115,55 L 132,48 L 125,65 Z"
          fill="#86EFAC"
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={animate ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 1.0, ease: 'easeOut' }}
          style={{ transformOrigin: '125px 55px' }}
        />
      </g>

      {/* Silver Rupee symbol on Bar 3 with fade-in and subtle float */}
      <motion.text
        x="114"
        y="112"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="24"
        fill="url(#silverGrad)"
        filter="url(#shadow)"
        initial={animate ? { opacity: 0, y: 118 } : undefined}
        animate={animate ? { opacity: 1, y: 112 } : undefined}
        transition={{ duration: 0.5, delay: 0.8, ease: 'easeOut' }}
      >
        ₹
      </motion.text>
    </svg>
  );
}

interface LogoFullProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function LogoFull({ size = 48, className = '', animate = true }: LogoFullProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon size={size} animate={animate} />
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none uppercase font-display flex items-center">
          Spend&nbsp;<span className="text-teal-600 font-extrabold">Wisely</span>
        </h1>
        <span className="text-[9px] sm:text-[10px] font-black text-teal-600 uppercase tracking-[0.25em] leading-none mt-1">
          Spend Tracker
        </span>
      </div>
    </div>
  );
}
