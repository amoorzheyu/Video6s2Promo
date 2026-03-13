interface SizeOption {
  value: string
  label: string
  ratio: string
  w: number
  h: number
}

// w/h are relative visual dimensions (max dim = 28px)
const SIZE_OPTIONS: SizeOption[] = [
  { value: '1280x720',  label: '1280 × 720',  ratio: '16 : 9', w: 28, h: 16 },
  { value: '720x1280',  label: '720 × 1280',  ratio: '9 : 16', w: 16, h: 28 },
  { value: '1792x1024', label: '1792 × 1024', ratio: '7 : 4',  w: 28, h: 16 },
  { value: '1024x1792', label: '1024 × 1792', ratio: '4 : 7',  w: 16, h: 28 },
  { value: '1024x1024', label: '1024 × 1024', ratio: '1 : 1',  w: 22, h: 22 },
]

interface Props {
  size: string
  onSizeChange: (size: string) => void
  disabled?: boolean
}

export default function SizeSelector({ size, onSizeChange, disabled }: Props) {
  return (
    <div style={s.wrapper}>
      <p className="label">画面比例</p>
      <div style={s.list}>
        {SIZE_OPTIONS.map((opt) => {
          const active = size === opt.value
          return (
            <button
              key={opt.value}
              style={{
                ...s.option,
                ...(active ? s.optionActive : {}),
                ...(disabled ? s.optionDisabled : {}),
              }}
              onClick={() => !disabled && onSizeChange(opt.value)}
              disabled={disabled}
            >
              {/* visual ratio rect */}
              <div style={s.ratioWrap}>
                <div
                  style={{
                    ...s.ratioRect,
                    width: opt.w,
                    height: opt.h,
                    borderColor: active ? 'var(--accent)' : 'var(--border-strong, #3f3f46)',
                    background: active ? 'var(--accent-dim)' : 'var(--elevated)',
                  }}
                />
              </div>
              <div style={s.info}>
                <span style={s.ratio}>{opt.ratio}</span>
                <span style={s.dims}>{opt.label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    marginBottom: 24,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius)',
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    textAlign: 'left',
    width: '100%',
  },
  optionActive: {
    background: 'var(--elevated)',
    borderColor: 'var(--border)',
  },
  optionDisabled: {
    cursor: 'not-allowed',
    opacity: 0.4,
  },
  ratioWrap: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ratioRect: {
    borderRadius: 2,
    border: '1.5px solid',
    transition: 'border-color 0.15s, background 0.15s',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  ratio: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-1)',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
  },
  dims: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
  },
}
