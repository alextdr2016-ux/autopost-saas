import { useRef, useState, useEffect, useCallback } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { useLanguage } from '../i18n/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeader() {
  const session = await fetchAuthSession({ forceRefresh: false })
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('Nu există sesiune activă')
  return { Authorization: token }
}

type Format = 'instagram' | 'facebook' | 'stories'
type TemplateId = 'nou' | 'promo' | 'bestseller' | 'freeship' | 'minimal' | 'luxury' | 'editorial' | 'collection' | 'sale' | 'frame_gold' | 'frame_minimal' | 'frame_double' | 'frame_black' | 'frame_rose' | 'frame_navy' | 'frame_polaroid' | 'frame_vintage' | 'frame_film' | 'frame_arch' | 'frame_stripe' | 'frame_corner' | 'frame_shadow'

const FORMATS: Record<Format, { w: number; h: number; label: string }> = {
  instagram: { w: 1080, h: 1080, label: 'Instagram 1:1' },
  facebook:  { w: 1080, h: 1350, label: 'Facebook 4:5' },
  stories:   { w: 1080, h: 1920, label: 'Stories 9:16' },
}

interface Template {
  id: TemplateId
  label: string
  accentColor: string
  badgeText: string
  badgeBg: string
  badgeTextColor: string
  layout: 'top-badge' | 'bottom-bar' | 'corner-badge' | 'luxury' | 'editorial' | 'collection' | 'sale' | 'frame_gold' | 'frame_minimal' | 'frame_double' | 'frame_black' | 'frame_rose' | 'frame_navy' | 'frame_polaroid' | 'frame_vintage' | 'frame_film' | 'frame_arch' | 'frame_stripe' | 'frame_corner' | 'frame_shadow'
}

const TEMPLATES: Template[] = [
  { id: 'nou',         label: 'NOU',           accentColor: '#111827', badgeText: 'NOU',                badgeBg: '#111827',  badgeTextColor: '#fff',     layout: 'top-badge' },
  { id: 'promo',       label: 'PROMO',         accentColor: '#ea580c', badgeText: 'PROMO',              badgeBg: '#ea580c',  badgeTextColor: '#fff',     layout: 'top-badge' },
  { id: 'bestseller',  label: 'BESTSELLER',    accentColor: '#ca8a04', badgeText: '★ BESTSELLER',       badgeBg: '#ca8a04',  badgeTextColor: '#fff',     layout: 'corner-badge' },
  { id: 'freeship',    label: 'FREE SHIPPING', accentColor: '#16a34a', badgeText: '✈ LIVRARE GRATUITĂ', badgeBg: '#16a34a',  badgeTextColor: '#fff',     layout: 'bottom-bar' },
  { id: 'minimal',     label: 'MINIMAL',       accentColor: '#3b82f6', badgeText: '',                   badgeBg: '#3b82f6',  badgeTextColor: '#fff',     layout: 'bottom-bar' },
  { id: 'luxury',      label: 'LUXURY',        accentColor: '#C9A84C', badgeText: '',                   badgeBg: '#C9A84C',  badgeTextColor: '#fff',     layout: 'luxury' },
  { id: 'editorial',   label: 'EDITORIAL',     accentColor: '#1e293b', badgeText: '',                   badgeBg: '#1e293b',  badgeTextColor: '#fff',     layout: 'editorial' },
  { id: 'collection',  label: 'COLLECTION',    accentColor: '#9f1239', badgeText: 'NEW COLLECTION',     badgeBg: '#9f1239',  badgeTextColor: '#fff',     layout: 'collection' },
  { id: 'sale',        label: 'SALE',          accentColor: '#dc2626', badgeText: 'SALE',               badgeBg: '#dc2626',  badgeTextColor: '#fff',     layout: 'sale' },
  { id: 'frame_gold',    label: 'AUR',       accentColor: '#C9A84C', badgeText: '', badgeBg: '#C9A84C', badgeTextColor: '#fff', layout: 'frame_gold' },
  { id: 'frame_minimal', label: 'ALB',       accentColor: '#ffffff', badgeText: '', badgeBg: '#ffffff', badgeTextColor: '#111', layout: 'frame_minimal' },
  { id: 'frame_double',  label: 'DUBLU',     accentColor: '#111827', badgeText: '', badgeBg: '#111827', badgeTextColor: '#fff', layout: 'frame_double' },
  { id: 'frame_black',   label: 'NEGRU',     accentColor: '#000000', badgeText: '', badgeBg: '#000',    badgeTextColor: '#fff', layout: 'frame_black' },
  { id: 'frame_rose',    label: 'ROZ',       accentColor: '#f43f5e', badgeText: '', badgeBg: '#f43f5e', badgeTextColor: '#fff', layout: 'frame_rose' },
  { id: 'frame_navy',    label: 'NAVY',      accentColor: '#1e3a5f', badgeText: '', badgeBg: '#1e3a5f', badgeTextColor: '#fff', layout: 'frame_navy' },
  { id: 'frame_polaroid',label: 'POLAROID',  accentColor: '#fffef5', badgeText: '', badgeBg: '#fffef5', badgeTextColor: '#111', layout: 'frame_polaroid' },
  { id: 'frame_vintage', label: 'VINTAGE',   accentColor: '#7c5c3a', badgeText: '', badgeBg: '#7c5c3a', badgeTextColor: '#fff', layout: 'frame_vintage' },
  { id: 'frame_film',    label: 'FILM',      accentColor: '#111111', badgeText: '', badgeBg: '#111111', badgeTextColor: '#fff', layout: 'frame_film' },
  { id: 'frame_arch',    label: 'ARCĂ',      accentColor: '#f5f0eb', badgeText: '', badgeBg: '#f5f0eb', badgeTextColor: '#111', layout: 'frame_arch' },
  { id: 'frame_stripe',  label: 'DUNGI',     accentColor: '#3b82f6', badgeText: '', badgeBg: '#3b82f6', badgeTextColor: '#fff', layout: 'frame_stripe' },
  { id: 'frame_corner',  label: 'COLȚURI',   accentColor: '#C9A84C', badgeText: '', badgeBg: '#C9A84C', badgeTextColor: '#fff', layout: 'frame_corner' },
  { id: 'frame_shadow',  label: 'SHADOW',    accentColor: '#6b21a8', badgeText: '', badgeBg: '#6b21a8', badgeTextColor: '#fff', layout: 'frame_shadow' },
]

// ─── Queue ────────────────────────────────────────────────────────────────────
interface QueueItem {
  id: string
  templateId: TemplateId
  count: number        // total posts planned with this template
  used: number         // posts already done
}

const QUEUE_KEY = 'autopost_template_queue'

function loadQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(q: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

// Returns the template that should be used for the *next* auto-post
function getNextTemplateFromQueue(q: QueueItem[]): Template | null {
  for (const item of q) {
    if (item.used < item.count) {
      return TEMPLATES.find(t => t.id === item.templateId) ?? null
    }
  }
  return null
}

// Advances the queue pointer by 1 post (used when posting from queue)
export function advanceQueue(q: QueueItem[]): QueueItem[] {
  const next = [...q]
  for (let i = 0; i < next.length; i++) {
    if (next[i].used < next[i].count) {
      next[i] = { ...next[i], used: next[i].used + 1 }
      return next
    }
  }
  return next
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, align: CanvasTextAlign = 'center') {
  ctx.textAlign = align
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

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
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
  _caption: string,
  overlayOpacity: number,
  textColor: string,
  textAlign: CanvasTextAlign,
  fontSize: number,
  bgColor: string,
  imgFit: 'contain' | 'cover',
  badgeFontSize: number = 40,
  showBadgeOnFrame: boolean = false,
) {
  const W = FORMATS[format].w
  const H = FORMATS[format].h
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  const fs = W / 1080

  // ── Helper: draw badge pill overlay (reusable for frames) ──
  const drawBadgeOverlay = () => {
    if (!template.badgeText) return
    ctx.font = `700 ${badgeFontSize * fs}px sans-serif`
    const bw = ctx.measureText(template.badgeText).width + 56 * fs
    const badgePillH = Math.max(76, badgeFontSize * 1.9) * fs
    const badgePillR = badgePillH / 2
    ctx.fillStyle = template.badgeBg
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(36 * fs, 36 * fs, bw, badgePillH, badgePillR)
    else ctx.rect(36 * fs, 36 * fs, bw, badgePillH)
    ctx.fill()
    ctx.fillStyle = template.badgeTextColor
    ctx.textAlign = 'left'
    ctx.fillText(template.badgeText, 64 * fs, 36 * fs + badgePillH * 0.65)
  }

  // ── helper: draw image ──
  const drawBg = (clipX = 0, clipY = 0, clipW = W, clipH = H) => {
    if (image) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(clipX, clipY, clipW, clipH)
      ctx.clip()

      // contain = produsul se vede complet (Math.min)
      // cover   = imaginea umple zona, poate fi tăiată (Math.max)
      const baseScale = imgFit === 'contain'
        ? Math.min(clipW / image.naturalWidth, clipH / image.naturalHeight)
        : Math.max(clipW / image.naturalWidth, clipH / image.naturalHeight)

      const finalScale = baseScale * imgScale
      const drawW = image.naturalWidth * finalScale
      const drawH = image.naturalHeight * finalScale
      const drawX = clipX + (clipW - drawW) / 2 + imgOffset.x
      const drawY = clipY + (clipH - drawH) / 2 + imgOffset.y

      // fill background before drawing image (visible when contain leaves gaps)
      ctx.fillStyle = bgColor || '#e5e7eb'
      ctx.fillRect(clipX, clipY, clipW, clipH)

      ctx.drawImage(image, drawX, drawY, drawW, drawH)
      ctx.restore()
    } else {
      ctx.fillStyle = bgColor || '#e5e7eb'
      ctx.fillRect(clipX, clipY, clipW, clipH)
      ctx.fillStyle = '#9ca3af'
      ctx.font = `600 ${W * 0.032}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Trage o poză sau apasă pentru a selecta', W / 2, H / 2)
    }
  }

  const layout = template.layout

  // ═══════════════════════════════════════════════════════
  // FRAME TEMPLATES — imagine cu margini / rame
  // ═══════════════════════════════════════════════════════

  const drawFrameTemplate = () => {

  if (layout === 'frame_gold') {
    const pad = Math.round(60 * fs)
    // fundal auriu
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect(0, 0, W, H)

    // imagine inside frame
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - Math.round(160 * fs))

    // inner thin gold border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2 * fs
    ctx.strokeRect(pad + 8 * fs, pad + 8 * fs, W - pad * 2 - 16 * fs, H - pad * 2 - Math.round(160 * fs) - 16 * fs)

    // bottom text area
    const textAreaY = H - pad - Math.round(160 * fs)
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect(0, textAreaY, W, H - textAreaY)

    // decorative lines
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1 * fs
    ctx.beginPath()
    ctx.moveTo(pad, textAreaY + 28 * fs)
    ctx.lineTo(W - pad, textAreaY + 28 * fs)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pad, H - 28 * fs)
    ctx.lineTo(W - pad, H - 28 * fs)
    ctx.stroke()

    ctx.shadowColor = 'rgba(0,0,0,0.2)'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#fff'
    ctx.font = `700 italic ${52 * fs}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(productName || 'Numele produsului', W / 2, textAreaY + 88 * fs)
    if (productPrice) {
      ctx.font = `600 ${38 * fs}px sans-serif`
      ctx.fillText(productPrice, W / 2, textAreaY + 138 * fs)
    }
    ctx.shadowBlur = 0

    // outer frame border
    ctx.strokeStyle = '#a07830'
    ctx.lineWidth = 3 * fs
    ctx.strokeRect(12 * fs, 12 * fs, W - 24 * fs, H - 24 * fs)
    ctx.strokeStyle = '#fff9'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(18 * fs, 18 * fs, W - 36 * fs, H - 36 * fs)
    return
  }

  if (layout === 'frame_minimal') {
    const pad = Math.round(48 * fs)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    drawBg(pad, pad, W - pad * 2, H - pad * 2 - Math.round(180 * fs))

    // simple black border
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2 * fs
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2 - Math.round(180 * fs))

    // bottom brand area
    const textAreaY = H - pad - Math.round(180 * fs)

    ctx.fillStyle = '#111827'
    ctx.font = `300 ${22 * fs}px sans-serif`
    ctx.letterSpacing = `${6 * fs}px`
    ctx.textAlign = 'center'
    ctx.fillText('ejolie.ro', W / 2, textAreaY + 38 * fs)
    ctx.letterSpacing = '0px'

    ctx.font = `600 ${48 * fs}px sans-serif`
    ctx.fillStyle = '#111827'
    ctx.fillText(productName || 'Numele produsului', W / 2, textAreaY + 100 * fs)

    if (productPrice) {
      ctx.font = `400 ${34 * fs}px sans-serif`
      ctx.fillStyle = '#6b7280'
      ctx.fillText(productPrice, W / 2, textAreaY + 148 * fs)
    }

    // outer border
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 4 * fs
    ctx.strokeRect(10 * fs, 10 * fs, W - 20 * fs, H - 20 * fs)
    return
  }

  if (layout === 'frame_double') {
    const outer = Math.round(24 * fs)
    const inner = Math.round(52 * fs)
    const imgPad = Math.round(70 * fs)
    const bottomH = Math.round(200 * fs)

    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, W, H)

    // cream inner area
    ctx.fillStyle = '#f5f0eb'
    ctx.fillRect(inner, inner, W - inner * 2, H - inner * 2)

    drawBg(imgPad, imgPad, W - imgPad * 2, H - imgPad * 2 - bottomH)

    // double border lines
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 1.5 * fs
    ctx.strokeRect(outer + 6 * fs, outer + 6 * fs, W - (outer + 6 * fs) * 2, H - (outer + 6 * fs) * 2)
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(inner - 6 * fs, inner - 6 * fs, W - (inner - 6 * fs) * 2, H - (inner - 6 * fs) * 2)

    // text
    const textY = H - imgPad - bottomH
    ctx.fillStyle = '#C9A84C'
    ctx.font = `400 ${18 * fs}px sans-serif`
    ctx.textAlign = 'center'

    // thin gold line
    const lineW = 80 * fs
    ctx.beginPath()
    ctx.moveTo(W / 2 - lineW, textY + 32 * fs)
    ctx.lineTo(W / 2 + lineW, textY + 32 * fs)
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 1 * fs
    ctx.stroke()

    ctx.fillStyle = '#111827'
    ctx.font = `700 italic ${50 * fs}px Georgia, serif`
    ctx.fillText(productName || 'Numele produsului', W / 2, textY + 88 * fs)

    if (productPrice) {
      ctx.font = `500 ${36 * fs}px sans-serif`
      ctx.fillStyle = '#C9A84C'
      ctx.fillText(productPrice, W / 2, textY + 140 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_BLACK — ramă neagră groasă, text alb pe fond negru jos
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_black') {
    const brd = Math.round(28 * fs)
    const btm = Math.round(170 * fs)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    drawBg(brd, brd, W - brd * 2, H - brd * 2 - btm)
    // white inset line
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(brd + 6 * fs, brd + 6 * fs, W - (brd + 6 * fs) * 2, H - brd * 2 - btm - 12 * fs)
    const ty = H - btm
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${50 * fs}px sans-serif`
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, ty + 54 * fs, W - brd * 2 - 20 * fs, 58 * fs)
    if (productPrice) {
      ctx.font = `400 ${32 * fs}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText(productPrice, W / 2, ty + 126 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_ROSE — ramă roz pastel, text elegant
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_rose') {
    const pad = Math.round(44 * fs)
    const btm = Math.round(160 * fs)
    ctx.fillStyle = '#fdf2f4'
    ctx.fillRect(0, 0, W, H)
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // rose border multi-layer
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 3 * fs
    ctx.strokeRect(10 * fs, 10 * fs, W - 20 * fs, H - 20 * fs)
    ctx.strokeStyle = '#fda4af'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(16 * fs, 16 * fs, W - 32 * fs, H - 32 * fs)
    ctx.strokeRect(pad - 6 * fs, pad - 6 * fs, W - (pad - 6 * fs) * 2, H - (pad - 6 * fs) * 2 - btm)
    const ty = H - pad - btm
    // thin rose line
    ctx.fillStyle = '#f43f5e'
    ctx.fillRect((W - 80 * fs) / 2, ty + 18 * fs, 80 * fs, 1.5 * fs)
    ctx.font = `italic 600 ${46 * fs}px Georgia, serif`
    ctx.fillStyle = '#881337'
    ctx.textAlign = 'center'
    ctx.fillText(productName || 'Numele produsului', W / 2, ty + 80 * fs)
    if (productPrice) {
      ctx.font = `400 ${30 * fs}px sans-serif`
      ctx.fillStyle = '#f43f5e'
      ctx.fillText(productPrice, W / 2, ty + 130 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_NAVY — ramă navy profundă cu detalii aurii
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_navy') {
    const pad = Math.round(52 * fs)
    const btm = Math.round(180 * fs)
    ctx.fillStyle = '#1e3a5f'
    ctx.fillRect(0, 0, W, H)
    // lighter inner bg
    ctx.fillStyle = '#162d4a'
    ctx.fillRect(pad - 12 * fs, pad - 12 * fs, W - (pad - 12 * fs) * 2, H - (pad - 12 * fs) * 2)
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // gold border lines
    ctx.strokeStyle = '#C9A84C'
    ctx.lineWidth = 1.5 * fs
    ctx.strokeRect(14 * fs, 14 * fs, W - 28 * fs, H - 28 * fs)
    ctx.strokeRect(20 * fs, 20 * fs, W - 40 * fs, H - 40 * fs)
    ctx.strokeRect(pad - 8 * fs, pad - 8 * fs, W - (pad - 8 * fs) * 2, H - (pad - 8 * fs) * 2 - btm)
    const ty = H - pad - btm
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect((W - 60 * fs) / 2, ty + 20 * fs, 60 * fs, 1 * fs)
    ctx.font = `700 italic ${50 * fs}px Georgia, serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(productName || 'Numele produsului', W / 2, ty + 88 * fs)
    if (productPrice) {
      ctx.font = `500 ${34 * fs}px sans-serif`
      ctx.fillStyle = '#C9A84C'
      ctx.fillText(productPrice, W / 2, ty + 142 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_POLAROID — stil polaroid cu margine albă groasă jos
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_polaroid') {
    const side = Math.round(36 * fs)
    const top = Math.round(36 * fs)
    const btm = Math.round(200 * fs)
    ctx.fillStyle = '#fffef5'
    ctx.fillRect(0, 0, W, H)
    // light shadow effect
    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = 30 * fs
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8 * fs
    ctx.fillStyle = '#fffef5'
    ctx.fillRect(side - 4 * fs, top - 4 * fs, W - (side - 4 * fs) * 2 + 8 * fs, H - btm + 8 * fs)
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    drawBg(side, top, W - side * 2, H - top - btm)
    // handwritten-style text
    ctx.font = `400 italic ${52 * fs}px Georgia, serif`
    ctx.fillStyle = '#374151'
    ctx.textAlign = 'center'
    const ty = H - btm
    ctx.fillText(productName || 'Numele produsului', W / 2, ty + 80 * fs)
    if (productPrice) {
      ctx.font = `300 ${30 * fs}px sans-serif`
      ctx.fillStyle = '#9ca3af'
      ctx.fillText(productPrice, W / 2, ty + 136 * fs)
    }
    // thin grey border
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(side, top, W - side * 2, H - top - btm)
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_VINTAGE — efect vintage cu colțuri ornamentate
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_vintage') {
    const pad = Math.round(56 * fs)
    const btm = Math.round(180 * fs)
    ctx.fillStyle = '#f5ede0'
    ctx.fillRect(0, 0, W, H)
    // sepia overlay on image
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // sepia tint
    ctx.fillStyle = 'rgba(124, 92, 58, 0.18)'
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // ornate border
    ctx.strokeStyle = '#7c5c3a'
    ctx.lineWidth = 3 * fs
    ctx.strokeRect(12 * fs, 12 * fs, W - 24 * fs, H - 24 * fs)
    ctx.strokeStyle = '#c4a47a'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(20 * fs, 20 * fs, W - 40 * fs, H - 40 * fs)
    ctx.strokeRect(pad - 10 * fs, pad - 10 * fs, W - (pad - 10 * fs) * 2, H - (pad - 10 * fs) * 2 - btm + 4 * fs)
    // corner ornaments (simple cross shape)
    const drawCornerOrnament = (cx: number, cy: number) => {
      ctx.fillStyle = '#7c5c3a'
      ctx.fillRect(cx - 12 * fs, cy - 1 * fs, 24 * fs, 2 * fs)
      ctx.fillRect(cx - 1 * fs, cy - 12 * fs, 2 * fs, 24 * fs)
      ctx.beginPath()
      ctx.arc(cx, cy, 4 * fs, 0, Math.PI * 2)
      ctx.fill()
    }
    drawCornerOrnament(pad - 10 * fs, pad - 10 * fs)
    drawCornerOrnament(W - pad + 10 * fs, pad - 10 * fs)
    drawCornerOrnament(pad - 10 * fs, H - pad + 10 * fs - btm + 4 * fs)
    drawCornerOrnament(W - pad + 10 * fs, H - pad + 10 * fs - btm + 4 * fs)
    const ty = H - pad - btm
    ctx.font = `italic 600 ${48 * fs}px Georgia, serif`
    ctx.fillStyle = '#4a3520'
    ctx.textAlign = 'center'
    ctx.fillText(productName || 'Numele produsului', W / 2, ty + 84 * fs)
    if (productPrice) {
      ctx.font = `400 ${30 * fs}px sans-serif`
      ctx.fillStyle = '#7c5c3a'
      ctx.fillText(productPrice, W / 2, ty + 138 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_FILM — stil peliculă cinematografică
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_film') {
    const filmBand = Math.round(64 * fs)
    const holeSize = Math.round(14 * fs)
    const holeGap = Math.round(28 * fs)
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, W, H)
    drawBg(filmBand, filmBand, W - filmBand * 2, H - filmBand * 2)
    // film holes left
    ctx.fillStyle = '#333'
    for (let y = holeGap; y < H - holeGap; y += holeGap * 2.5) {
      const hx = (filmBand - holeSize) / 2
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(hx, y, holeSize, holeSize * 1.4, 3 * fs)
      else ctx.rect(hx, y, holeSize, holeSize * 1.4)
      ctx.fill()
      // right side
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(W - hx - holeSize, y, holeSize, holeSize * 1.4, 3 * fs)
      else ctx.rect(W - hx - holeSize, y, holeSize, holeSize * 1.4)
      ctx.fill()
    }
    // gradient bottom
    const grad = ctx.createLinearGradient(0, H - 260 * fs, 0, H - filmBand)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.85)')
    ctx.fillStyle = grad
    ctx.fillRect(filmBand, H - 260 * fs, W - filmBand * 2, 260 * fs - filmBand)
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${50 * fs}px sans-serif`
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, H - filmBand - 100 * fs, W - filmBand * 2 - 20 * fs, 58 * fs)
    if (productPrice) {
      ctx.font = `400 ${32 * fs}px sans-serif`
      ctx.fillStyle = '#C9A84C'
      ctx.fillText(productPrice, W / 2, H - filmBand - 20 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_ARCH — formă arcuită în vârf (arch window)
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_arch') {
    const pad = Math.round(40 * fs)
    const archW = W - pad * 2
    const archH = Math.round(H * 0.68)
    const archRadius = archW / 2
    ctx.fillStyle = '#f5f0eb'
    ctx.fillRect(0, 0, W, H)
    // clip to arch shape
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(pad, pad + archRadius)
    ctx.arc(pad + archRadius, pad + archRadius, archRadius, Math.PI, 0, false)
    ctx.lineTo(pad + archW, pad + archRadius + (archH - archRadius))
    ctx.lineTo(pad, pad + archRadius + (archH - archRadius))
    ctx.closePath()
    ctx.clip()
    if (image) {
      const baseScale = Math.max(archW / image.naturalWidth, archH / image.naturalHeight) * imgScale
      const dw = image.naturalWidth * baseScale
      const dh = image.naturalHeight * baseScale
      const dx = pad + (archW - dw) / 2 + imgOffset.x
      const dy = pad + (archH - dh) / 2 + imgOffset.y
      ctx.drawImage(image, dx, dy, dw, dh)
    } else {
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(pad, pad, archW, archH)
    }
    ctx.restore()
    // arch outline
    ctx.strokeStyle = '#d1c4b0'
    ctx.lineWidth = 2 * fs
    ctx.beginPath()
    ctx.moveTo(pad, pad + archRadius)
    ctx.arc(pad + archRadius, pad + archRadius, archRadius, Math.PI, 0, false)
    ctx.lineTo(pad + archW, pad + archRadius + (archH - archRadius))
    ctx.lineTo(pad, pad + archRadius + (archH - archRadius))
    ctx.closePath()
    ctx.stroke()
    const ty = pad + archH + 20 * fs
    // gold line
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect((W - 80 * fs) / 2, ty + 10 * fs, 80 * fs, 1.5 * fs)
    ctx.font = `italic 600 ${52 * fs}px Georgia, serif`
    ctx.fillStyle = '#1a1a1a'
    ctx.textAlign = 'center'
    ctx.fillText(productName || 'Numele produsului', W / 2, ty + 76 * fs)
    if (productPrice) {
      ctx.font = `400 ${34 * fs}px sans-serif`
      ctx.fillStyle = '#6b7280'
      ctx.fillText(productPrice, W / 2, ty + 128 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_STRIPE — dungi diagonale la colțuri + text jos
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_stripe') {
    const pad = Math.round(50 * fs)
    const btm = Math.round(160 * fs)
    ctx.fillStyle = '#1e40af'
    ctx.fillRect(0, 0, W, H)
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // diagonal stripe corner top-left
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, pad, pad + 80 * fs)
    ctx.clip()
    ctx.fillStyle = 'rgba(59,130,246,0.8)'
    for (let i = -20; i < 200; i += 16) {
      ctx.fillRect(i * fs, -10 * fs, 8 * fs, (pad + 90 * fs))
    }
    ctx.restore()
    ctx.save()
    ctx.beginPath()
    ctx.rect(W - pad, 0, pad, pad + 80 * fs)
    ctx.clip()
    ctx.fillStyle = 'rgba(59,130,246,0.8)'
    for (let i = -20; i < 200; i += 16) {
      ctx.fillRect(W - pad + i * fs, -10 * fs, 8 * fs, (pad + 90 * fs))
    }
    ctx.restore()
    // border
    ctx.strokeStyle = '#93c5fd'
    ctx.lineWidth = 2 * fs
    ctx.strokeRect(12 * fs, 12 * fs, W - 24 * fs, H - 24 * fs)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(pad - 6 * fs, pad - 6 * fs, W - (pad - 6 * fs) * 2, H - (pad - 6 * fs) * 2 - btm + 6 * fs)
    const ty = H - pad - btm
    ctx.font = `700 ${50 * fs}px sans-serif`
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, ty + 60 * fs, W - pad * 2, 58 * fs)
    if (productPrice) {
      ctx.font = `600 ${34 * fs}px sans-serif`
      ctx.fillStyle = '#bfdbfe'
      ctx.fillText(productPrice, W / 2, ty + 130 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_CORNER — colțuri aurii decorative pe imagine full-bleed
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_corner') {
    drawBg()
    // gradient overlay
    const gradC = ctx.createLinearGradient(0, H * 0.5, 0, H)
    gradC.addColorStop(0, 'rgba(0,0,0,0)')
    gradC.addColorStop(1, `rgba(0,0,0,${0.80 * overlayOpacity})`)
    ctx.fillStyle = gradC
    ctx.fillRect(0, 0, W, H)
    // corner bracket decorations
    const cSize = 60 * fs
    const cOff = 22 * fs
    const drawBracket = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      const sx = flipX ? -1 : 1
      const sy = flipY ? -1 : 1
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(sx, sy)
      ctx.strokeStyle = '#C9A84C'
      ctx.lineWidth = 2.5 * fs
      ctx.beginPath()
      ctx.moveTo(0, cSize)
      ctx.lineTo(0, 0)
      ctx.lineTo(cSize, 0)
      ctx.stroke()
      ctx.restore()
    }
    drawBracket(cOff, cOff, false, false)
    drawBracket(W - cOff, cOff, true, false)
    drawBracket(cOff, H - cOff, false, true)
    drawBracket(W - cOff, H - cOff, true, true)
    // text
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 12
    ctx.font = `700 italic ${56 * fs}px Georgia, serif`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, H - (productPrice ? 130 : 80) * fs, W - 120 * fs, 66 * fs)
    if (productPrice) {
      ctx.font = `600 ${38 * fs}px sans-serif`
      ctx.fillStyle = '#C9A84C'
      ctx.fillText(productPrice, W / 2, H - 56 * fs)
    }
    ctx.shadowBlur = 0
    return
  }

  // ═══════════════════════════════════════════════════════
  // FRAME_SHADOW — drop shadow + border violet/mov
  // ═══════════════════════════════════════════════════════

  if (layout === 'frame_shadow') {
    const pad = Math.round(46 * fs)
    const btm = Math.round(170 * fs)
    ctx.fillStyle = '#f3e8ff'
    ctx.fillRect(0, 0, W, H)
    // shadow effect for image
    ctx.shadowColor = 'rgba(107,33,168,0.35)'
    ctx.shadowBlur = 30 * fs
    ctx.shadowOffsetX = 8 * fs
    ctx.shadowOffsetY = 8 * fs
    ctx.fillStyle = '#fff'
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2 - btm)
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    drawBg(pad, pad, W - pad * 2, H - pad * 2 - btm)
    // purple border
    ctx.strokeStyle = '#6b21a8'
    ctx.lineWidth = 3 * fs
    ctx.strokeRect(12 * fs, 12 * fs, W - 24 * fs, H - 24 * fs)
    ctx.strokeStyle = '#d8b4fe'
    ctx.lineWidth = 1 * fs
    ctx.strokeRect(20 * fs, 20 * fs, W - 40 * fs, H - 40 * fs)
    const ty = H - pad - btm
    ctx.fillStyle = '#6b21a8'
    ctx.fillRect((W - 80 * fs) / 2, ty + 18 * fs, 80 * fs, 2 * fs)
    ctx.font = `700 ${50 * fs}px sans-serif`
    ctx.fillStyle = '#3b0764'
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, ty + 78 * fs, W - pad * 2 - 10 * fs, 58 * fs)
    if (productPrice) {
      ctx.font = `500 ${34 * fs}px sans-serif`
      ctx.fillStyle = '#6b21a8'
      ctx.fillText(productPrice, W / 2, ty + 140 * fs)
    }
    return true
  }

  return false
  } // end drawFrameTemplate

  if (layout.startsWith('frame_')) {
    drawFrameTemplate()
    if (showBadgeOnFrame) drawBadgeOverlay()
    return
  }

  // ═══════════════════════════════════════════════════════
  // LUXURY template
  // ═══════════════════════════════════════════════════════

  if (layout === 'luxury') {
    const CREAM = '#f5f0eb'
    ctx.fillStyle = CREAM
    ctx.fillRect(0, 0, W, H)

    // fit image (not full-bleed) — show whole photo
    const imgAreaH = Math.round(H * 0.72)
    const pad = Math.round(36 * fs)
    if (image) {
      const baseScale = Math.min((W - pad * 2) / image.naturalWidth, imgAreaH / image.naturalHeight) * imgScale
      const dw = image.naturalWidth * baseScale
      const dh = image.naturalHeight * baseScale
      const dx = (W - dw) / 2 + imgOffset.x
      const dy = pad + (imgAreaH - dh) / 2 + imgOffset.y
      ctx.drawImage(image, dx, dy, dw, dh)
    }

    // gold line
    const lineY = imgAreaH + pad + 20 * fs
    const lineW2 = 120 * fs
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect((W - lineW2) / 2, lineY, lineW2, 2 * fs)

    // brand
    ctx.fillStyle = '#C9A84C'
    ctx.font = `400 ${22 * fs}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('ejolie.ro', W / 2, lineY + 38 * fs)

    // product name
    ctx.fillStyle = '#1a1a1a'
    ctx.font = `italic ${50 * fs}px Georgia, serif`
    ctx.fillText(productName || 'Numele produsului', W / 2, lineY + 98 * fs)

    if (productPrice) {
      ctx.font = `400 ${36 * fs}px sans-serif`
      ctx.fillStyle = '#6b7280'
      ctx.fillText(productPrice, W / 2, lineY + 148 * fs)
    }
    return
  }

  // ═══════════════════════════════════════════════════════
  // EDITORIAL template
  // ═══════════════════════════════════════════════════════

  if (layout === 'editorial') {
    drawBg()

    // left gradient overlay
    const grad = ctx.createLinearGradient(0, 0, W * 0.7, 0)
    grad.addColorStop(0, `rgba(0,0,0,${0.82 * overlayOpacity})`)
    grad.addColorStop(0.6, `rgba(0,0,0,${0.3 * overlayOpacity})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // vertical accent line
    ctx.fillStyle = '#C9A84C'
    ctx.fillRect(60 * fs, H * 0.25, 3 * fs, H * 0.45)

    const textX = 90 * fs
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 8

    // category tag
    ctx.fillStyle = '#C9A84C'
    ctx.font = `600 ${22 * fs}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText('EJOLIE', textX, H * 0.32)

    // product name left-aligned, big
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${60 * fs}px sans-serif`
    wrapText(ctx, productName || 'Numele produsului', textX, H * 0.42, W * 0.55, 72 * fs, 'left')

    if (productPrice) {
      ctx.font = `700 ${48 * fs}px sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.fillText(productPrice, textX, H * 0.65)
    }
    if (promoText) {
      ctx.font = `400 ${30 * fs}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.textAlign = 'left'
      ctx.fillText(promoText, textX, H * 0.72)
    }
    ctx.shadowBlur = 0
    return
  }

  // ═══════════════════════════════════════════════════════
  // COLLECTION template
  // ═══════════════════════════════════════════════════════

  if (layout === 'collection') {
    drawBg()

    // dark overlay
    ctx.fillStyle = `rgba(0,0,0,${0.45 * overlayOpacity})`
    ctx.fillRect(0, 0, W, H)

    // center thin lines + text
    const cy = H / 2
    const lineLen = 160 * fs
    const gap = 24 * fs

    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1 * fs

    ctx.beginPath(); ctx.moveTo(W / 2 - lineLen, cy - gap); ctx.lineTo(W / 2 + lineLen, cy - gap); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W / 2 - lineLen, cy + gap); ctx.lineTo(W / 2 + lineLen, cy + gap); ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.font = `300 ${28 * fs}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('N E W', W / 2, cy - gap - 16 * fs)

    ctx.font = `800 ${68 * fs}px sans-serif`
    ctx.fillText('COLLECTION', W / 2, cy + gap + 60 * fs)

    if (productName) {
      ctx.font = `400 italic ${34 * fs}px Georgia, serif`
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(productName, W / 2, cy + gap + 110 * fs)
    }

    // bottom brand
    ctx.font = `400 ${22 * fs}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillText('ejolie.ro', W / 2, H - 48 * fs)
    return
  }

  // ═══════════════════════════════════════════════════════
  // SALE template
  // ═══════════════════════════════════════════════════════

  if (layout === 'sale') {
    drawBg()

    ctx.fillStyle = `rgba(0,0,0,${0.35 * overlayOpacity})`
    ctx.fillRect(0, 0, W, H)

    // diagonal SALE text watermark
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 6)
    ctx.font = `900 ${280 * fs}px sans-serif`
    ctx.fillStyle = 'rgba(220, 38, 38, 0.18)'
    ctx.textAlign = 'center'
    ctx.fillText('SALE', 0, 80 * fs)
    ctx.restore()

    // top badge
    const badgeW = 220 * fs
    const badgeH = 80 * fs
    const badgeX = (W - badgeW) / 2
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    if (ctx.roundRect) ctx.roundRect(badgeX, 48 * fs, badgeW, badgeH, 40 * fs)
    else ctx.rect(badgeX, 48 * fs, badgeW, badgeH)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${42 * fs}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('SALE', W / 2, 104 * fs)

    // gradient bottom
    const grad2 = ctx.createLinearGradient(0, H - 340 * fs, 0, H)
    grad2.addColorStop(0, 'rgba(0,0,0,0)')
    grad2.addColorStop(1, 'rgba(0,0,0,0.88)')
    ctx.fillStyle = grad2
    ctx.fillRect(0, H - 340 * fs, W, 340 * fs)

    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 12
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${54 * fs}px sans-serif`
    ctx.textAlign = 'center'
    wrapText(ctx, productName || 'Numele produsului', W / 2, H - 200 * fs, W - 80 * fs, 64 * fs)
    if (productPrice) {
      ctx.font = `800 ${56 * fs}px sans-serif`
      ctx.fillStyle = '#fca5a5'
      ctx.fillText(productPrice, W / 2, H - 96 * fs)
    }
    ctx.shadowBlur = 0
    return
  }

  // ═══════════════════════════════════════════════════════
  // STANDARD templates (nou, promo, bestseller, freeship, minimal)
  // ═══════════════════════════════════════════════════════

  drawBg()

  // Badge
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
      ctx.font = `700 ${(badgeFontSize * 0.85) * fs}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(template.badgeText, 0, 12 * fs)
      ctx.restore()
    } else {
      ctx.font = `700 ${badgeFontSize * fs}px sans-serif`
      const bw = ctx.measureText(template.badgeText).width + 56 * fs
      const badgePillH = Math.max(76, badgeFontSize * 1.9) * fs
      const badgePillR = badgePillH / 2
      ctx.fillStyle = template.badgeBg
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(36 * fs, 36 * fs, bw, badgePillH, badgePillR)
      else ctx.rect(36 * fs, 36 * fs, bw, badgePillH)
      ctx.fill()
      ctx.fillStyle = template.badgeTextColor
      ctx.textAlign = 'left'
      ctx.fillText(template.badgeText, 64 * fs, 36 * fs + badgePillH * 0.65)
    }
  }

  // Gradient overlay bottom
  const gradH = (promoText ? 380 : productPrice ? 300 : 240) * fs
  const grad3 = ctx.createLinearGradient(0, H - gradH, 0, H)
  grad3.addColorStop(0, 'rgba(0,0,0,0)')
  grad3.addColorStop(0.35, `rgba(0,0,0,${0.5 * overlayOpacity})`)
  grad3.addColorStop(1, `rgba(0,0,0,${0.85 * overlayOpacity})`)
  ctx.fillStyle = grad3
  ctx.fillRect(0, H - gradH, W, gradH)

  // Accent line bottom
  ctx.fillStyle = template.accentColor
  ctx.fillRect(0, H - 8 * fs, W, 8 * fs)

  // Text
  const rgb = hexToRgb(textColor)
  const tc = `rgb(${rgb.r},${rgb.g},${rgb.b})`
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 10

  const hasPrice = !!productPrice
  const hasPromo = !!promoText
  const nameY = H - (hasPromo ? 190 : hasPrice ? 140 : 80) * fs

  const tX = textAlign === 'left' ? 48 * fs : textAlign === 'right' ? W - 48 * fs : W / 2

  const nameFontSize = fontSize * fs
  ctx.fillStyle = tc
  ctx.font = `700 ${nameFontSize}px sans-serif`
  ctx.textAlign = textAlign
  wrapText(ctx, productName || 'Numele produsului', tX, nameY, W - 80 * fs, nameFontSize * 1.18, textAlign)

  if (hasPrice) {
    ctx.font = `700 ${nameFontSize * 0.88}px sans-serif`
    ctx.fillStyle = tc
    ctx.textAlign = textAlign
    ctx.fillText(productPrice, tX, nameY + nameFontSize * 1.32)
  }

  if (hasPromo) {
    ctx.font = `500 ${nameFontSize * 0.66}px sans-serif`
    ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.82)`
    ctx.textAlign = textAlign
    ctx.fillText(promoText, tX, H - 48 * fs)
  }

  ctx.shadowBlur = 0
}


export default function CreatorPage() {
  const { t, lang } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const [format, setFormat] = useState<Format>('instagram')
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0])
  // Custom badge overrides (editable per-template)
  const [customBadgeText, setCustomBadgeText] = useState(TEMPLATES[0].badgeText)
  const [customBadgeBg, setCustomBadgeBg] = useState(TEMPLATES[0].badgeBg)
  const [customBadgeFontSize, setCustomBadgeFontSize] = useState(40)
  const [showBadgeOnFrame, setShowBadgeOnFrame] = useState(false)
  const [productImage, setProductImage] = useState<HTMLImageElement | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const [imgScale, setImgScale] = useState(1)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [promoText, setPromoText] = useState('')
  const [caption, setCaption] = useState('')
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textAlign, setTextAlign] = useState<CanvasTextAlign>('center')
  const [fontSize, setFontSize] = useState(54)
  const [bgColor, setBgColor] = useState('#e5e7eb')
  const [imgFit, setImgFit] = useState<'contain' | 'cover'>('contain')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUrlLoading, setImageUrlLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // ── Programare ──
  const [showSchedule, setShowSchedule] = useState(false)
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0])
  const [schedHour, setSchedHour] = useState('09:00')
  const [scheduling, setScheduling] = useState(false)
  const [schedSuccess, setSchedSuccess] = useState('')
  const SCHED_HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

  // ── Left panel tabs ──
  const [leftTab, setLeftTab] = useState<'editor' | 'queue'>('editor')

  // ── Accordion sections (multiple can be open) ──
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['template', 'content']))
  const toggleSection = (id: string) => setOpenSections(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  // ── Template queue ──
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue)
  const [queueAddCount, setQueueAddCount] = useState(1)
  const [queueMsg, setQueueMsg] = useState('')

  // Auto-save queue to localStorage
  useEffect(() => { saveQueue(queue) }, [queue])

  const addToQueue = () => {
    const item: QueueItem = {
      id: `${Date.now()}`,
      templateId: selectedTemplate.id,
      count: Math.max(1, queueAddCount),
      used: 0,
    }
    setQueue(prev => [...prev, item])
  }

  const removeQueueItem = (id: string) => setQueue(prev => prev.filter(i => i.id !== id))

  const moveQueueItem = (id: string, dir: -1 | 1) => {
    setQueue(prev => {
      const idx = prev.findIndex(i => i.id === id)
      if (idx < 0) return prev
      const ni = idx + dir
      if (ni < 0 || ni >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[ni]] = [arr[ni], arr[idx]]
      return arr
    })
  }

  const updateQueueItemCount = (id: string, count: number) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, count: Math.max(1, count) } : i))
  }

  const resetQueueUsed = () => {
    setQueue(prev => prev.map(i => ({ ...i, used: 0 })))
    setQueueMsg('Coada a fost resetată. Postările vor relua de la început.')
    setTimeout(() => setQueueMsg(''), 3500)
  }

  const totalQueuePosts = queue.reduce((s, i) => s + i.count, 0)
  const remainingQueuePosts = queue.reduce((s, i) => s + Math.max(0, i.count - i.used), 0)
  const nextQueueTemplate = getNextTemplateFromQueue(queue)
  const [cloudSaving, setCloudSaving] = useState(false)
  const [cloudLoading, setCloudLoading] = useState(false)

  // ── Cloud save/load queue ──
  const saveQueueToCloud = async () => {
    setCloudSaving(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/template-queue`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue, img_fit: imgFit, format }),
      })
      if (res.ok) {
        setQueueMsg(t('saveToCloud') + ' ✓')
        setTimeout(() => setQueueMsg(''), 4000)
      } else {
        const d = await res.json()
        setError(d.error || t('cloudSaveError'))
      }
    } catch {
      setError(t('serverConnectionError'))
    }
    setCloudSaving(false)
  }

  const loadQueueFromCloud = async () => {
    setCloudLoading(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`${API_URL}/template-queue`, { headers })
      if (res.ok) {
        const data = await res.json()
        if (data.queue && data.queue.length > 0) {
          setQueue(data.queue)
          if (data.img_fit) setImgFit(data.img_fit)
          if (data.format) setFormat(data.format)
          setQueueMsg(`${t('loadFromCloud')} ✓ (${data.queue.length})`)
          setTimeout(() => setQueueMsg(''), 3500)
        } else {
          setQueueMsg(t('noTemplatesInQueue'))
          setTimeout(() => setQueueMsg(''), 3000)
        }
      }
    } catch {
      setError(t('cloudLoadError'))
    }
    setCloudLoading(false)
  }

  const redraw = useCallback(() => {
    if (!canvasRef.current) return
    // Build effective template with custom overrides
    const effectiveTemplate: Template = {
      ...selectedTemplate,
      badgeText: customBadgeText,
      badgeBg: customBadgeBg,
      accentColor: customBadgeBg,
    }
    drawCanvas(canvasRef.current, format, effectiveTemplate, productImage, imgOffset, imgScale, productName, productPrice, promoText, caption, overlayOpacity, textColor, textAlign, fontSize, bgColor, imgFit, customBadgeFontSize, showBadgeOnFrame)
  }, [format, selectedTemplate, customBadgeText, customBadgeBg, customBadgeFontSize, showBadgeOnFrame, productImage, imgOffset, imgScale, productName, productPrice, promoText, caption, overlayOpacity, textColor, textAlign, fontSize, bgColor, imgFit])

  useEffect(() => { redraw() }, [redraw])

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

  const loadImageFromUrl = async (url: string) => {
    if (!url.trim()) return
    setImageUrlLoading(true)
    try {
      const trimmed = url.trim()
      const img = new Image()

      // Try loading without crossOrigin first (works with any server)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Nu s-a putut incarca'))
        img.src = trimmed
      })

      setProductImage(img)
      setProductImagePreview(trimmed)
      setImgOffset({ x: 0, y: 0 })
      setImgScale(1)
    } catch {
      setError('Nu s-a putut incarca imaginea de la acel URL.')
      setTimeout(() => setError(''), 4000)
    }
    setImageUrlLoading(false)
  }

  const schedulePost = async () => {
    if (!canvasRef.current) return
    setScheduling(true)
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
        const postCaption = caption || `${productName}${productPrice ? ' — ' + productPrice : ''}${promoText ? '\n' + promoText : ''}`
        const postType = format === 'stories' ? 'story' : 'feed'
        const scheduled_at = `${schedDate}T${schedHour}:00`
        const res = await fetch(`${API_URL}/scheduled`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduled_at, caption: postCaption, post_type: postType, image_base64: base64 })
        })
        if (res.ok) {
          setSchedSuccess(`${t('scheduledFor')} ${schedDate} ${t('at')} ${schedHour}!`)
          setShowSchedule(false)
          setTimeout(() => setSchedSuccess(''), 4000)
        } else {
          const data = await res.json()
          setError(data.error || t('scheduleError'))
        }
        setScheduling(false)
      }
    } catch {
      setError(t('connectionError'))
      setScheduling(false)
    }
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
        const postCaption = caption || `${productName}${productPrice ? ' — ' + productPrice : ''}${promoText ? '\n' + promoText : ''}`
        const postType = format === 'stories' ? 'story' : 'feed'
        const res = await fetch(`${API_URL}/post-image`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, caption: postCaption, post_type: postType })
        })
        if (res.ok) {
          setSuccess(postType === 'story' ? t('storyPosted') : t('feedPosted'))
          setTimeout(() => setSuccess(''), 4000)
        } else {
          const data = await res.json()
          setError(data.error || t('postError'))
        }
        setPosting(false)
      }
    } catch {
      setError(t('connectionError'))
      setPosting(false)
    }
  }

  const canvasAspect = FORMATS[format].h / FORMATS[format].w

  const templateGroups = [
    { label: t('badges'), ids: ['nou', 'promo', 'bestseller', 'freeship', 'minimal'] },
    { label: 'Premium', ids: ['luxury', 'editorial', 'collection', 'sale'] },
    { label: t('frames'), ids: ['frame_gold', 'frame_minimal', 'frame_double', 'frame_black', 'frame_rose', 'frame_navy', 'frame_polaroid', 'frame_vintage', 'frame_film', 'frame_arch', 'frame_stripe', 'frame_corner', 'frame_shadow'] },
  ]

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)' }}>{t('creatorTitle')}</h1>
        <p style={{ color: 'var(--foreground-muted)', fontSize: 14, marginTop: 4 }}>
          {t('creatorDesc')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* Stânga — controale */}
        <div style={{ width: 310, flexShrink: 0 }}>

          {/* Left panel tab switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 18, borderBottom: '2px solid var(--border)' }}>
            {([
              { key: 'editor', label: `⚙ ${t('editorTab')}` },
              { key: 'queue',  label: `📋 ${t('queueTab')}` },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setLeftTab(tab.key)}
                style={{
                  padding: '8px 14px', fontSize: 12, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: leftTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent',
                  color: leftTab === tab.key ? '#1d4ed8' : 'var(--foreground-muted)',
                  marginBottom: -2, whiteSpace: 'nowrap',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ QUEUE TAB ══ */}
          {leftTab === 'queue' && (
            <div>
              {/* Summary bar */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 2 }}>
                  {queue.length === 0 ? t('queueEmpty') : `${remainingQueuePosts} ${t('postsRemaining')} ${totalQueuePosts} ${t('total')}`}
                </div>
                {nextQueueTemplate && (
                  <div style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t('next')}&nbsp;
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: nextQueueTemplate.accentColor }} />
                    <strong>{nextQueueTemplate.label}</strong>
                  </div>
                )}
              </div>

              {queueMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 7, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#065f46' }}>
                  ✓ {queueMsg}
                </div>
              )}

              {/* Queue list */}
              {queue.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--foreground-dim)', fontSize: 12, padding: '20px 0', border: '2px dashed var(--border)', borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
                  {t('noTemplatesInQueue')}<br />{t('addBelow')}
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  {queue.map((item, idx) => {
                    const tpl = TEMPLATES.find(t => t.id === item.templateId)
                    if (!tpl) return null
                    const done = item.used >= item.count
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                        marginBottom: 6, borderRadius: 8,
                        background: done ? 'var(--surface)' : 'var(--bg-card)',
                        border: done ? '1px solid var(--border)' : '1px solid var(--border)',
                        opacity: done ? 0.55 : 1,
                      }}>
                        {/* Color dot */}
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: tpl.accentColor, flexShrink: 0 }} />
                        {/* Name */}
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tpl.label}
                        </span>
                        {/* Progress: used/count */}
                        <span style={{ fontSize: 10, color: 'var(--foreground-dim)', whiteSpace: 'nowrap' }}>{item.used}/{item.count}</span>
                        {/* Count input */}
                        <input
                          type="number" min={1} max={999}
                          value={item.count}
                          onChange={e => updateQueueItemCount(item.id, parseInt(e.target.value) || 1)}
                          style={{ width: 44, padding: '3px 5px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 11, textAlign: 'center', outline: 'none' }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--foreground-dim)' }}>post.</span>
                        {/* Move up */}
                        <button onClick={() => moveQueueItem(item.id, -1)} disabled={idx === 0}
                          style={{ padding: '2px 5px', fontSize: 10, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'var(--foreground-muted)' }}>▲</button>
                        {/* Move down */}
                        <button onClick={() => moveQueueItem(item.id, 1)} disabled={idx === queue.length - 1}
                          style={{ padding: '2px 5px', fontSize: 10, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)', cursor: idx === queue.length - 1 ? 'not-allowed' : 'pointer', color: 'var(--foreground-muted)' }}>▼</button>
                        {/* Delete */}
                        <button onClick={() => removeQueueItem(item.id)}
                          style={{ padding: '2px 6px', fontSize: 12, border: '1px solid #fecaca', borderRadius: 4, background: '#fff5f5', cursor: 'pointer', color: '#ef4444' }}>×</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add to queue */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>{t('addToQueue')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: selectedTemplate.accentColor, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--foreground)' }}>
                    {selectedTemplate.label} <span style={{ fontWeight: 400, color: 'var(--foreground-dim)' }}>{t('selectedInEditor')}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>{t('numberOfPosts')}</label>
                  <input
                    type="number" min={1} max={999} value={queueAddCount}
                    onChange={e => setQueueAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{ width: 60, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, textAlign: 'center', outline: 'none' }}
                  />
                  <button onClick={addToQueue}
                    style={{ flex: 1, padding: '6px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    + {t('add')}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--foreground-dim)', marginTop: 6 }}>
                  {t('selectOtherTemplate')}
                </div>
              </div>

              {/* Cloud save/load */}
              {queue.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  <button onClick={saveQueueToCloud} disabled={cloudSaving}
                    style={{
                      padding: '10px', background: cloudSaving ? '#93c5fd' : '#3b82f6', color: '#fff',
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: cloudSaving ? 'not-allowed' : 'pointer',
                    }}>
                    {cloudSaving ? t('savingCloud') : `☁ ${t('saveToCloud')}`}
                  </button>
                </div>
              )}

              <button onClick={loadQueueFromCloud} disabled={cloudLoading}
                style={{
                  width: '100%', padding: '8px', background: 'var(--surface)', color: 'var(--foreground)',
                  border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  cursor: cloudLoading ? 'not-allowed' : 'pointer', marginBottom: 10,
                }}>
                {cloudLoading ? t('loadingCloud') : `⬇ ${t('loadFromCloud')}`}
              </button>

              {/* Reset + clear */}
              {queue.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <button onClick={resetQueueUsed}
                    style={{ flex: 1, padding: '7px', background: 'var(--bg-card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>
                    🔄 {t('resetCounters')}
                  </button>
                  <button onClick={() => { setQueue([]); setQueueMsg('') }}
                    style={{ padding: '7px 10px', background: '#fff5f5', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>
                    🗑 {t('clearQueue')}
                  </button>
                </div>
              )}

              {/* Note about auto-posting */}
              <div style={{ marginTop: 6, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
                <strong>ℹ {t('howItWorks')}</strong><br />
                {t('queueInfo1')}<br />
                {t('queueInfo2')}<br />
                3. {imgFit === 'contain' ? t('queueInfo3Fit') : t('queueInfo3Fill')}
              </div>
            </div>
          )}

          {/* ══ EDITOR TAB ══ */}
          {leftTab === 'editor' && <div>

          {/* ── Section: Template & Format (always open, compact) ── */}
          {(() => {
            const sectionStyle = (id: string) => ({
              marginBottom: 6,
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden' as const,
              background: openSections.has(id) ? 'var(--bg-card)' : 'var(--surface)',
            })
            const headerStyle = (id: string) => ({
              display: 'flex' as const,
              alignItems: 'center' as const,
              justifyContent: 'space-between' as const,
              padding: '10px 12px',
              cursor: 'pointer' as const,
              background: 'none',
              border: 'none',
              width: '100%' as const,
              fontSize: 13,
              fontWeight: 600 as const,
              color: 'var(--foreground)',
              userSelect: 'none' as const,
            })
            const bodyStyle = {
              padding: '0 12px 12px',
            }
            const chevron = (id: string) => openSections.has(id) ? '▾' : '▸'

            return <>
            {/* ── 1. Template & Format ── */}
            <div style={sectionStyle('template')}>
              <button onClick={() => toggleSection('template')} style={headerStyle('template')}>
                <span>{chevron('template')} {t('templateAndFormat')}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--foreground-dim)' }}>{selectedTemplate.label} · {FORMATS[format].label}</span>
              </button>
              {openSections.has('template') && <div style={bodyStyle}>
                {/* Format */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {(Object.entries(FORMATS) as [Format, typeof FORMATS[Format]][]).map(([key, val]) => (
                    <button key={key} onClick={() => setFormat(key)}
                      style={{
                        flex: 1, padding: '6px 4px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                        border: format === key ? '2px solid #3b82f6' : '1px solid var(--border)',
                        background: format === key ? '#eff6ff' : 'var(--bg-card)',
                        color: format === key ? '#1d4ed8' : 'var(--foreground-muted)',
                        cursor: 'pointer',
                      }}>
                      {val.label}
                    </button>
                  ))}
                </div>
                {/* Templates */}
                {templateGroups.map(group => (
                  <div key={group.label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--foreground-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {group.label}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {TEMPLATES.filter(t => group.ids.includes(t.id)).map(t => (
                        <button key={t.id}
                          onClick={() => { setSelectedTemplate(t); setCustomBadgeText(t.badgeText); setCustomBadgeBg(t.badgeBg); setCustomBadgeFontSize(40) }}
                          style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600,
                            border: selectedTemplate.id === t.id ? `2px solid ${t.accentColor}` : '1px solid var(--border)',
                            background: selectedTemplate.id === t.id ? t.accentColor : 'var(--bg-card)',
                            color: selectedTemplate.id === t.id ? '#fff' : 'var(--foreground-muted)',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>}
            </div>

            {/* ── 2. Imagine ── */}
            <div style={sectionStyle('image')}>
              <button onClick={() => toggleSection('image')} style={headerStyle('image')}>
                <span>{chevron('image')} {t('image')}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--foreground-dim)' }}>{productImage ? (lang === 'ro' ? '✓ incarcata' : '✓ loaded') : (lang === 'ro' ? 'nicio poza' : 'no image')}</span>
              </button>
              {openSections.has('image') && <div style={bodyStyle}>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) handleImageUpload(f) }}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 8, padding: 10,
                    cursor: 'pointer', textAlign: 'center', background: 'var(--surface)', marginBottom: 8,
                  }}>
                  {productImagePreview ? (
                    <img src={productImagePreview} style={{ maxHeight: 60, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: 'var(--foreground-dim)', fontSize: 11 }}>{t('dragPhotoOrClick')}</div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                {/* URL */}
                <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') loadImageFromUrl(imageUrl) }}
                    placeholder="Sau lipește un URL..."
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                  <button onClick={() => loadImageFromUrl(imageUrl)} disabled={imageUrlLoading}
                    style={{ padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--foreground)' }}>
                    {imageUrlLoading ? '...' : '→'}
                  </button>
                </div>
                {productImage && (
                  <>
                    <button onClick={() => { setProductImage(null); setProductImagePreview(null); setImageUrl('') }}
                      style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
                      × Șterge poza
                    </button>
                    {/* Fit/Cover */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      <button onClick={() => setImgFit('contain')}
                        style={{ flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          border: imgFit === 'contain' ? '2px solid #3b82f6' : '1px solid var(--border)',
                          background: imgFit === 'contain' ? '#eff6ff' : 'var(--bg-card)',
                          color: imgFit === 'contain' ? '#1d4ed8' : 'var(--foreground-muted)', cursor: 'pointer' }}>
                        Fit
                      </button>
                      <button onClick={() => setImgFit('cover')}
                        style={{ flex: 1, padding: '5px 4px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                          border: imgFit === 'cover' ? '2px solid #3b82f6' : '1px solid var(--border)',
                          background: imgFit === 'cover' ? '#eff6ff' : 'var(--bg-card)',
                          color: imgFit === 'cover' ? '#1d4ed8' : 'var(--foreground-muted)', cursor: 'pointer' }}>
                        Fill
                      </button>
                    </div>
                    {/* Zoom */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>Zoom {Math.round(imgScale * 100)}%</span>
                      <input type="range" min="0.5" max="3" step="0.01" value={imgScale}
                        onChange={e => setImgScale(parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: '#3b82f6' }} />
                      <button onClick={() => { setImgScale(1); setImgOffset({ x: 0, y: 0 }) }}
                        style={{ fontSize: 9, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>
                        Reset
                      </button>
                    </div>
                  </>
                )}
                {/* Culoare fundal */}
                {!productImage && (
                  <div style={{ marginTop: 6 }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 3 }}>Culoare fundal</label>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      {['#e5e7eb', '#111827', '#1e3a5f', '#f5f0eb', '#fdf2f4', '#fffef5', '#f3e8ff', '#dcfce7'].map(c => (
                        <div key={c} onClick={() => setBgColor(c)}
                          style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                            border: bgColor === c ? '3px solid #3b82f6' : '2px solid #d1d5db' }} />
                      ))}
                      <label style={{ position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', border: '2px solid #d1d5db' }} />
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>}
            </div>

            {/* ── 3. Badge ── */}
            <div style={sectionStyle('badge')}>
              <button onClick={() => toggleSection('badge')} style={headerStyle('badge')}>
                <span>{chevron('badge')} Badge</span>
                {customBadgeText && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: customBadgeBg, color: '#fff' }}>{customBadgeText}</span>
                )}
              </button>
              {openSections.has('badge') && <div style={bodyStyle}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>Text</label>
                  <input value={customBadgeText} onChange={e => setCustomBadgeText(e.target.value)}
                    placeholder="Ex: LIVRARE GRATUITĂ, PROMO..."
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>Culoare</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    {['#111827', '#ea580c', '#ca8a04', '#16a34a', '#dc2626', '#9f1239', '#3b82f6', '#6b21a8'].map(c => (
                      <div key={c} onClick={() => setCustomBadgeBg(c)}
                        style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer',
                          border: customBadgeBg === c ? '3px solid #3b82f6' : '2px solid #d1d5db' }} />
                    ))}
                    <label style={{ position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', border: '2px solid #d1d5db' }} />
                      <input type="color" value={customBadgeBg} onChange={e => setCustomBadgeBg(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }} />
                    </label>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>Mărime {customBadgeFontSize}px</span>
                    <input type="range" min="20" max="72" step="2" value={customBadgeFontSize}
                      onChange={e => setCustomBadgeFontSize(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: customBadgeBg }} />
                  </div>
                </div>
                {/* Show badge on frame toggle */}
                {selectedTemplate.layout.startsWith('frame_') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 11, color: 'var(--foreground)' }}>
                    <input type="checkbox" checked={showBadgeOnFrame}
                      onChange={e => setShowBadgeOnFrame(e.target.checked)}
                      style={{ accentColor: customBadgeBg, width: 16, height: 16, cursor: 'pointer' }} />
                    <span>{t('addBadgeOnFrame')}</span>
                  </label>
                )}
              </div>}
            </div>

            {/* ── 4. Stil text ── */}
            <div style={sectionStyle('style')}>
              <button onClick={() => toggleSection('style')} style={headerStyle('style')}>
                <span>{chevron('style')} {lang === 'ro' ? 'Stil text' : 'Text style'}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--foreground-dim)' }}>{fontSize}px · {Math.round(overlayOpacity * 100)}%</span>
              </button>
              {openSections.has('style') && <div style={bodyStyle}>
                {/* Font size */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>Text {fontSize}px</span>
                  <input type="range" min="24" max="96" step="2" value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#3b82f6' }} />
                </div>
                {/* Overlay */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--foreground-muted)', whiteSpace: 'nowrap' }}>Overlay {Math.round(overlayOpacity * 100)}%</span>
                  <input type="range" min="0" max="1" step="0.05" value={overlayOpacity}
                    onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#6b7280' }} />
                </div>
                {/* Align */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {(['left', 'center', 'right'] as CanvasTextAlign[]).map(a => (
                    <button key={a} onClick={() => setTextAlign(a)}
                      style={{
                        flex: 1, padding: '5px', borderRadius: 5, fontSize: 12,
                        border: textAlign === a ? '2px solid #3b82f6' : '1px solid var(--border)',
                        background: textAlign === a ? '#eff6ff' : 'var(--bg-card)',
                        color: textAlign === a ? '#1d4ed8' : 'var(--foreground-muted)', cursor: 'pointer',
                      }}>
                      {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                    </button>
                  ))}
                </div>
                {/* Color */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: textColor, border: '2px solid var(--border)', flexShrink: 0 }} />
                  {['#ffffff', '#111827', '#C9A84C', '#dc2626', '#3b82f6'].map(c => (
                    <div key={c} onClick={() => setTextColor(c)}
                      style={{ width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', flexShrink: 0,
                        border: textColor === c ? '3px solid #3b82f6' : '2px solid var(--border)' }} />
                  ))}
                  <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)', border: '2px solid var(--border)' }} />
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }} />
                  </label>
                </div>
              </div>}
            </div>

            {/* ── 5. Conținut ── */}
            <div style={sectionStyle('content')}>
              <button onClick={() => toggleSection('content')} style={headerStyle('content')}>
                <span>{chevron('content')} {lang === 'ro' ? 'Continut' : 'Content'}</span>
              </button>
              {openSections.has('content') && <div style={bodyStyle}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>{lang === 'ro' ? 'Numele produsului' : 'Product name'}</label>
                  <input value={productName} onChange={e => setProductName(e.target.value)}
                    placeholder={lang === 'ro' ? 'ex: Rochie de vara florala' : 'e.g.: Summer floral dress'}
                    style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>{lang === 'ro' ? 'Pret' : 'Price'}</label>
                  <input value={productPrice} onChange={e => setProductPrice(e.target.value)}
                    placeholder={lang === 'ro' ? 'ex: 149 RON' : 'e.g.: $49.99'}
                    style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>
                    {lang === 'ro' ? 'Text pe imagine' : 'Image text'} <span style={{ fontWeight: 400, color: 'var(--foreground-dim)' }}>{t('optional')}</span>
                  </label>
                  <input value={promoText} onChange={e => setPromoText(e.target.value)}
                    placeholder={lang === 'ro' ? 'ex: Livrare gratuita azi!' : 'e.g.: Free shipping today!'}
                    style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: 'var(--foreground-muted)', marginBottom: 2 }}>
                    {t('captionFb')} <span style={{ fontWeight: 400, color: 'var(--foreground-dim)' }}>{t('optional')}</span>
                  </label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder={lang === 'ro' ? 'Textul postarii de pe Facebook...' : 'Facebook post text...'}
                    rows={2}
                    style={{ width: '100%', padding: '7px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
              </div>}
            </div>

            </>
          })()}

          {/* ── Messages ── */}
          {success && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12, color: '#065f46', fontWeight: 500 }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* ── Actions (always visible) ── */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={postToFacebook} disabled={posting}
              style={{ flex: 1, padding: '10px', background: posting ? '#93c5fd' : '#1877f2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer' }}>
              {posting ? t('postingNow') : format === 'stories' ? `📤 ${t('publishStory')}` : `📤 ${t('postToFeed')}`}
            </button>
            <button onClick={() => setShowSchedule(true)}
              style={{ padding: '10px 14px', background: 'var(--bg-card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              title={t('schedulePostBtn')}>
              🗓
            </button>
            <button onClick={downloadImage}
              style={{ padding: '10px 14px', background: 'var(--bg-card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              ⬇
            </button>
          </div>

          {schedSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12, color: '#15803d', fontWeight: 500 }}>
              ✓ {schedSuccess}
            </div>
          )}

          {/* ── Modal programare ── */}
          {showSchedule && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{t('schedulePostTitle')}</div>
                <div style={{ fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 20 }}>
                  {format === 'stories' ? t('story') : t('feed')} • {t('scheduleCurrentImage')}
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--foreground)', marginBottom: 4 }}>{t('dateLabel')}</label>
                    <input
                      type="date"
                      value={schedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setSchedDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-deep)', color: 'var(--foreground)' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--foreground)', marginBottom: 4 }}>{t('hourLabel')}</label>
                    <select
                      value={schedHour}
                      onChange={e => setSchedHour(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', background: 'var(--bg-deep)', boxSizing: 'border-box', color: 'var(--foreground)' }}
                    >
                      {SCHED_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowSchedule(false)}
                    style={{ flex: 1, padding: '10px', background: 'var(--surface)', color: 'var(--foreground)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={schedulePost}
                    disabled={scheduling}
                    style={{ flex: 2, padding: '10px', background: scheduling ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: scheduling ? 'not-allowed' : 'pointer' }}
                  >
                    {scheduling ? t('scheduling') : `${t('schedulePost')} ${schedHour}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>} {/* end editor tab */}
        </div>

        {/* Dreapta — preview canvas */}
        <div style={{ flex: 1, maxWidth: 440 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
            Preview — {FORMATS[format].w}×{FORMATS[format].h}px
            {productImage && <span style={{ fontWeight: 400, color: 'var(--foreground-dim)', marginLeft: 8 }}>{t('dragToReposition')}</span>}
          </label>
          <div style={{
            border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
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
          <div style={{ fontSize: 11, color: 'var(--foreground-dim)', marginTop: 6, textAlign: 'center' }}>
            {format === 'instagram' ? 'Instagram Feed & Reels — 1:1' : format === 'stories' ? 'Stories — 9:16' : 'Facebook Feed — 2:3 portret'}
          </div>
        </div>

      </div>

    </div>
  )
}
