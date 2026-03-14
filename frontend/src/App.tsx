import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ImageUploader from './components/ImageUploader'
import SizeSelector from './components/SizeSelector'
import SegmentEditor from './components/SegmentEditor'
import ProgressTracker from './components/ProgressTracker'
import PreviewPanel from './components/PreviewPanel'
import { IconFilm, IconPlay, IconReset, IconSpinner, IconWarning } from './Icons'
import type { TaskStatus, SegmentItem } from './types'
import { DEFAULT_SEGMENTS } from './constants/defaultSegments'

export default function App() {
  const [image, setImage] = useState<File | null>(null)
  const [size, setSize] = useState('1280x720')
  const [segments, setSegments] = useState<SegmentItem[]>(() => [...DEFAULT_SEGMENTS])
  const [taskId, setTaskId] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const handleGenerate = async () => {
    if (!image || isGenerating) return
    setError(null)
    setTaskStatus(null)
    setTaskId(null)
    setIsGenerating(true)

    const formData = new FormData()
    formData.append('image', image)
    formData.append('size', size)
    formData.append('segments', JSON.stringify(segments))

    try {
      const { data } = await axios.post<{ task_id: string }>('/api/generate', formData)
      const id = data.task_id
      setTaskId(id)

      pollingRef.current = setInterval(async () => {
        try {
          const { data: status } = await axios.get<TaskStatus>(`/api/status/${id}`)
          setTaskStatus(status)
          if (status.status === 'done' || status.status === 'error') {
            stopPolling()
            setIsGenerating(false)
          }
        } catch {
          // network blip — keep polling
        }
      }, 3000)
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.message)
        : String(err)
      setError(msg)
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    stopPolling()
    setImage(null)
    setTaskId(null)
    setTaskStatus(null)
    setIsGenerating(false)
    setError(null)
  }

  const showPreview =
    taskId !== null &&
    taskStatus !== null &&
    (taskStatus.completed_videos > 0 || taskStatus.has_merged)
  const isDone = taskStatus?.status === 'done'
  const hasError = taskStatus?.status === 'error'

  return (
    <div style={s.root}>
      {/* ── NAV ── */}
      <header style={s.nav}>
        <div style={s.navInner}>
          <div style={s.brand}>
            <IconFilm size={18} style={{ color: 'var(--accent)' }} />
            <span style={s.brandName}>Video6s²Promo</span>
          </div>
          {isDone && (
            <span style={s.doneBadge}>
              <span style={s.doneDot} />
              完成
            </span>
          )}
          {isGenerating && (
            <span style={s.generatingBadge}>
              <IconSpinner size={12} />
              生成中 {taskStatus?.completed_videos ?? 0} / 5
            </span>
          )}
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <main style={s.main}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <ImageUploader image={image} onImageChange={setImage} disabled={isGenerating} />
          <SizeSelector size={size} onSizeChange={setSize} disabled={isGenerating} />
          <SegmentEditor
            segments={segments}
            onSegmentsChange={setSegments}
            disabled={isGenerating}
          />

          <div style={s.actions}>
            {error && (
              <div style={s.errorBox}>
                <IconWarning size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, lineHeight: 1.5, wordBreak: 'break-all' }}>{error}</span>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || !image}
            >
              {isGenerating
                ? <><IconSpinner size={15} /> 生成中…</>
                : <><IconPlay size={14} /> 开始生成</>
              }
            </button>

            {(isDone || hasError) && (
              <button className="btn-ghost" onClick={handleReset}>
                <IconReset size={13} /> 重新开始
              </button>
            )}
          </div>
        </aside>

        {/* Content */}
        <section style={s.content}>
          {(isGenerating || taskStatus) ? (
            <div style={s.activeArea}>
              <ProgressTracker
                status={taskStatus}
                isGenerating={isGenerating}
                segmentTitles={taskStatus?.segment_titles}
              />
              {showPreview && (
                <PreviewPanel
                  taskId={taskId!}
                  completedVideos={taskStatus!.completed_videos}
                  hasMerged={taskStatus!.has_merged}
                  isDone={isDone}
                  segmentTitles={taskStatus?.segment_titles}
                />
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
    </div>
  )
}

function EmptyState() {
  const steps = [
    { n: '01', text: '上传产品图（每段均以此为参考）' },
    { n: '02', text: '选择画面比例' },
    { n: '03', text: '一键生成 5 段 6s 视频' },
    { n: '04', text: '实时预览合并成片' },
  ]
  return (
    <div style={s.empty}>
      <div style={s.emptyHeadline}>
        <p style={s.emptySubhead}>六秒一帧，串联成片</p>
        <h2 style={s.emptyH2}>五段自动生成<br />合并为 30 秒宣传片</h2>
      </div>

      <div style={s.emptySteps}>
        {steps.map((step, i) => (
          <div
            key={step.n}
            className="fade-up"
            style={{ ...s.emptyStep, animationDelay: `${i * 60}ms` }}
          >
            <span style={s.emptyN}>{step.n}</span>
            <span style={s.emptyText}>{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  nav: {
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navInner: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '0 32px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--text-1)',
  },
  doneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 99,
    background: 'var(--success-dim)',
    border: '1px solid rgba(16,185,129,0.2)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--success)',
  },
  doneDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--success)',
  },
  generatingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 99,
    background: 'var(--accent-dim)',
    border: '1px solid rgba(245,158,11,0.2)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent)',
  },
  main: {
    flex: 1,
    maxWidth: 1320,
    margin: '0 auto',
    width: '100%',
    padding: '32px 32px',
    display: 'grid',
    gridTemplateColumns: '268px 1fr',
    gap: 32,
    alignItems: 'start',
  },
  sidebar: {
    position: 'sticky',
    top: 88,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  content: {
    minWidth: 0,
  },
  activeArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: 'var(--error-dim)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 'var(--radius)',
    padding: '10px 12px',
    color: 'var(--error)',
    marginBottom: 4,
  },
  empty: {
    padding: '48px 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 48,
  },
  emptyHeadline: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  emptySubhead: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--accent)',
    letterSpacing: '0.04em',
  },
  emptyH2: {
    fontSize: 38,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    color: 'var(--text-1)',
  },
  emptySteps: {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid var(--border)',
  },
  emptyStep: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 20,
    padding: '16px 0',
    borderBottom: '1px solid var(--border)',
  },
  emptyN: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-3)',
    minWidth: 24,
  },
  emptyText: {
    fontSize: 15,
    color: 'var(--text-2)',
  },
}
