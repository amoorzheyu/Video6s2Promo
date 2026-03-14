import { TaskStatus } from '../types'
import { IconCheck, IconSpinner, IconX } from '../Icons'

interface Props {
  status: TaskStatus | null
  isGenerating: boolean
  segmentTitles?: string[]
}

const DEFAULT_STEP_LABELS = [
  '开场暖光',
  '光线折射',
  '俯视光圈',
  '亲子互动',
  '星空收尾',
]

type StepState = 'done' | 'active' | 'waiting' | 'error'

function getStepState(i: number, status: TaskStatus | null, isGenerating: boolean): StepState {
  if (!status && !isGenerating) return 'waiting'
  if (status?.status === 'error') {
    const done = status.completed_videos ?? 0
    if (i < done) return 'done'
    if (i === done) return 'error'
    return 'waiting'
  }
  const done = status?.completed_videos ?? 0
  if (i < done) return 'done'
  if (isGenerating && i === done) return 'active'
  return 'waiting'
}

function StepDot({ state }: { state: StepState }) {
  const bg = {
    done:    'var(--success)',
    active:  'var(--accent)',
    waiting: 'var(--elevated)',
    error:   'var(--error)',
  }[state]
  const border = {
    done:    'transparent',
    active:  'var(--accent)',
    waiting: 'var(--border)',
    error:   'transparent',
  }[state]

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{ ...dot, background: bg, border: `1.5px solid ${border}` }}>
        {state === 'done'    && <IconCheck size={10} style={{ color: '#052e16' }} />}
        {state === 'active'  && <IconSpinner size={10} style={{ color: '#451a03' }} />}
        {state === 'error'   && <IconX size={9} style={{ color: '#fff' }} />}
        {state === 'waiting' && <span style={dotNum} />}
      </div>
      {state === 'active' && <div style={pulseRing} />}
    </div>
  )
}

export default function ProgressTracker({ status, isGenerating, segmentTitles }: Props) {
  const stepLabels =
    segmentTitles && segmentTitles.length >= 5
      ? segmentTitles
      : DEFAULT_STEP_LABELS

  const headerText = () => {
    if (!status) return isGenerating ? '初始化…' : ''
    switch (status.status) {
      case 'pending':    return '初始化…'
      case 'generating': return `已完成 ${status.completed_videos} / ${status.total_steps}`
      case 'done':       return '全部完成'
      case 'error':      return '生成失败'
      default:           return ''
    }
  }
  const headerColor = status?.status === 'error'
    ? 'var(--error)'
    : status?.status === 'done'
    ? 'var(--success)'
    : 'var(--text-2)'

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <span style={{ ...s.headerLabel, color: headerColor }}>{headerText()}</span>
        {status && status.status !== 'error' && status.status !== 'done' && (
          <div style={s.progressBar}>
            <div
              style={{
                ...s.progressFill,
                width: `${((status.completed_videos) / status.total_steps) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      <div style={s.steps}>
        {stepLabels.map((label, i) => {
          const state = getStepState(i, status, isGenerating)
          const isLast = i === stepLabels.length - 1
          return (
            <div key={i} style={s.row}>
              <div style={s.dotCol}>
                <StepDot state={state} />
                {!isLast && (
                  <div style={{
                    ...s.connector,
                    background: state === 'done' ? 'var(--success)' : 'var(--border)',
                  }} />
                )}
              </div>
              <div style={{ ...s.rowContent, paddingBottom: isLast ? 0 : 12 }}>
                <span style={{
                  ...s.stepLabel,
                  color: state === 'waiting' ? 'var(--text-3)' : 'var(--text-1)',
                }}>
                  {label}
                </span>
                <span style={{ ...s.stepSub, fontFamily: "'JetBrains Mono', monospace" }}>
                  片段 {i + 1} · 6s
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {status?.status === 'error' && status.error && (
        <div style={s.errorDetail}>
          <pre style={s.errorPre}>{status.error}</pre>
        </div>
      )}
    </div>
  )
}

const dot: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.3s, border-color 0.3s',
  position: 'relative',
  zIndex: 1,
}

const dotNum: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: 'var(--border)',
}

const pulseRing: React.CSSProperties = {
  position: 'absolute',
  inset: -3,
  borderRadius: '50%',
  border: '1.5px solid var(--accent)',
  animation: 'pulse-ring 1.6s ease-out infinite',
  pointerEvents: 'none',
  zIndex: 0,
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: 600,
    minWidth: 80,
  },
  progressBar: {
    flex: 1,
    height: 3,
    background: 'var(--border)',
    borderRadius: 9,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 9,
    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  dotCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  connector: {
    width: 1,
    flex: 1,
    minHeight: 12,
    marginTop: 2,
    marginBottom: 2,
    transition: 'background 0.4s',
  },
  rowContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    paddingTop: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 500,
    transition: 'color 0.3s',
  },
  stepSub: {
    fontSize: 10,
    color: 'var(--text-3)',
    letterSpacing: '0.02em',
  },
  errorDetail: {
    marginTop: 14,
    padding: '10px 12px',
    background: 'var(--error-dim)',
    border: '1px solid rgba(239,68,68,0.18)',
    borderRadius: 'var(--radius)',
  },
  errorPre: {
    fontSize: 11,
    color: 'var(--error)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.6,
    opacity: 0.85,
  },
}
