import { useState } from 'react'
import type { SegmentItem } from '../types'
import { IconChevronDown, IconChevronUp } from '../Icons'

interface Props {
  segments: SegmentItem[]
  onSegmentsChange: (segments: SegmentItem[]) => void
  disabled?: boolean
}

const SEGMENT_NUMS = [1, 2, 3, 4, 5] as const
const CONTENT_HELPER =
  '整段原样发送。建议：先写【产品】、【人物1】、【画面要求】，再按 0~1s、1~2s… 写分镜，正文中人物用【人物1】指代。'

export default function SegmentEditor({ segments, onSegmentsChange, disabled }: Props) {
  const [collapsed, setCollapsed] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateOne = (index: number, field: 'title' | 'content', value: string) => {
    const next = segments.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    onSegmentsChange(next)
  }

  const current = segments[activeIndex]

  return (
    <div className="segment-editor" style={s.wrapper}>
      <button
        type="button"
        className="segment-editor-toggle"
        style={{ ...s.toggle, ...(disabled ? { cursor: 'not-allowed', opacity: 0.7 } : {}) }}
        onClick={() => !disabled && setCollapsed((c) => !c)}
        disabled={disabled}
        aria-expanded={!collapsed}
      >
        <span style={s.toggleLabel}>片段标题与文案</span>
        <span style={s.toggleMeta}>共 5 段</span>
        {collapsed ? (
          <IconChevronDown size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        ) : (
          <IconChevronUp size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        )}
      </button>

      {!collapsed && (
        <div style={s.body}>
          <div style={s.tabList} role="tablist" aria-label="选择片段">
            {SEGMENT_NUMS.map((n, i) => (
              <button
                key={n}
                type="button"
                role="tab"
                aria-selected={activeIndex === i}
                aria-controls={`segment-panel-${n}`}
                id={`segment-tab-${n}`}
                style={{
                  ...s.tab,
                  ...(activeIndex === i ? s.tabActive : {}),
                }}
                onClick={() => setActiveIndex(i)}
                disabled={disabled}
              >
                {n}
              </button>
            ))}
          </div>

          <div
            id={`segment-panel-${activeIndex + 1}`}
            role="tabpanel"
            aria-labelledby={`segment-tab-${activeIndex + 1}`}
            style={s.panel}
          >
            <div style={s.fieldBlock}>
              <label htmlFor={`segment-title-${activeIndex}`} style={s.label}>
                标题
              </label>
              <input
                id={`segment-title-${activeIndex}`}
                type="text"
                value={current?.title ?? ''}
                onChange={(e) => updateOne(activeIndex, 'title', e.target.value)}
                placeholder={`片段 ${activeIndex + 1}`}
                disabled={disabled}
                style={s.input}
              />
            </div>
            <div style={s.fieldBlock}>
              <label htmlFor={`segment-content-${activeIndex}`} style={s.label}>
                内容
              </label>
              <p style={s.helper}>{CONTENT_HELPER}</p>
              <textarea
                id={`segment-content-${activeIndex}`}
                value={current?.content ?? ''}
                onChange={(e) => updateOne(activeIndex, 'content', e.target.value)}
                placeholder={'【产品】…\n【人物1】…\n【画面要求】…\n0~1s：…\n1~2s：…'}
                disabled={disabled}
                rows={8}
                style={s.textarea}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius)',
    background: 'var(--surface)',
    overflow: 'hidden',
  },
  toggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-1)',
    transition: 'background 0.15s, color 0.15s',
  },
  toggleLabel: {
    flex: 1,
    textAlign: 'left',
  },
  toggleMeta: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  body: {
    borderTop: '1px solid var(--border)',
    display: 'grid',
    gridTemplateRows: 'auto 1fr',
    gap: 0,
    minHeight: 320,
    maxHeight: 420,
  },
  tabList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 2,
    padding: '10px 12px 0',
    background: 'var(--surface)',
  },
  tab: {
    padding: '8px 4px',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'JetBrains Mono', monospace",
    color: 'var(--text-3)',
    background: 'var(--elevated)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s, color 0.2s',
  },
  tabActive: {
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    borderColor: 'var(--border-accent)',
  },
  panel: {
    padding: '12px 12px 14px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  fieldBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--text-2)',
  },
  helper: {
    fontSize: 10,
    lineHeight: 1.4,
    color: 'var(--text-3)',
    margin: 0,
  },
  input: {
    padding: '8px 10px',
    fontSize: 13,
    color: 'var(--text-1)',
    background: 'var(--elevated)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    padding: '10px',
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-1)',
    background: 'var(--elevated)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'JetBrains Mono', monospace",
    resize: 'vertical',
    minHeight: 140,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
}
