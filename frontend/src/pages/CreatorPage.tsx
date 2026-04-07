import { useRef, useState, useEffect, useCallback } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

type Format = 'instagram' | 'facebook'
type TemplateId = 'nou' | 'promo' | 'bestseller' | 'freeship' | 'minimal'

const FORMATS: Record<Format, { w: number; h: number; label: string }> = {
  instagram: { w: 1080, h: 1080, label: 'Instagram 1:1' },
  facebook:  { w: 1080, h: 1620, label: 'Facebook 2:3' },
}

interface Template {
  id: TemplateId
  label: string
  accentColor: string
  badgeText: string
  badgeBg: string
  badgeTextColor: string
  layout: 'top-badge' | 'bottom-bar' | 'corner-badge'
}

const TEMPLATES: Template[] = [
  { id: 'nou',        label: 'NOU',           accentColor: '#111827', badgeText: 'NOU',                  badgeBg: '#111827', badgeTextColor: '#fff', layout: 'top-badge' },
  { id: 'promo',      label: 'PROMO',         accentColor: '#ea580c', badgeText: 'PROMO',                badgeBg: '#ea580c', badgeTextColor: '#fff', layout: 'top-badge' },
  { id: 'bestseller', label: 'BESTSELLER',    accentColor: '#ca8a04', badgeText: '★ BESTSELLER',         badgeBg: '#ca8a04', badgeTextColor: '#fff', layout: 'corner-badge' },
  { id: 'freeship',   label: 'FREE SHIPPING', accentColor: '#16a34a', badgeText: '✈ LIVRARE GRATUITĂ',   badgeBg: '#16a34a', badgeTextColor: '#fff', layout: 'bottom-bar' },
  { id: 'minimal',    label: 'MINIMAL',       accentColor: '#3b82f6', badgeText: '',                     badgeBg: '#3b82f6', badgeTextColor: '#fff', layout: 'bottom-bar' },
]

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), x, cy)
      line = words[i] + ' '
      cy += lh
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), x, cy)
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  format: Format,
  template: Template,
  image: HTMLImageElement | null,
  imgOffset: { x: number; y: number },
  imgScale: number,
  productName: string,
  productPrice: string,
  promoText: string,
) {
  const W = FORMATS[format].w
  const H = FORMATS[format].h
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  // ── Imagine full-bleed cu offset și scale controlat de utilizator ──
  if (image) {
    const baseScale = Math.max(W / image.naturalWidth, H / image.naturalHeight)
    const finalScale = baseScale * imgScale
    const drawW = image.naturalWidth * finalScale
    const drawH = image.naturalHeight * finalScale
    const drawX = (W - drawW) / 2 + imgOffset.x
    const drawY = (H - drawH) / 2 + imgOffset.y
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
  } else {
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#9ca3af'
    ctx.font = `600 ${W * 0.036}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Trage o poză sau apasă pentru a selecta', W / 2, H / 2 - 20)
    ctx.font = `400 ${W * 0.026}px sans-serif`
    ctx.fillText('Recomandat: poză portret', W / 2, H / 2 + 40)
  }

  const fs = W / 1080 // factor de scalare față de 1080px referință

  // ── Badge ──
  if (template.badgeText) {
    if (template.layout === 'corner-badge') {
      ctx.fillStyle = template.badgeBg
      ctx.beginPath()
      ctx.moveTo(W - 280 * fs, 0)
      ctx.lineTo(W, 0)
      ctx.lineTo(W, 280 * fs)
      ctx.closePath()
      ctx.fill()
      ctx.save()
      ctx.translate(W - 88 * fs, 88 * fs)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = template.badgeTextColor
      ctx.font = `700 ${34 * fs}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(template.badgeText, 0, 12 * fs)
      ctx.restore()
    } else {
      ctx.font = `700 ${40 * fs}px sans-serif`
      const bw = ctx.measureText(template.badgeText).width + 56 * fs
      ctx.fillStyle = template.badgeBg
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(36 * fs, 36 * fs, bw, 76 * fs, 38 * fs)
      else ctx.rect(36 * fs, 36 * fs, bw, 76 * fs)
      ctx.fill()
      ctx.fillStyle = template.badgeTextColor
      ctx.textAlign = 'left'
      ctx.fillText(template.badgeText, 64 * fs, 88 * fs)
    }
  }

  // ── Gradient overlay jos ──
  const gradH = (promoText ? 380 : productPrice ? 300 : 240) * fs
  const grad = ctx.createLinearGradient(0, H - gradH, 0, H)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(0.35, 'rgba(0,0,0,0.5)')
  grad.addColorStop(1, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = grad
  ctx.fillRect(0, H - gradH, W, gradH)

  // Linie accent jos
  ctx.fillStyle = template.accentColor
  ctx.fillRect(0, H - 8 * fs, W, 8 * fs)

  // ── Text ──
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 10

  const hasPrice = !!productPrice
  const hasPromo = !!promoText
  const nameY = H - (hasPromo ? 190 : hasPrice ? 140 : 80) * fs

  ctx.fillStyle = '#ffffff'
  ctx.font = `700 ${54 * fs}px sans-serif`
  ctx.textAlign = 'center'
  wrapText(ctx, productName || 'Numele produsului', W / 2, nameY, W - 80 * fs, 64 * fs)

  if (hasPrice) {
    ctx.font = `700 ${48 * fs}px sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(productPrice, W / 2, nameY + 72 * fs)
  }

  if (hasPromo) {
    ctx.font = `500 ${36 * fs}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.textAlign = 'center'
    ctx.fillText(promoText, W / 2, H - 48 * fs)
  }

  ctx.shadowBlur = 0
}

