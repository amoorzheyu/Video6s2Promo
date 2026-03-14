import React from 'react'

interface P { size?: number; className?: string; style?: React.CSSProperties }

const base = (size: number, p: P) => ({
  width: p.size ?? size,
  height: p.size ?? size,
  className: p.className,
  style: p.style,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
})

export function IconFilm(p: P) {
  return (
    <svg {...base(20, p)}>
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M17 17h5M2 17h5" />
    </svg>
  )
}

export function IconUpload(p: P) {
  return (
    <svg {...base(24, p)}>
      <path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1" />
      <polyline points="16 12 12 8 8 12" />
      <line x1="12" y1="8" x2="12" y2="21" />
    </svg>
  )
}

export function IconPlay(p: P) {
  return (
    <svg {...base(18, p)} fill="currentColor" stroke="none">
      <path d="M6.5 5.5a1 1 0 0 1 1.5-.87l9 5.2a1 1 0 0 1 0 1.74l-9 5.2a1 1 0 0 1-1.5-.87V5.5Z" />
    </svg>
  )
}

export function IconCheck(p: P) {
  return (
    <svg {...base(16, p)} strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconSpinner(p: P) {
  return (
    <svg {...base(16, p)} className={[p.className, 'spin'].filter(Boolean).join(' ')}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

export function IconX(p: P) {
  return (
    <svg {...base(14, p)} strokeWidth={2.5}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconArrowLeft(p: P) {
  return (
    <svg {...base(14, p)}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export function IconReset(p: P) {
  return (
    <svg {...base(14, p)}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4" />
    </svg>
  )
}

export function IconWarning(p: P) {
  return (
    <svg {...base(14, p)} strokeWidth={2}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconImage(p: P) {
  return (
    <svg {...base(24, p)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export function IconChevronDown(p: P) {
  return (
    <svg {...base(20, p)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconChevronUp(p: P) {
  return (
    <svg {...base(20, p)}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}
