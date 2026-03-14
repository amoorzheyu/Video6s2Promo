import { useState } from 'react'
import type { SegmentItem } from '../types'
import { IconChevronDown, IconChevronUp } from '../Icons'

interface Props {
  segments: SegmentItem[]
  onSegmentsChange: (segments: SegmentItem[]) => void
  disabled?: boolean
}

const SEGMENT_NUMS = [1, 2, 3, 4, 5]

export default function SegmentEditor({ segments, onSegmentsChange, disabled }: Props) {
  const [collapsed, setCollapsed] = useState(true)

  const updateOne = (index: number, field: 'title' | 'content', value: string) => {
    const next = segments.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    onSegmentsChange(next)
  }

  return (
    <div className="segment-editor" style={s.wrapper}>
      <button
        type="button"
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
        <div style={s.list}>
          {SEGMENT_NUMS.map((n, i) => (
            <div key={n} style={s.block}>
              <label style={s.blockLabel}>片段 {n}</label>
              <div style={s.fields}>
                <div style={s.field}>
                  <span style={s.label}>标题</span>
                  <input
                    type="text"
                    value={segments[i]?.title ?? ''}
                    onChange={(e) => updateOne(i, 'title', e.target.value)}
                    placeholder={`片段 ${n}`}
                    disabled={disabled}
                    style={s.input}
                  />
                </div>
                <div style={s.field}>
                  <span style={s.label}>内容（生成描述）</span>
                  <textarea
                    value={segments[i]?.content ?? ''}
                    onChange={(e) => updateOne(i, 'content', e.target.value)}
                    placeholder="描述该段画面..."
                    disabled={disabled}
                    rows={2}
                    style={s.textarea}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '1px solid var(--border)',
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
    transition: 'background 0.15s',
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
  list: {
    borderTop: '1px solid var(--border)',
    padding: '8px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxHeight: 320,
    overflowY: 'auto',
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.02em',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-3)',
  },
  input: {
    padding: '6px 10px',
    fontSize: 13,
    color: 'var(--text-1)',
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textarea: {
    padding: '8px 10px',
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-1)',
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: 52,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
}
