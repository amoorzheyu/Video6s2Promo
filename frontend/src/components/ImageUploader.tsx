import { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { IconUpload, IconX, IconImage } from '../Icons'

interface Props {
  image: File | null
  onImageChange: (file: File) => void
  disabled?: boolean
}

export default function ImageUploader({ image, onImageChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    onImageChange(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const preview = image ? URL.createObjectURL(image) : null

  return (
    <div style={s.wrapper}>
      <p className="label">产品图片（参考图）</p>
      <p style={s.sublabel}>每段视频均使用此产品图作为参考，请上传清晰产品图</p>

      <div
        style={{
          ...s.zone,
          ...(dragging ? s.zoneDragging : {}),
          ...(disabled ? s.zoneDisabled : {}),
          ...(preview ? s.zoneHasImage : {}),
        }}
        onClick={() => !disabled && !image && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" style={s.preview} />
            {!disabled && (
              <button
                style={s.removeBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  inputRef.current!.value = ''
                  onImageChange(null as unknown as File)
                }}
                title="移除产品图"
              >
                <IconX size={12} />
              </button>
            )}
          </>
        ) : (
          <div style={s.placeholder}>
            <div style={s.iconWrap}>
              {dragging
                ? <IconImage size={22} style={{ color: 'var(--accent)' }} />
                : <IconUpload size={22} style={{ color: 'var(--text-3)' }} />
              }
            </div>
            <span style={s.hint}>
              {dragging ? '松开以上传' : '点击或拖拽上传'}
            </span>
            <span style={s.formats}>PNG · JPG · WEBP</span>
          </div>
        )}
      </div>

      {image && (
        <p style={s.filename} title={image.name}>
          {image.name}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: {
    marginBottom: 24,
  },
  sublabel: {
    fontSize: 11,
    color: 'var(--text-3)',
    marginTop: 2,
    marginBottom: 10,
  },
  zone: {
    position: 'relative',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-lg)',
    height: 164,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s, background 0.2s',
    background: 'var(--surface)',
  },
  zoneDragging: {
    borderColor: 'var(--accent)',
    borderStyle: 'solid',
    background: 'var(--accent-dim)',
  },
  zoneDisabled: {
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  zoneHasImage: {
    cursor: 'default',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.7)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-2)',
    transition: 'background 0.15s, color 0.15s',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius)',
    background: 'var(--elevated)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  hint: {
    fontSize: 13,
    color: 'var(--text-2)',
    fontWeight: 500,
  },
  formats: {
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: '0.04em',
  },
  filename: {
    marginTop: 7,
    fontSize: 11,
    color: 'var(--text-3)',
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
