import { useState } from 'react'
import { IconArrowLeft } from '../Icons'

interface Props {
  taskId: string
  completedVideos: number
  hasMerged: boolean
  isDone: boolean
  segmentTitles?: string[]
}

export default function PreviewPanel({
  taskId,
  completedVideos,
  hasMerged,
  isDone,
  segmentTitles,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const isMergedView = hasMerged && selected === null
  const effectiveSegment = selected ?? 1
  const titles =
    segmentTitles && segmentTitles.length >= 5 ? segmentTitles : null

  const videoUrl = isMergedView
    ? `/api/video/${taskId}/merged`
    : `/api/video/${taskId}/${effectiveSegment}`

  const playerKey = isMergedView ? `merged-${completedVideos}` : `seg-${effectiveSegment}`
  const duration = completedVideos * 6

  return (
    <div style={s.wrapper}>
      {/* ── Player ── */}
      <div style={s.playerWrap}>
        <video
          key={playerKey}
          controls
          style={s.video}
          src={videoUrl}
        />
        <div style={s.playerBar}>
          <div style={s.playerInfo}>
            {isMergedView ? (
              <>
                <span style={s.playerTitle}>合并预览</span>
                <span style={s.playerMeta}>
                  {duration}s{!isDone && <span style={s.liveChip}>实时更新</span>}
                </span>
              </>
            ) : (
              <>
                <span style={s.playerTitle}>
                  {titles ? titles[effectiveSegment - 1] : `片段 ${effectiveSegment}`}
                </span>
                <span style={s.playerMeta}>6s</span>
              </>
            )}
          </div>
          {hasMerged && !isMergedView && (
            <button className="btn-inline" onClick={() => setSelected(null)}>
              <IconArrowLeft size={11} /> 合并视图
            </button>
          )}
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      <div style={s.strip}>
        {Array.from({ length: 5 }, (_, i) => i + 1).map((i) => {
          const ready = i <= completedVideos
          const active = selected === i
          return (
            <div
              key={i}
              style={{
                ...s.thumb,
                ...(active ? s.thumbActive : {}),
                ...(!ready ? s.thumbPending : {}),
              }}
              onClick={() =>
                ready && setSelected(active && hasMerged ? null : i)
              }
              title={ready ? (titles ? titles[i - 1] : `片段 ${i}`) : '等待生成'}
            >
              {ready ? (
                <video
                  src={`/api/video/${taskId}/${i}#t=0.5`}
                  style={s.thumbVid}
                  muted
                  preload="metadata"
                />
              ) : (
                <div style={s.thumbPlaceholder}>
                  <span style={s.thumbN}>{i}</span>
                </div>
              )}
              <div style={s.thumbOverlay}>
                <span style={s.thumbLabel}>
                  {titles ? titles[i - 1] : String(i)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  playerWrap: {
    background: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    display: 'block',
    maxHeight: 440,
    background: '#000',
  },
  playerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 14px',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
  },
  playerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-1)',
  },
  playerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 12,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  liveChip: {
    padding: '1px 6px',
    borderRadius: 99,
    background: 'var(--accent-dim)',
    border: '1px solid rgba(245,158,11,0.2)',
    color: 'var(--accent)',
    fontSize: 10,
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  strip: {
    display: 'flex',
    gap: 6,
    padding: '10px 12px',
    background: 'var(--surface)',
    overflowX: 'auto',
  },
  thumb: {
    position: 'relative',
    width: 88,
    flexShrink: 0,
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    cursor: 'pointer',
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    background: 'var(--elevated)',
    transition: 'border-color 0.15s, transform 0.15s',
    aspectRatio: '16 / 9',
  },
  thumbActive: {
    borderColor: 'var(--accent)',
  },
  thumbPending: {
    cursor: 'default',
    opacity: 0.4,
  },
  thumbVid: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbN: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--border)',
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '3px 0',
    textAlign: 'center',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: "'JetBrains Mono', monospace",
  },
}
