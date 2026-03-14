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
  const [progressExpanded, setProgressExpanded] = useState(false)
  const [segmentVersions, setSegmentVersions] = useState<Record<number, number>>({})
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevRegeneratingRef = useRef<number | null>(null)

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
          const prev = prevRegeneratingRef.current
          if (status.regenerating_segment != null) prevRegeneratingRef.current = status.regenerating_segment
          else if (prev != null) {
            setSegmentVersions((v) => ({ ...v, [prev]: (v[prev] ?? 0) + 1 }))
            prevRegeneratingRef.current = null
          }
          setTaskStatus(status)
          if (status.status === 'done' || status.status === 'error') {
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
    setSegmentVersions({})
    prevRegeneratingRef.current = null
  }

  const handleRegenerateSegment = async (segmentIndex: number) => {
    if (!taskId) return
    try {
      const formData = new FormData()
      formData.append('task_id', taskId)
      formData.append('segment_index', String(segmentIndex))
      await axios.post('/api/regenerate', formData)
      setError(null)
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.message)
        : String(err)
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
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
              {/* 主区域：视频预览（未就绪时显示占位） */}
              {showPreview ? (
                <PreviewPanel
                  taskId={taskId!}
                  completedVideos={taskStatus!.completed_videos}
                  hasMerged={taskStatus!.has_merged}
                  isDone={isDone}
                  segmentTitles={taskStatus?.segment_titles}
                  regeneratingSegment={taskStatus?.regenerating_segment ?? null}
                  onRegenerateSegment={handleRegenerateSegment}
                  segmentVersions={segmentVersions}
                />
              ) : (
                <div style={s.previewPlaceholder}>
                  <p style={s.placeholderTitle}>视频预览将在此显示</p>
                  <p style={s.placeholderSub}>
                    {isGenerating
                      ? `正在生成 5 段视频… 已完成 ${taskStatus?.completed_videos ?? 0} / 5 段`
                      : '生成完成后可在此预览与下载'}
                  </p>
                  {taskStatus && (isGenerating || taskStatus.status === 'generating') && (
                    <div style={s.placeholderBar}>
                      <div
                        style={{
                          ...s.placeholderBarFill,
                          width: `${((taskStatus.completed_videos ?? 0) / (taskStatus.total_steps ?? 5)) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              {/* 次要：进度列表（可折叠，默认收起） */}
              <div style={s.progressSection}>
                <button
                  type="button"
                  className="progress-toggle"
                  style={s.progressToggle}
                  onClick={() => setProgressExpanded((e) => !e)}
                  aria-expanded={progressExpanded}
                >
                  <span style={s.progressToggleLabel}>
                    {taskStatus?.status === 'done'
                      ? '全部完成'
                      : taskStatus?.status === 'error'
                        ? '生成失败'
                        : `进度 ${taskStatus?.completed_videos ?? 0} / 5`}
                  </span>
                  <span style={s.progressToggleArrow}>{progressExpanded ? '▼' : '▶'}</span>
                </button>
                {progressExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <ProgressTracker
                      status={taskStatus}
                      isGenerating={isGenerating}
                      segmentTitles={taskStatus?.segment_titles}
                    />
                  </div>
                )}
              </div>
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
    gap: 20,
  },
  previewPlaceholder: {
    background: 'var(--surface)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '48px 24px',
    textAlign: 'center',
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-2)',
    margin: 0,
  },
  placeholderSub: {
    fontSize: 13,
    color: 'var(--text-3)',
    margin: 0,
  },
  placeholderBar: {
    width: '100%',
    maxWidth: 240,
    height: 4,
    background: 'var(--border)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  placeholderBarFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  progressSection: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    background: 'var(--surface)',
  },
  progressToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-2)',
    transition: 'background 0.15s',
  },
  progressToggleLabel: {},
  progressToggleArrow: {
    fontSize: 10,
    color: 'var(--text-3)',
    fontFamily: 'inherit',
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
