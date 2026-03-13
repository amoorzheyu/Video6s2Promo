import { useRef, useState, DragEvent, ChangeEvent } from 'react'

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
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const preview = image ? URL.createObjectURL(image) : null

  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>产品参考图</p>
      <div
        style={{
          ...styles.dropzone,
          ...(dragging ? styles.dropzoneDragging : {}),
          ...(disabled ? styles.dropzoneDisabled : {}),
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="preview" style={styles.previewImg} />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.uploadIcon}>📷</span>
            <span style={styles.uploadHint}>点击或拖拽上传图片</span>
            <span style={styles.uploadFormats}>支持 PNG / JPG / WEBP</span>
          </div>
        )}
      </div>
      {image && (
        <p style={styles.fileName}>{image.name}</p>
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

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#a090c0',
    marginBottom: 8,
    fontWeight: 500,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  dropzone: {
    border: '2px dashed #3d2f5a',
    borderRadius: 12,
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s, background 0.2s',
    background: '#1a1030',
  },
  dropzoneDragging: {
    borderColor: '#f0a040',
    background: '#221540',
  },
  dropzoneDisabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: {
    fontSize: 36,
  },
  uploadHint: {
    fontSize: 14,
    color: '#8070a0',
  },
  uploadFormats: {
    fontSize: 11,
    color: '#5a4a70',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  fileName: {
    marginTop: 6,
    fontSize: 12,
    color: '#7060a0',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
