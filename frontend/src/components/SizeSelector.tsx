interface SizeOption {
  value: string
  label: string
  desc: string
}

const SIZE_OPTIONS: SizeOption[] = [
  { value: '1280x720', label: '1280 × 720', desc: '横屏 16:9' },
  { value: '720x1280', label: '720 × 1280', desc: '竖屏 9:16' },
  { value: '1792x1024', label: '1792 × 1024', desc: '宽屏 7:4' },
  { value: '1024x1792', label: '1024 × 1792', desc: '竖宽屏 4:7' },
  { value: '1024x1024', label: '1024 × 1024', desc: '正方形 1:1' },
]

interface Props {
  size: string
  onSizeChange: (size: string) => void
  disabled?: boolean
}

export default function SizeSelector({ size, onSizeChange, disabled }: Props) {
  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>画面比例</p>
      <div style={styles.grid}>
        {SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            style={{
              ...styles.option,
              ...(size === opt.value ? styles.optionActive : {}),
              ...(disabled ? styles.optionDisabled : {}),
            }}
            onClick={() => !disabled && onSizeChange(opt.value)}
            disabled={disabled}
          >
            <span style={styles.optionValue}>{opt.label}</span>
            <span style={styles.optionDesc}>{opt.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#a090c0',
    marginBottom: 10,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  },
  option: {
    background: '#1a1030',
    border: '1.5px solid #3d2f5a',
    borderRadius: 8,
    padding: '10px 12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    transition: 'border-color 0.15s, background 0.15s',
    textAlign: 'left',
  },
  optionActive: {
    borderColor: '#f0a040',
    background: '#2a1a40',
  },
  optionDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  optionValue: {
    fontSize: 13,
    color: '#d0c0e8',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  optionDesc: {
    fontSize: 11,
    color: '#7060a0',
  },
}
