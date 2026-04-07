import { useRef, useState, useEffect } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

const CANVAS_W = 1080
const CANVAS_H = 1080

type TemplateId = 'nou' | 'promo' | 'bestseller' | 'freeship' | 'minimal'

interface Template {
  id: TemplateId
  label: string
  bgColor: string
  accentColor: string
  textColor: string
  badgeText: string
  badgeBg: string
  badgeTextColor: string
  layout: 'top-badge' | 'bottom-bar' | 'corner-badge'
}

const TEMPLATES: Template[] = [
  {
    id: 'nou',
    label: 'NOU',
    bgColor: '#ffffff',
    accentColor: '#111827',
    textColor: '#111827',
    badgeText: 'NOU',
    badgeBg: '#111827',
    badgeTextColor: '#ffffff',
    layout: 'top-badge',
  },
  {
    id: 'promo',
    label: 'PROMO',
    bgColor: '#fff7ed',
    accentColor: '#ea580c',
    textColor: '#111827',
    badgeText: 'PROMO',
    badgeBg: '#ea580c',
    badgeTextColor: '#ffffff',
    layout: 'top-badge',
  },
  {
    id: 'bestseller',
    label: 'BESTSELLER',
    bgColor: '#fefce8',
    accentColor: '#ca8a04',
    textColor: '#111827',
    badgeText: '★ BESTSELLER',
    badgeBg: '#ca8a04',
    badgeTextColor: '#ffffff',
    layout: 'corner-badge',
  },
  {
    id: 'freeship',
    label: 'FREE SHIPPING',
    bgColor: '#f0fdf4',
    accentColor: '#16a34a',
    textColor: '#111827',
    badgeText: '✈ LIVRARE GRATUITĂ',
    badgeBg: '#16a34a',
    badgeTextColor: '#ffffff',
    layout: 'bottom-bar',
  },
  {
    id: 'minimal',
    label: 'MINIMAL',
    bgColor: '#f8f9fb',
    accentColor: '#3b82f6',
    textColor: '#111827',
    badgeText: '',
    badgeBg: '#3b82f6',
    badgeTextColor: '#ffffff',
    layout: 'bottom-bar',
  },
]

function drawCanvas(
  canvas: HTMLCanvasElement,
  template: Template,
  image: HTMLImageElement | null,
  productName: string,
  productPrice: string,
  promoText: string,
) {
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

  // Fundal
  ctx.fillStyle = template.bgColor
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Imagine produs (centrat, cu padding)
  if (image) {
    const pad = 80
    const imgSize = CANVAS_W - pad * 2
    const imgY = template.layout === 'top-badge' ? 140 : template.layout === 'bottom-bar' ? 80 : 100
    const imgH = template.layout === 'bottom-bar' ? 700 : 680

    // Fit imagine în dreptunghi păstrând proporțiile
    const ratio = Math.min(imgSize / image.naturalWidth, imgH / image.naturalHeight)
    const drawW = image.naturalWidth * ratio
    const drawH = image.naturalHeight * ratio
    const drawX = pad + (imgSize - drawW) / 2
    const drawY = imgY + (imgH - drawH) / 2

    ctx.drawImage(image, drawX, drawY, drawW, drawH)
  } else {
    // Placeholder
    ctx.fillStyle = '#e5e7eb'
    ctx.fillRect(80, 140, CANVAS_W - 160, 680)
    ctx.fillStyle = '#9ca3af'
    ctx.font = '600 36px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Adaugă poza produsului', CANVAS_W / 2, 500)
  }

  // ── Layout: top-badge ──
  if (template.layout === 'top-badge') {
    // Bar sus
    ctx.fillStyle = template.accentColor
    ctx.fillRect(0, 0, CANVAS_W, 110)

    // Badge text
    ctx.fillStyle = template.badgeTextColor
    ctx.font = '700 52px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(template.badgeText, 48, 74)

    // Preț dreapta sus
    if (productPrice) {
      ctx.font = '700 52px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillStyle = template.badgeTextColor
      ctx.fillText(productPrice, CANVAS_W - 48, 74)
    }

    // Bar jos — nume produs
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 900, CANVAS_W, 180)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 46px sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', CANVAS_W / 2, 960, CANVAS_W - 80, 56)

    if (promoText) {
      ctx.font = '400 34px sans-serif'
      ctx.fillStyle = '#d1d5db'
      ctx.textAlign = 'center'
      ctx.fillText(promoText, CANVAS_W / 2, 1040)
    }
  }

  // ── Layout: bottom-bar ──
  if (template.layout === 'bottom-bar') {
    // Bar jos colorat
    ctx.fillStyle = template.accentColor
    ctx.fillRect(0, 870, CANVAS_W, 210)

    if (template.badgeText) {
      ctx.fillStyle = template.badgeTextColor
      ctx.font = '700 44px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(template.badgeText, CANVAS_W / 2, 940)
    }

    ctx.fillStyle = template.badgeTextColor
    ctx.font = '600 42px sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', CANVAS_W / 2, template.badgeText ? 1010 : 960, CANVAS_W - 80, 50)

    if (productPrice) {
      ctx.font = '700 44px sans-serif'
      ctx.fillStyle = template.badgeTextColor
      ctx.textAlign = 'center'
      ctx.fillText(productPrice, CANVAS_W / 2, template.badgeText ? 1062 : 1040)
    }
  }

  // ── Layout: corner-badge ──
  if (template.layout === 'corner-badge') {
    // Badge triunghi colț dreapta sus
    ctx.fillStyle = template.badgeBg
    ctx.beginPath()
    ctx.moveTo(CANVAS_W - 260, 0)
    ctx.lineTo(CANVAS_W, 0)
    ctx.lineTo(CANVAS_W, 260)
    ctx.closePath()
    ctx.fill()

    // Text pe diagonală
    ctx.save()
    ctx.translate(CANVAS_W - 90, 90)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = template.badgeTextColor
    ctx.font = '700 34px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(template.badgeText, 0, 0)
    ctx.restore()

    // Bar jos
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 880, CANVAS_W, 200)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 46px sans-serif'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', CANVAS_W / 2, 950, CANVAS_W - 80, 56)

    if (productPrice) {
      ctx.font = '700 44px sans-serif'
      ctx.fillStyle = template.accentColor === '#ca8a04' ? '#fde68a' : '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText(productPrice, CANVAS_W / 2, 1040)
    }
  }

  // Linie decorativă accent jos (minimal)
  if (template.id === 'minimal') {
    ctx.fillStyle = template.accentColor
    ctx.fillRect(0, CANVAS_H - 8, CANVAS_W, 8)
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ')
  let line = ''
  let currentY = y
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' '
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY)
      line = words[i] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), x, currentY)
}

