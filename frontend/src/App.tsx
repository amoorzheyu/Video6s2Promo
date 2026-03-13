import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import ImageUploader from './components/ImageUploader'
import SizeSelector from './components/SizeSelector'
import ProgressTracker from './components/ProgressTracker'
import PreviewPanel from './components/PreviewPanel'
import { TaskStatus } from './types'

export default function App() {
  const [image, setImage] = useState<File | null>(null)
  const [size, setSize] = useState('1280x720')
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
          // 网络抖动，继续轮询
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
    taskStatus.has_merged

  return (
    <div style={styles.app}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logo}>🎬</span>
          <div>
            <h1 style={styles.title}>Video6s²Promo</h1>
            <p style={styles.subtitle}>上传参考图 · 自动生成 5 段 6s 视频 · 实时合并预览</p>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={styles.main}>
        {/* 左侧控制区 */}
        <aside style={styles.sidebar}>
          <ImageUploader
            image={image}
            onImageChange={setImage}
            disabled={isGenerating}
          />
          <SizeSelector
            size={size}
            onSizeChange={setSize}
            disabled={isGenerating}
          />

          {error && (
            <div style={styles.errorBox}>
              <strong>错误：</strong>{error}
            </div>
          )}

          <button
            style={{
              ...styles.generateBtn,
              ...(isGenerating || !image ? styles.generateBtnDisabled : {}),
            }}
            onClick={handleGenerate}
            disabled={isGenerating || !image}
          >
            {isGenerating ? (
              <span style={styles.btnContent}>
                <span style={styles.spinner}>⟳</span> 生成中…
              </span>
            ) : '▶ 开始生成'}
          </button>

          {(taskStatus?.status === 'done' || taskStatus?.status === 'error') && (
            <button style={styles.resetBtn} onClick={handleReset}>
              重新开始
            </button>
          )}
        </aside>

        {/* 右侧结果区 */}
        <section style={styles.content}>
          {(isGenerating || taskStatus) ? (
            <>
              <ProgressTracker status={taskStatus} isGenerating={isGenerating} />
              {showPreview && (
                <PreviewPanel
                  taskId={taskId!}
                  completedVideos={taskStatus!.completed_videos}
                  hasMerged={taskStatus!.has_merged}
                  isDone={taskStatus!.status === 'done'}
                />
              )}
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌙</div>
              <p style={styles.emptyTitle}>准备好了</p>
              <p style={styles.emptyDesc}>
                上传参考图片，选择尺寸后<br />点击「开始生成」即可
              </p>
              <div style={styles.emptySteps}>
                {['上传产品图', '选择比例', '一键生成 5 段视频', '预览 & 下载'].map(
                  (s, i) => (
                    <div key={i} style={styles.emptyStep}>
                      <span style={styles.emptyStepNum}>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid #1e1535',
    padding: '16px 32px',
    background: 'rgba(12,9,22,0.95)',
    backdropFilter: 'blur(8px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    maxWidth: 1200,
    margin: '0 auto',
  },
  logo: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#f0e8ff',
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontSize: 12,
    color: '#6050a0',
    marginTop: 2,
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 24,
    padding: '28px 32px',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    alignItems: 'flex-start',
  },
  sidebar: {
    position: 'sticky',
    top: 86,
  },
  content: {
    minWidth: 0,
  },
  generateBtn: {
    width: '100%',
    padding: '13px 0',
    background: 'linear-gradient(135deg, #e8860a 0%, #f0a040 100%)',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
    letterSpacing: '0.04em',
    marginBottom: 10,
  },
  generateBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    transform: 'none',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  resetBtn: {
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: '1.5px solid #3d2f5a',
    borderRadius: 10,
    fontSize: 13,
    color: '#8070a0',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
    marginBottom: 10,
  },
  errorBox: {
    background: '#2a0e0e',
    border: '1px solid #7f1d1d',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#fca5a5',
    marginBottom: 14,
    wordBreak: 'break-all',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    gap: 12,
    color: '#5a4a70',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#8070a0',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.7,
    color: '#5a4a70',
  },
  emptySteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 16,
    width: '100%',
    maxWidth: 280,
  },
  emptyStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
    color: '#6050a0',
    background: '#140e24',
    border: '1px solid #2a1e42',
    borderRadius: 8,
    padding: '8px 14px',
  },
  emptyStepNum: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#2a1e42',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#8070a0',
    flexShrink: 0,
  },
}
