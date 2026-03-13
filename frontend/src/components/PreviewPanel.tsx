import { useState } from 'react'

interface Props {
  taskId: string
  completedVideos: number
  hasMerged: boolean
  isDone: boolean
}

const SEGMENT_LABELS = [
  '片段 1',
  '片段 2',
  '片段 3',
  '片段 4',
  '片段 5',
]

export default function PreviewPanel({ taskId, completedVideos, isDone }: Props) {
  // null = 展示合并视频；1~5 = 展示对应片段
  const [selected, setSelected] = useState<number | null>(null)

  const isMergedView = selected === null
  const videoUrl = isMergedView
    ? `/api/video/${taskId}/merged`
    : `/api/video/${taskId}/${selected}`

  // 合并视频更新时（completedVideos 增加），key 变化强制重新加载
  const playerKey = isMergedView ? `merged-${completedVideos}` : `seg-${selected}`

  const mergedDuration = completedVideos * 6

  return (
    <div style={styles.wrapper}>
      {/* ── 主播放器 ── */}
      <div style={styles.mainPlayer}>
        <video
          key={playerKey}
          controls
          autoPlay
          style={styles.video}
          src={videoUrl}
        />
        <div style={styles.playerBar}>
          <span style={styles.playerLabel}>
            {isMergedView
              ? `合并预览 · ${mergedDuration}s${isDone ? '' : ' (生成中…)'}`
              : SEGMENT_LABELS[(selected as number) - 1]}
          </span>
          {!isMergedView && (
            <button style={styles.backBtn} onClick={() => setSelected(null)}>
              ← 返回合并视图
            </button>
          )}
        </div>
      </div>

      {/* ── 片段缩略图行 ── */}
      <div style={styles.thumbRow}>
        {Array.from({ length: completedVideos }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            style={{
              ...styles.thumb,
              ...(selected === i ? styles.thumbActive : {}),
            }}
            onClick={() => setSelected(selected === i ? null : i)}
            title={`点击预览${SEGMENT_LABELS[i - 1]}`}
          >
            <video
              src={`/api/video/${taskId}/${i}#t=0.5`}
              style={styles.thumbVideo}
              muted
              preload="metadata"
            />
            <span style={styles.thumbLabel}>{i}</span>
          </div>
        ))}

        {/* 占位格——未生成的片段 */}
        {Array.from({ length: 5 - completedVideos }, (_, i) => (
          <div key={`placeholder-${i}`} style={styles.thumbPlaceholder}>
            <span style={styles.thumbPlaceholderNum}>{completedVideos + i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#140e24',
    border: '1px solid #2a1e42',
    borderRadius: 14,
    overflow: 'hidden',
  },
  mainPlayer: {
    background: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    display: 'block',
    maxHeight: 420,
    background: '#000',
  },
  playerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 14px',
    background: '#0a0716',
  },
  playerLabel: {
    fontSize: 13,
    color: '#a090c0',
    fontWeight: 500,
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #3d2f5a',
    borderRadius: 6,
    padding: '3px 10px',
    fontSize: 12,
    color: '#8070a0',
    cursor: 'pointer',
  },
  thumbRow: {
    display: 'flex',
    gap: 8,
    padding: '12px 14px',
    background: '#0f0b1e',
    overflowX: 'auto',
  },
  thumb: {
    position: 'relative',
    width: 90,
    flexShrink: 0,
    borderRadius: 6,
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1.5px solid #2a1e42',
    transition: 'border-color 0.15s',
    background: '#000',
  },
  thumbActive: {
    borderColor: '#f0a040',
  },
  thumbVideo: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: 'rgba(0,0,0,0.55)',
    padding: '2px 0',
  },
  thumbPlaceholder: {
    width: 90,
    flexShrink: 0,
    borderRadius: 6,
    border: '1.5px dashed #2a1e42',
    aspectRatio: '16/9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0c0918',
  },
  thumbPlaceholderNum: {
    fontSize: 16,
    color: '#2a1e42',
    fontWeight: 700,
  },
}
