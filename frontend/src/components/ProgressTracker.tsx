import { TaskStatus } from '../types'

interface Props {
  status: TaskStatus | null
  isGenerating: boolean
}

const STEP_LABELS = [
  '开场：暖光亮起',
  '近景：光线折射',
  '俯视：安全感光圈',
  '互动：亲子场景',
  '收尾：星空映衬',
]

type StepState = 'done' | 'active' | 'waiting' | 'error'

function getStepState(
  stepIndex: number,
  status: TaskStatus | null,
  isGenerating: boolean,
): StepState {
  if (!status && !isGenerating) return 'waiting'
  if (status?.status === 'error') {
    if (stepIndex < (status.current_step - 1)) return 'done'
    if (stepIndex === (status.current_step - 1)) return 'error'
    return 'waiting'
  }
  const completed = status?.completed_videos ?? 0
  if (stepIndex < completed) return 'done'
  if (stepIndex === (status?.current_step ?? 0) - 1 && isGenerating) return 'active'
  return 'waiting'
}

const STATE_COLORS: Record<StepState, string> = {
  done: '#34d399',
  active: '#f0a040',
  waiting: '#3d2f5a',
  error: '#f87171',
}

const STATE_ICONS: Record<StepState, string> = {
  done: '✓',
  active: '⟳',
  waiting: '○',
  error: '✗',
}

export default function ProgressTracker({ status, isGenerating }: Props) {
  const statusText = () => {
    if (!status) return isGenerating ? '准备中…' : ''
    switch (status.status) {
      case 'pending': return '准备中…'
      case 'generating': return `正在生成第 ${status.current_step} / ${status.total_steps} 段`
      case 'merging' as string: return '正在合并视频…'
      case 'done': return '全部完成 🎉'
      case 'error': return '生成失败'
      default: return ''
    }
  }

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>生成进度</p>
      <div style={styles.statusBar}>
        <span
          style={{
            ...styles.statusText,
            color: status?.status === 'error' ? '#f87171'
              : status?.status === 'done' ? '#34d399'
              : '#f0a040',
          }}
        >
          {statusText()}
        </span>
      </div>

      <div style={styles.steps}>
        {STEP_LABELS.map((label, i) => {
          const state = getStepState(i, status, isGenerating)
          return (
            <div key={i} style={styles.step}>
              <div
                style={{
                  ...styles.stepIcon,
                  background: STATE_COLORS[state],
                  color: state === 'waiting' ? '#7060a0' : '#fff',
                  animation: state === 'active' ? 'spin 1.2s linear infinite' : 'none',
                }}
              >
                {STATE_ICONS[state]}
              </div>
              <div style={styles.stepInfo}>
                <span style={styles.stepNum}>片段 {i + 1}</span>
                <span
                  style={{
                    ...styles.stepLabel,
                    color: state === 'waiting' ? '#5a4a70' : '#c0b0e0',
                  }}
                >
                  {label}
                </span>
              </div>
              {state === 'active' && (
                <div style={styles.pulse} />
              )}
            </div>
          )
        })}
      </div>

      {status?.status === 'error' && status.error && (
        <div style={styles.errorDetail}>
          <strong>错误详情：</strong>
          <pre style={styles.errorPre}>{status.error}</pre>
        </div>
      )}

      {status?.status === 'done' && (
        <div style={styles.mergeRow}>
          <div style={{ ...styles.stepIcon, background: '#34d399', color: '#fff' }}>✓</div>
          <span style={styles.mergeLabel}>全部完成</span>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#140e24',
    border: '1px solid #2a1e42',
    borderRadius: 14,
    padding: '20px 24px',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#a090c0',
    marginBottom: 12,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statusBar: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 600,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
    transition: 'background 0.3s',
  },
  stepInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  stepNum: {
    fontSize: 11,
    color: '#6050a0',
    fontWeight: 600,
  },
  stepLabel: {
    fontSize: 13,
    transition: 'color 0.3s',
  },
  pulse: {
    position: 'absolute',
    left: 0,
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid #f0a040',
    animation: 'pulse 1.5s ease-out infinite',
    pointerEvents: 'none',
  },
  mergeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #2a1e42',
  },
  mergeLabel: {
    fontSize: 13,
    color: '#c0b0e0',
  },
  errorDetail: {
    marginTop: 14,
    padding: '10px 14px',
    background: '#2a0e0e',
    border: '1px solid #7f1d1d',
    borderRadius: 8,
    fontSize: 12,
    color: '#fca5a5',
  },
  errorPre: {
    marginTop: 6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#fca5a5',
    lineHeight: 1.5,
  },
}