export default function CreatorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [promoText, setPromoText] = useState('')
  const [posting, setPosting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Redesenează canvas la orice modificare
  useEffect(() => {
    if (!canvasRef.current) return
    drawCanvas(canvasRef.current, selectedTemplate, productImage, productName, productPrice, promoText)
  }, [selectedTemplate, productImage, productName, productPrice, promoText])

  const handleImageUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    setProductImagePreview(url)
    const img = new Image()
    img.onload = () => setProductImage(img)
    img.src = url
  }

  const downloadImage = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `autopost-${selectedTemplate.id}.jpg`
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

      // Convertim în base64
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
          setSuccess('Postare trimisă cu succes pe Facebook!')
          setTimeout(() => setSuccess(''), 4000)
        } else {
          const data = await res.json()
          setError(data.error || 'Eroare la postare')
        }
        setPosting(false)
      }
    } catch (e) {
      setError('Eroare de conexiune.')
      setPosting(false)
    }
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Creator postări</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
          Alege un template, adaugă poza și textul — gata de postat.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Stânga — controale */}
        <div style={{ width: 340, flexShrink: 0 }}>

          {/* Template selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              Template
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: selectedTemplate.id === t.id ? `2px solid ${t.accentColor}` : '1px solid #e5e7eb',
                    background: selectedTemplate.id === t.id ? t.bgColor : '#fff',
                    color: selectedTemplate.id === t.id ? t.accentColor : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload imagine */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
              Poza produsului
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #d1d5db', borderRadius: 10, padding: 16,
                cursor: 'pointer', textAlign: 'center', background: '#f9fafb',
              }}
            >
              {productImagePreview ? (
                <img src={productImagePreview} style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🖼</div>
                  Click pentru a adăuga poza
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
            />
          </div>

          {/* Nume produs */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Numele produsului
            </label>
            <input
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="ex: Rochie de vară florală"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Preț */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Preț
            </label>
            <input
              value={productPrice}
              onChange={e => setProductPrice(e.target.value)}
              placeholder="ex: 149 RON"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Text promoțional */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Text promoțional <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opțional)</span>
            </label>
            <input
              value={promoText}
              onChange={e => setPromoText(e.target.value)}
              placeholder="ex: Livrare gratuită azi!"
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Feedback */}
          {success && (
            <div style={{
              background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#065f46', fontWeight: 500,
            }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          {/* Butoane */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={postToFacebook}
              disabled={posting}
              style={{
                padding: '12px', background: posting ? '#93c5fd' : '#1877f2',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer',
              }}
            >
              {posting ? 'Se postează...' : '📤 Postează pe Facebook'}
            </button>
            <button
              onClick={downloadImage}
              style={{
                padding: '12px', background: '#fff', color: '#374151',
                border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14,
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              ⬇ Descarcă imagine
            </button>
          </div>
        </div>

        {/* Dreapta — preview canvas */}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            Preview (1080×1080)
          </label>
          <div style={{
            border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ width: '100%', display: 'block' }}
            />
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
            Imaginea generată este 1080×1080px — format ideal pentru Instagram & Facebook
          </div>
        </div>

      </div>
    </div>
  )
}