export default function CreatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const [format, setFormat] = useState<Format>('instagram')
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [imgScale, setImgScale] = useState(1)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [promoText, setPromoText] = useState('')
  const [posting, setPosting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const redraw = useCallback(() => {
    if (!canvasRef.current) return
    drawCanvas(canvasRef.current, format, selectedTemplate, productImage, imgOffset, imgScale, productName, productPrice, promoText)
  }, [format, selectedTemplate, productImage, imgOffset, imgScale, productName, productPrice, promoText])

  useEffect(() => { redraw() }, [redraw])

  // ── Drag handlers ──
  const getCanvasScale = () => {
    if (!canvasRef.current) return 1
    return FORMATS[format].w / canvasRef.current.getBoundingClientRect().width
  }

  const onMouseDown = (e: React.MouseEvent) => {
    if (!productImage) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const s = getCanvasScale()
    const dx = (e.clientX - lastPos.current.x) * s
    const dy = (e.clientY - lastPos.current.y) * s
    lastPos.current = { x: e.clientX, y: e.clientY }
    setImgOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const onMouseUp = () => { isDragging.current = false }

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    if (!productImage) return
    isDragging.current = true
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const s = getCanvasScale()
    const dx = (e.touches[0].clientX - lastPos.current.x) * s
    const dy = (e.touches[0].clientY - lastPos.current.y) * s
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setImgOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const onTouchEnd = () => { isDragging.current = false }

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setProductImagePreview(url)
    setImgOffset({ x: 0, y: 0 })
    setImgScale(1)
    const img = new Image()
    img.onload = () => setProductImage(img)
    img.src = url
  }

  const downloadImage = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `autopost-${format}-${selectedTemplate.id}.jpg`
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.92)
    link.click()
  }

  const postToFacebook = async () => {
    if (!canvasRef.current) return
    setPosting(true)
    setError('')
    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
      })
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const headers = await getAuthHeader()
        const res = await fetch(`${API_URL}/post-image`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            caption: `${productName}${productPrice ? ' — ' + productPrice : ''}${promoText ? '\n' + promoText : ''}`,
          })
        })
        if (res.ok) {
          setSuccess('Postare trimisă pe Facebook!')
          setTimeout(() => setSuccess(''), 4000)
        } else {
          const data = await res.json()
          setError(data.error || 'Eroare la postare')
        }
        setPosting(false)
      }
    } catch {
      setError('Eroare de conexiune.')
      setPosting(false)
    }
  }

  const canvasAspect = FORMATS[format].h / FORMATS[format].w

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Creator postări</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Alege format și template, ajustează poza, adaugă textul — gata de postat.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Stânga — controale */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* Format */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(Object.entries(FORMATS) as [Format, typeof FORMATS[Format]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: format === key ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    background: format === key ? '#eff6ff' : '#fff',
                    color: format === key ? '#1d4ed8' : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Template</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: selectedTemplate.id === t.id ? `2px solid ${t.accentColor}` : '1px solid #e5e7eb',
                    background: selectedTemplate.id === t.id ? t.accentColor : '#fff',
                    color: selectedTemplate.id === t.id ? '#fff' : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload imagine */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Poza produsului</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #d1d5db', borderRadius: 10, padding: 14,
                cursor: 'pointer', textAlign: 'center', background: '#f9fafb',
              }}
            >
              {productImagePreview ? (
                <img src={productImagePreview} style={{ maxHeight: 90, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>🖼</div>
                  Click pentru a adăuga poza
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
          </div>

          {/* Zoom slider */}
          {productImage && (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Zoom imagine — {Math.round(imgScale * 100)}%
              </label>
              <input
                type="range" min="0.5" max="3" step="0.01"
                value={imgScale}
                onChange={e => setImgScale(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#3b82f6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                <span>50%</span>
                <button
                  onClick={() => { setImgScale(1); setImgOffset({ x: 0, y: 0 }) }}
                  style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Reset poziție
                </button>
                <span>300%</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Trage poza în preview pentru a o repoziția
              </div>
            </div>
          )}

          {/* Nume produs */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Numele produsului</label>
            <input value={productName} onChange={e => setProductName(e.target.value)}
              placeholder="ex: Rochie de vară florală"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Preț */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Preț</label>
            <input value={productPrice} onChange={e => setProductPrice(e.target.value)}
              placeholder="ex: 149 RON"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Text promo */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Text promoțional <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opțional)</span>
            </label>
            <input value={promoText} onChange={e => setPromoText(e.target.value)}
              placeholder="ex: Livrare gratuită azi!"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {success && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#065f46', fontWeight: 500 }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={postToFacebook} disabled={posting}
              style={{ padding: '11px', background: posting ? '#93c5fd' : '#1877f2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer' }}>
              {posting ? 'Se postează...' : '📤 Postează pe Facebook'}
            </button>
            <button onClick={downloadImage}
              style={{ padding: '11px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              ⬇ Descarcă imagine
            </button>
          </div>
        </div>

        {/* Dreapta — preview canvas */}
        <div style={{ flex: 1, maxWidth: 440 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Preview — {FORMATS[format].w}×{FORMATS[format].h}px
            {productImage && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>Trage pentru a repoziționa</span>}
          </label>
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            cursor: productImage ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
            aspectRatio: `1 / ${canvasAspect}`,
          }}>
            <canvas
              ref={canvasRef}
              width={FORMATS[format].w}
              height={FORMATS[format].h}
              style={{ width: '100%', display: 'block', userSelect: 'none' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
            {format === 'instagram' ? 'Instagram Feed & Reels — 1:1' : 'Facebook Feed — 2:3 portret'}
          </div>
        </div>

      </div>
    </div>
  )
}
