import { useState, useEffect, useRef } from 'react'
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth'
import { useLanguage } from '../i18n/LanguageContext'

type AuthMode = 'login' | 'signup' | 'confirm'

const LANDING_CSS = `
/* =============================================
   RESET & BASE (Landing)
============================================= */
.lp *, .lp *::before, .lp *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-deep: #0A1628;
  --bg-surface: #0D1F3C;
  --marine: #1E3A8A;
  --blue-accent: #2563EB;
  --orange: #F97316;
  --orange-hover: #EA580C;
  --gradient-hero: linear-gradient(135deg, #0A1628 0%, #1E3A8A 50%, #0A1628 100%);
  --gradient-cta: linear-gradient(135deg, #F97316, #EA580C);
  --text-primary: #F1F5F9;
  --text-muted: #94A3B8;
  --border: rgba(37, 99, 235, 0.2);
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-blur: blur(12px);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --shadow-glow: 0 0 40px rgba(37, 99, 235, 0.15);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 300ms ease;
  --font: 'Plus Jakarta Sans', sans-serif;
}

.lp {
  font-family: var(--font);
  background-color: var(--bg-deep);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

.lp a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.lp button {
  cursor: pointer;
  font-family: var(--font);
  border: none;
  outline: none;
}

.lp img {
  max-width: 100%;
  display: block;
}

.lp ul {
  list-style: none;
}

/* =============================================
   ANIMATION KEYFRAMES
============================================= */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
  50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.6); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scroll-triggered animation classes */
.lp .animate-on-scroll {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.lp .animate-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

.lp .animate-on-scroll.delay-1 { transition-delay: 0.1s; }
.lp .animate-on-scroll.delay-2 { transition-delay: 0.2s; }
.lp .animate-on-scroll.delay-3 { transition-delay: 0.3s; }
.lp .animate-on-scroll.delay-4 { transition-delay: 0.4s; }

/* =============================================
   UTILITIES
============================================= */
.lp .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.lp .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.lp .badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.35);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  color: var(--orange);
  letter-spacing: 0.02em;
}

.lp .badge svg { flex-shrink: 0; }

.lp .section-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--blue-accent);
  margin-bottom: 12px;
}

.lp .section-title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 16px;
}

.lp .section-subtitle {
  font-size: 17px;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 560px;
}

.lp .section-header {
  text-align: center;
  margin-bottom: 60px;
}

.lp .section-header .section-subtitle {
  margin: 0 auto;
}

/* =============================================
   BUTTONS
============================================= */
.lp .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-normal);
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.lp .btn-primary {
  background: var(--gradient-cta);
  color: #fff;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
}

.lp .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(249, 115, 22, 0.5);
  filter: brightness(1.05);
}

.lp .btn-primary:active { transform: translateY(0); }

.lp .btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border);
  backdrop-filter: var(--glass-blur);
}

.lp .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(37, 99, 235, 0.5);
  transform: translateY(-2px);
}

.lp .btn-secondary:active { transform: translateY(0); }

.lp .btn-white {
  background: #fff;
  color: var(--bg-deep);
  font-weight: 800;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.lp .btn-white:hover {
  background: #F1F5F9;
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.lp .btn-lg {
  padding: 16px 36px;
  font-size: 16px;
  border-radius: var(--radius-md);
}

/* =============================================
   NAVBAR
============================================= */
.lp .navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 22, 40, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  transition: background var(--transition-slow), box-shadow var(--transition-slow);
  animation: fadeInDown 0.5s ease forwards;
}

.lp .navbar.scrolled {
  background: rgba(10, 22, 40, 0.98);
  box-shadow: 0 4px 30px rgba(0,0,0,0.4);
}

.lp .navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
}

.lp .navbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.lp .navbar-logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-cta);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.lp .navbar-logo-text {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.lp .navbar-logo-text span { color: var(--orange); }

.lp .navbar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lp .navbar-nav a {
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
  cursor: pointer;
}

.lp .navbar-nav a:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.06);
}

.lp .navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.lp .navbar-cta {
  padding: 10px 20px;
  font-size: 14px;
}

/* Mobile menu toggle */
.lp .menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 6px;
  background: none;
}

.lp .menu-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all var(--transition-normal);
}

.lp .menu-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.lp .menu-toggle.active span:nth-child(2) { opacity: 0; }
.lp .menu-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* Mobile menu */
.lp .mobile-menu {
  display: none;
  position: fixed;
  top: 68px;
  left: 0;
  right: 0;
  background: rgba(10, 22, 40, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 20px 24px;
  z-index: 999;
  flex-direction: column;
  gap: 4px;
}

.lp .mobile-menu.open { display: flex; }

.lp .mobile-menu a {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.lp .mobile-menu a:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.06);
}

.lp .mobile-menu .btn-primary {
  margin-top: 12px;
  width: 100%;
}

/* =============================================
   HERO SECTION
============================================= */
.lp .hero {
  min-height: 100vh;
  background: var(--gradient-hero);
  background-size: 200% 200%;
  animation: gradientShift 12s ease infinite;
  display: flex;
  align-items: center;
  padding-top: 68px;
  position: relative;
  overflow: hidden;
}

.lp .hero::before {
  content: '';
  position: absolute;
  top: -200px;
  right: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.lp .hero::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.lp .hero-grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.lp .hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  padding: 80px 0;
  position: relative;
  z-index: 1;
}

.lp .hero-content { animation: fadeInUp 0.8s ease 0.1s both; }

.lp .hero-badge { margin-bottom: 24px; }

.lp .hero-title {
  font-size: clamp(36px, 5vw, 58px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.lp .hero-title .highlight {
  background: var(--gradient-cta);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lp .hero-subtitle {
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 36px;
  max-width: 480px;
}

.lp .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }

.lp .hero-trust {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  font-size: 13px;
  color: var(--text-muted);
}

.lp .hero-trust-dots { display: flex; }

.lp .hero-trust-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--bg-deep);
  background: linear-gradient(135deg, var(--marine), var(--blue-accent));
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
}

.lp .hero-trust-dot:first-child { margin-left: 0; }

/* Hero mockup */
.lp .hero-mockup { animation: fadeInUp 0.8s ease 0.3s both; }

.lp .mockup-window {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card), 0 0 80px rgba(37, 99, 235, 0.1);
  overflow: hidden;
  animation: float 6s ease-in-out infinite;
}

.lp .mockup-topbar {
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.lp .mockup-dots { display: flex; gap: 6px; }

.lp .mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
.lp .mockup-dot.red { background: #FF5F57; }
.lp .mockup-dot.yellow { background: #FFBD2E; }
.lp .mockup-dot.green { background: #28C840; }

.lp .mockup-url-bar {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.lp .mockup-body { padding: 20px; }

.lp .mockup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.lp .mockup-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.lp .mockup-btn-sm {
  padding: 6px 14px;
  background: var(--gradient-cta);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
}

.lp .mockup-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.lp .mockup-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.lp .mockup-card-img {
  height: 60px;
  background: linear-gradient(135deg, var(--marine), var(--blue-accent));
  position: relative;
}

.lp .mockup-card-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, rgba(249,115,22,0.3), transparent);
}

.lp .mockup-card:nth-child(2) .mockup-card-img {
  background: linear-gradient(135deg, #1e3a8a, #7c3aed);
}

.lp .mockup-card:nth-child(3) .mockup-card-img {
  background: linear-gradient(135deg, #064e3b, #065f46);
}

.lp .mockup-card-info { padding: 8px; }
.lp .mockup-card-label { font-size: 9px; color: var(--text-muted); font-weight: 500; }
.lp .mockup-card-name { font-size: 10px; color: var(--text-primary); font-weight: 700; }

.lp .mockup-schedule {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}

.lp .mockup-schedule-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lp .mockup-schedule-items { display: flex; flex-direction: column; gap: 8px; }

.lp .mockup-schedule-item { display: flex; align-items: center; gap: 10px; }

.lp .mockup-schedule-time {
  font-size: 10px;
  font-weight: 700;
  color: var(--orange);
  width: 36px;
  flex-shrink: 0;
}

.lp .mockup-schedule-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}

.lp .mockup-schedule-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--gradient-cta);
}

.lp .mockup-schedule-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lp .mockup-schedule-status.done { background: #22C55E; }
.lp .mockup-schedule-status.pending { background: var(--orange); animation: pulseGlow 2s ease infinite; }
.lp .mockup-schedule-status.queued { background: var(--text-muted); }

/* =============================================
   LOGOS BAR
============================================= */
.lp .logos-bar {
  padding: 48px 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.lp .logos-bar-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.lp .logos-bar-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.lp .logos-list {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.lp .logo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: var(--glass-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  opacity: 0.7;
}

.lp .logo-item:hover {
  opacity: 1;
  border-color: rgba(37, 99, 235, 0.5);
  background: rgba(37, 99, 235, 0.08);
  transform: translateY(-2px);
}

.lp .logo-item-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }

/* =============================================
   FEATURES SECTION
============================================= */
.lp .features {
  padding: 100px 0;
  background: var(--bg-deep);
  position: relative;
}

.lp .features::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue-accent), transparent);
}

.lp .features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.lp .feature-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  cursor: pointer;
  transition: all var(--transition-slow);
  position: relative;
  overflow: hidden;
}

.lp .feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-cta);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-slow);
}

.lp .feature-card:hover {
  border-color: rgba(37, 99, 235, 0.5);
  transform: translateY(-6px);
  box-shadow: var(--shadow-card), 0 0 40px rgba(37, 99, 235, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.lp .feature-card:hover::before { transform: scaleX(1); }

.lp .feature-card-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.lp .feature-icon-wrap {
  width: 52px;
  height: 52px;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  transition: all var(--transition-normal);
}

.lp .feature-card:hover .feature-icon-wrap {
  background: rgba(37, 99, 235, 0.25);
  border-color: rgba(37, 99, 235, 0.5);
  box-shadow: 0 0 20px rgba(37, 99, 235, 0.2);
}

.lp .feature-card-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.lp .feature-card-desc {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 24px;
}

.lp .feature-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.lp .feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  color: #93C5FD;
}

/* =============================================
   HOW IT WORKS
============================================= */
.lp .how-it-works {
  padding: 100px 0;
  background: var(--bg-surface);
  position: relative;
  overflow: hidden;
}

.lp .how-it-works::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}

.lp .steps-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  position: relative;
}

.lp .steps-connector {
  position: absolute;
  top: 36px;
  left: calc(16.67% + 36px);
  right: calc(16.67% + 36px);
  height: 2px;
  z-index: 0;
}

.lp .steps-connector-line {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--blue-accent), rgba(37, 99, 235, 0.3), var(--blue-accent));
  position: relative;
  overflow: hidden;
}

.lp .steps-connector-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 3s ease-in-out infinite;
  background-size: 200% auto;
}

.lp .step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.lp .step-number {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 28px;
  position: relative;
  transition: all var(--transition-slow);
  cursor: default;
}

.lp .step-number-inner {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  background: var(--bg-surface);
  border: 2px solid var(--blue-accent);
  color: var(--blue-accent);
  position: relative;
  z-index: 2;
  transition: all var(--transition-slow);
}

.lp .step-item:hover .step-number-inner {
  background: var(--blue-accent);
  color: #fff;
  box-shadow: 0 0 30px rgba(37, 99, 235, 0.5);
  transform: scale(1.05);
}

.lp .step-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.lp .step-desc { font-size: 15px; color: var(--text-muted); line-height: 1.7; }

.lp .step-platform-icons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
}

.lp .step-platform-icon {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

/* =============================================
   STATS BAR
============================================= */
.lp .stats-bar {
  padding: 64px 0;
  background: linear-gradient(135deg, var(--marine) 0%, rgba(37, 99, 235, 0.4) 50%, var(--marine) 100%);
  border-top: 1px solid rgba(37, 99, 235, 0.3);
  border-bottom: 1px solid rgba(37, 99, 235, 0.3);
  position: relative;
  overflow: hidden;
}

.lp .stats-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10, 22, 40, 0.6) 0%, transparent 50%, rgba(10, 22, 40, 0.6) 100%);
  pointer-events: none;
}

.lp .stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
}

.lp .stat-item { text-align: center; padding: 24px; cursor: default; }
.lp .stat-divider { border-right: 1px solid rgba(255,255,255,0.1); }

.lp .stat-value {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 8px;
}

.lp .stat-value .stat-accent {
  background: var(--gradient-cta);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lp .stat-label { font-size: 16px; font-weight: 600; color: rgba(241, 245, 249, 0.7); }
.lp .stat-sublabel { font-size: 13px; color: rgba(148, 163, 184, 0.7); margin-top: 4px; }

/* =============================================
   PRICING
============================================= */
.lp .pricing {
  padding: 100px 0;
  background: var(--bg-deep);
  position: relative;
}

.lp .pricing::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blue-accent), transparent);
}

.lp .pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 860px;
  margin: 0 auto;
}

.lp .pricing-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 40px 36px;
  cursor: pointer;
  transition: all var(--transition-slow);
  position: relative;
  overflow: hidden;
}

.lp .pricing-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-card);
}

.lp .pricing-card.featured {
  border-color: var(--orange);
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.15);
  background: rgba(249, 115, 22, 0.04);
}

.lp .pricing-card.featured:hover {
  box-shadow: 0 12px 60px rgba(249, 115, 22, 0.25);
}

.lp .pricing-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 5px 14px;
  background: var(--gradient-cta);
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  animation: pulseGlow 2.5s ease infinite;
}

.lp .pricing-plan-name {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.lp .pricing-price { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 6px; }
.lp .pricing-currency { font-size: 22px; font-weight: 700; color: var(--text-primary); padding-bottom: 6px; }

.lp .pricing-amount {
  font-size: 56px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.04em;
  line-height: 1;
}

.lp .pricing-period { font-size: 16px; color: var(--text-muted); padding-bottom: 10px; }

.lp .pricing-desc { font-size: 14px; color: var(--text-muted); margin-bottom: 32px; line-height: 1.6; }

.lp .pricing-features { display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; }

.lp .pricing-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--text-primary);
}

.lp .pricing-feature svg { flex-shrink: 0; color: #22C55E; }
.lp .pricing-feature.disabled { color: var(--text-muted); }
.lp .pricing-feature.disabled svg { color: rgba(148, 163, 184, 0.4); }
.lp .pricing-cta { width: 100%; }
.lp .pricing-card .btn-secondary { border-color: rgba(37, 99, 235, 0.4); }
.lp .pricing-separator { height: 1px; background: var(--border); margin: 28px 0; }

/* =============================================
   CTA FINAL
============================================= */
.lp .cta-final {
  padding: 100px 0;
  background: var(--gradient-cta);
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.lp .cta-final::before {
  content: '';
  position: absolute;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.lp .cta-final-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.lp .cta-final-title {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 20px;
}

.lp .cta-final-subtitle {
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  line-height: 1.6;
  margin-bottom: 40px;
}

.lp .cta-final-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

.lp .cta-final .btn-white { font-size: 16px; padding: 16px 40px; }

.lp .cta-final-note { margin-top: 20px; font-size: 13px; color: rgba(255,255,255,0.6); }

.lp .cta-decor { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1); }
.lp .cta-decor-1 { width: 300px; height: 300px; top: -100px; left: -80px; }
.lp .cta-decor-2 { width: 200px; height: 200px; bottom: -60px; right: -50px; }
.lp .cta-decor-3 { width: 150px; height: 150px; bottom: 20px; right: 100px; }

/* =============================================
   FOOTER
============================================= */
.lp .footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  padding: 48px 0 32px;
}

.lp .footer-inner {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 48px;
}

.lp .footer-brand { display: flex; flex-direction: column; gap: 16px; }

.lp .footer-brand-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 240px;
}

.lp .footer-social { display: flex; gap: 10px; }

.lp .footer-social-link {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--text-muted);
}

.lp .footer-social-link:hover {
  background: rgba(37, 99, 235, 0.15);
  border-color: rgba(37, 99, 235, 0.4);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.lp .footer-col-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.lp .footer-links { display: flex; flex-direction: column; gap: 10px; }

.lp .footer-links a {
  font-size: 14px;
  color: rgba(148, 163, 184, 0.8);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.lp .footer-links a:hover { color: var(--text-primary); }

.lp .footer-bottom {
  border-top: 1px solid var(--border);
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.lp .footer-copyright { font-size: 13px; color: var(--text-muted); }

.lp .footer-bottom-links { display: flex; gap: 20px; }

.lp .footer-bottom-links a {
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.lp .footer-bottom-links a:hover { color: var(--text-primary); }

/* =============================================
   SCROLL TO TOP BUTTON
============================================= */
.lp .scroll-top {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 44px;
  height: 44px;
  background: var(--gradient-cta);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--transition-normal);
  box-shadow: 0 4px 16px rgba(249, 115, 22, 0.4);
  z-index: 500;
}

.lp .scroll-top.visible { opacity: 1; transform: translateY(0); }

.lp .scroll-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.5);
}

/* =============================================
   AUTH DROPDOWN
============================================= */
.lp .auth-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
}

.lp .auth-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 380px;
  background: rgba(13, 31, 60, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(37, 99, 235, 0.3);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  padding: 28px;
  z-index: 1200;
  animation: fadeInDown 0.25s ease forwards;
}

.lp .auth-dropdown h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.lp .auth-dropdown label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #94A3B8;
  margin-bottom: 6px;
}

.lp .auth-dropdown input[type="email"],
.lp .auth-dropdown input[type="password"],
.lp .auth-dropdown input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  background: #0A1628;
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 8px;
  font-size: 14px;
  color: #F1F5F9;
  outline: none;
  font-family: var(--font);
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.lp .auth-dropdown input:focus {
  border-color: rgba(37, 99, 235, 0.5);
}

.lp .auth-dropdown .auth-submit-btn {
  width: 100%;
  padding: 11px;
  background: var(--gradient-cta);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
  font-family: var(--font);
}

.lp .auth-dropdown .auth-submit-btn:hover {
  box-shadow: 0 8px 32px rgba(249, 115, 22, 0.5);
}

.lp .auth-dropdown .auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lp .auth-dropdown .auth-error {
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #FCA5A5;
}

.lp .auth-dropdown .auth-success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #86EFAC;
}

.lp .auth-dropdown .auth-toggle {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: #94A3B8;
}

.lp .auth-dropdown .auth-toggle button {
  color: #60A5FA;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  font-family: var(--font);
}

.lp .auth-dropdown .auth-toggle button:hover {
  color: #93C5FD;
}

/* =============================================
   RESPONSIVE STYLES
============================================= */
@media (max-width: 1024px) {
  .lp .hero-inner { gap: 40px; }
  .lp .features-grid { gap: 20px; }
  .lp .footer-inner { grid-template-columns: 1fr 1fr; gap: 32px; }
}

@media (max-width: 768px) {
  .lp .navbar-nav { display: none; }
  .lp .menu-toggle { display: flex; }
  .lp .navbar-cta { display: none; }

  .lp .hero-inner {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 60px 0 40px;
    gap: 48px;
  }

  .lp .hero-subtitle { max-width: 100%; }
  .lp .hero-actions { justify-content: center; }
  .lp .hero-trust { justify-content: center; }
  .lp .hero-mockup { max-width: 480px; margin: 0 auto; }

  .lp .features-grid { grid-template-columns: 1fr; gap: 20px; }
  .lp .feature-card { padding: 28px 24px; }

  .lp .steps-container { grid-template-columns: 1fr; gap: 40px; }
  .lp .steps-connector { display: none; }

  .lp .step-item {
    flex-direction: row;
    text-align: left;
    gap: 20px;
    align-items: flex-start;
  }

  .lp .step-number { margin-bottom: 0; flex-shrink: 0; }
  .lp .step-platform-icons { justify-content: flex-start; }

  .lp .stats-grid { grid-template-columns: 1fr; gap: 32px; }

  .lp .stat-divider {
    border-right: none;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 32px;
  }

  .lp .pricing-grid { grid-template-columns: 1fr; max-width: 460px; }

  .lp .footer-inner { grid-template-columns: 1fr; gap: 32px; }
  .lp .footer-brand-desc { max-width: 100%; }

  .lp .footer-bottom {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .lp .section-header { margin-bottom: 40px; }
  .lp .cta-final-actions { flex-direction: column; align-items: center; }

  .lp .auth-dropdown {
    position: fixed;
    top: 80px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}

@media (max-width: 480px) {
  .lp .container { padding: 0 16px; }

  .lp .hero-actions { flex-direction: column; align-items: center; }
  .lp .hero-actions .btn { width: 100%; max-width: 320px; }

  .lp .logos-list { gap: 12px; }
  .lp .logo-item { padding: 10px 16px; }

  .lp .pricing-card { padding: 28px 24px; }
}

/* =============================================
   CUSTOM SCROLLBAR
============================================= */
.lp ::-webkit-scrollbar { width: 6px; }
.lp ::-webkit-scrollbar-track { background: var(--bg-deep); }
.lp ::-webkit-scrollbar-thumb { background: var(--marine); border-radius: 3px; }
.lp ::-webkit-scrollbar-thumb:hover { background: var(--blue-accent); }

/* =============================================
   SELECTION COLOR
============================================= */
.lp ::selection {
  background: rgba(37, 99, 235, 0.4);
  color: var(--text-primary);
}

/* =============================================
   FOCUS VISIBLE
============================================= */
.lp :focus-visible {
  outline: 2px solid var(--blue-accent);
  outline-offset: 3px;
}
`

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const { t } = useLanguage()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [navScrolled, setNavScrolled] = useState(false)
  const [scrollTopVisible, setScrollTopVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const authRef = useRef<HTMLDivElement>(null)
  const authBtnRef = useRef<HTMLButtonElement>(null)
  const navbarRef = useRef<HTMLElement>(null)

  // --- Inject Google Font ---
  useEffect(() => {
    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"]')) {
      const preconnect1 = document.createElement('link')
      preconnect1.rel = 'preconnect'
      preconnect1.href = 'https://fonts.googleapis.com'
      document.head.appendChild(preconnect1)

      const preconnect2 = document.createElement('link')
      preconnect2.rel = 'preconnect'
      preconnect2.href = 'https://fonts.gstatic.com'
      preconnect2.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect2)

      const fontLink = document.createElement('link')
      fontLink.rel = 'stylesheet'
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
      document.head.appendChild(fontLink)
    }
  }, [])

  // --- Scroll handlers ---
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 60)
      setScrollTopVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // --- Intersection Observer for scroll animations ---
  useEffect(() => {
    const els = document.querySelectorAll('.lp .animate-on-scroll')
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'))
      return
    }
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // --- Click outside auth dropdown ---
  useEffect(() => {
    if (!showAuth) return
    const handler = (e: MouseEvent) => {
      if (
        authRef.current &&
        !authRef.current.contains(e.target as Node) &&
        authBtnRef.current &&
        !authBtnRef.current.contains(e.target as Node)
      ) {
        setShowAuth(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showAuth])

  // --- Close mobile menu on resize ---
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // --- Smooth scroll helper ---
  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '#') return
    const target = document.querySelector(href)
    if (target) {
      e.preventDefault()
      const navH = navbarRef.current?.offsetHeight || 68
      const pos = target.getBoundingClientRect().top + window.scrollY - navH - 16
      window.scrollTo({ top: pos, behavior: 'smooth' })
    }
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // --- Auth handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn({
        username: email,
        password,
        options: { authFlowType: 'USER_PASSWORD_AUTH' }
      })
      if (result.isSignedIn) {
        setShowAuth(false)
        onLogin()
      }
    } catch (err: unknown) {
      const ex = err as { message?: string }
      setError(ex.message || t('lpAuthError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } }
      })
      setAuthMode('confirm')
    } catch (err: unknown) {
      const ex = err as { message?: string }
      setError(ex.message || t('lpSignupError'))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      setSuccess(t('lpVerified'))
      setAuthMode('login')
      setCode('')
      setPassword('')
    } catch (err: unknown) {
      const ex = err as { message?: string }
      setError(ex.message || t('lpInvalidCode'))
    } finally {
      setLoading(false)
    }
  }

  // --- Reusable SVG: check icon for feature tags / pricing ---
  const CheckSvg = ({ size = 10, sw = 3 }: { size?: number; sw?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )

  return (
    <div className="lp">
      <style>{LANDING_CSS}</style>

      {/* ==================== NAVBAR ==================== */}
      <header className={`navbar${navScrolled ? ' scrolled' : ''}`} ref={navbarRef} role="banner">
        <div className="container">
          <nav className="navbar-inner" aria-label={t('lpMainNav')}>
            {/* Logo */}
            <a className="navbar-logo" href="#" aria-label={t('lpAutoPostHome')} onClick={e => { e.preventDefault(); scrollToTop() }}>
              <div className="navbar-logo-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="navbar-logo-text">Auto<span>Post</span></span>
            </a>

            {/* Desktop nav */}
            <ul className="navbar-nav" role="list">
              <li><a href="#features" onClick={e => smoothScroll(e, '#features')}>{t('lpFeatures')}</a></li>
              <li><a href="#how-it-works" onClick={e => smoothScroll(e, '#how-it-works')}>{t('lpHowItWorks')}</a></li>
              <li><a href="#pricing" onClick={e => smoothScroll(e, '#pricing')}>{t('lpPricing')}</a></li>
            </ul>

            {/* Actions */}
            <div className="navbar-actions">
              <button
                ref={authBtnRef}
                className="btn btn-primary navbar-cta"
                onClick={() => setShowAuth(v => !v)}
                type="button"
              >
                {t('lpAuth')}
              </button>
              <button
                className={`menu-toggle${mobileMenuOpen ? ' active' : ''}`}
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label={t('lpOpenMenu')}
                aria-expanded={mobileMenuOpen}
                type="button"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              {/* Auth Dropdown */}
              {showAuth && (
                <>
                  <div className="auth-dropdown-overlay" onClick={() => setShowAuth(false)} />
                  <div className="auth-dropdown" ref={authRef}>
                    <h3>
                      {authMode === 'login' && t('lpLoginTitle')}
                      {authMode === 'signup' && t('lpSignupTitle')}
                      {authMode === 'confirm' && t('lpConfirmTitle')}
                    </h3>

                    {success && <div className="auth-success">{success}</div>}
                    {error && <div className="auth-error">{error}</div>}

                    {authMode === 'confirm' && (
                      <form onSubmit={handleConfirm}>
                        <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
                          {t('lpVerifSent1')} <strong style={{ color: '#F1F5F9' }}>{email}</strong>{t('lpVerifSent2')}
                        </p>
                        <div style={{ marginBottom: 20 }}>
                          <label>{t('lpVerifCode')}</label>
                          <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder="123456"
                            style={{ letterSpacing: '0.2em', textAlign: 'center' }}
                          />
                        </div>
                        <button type="submit" disabled={loading} className="auth-submit-btn">
                          {loading ? t('lpVerifying') : t('lpVerifyCode')}
                        </button>
                      </form>
                    )}

                    {(authMode === 'login' || authMode === 'signup') && (
                      <form onSubmit={authMode === 'login' ? handleLogin : handleSignUp}>
                        <div style={{ marginBottom: 16 }}>
                          <label>Email</label>
                          <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                          <label>
                            {t('lpPassword')} {authMode === 'signup' && <span style={{ color: '#64748B', fontWeight: 400 }}>{t('lpMinChars')}</span>}
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" disabled={loading} className="auth-submit-btn">
                          {loading
                            ? (authMode === 'login' ? t('lpLoggingIn') : t('lpCreatingAccount'))
                            : (authMode === 'login' ? t('lpLoginTitle') : t('lpCreateAccount'))
                          }
                        </button>
                      </form>
                    )}

                    {authMode !== 'confirm' && (
                      <div className="auth-toggle">
                        {authMode === 'login' ? (
                          <>{t('lpNoAccount')}{' '}
                            <button onClick={() => { setAuthMode('signup'); setError(''); setSuccess('') }} type="button">
                              {t('lpSignupFree')}
                            </button>
                          </>
                        ) : (
                          <>{t('lpHaveAccount')}{' '}
                            <button onClick={() => { setAuthMode('login'); setError(''); setSuccess('') }} type="button">
                              {t('lpLoginTitle')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      <nav className={`mobile-menu${mobileMenuOpen ? ' open' : ''}`} aria-label={t('lpMobileMenu')}>
        <a href="#features" onClick={e => { smoothScroll(e, '#features'); setMobileMenuOpen(false) }}>{t('lpFeatures')}</a>
        <a href="#how-it-works" onClick={e => { smoothScroll(e, '#how-it-works'); setMobileMenuOpen(false) }}>{t('lpHowItWorks')}</a>
        <a href="#pricing" onClick={e => { smoothScroll(e, '#pricing'); setMobileMenuOpen(false) }}>{t('lpPricing')}</a>
        <a href="#" onClick={e => { e.preventDefault(); setMobileMenuOpen(false); setShowAuth(true) }}>{t('lpAuth')}</a>
      </nav>

      <main>
        {/* ==================== HERO ==================== */}
        <section className="hero" id="hero" aria-label={t('lpHeroSection')}>
          <div className="hero-grid-overlay" aria-hidden="true"></div>
          <div className="container">
            <div className="hero-inner">
              {/* Left: Content */}
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    {t('lpBadge')}
                  </span>
                </div>

                <h1 className="hero-title">
                  {t('lpHeroTitle1')}<br />
                  <span className="highlight">Facebook &amp; Instagram</span><br />
                  {t('lpHeroTitle2')}
                </h1>

                <p className="hero-subtitle">
                  {t('lpHeroSubtitle')}
                </p>

                <div className="hero-actions">
                  <a className="btn btn-primary btn-lg" href="#pricing" onClick={e => smoothScroll(e, '#pricing')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    {t('lpStartFree')}
                  </a>
                  <a className="btn btn-secondary btn-lg" href="#how-it-works" onClick={e => smoothScroll(e, '#how-it-works')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {t('lpSeeDemo')}
                  </a>
                </div>

                <div className="hero-trust" aria-label={t('lpActiveUsers')}>
                  <div className="hero-trust-dots" aria-hidden="true">
                    <div className="hero-trust-dot">A</div>
                    <div className="hero-trust-dot">M</div>
                    <div className="hero-trust-dot">R</div>
                    <div className="hero-trust-dot">+</div>
                  </div>
                  <span>{t('lpUsedBy')} <strong>{t('lpStoresFromRo')}</strong></span>
                </div>
              </div>

              {/* Right: Mockup */}
              <div className="hero-mockup" aria-label={t('lpAppPreview')} aria-hidden="true">
                <div className="mockup-window">
                  <div className="mockup-topbar">
                    <div className="mockup-dots">
                      <div className="mockup-dot red"></div>
                      <div className="mockup-dot yellow"></div>
                      <div className="mockup-dot green"></div>
                    </div>
                    <div className="mockup-url-bar">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      app.autopost.ro/dashboard
                    </div>
                  </div>
                  <div className="mockup-body">
                    <div className="mockup-header">
                      <div className="mockup-title">{t('lpTemplates')}</div>
                      <div className="mockup-btn-sm">{t('lpNewPost')}</div>
                    </div>

                    <div className="mockup-grid">
                      <div className="mockup-card">
                        <div className="mockup-card-img"></div>
                        <div className="mockup-card-info">
                          <div className="mockup-card-label">{t('lpPromotion')}</div>
                          <div className="mockup-card-name">Flash Sale</div>
                        </div>
                      </div>
                      <div className="mockup-card">
                        <div className="mockup-card-img"></div>
                        <div className="mockup-card-info">
                          <div className="mockup-card-label">{t('lpProduct')}</div>
                          <div className="mockup-card-name">Product Spotlight</div>
                        </div>
                      </div>
                      <div className="mockup-card">
                        <div className="mockup-card-img"></div>
                        <div className="mockup-card-info">
                          <div className="mockup-card-label">{t('lpSeason')}</div>
                          <div className="mockup-card-name">Spring Sale</div>
                        </div>
                      </div>
                    </div>

                    <div className="mockup-schedule">
                      <div className="mockup-schedule-label">{t('lpWeeklySchedule')}</div>
                      <div className="mockup-schedule-items">
                        <div className="mockup-schedule-item">
                          <div className="mockup-schedule-time">09:00</div>
                          <div className="mockup-schedule-bar">
                            <div className="mockup-schedule-fill" style={{ width: '100%' }}></div>
                          </div>
                          <div className="mockup-schedule-status done"></div>
                        </div>
                        <div className="mockup-schedule-item">
                          <div className="mockup-schedule-time">13:30</div>
                          <div className="mockup-schedule-bar">
                            <div className="mockup-schedule-fill" style={{ width: '70%' }}></div>
                          </div>
                          <div className="mockup-schedule-status pending"></div>
                        </div>
                        <div className="mockup-schedule-item">
                          <div className="mockup-schedule-time">18:00</div>
                          <div className="mockup-schedule-bar">
                            <div className="mockup-schedule-fill" style={{ width: '0%' }}></div>
                          </div>
                          <div className="mockup-schedule-status queued"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== LOGOS BAR ==================== */}
        <section className="logos-bar" aria-label={t('lpCompatiblePlatforms')}>
          <div className="container">
            <div className="logos-bar-inner">
              <p className="logos-bar-label">{t('lpWorksWithPlatforms')}</p>
              <ul className="logos-list animate-on-scroll" role="list">
                <li>
                  <div className="logo-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#96BF48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      <polyline points="16 16 12 12 8 16" />
                    </svg>
                    <span className="logo-item-name">Shopify</span>
                  </div>
                </li>
                <li>
                  <div className="logo-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7F54B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span className="logo-item-name">WooCommerce</span>
                  </div>
                </li>
                <li>
                  <div className="logo-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="logo-item-name">Extended CMS</span>
                  </div>
                </li>
                <li>
                  <div className="logo-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <span className="logo-item-name">Facebook</span>
                  </div>
                </li>
                <li>
                  <div className="logo-item">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                    <span className="logo-item-name">Instagram</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section className="features" id="features" aria-label={t('lpMainFeatures')}>
          <div className="container">
            <header className="section-header">
              <span className="section-label animate-on-scroll">{t('lpFeaturesLabel')}</span>
              <h2 className="section-title animate-on-scroll delay-1">{t('lpFeaturesTitle').split('\n')[0]}<br />{t('lpFeaturesTitle').split('\n')[1]}</h2>
              <p className="section-subtitle animate-on-scroll delay-2">{t('lpFeaturesSubtitle')}</p>
            </header>

            <div className="features-grid">
              {/* Card 1 */}
              <article className="feature-card animate-on-scroll" tabIndex={0}>
                <div className="feature-card-glow" aria-hidden="true"></div>
                <div className="feature-icon-wrap" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <h3 className="feature-card-title">{t('lpPostCreator')}</h3>
                <p className="feature-card-desc">
                  {t('lpPostCreatorDesc')}
                </p>
                <ul className="feature-tags" role="list">
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTag22Templates')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagDragDrop')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagExport')}</span></li>
                </ul>
              </article>

              {/* Card 2 */}
              <article className="feature-card animate-on-scroll delay-1" tabIndex={0}>
                <div className="feature-card-glow" aria-hidden="true"></div>
                <div className="feature-icon-wrap" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3 className="feature-card-title">{t('lpAutoScheduling')}</h3>
                <p className="feature-card-desc">
                  {t('lpAutoSchedulingDesc')}
                </p>
                <ul className="feature-tags" role="list">
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagVisualCalendar')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagMultipleTimes')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagStatusNotif')}</span></li>
                </ul>
              </article>

              {/* Card 3 */}
              <article className="feature-card animate-on-scroll delay-2" tabIndex={0}>
                <div className="feature-card-glow" aria-hidden="true"></div>
                <div className="feature-icon-wrap" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </div>
                <h3 className="feature-card-title">{t('lpFbIgTitle')}</h3>
                <p className="feature-card-desc">
                  {t('lpFbIgDesc')}
                </p>
                <ul className="feature-tags" role="list">
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagFeedStories')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagMultiAccount')}</span></li>
                  <li><span className="feature-tag"><CheckSvg /> {t('lpTagAnalytics')}</span></li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="how-it-works" id="how-it-works" aria-label={t('lpHowItWorks')}>
          <div className="container">
            <header className="section-header">
              <span className="section-label animate-on-scroll">{t('lpSimpleProcess')}</span>
              <h2 className="section-title animate-on-scroll delay-1">{t('lpStepsTitle').split('\n')[0]}<br />{t('lpStepsTitle').split('\n')[1]}</h2>
              <p className="section-subtitle animate-on-scroll delay-2">{t('lpStepsSubtitle')}</p>
            </header>

            <div className="steps-container">
              {/* Connector line between steps */}
              <div className="steps-connector" aria-hidden="true">
                <div className="steps-connector-line"></div>
              </div>

              {/* Step 1 */}
              <article className="step-item animate-on-scroll">
                <div className="step-number">
                  <div className="step-number-inner">1</div>
                </div>
                <div>
                  <h3 className="step-title">{t('lpStep1Title')}</h3>
                  <p className="step-desc">{t('lpStep1Desc')}</p>
                  <div className="step-platform-icons" aria-label={t('lpSupportedPlatforms')}>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#96BF48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        <polyline points="16 16 12 12 8 16" />
                      </svg>
                      Shopify
                    </div>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7F54B3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      WooCommerce
                    </div>
                  </div>
                </div>
              </article>

              {/* Step 2 */}
              <article className="step-item animate-on-scroll delay-2">
                <div className="step-number">
                  <div className="step-number-inner">2</div>
                </div>
                <div>
                  <h3 className="step-title">{t('lpStep2Title')}</h3>
                  <p className="step-desc">{t('lpStep2Desc')}</p>
                  <div className="step-platform-icons" aria-label={t('lpTemplateOptions')}>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      {t('lpTag22Templates')}
                    </div>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {t('lpCustomHours')}
                    </div>
                  </div>
                </div>
              </article>

              {/* Step 3 */}
              <article className="step-item animate-on-scroll delay-3">
                <div className="step-number">
                  <div className="step-number-inner">3</div>
                </div>
                <div>
                  <h3 className="step-title">{t('lpStep3Title')}</h3>
                  <p className="step-desc">{t('lpStep3Desc')}</p>
                  <div className="step-platform-icons" aria-label={t('lpSocialNetworks')}>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                      Facebook
                    </div>
                    <div className="step-platform-icon">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                      Instagram
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ==================== STATS BAR ==================== */}
        <section className="stats-bar" aria-label={t('lpKeyStats')}>
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item stat-divider animate-on-scroll">
                <div className="stat-value">
                  <span className="stat-accent">22+</span>
                </div>
                <div className="stat-label">{t('lpStatTemplates')}</div>
                <div className="stat-sublabel">{t('lpStatTemplatesSub')}</div>
              </div>
              <div className="stat-item stat-divider animate-on-scroll delay-2">
                <div className="stat-value">
                  <span className="stat-accent">100%</span>
                </div>
                <div className="stat-label">{t('lpStatAutomatic')}</div>
                <div className="stat-sublabel">{t('lpStatAutomaticSub')}</div>
              </div>
              <div className="stat-item animate-on-scroll delay-3">
                <div className="stat-value">
                  <span className="stat-accent">2</span>
                </div>
                <div className="stat-label">Facebook &amp; Instagram</div>
                <div className="stat-sublabel">{t('lpStatPlatformsSub')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== PRICING ==================== */}
        <section className="pricing" id="pricing" aria-label={t('lpPricingPlans')}>
          <div className="container">
            <header className="section-header">
              <span className="section-label animate-on-scroll">{t('lpPricingLabel')}</span>
              <h2 className="section-title animate-on-scroll delay-1">{t('lpPricingTitle')}</h2>
              <p className="section-subtitle animate-on-scroll delay-2">{t('lpPricingSubtitle')}</p>
            </header>

            <div className="pricing-grid">
              {/* Starter */}
              <article className="pricing-card animate-on-scroll" tabIndex={0}>
                <div className="pricing-plan-name">Starter</div>
                <div className="pricing-price">
                  <span className="pricing-currency">&euro;</span>
                  <span className="pricing-amount">29</span>
                  <span className="pricing-period">{t('lpPerMonth')}</span>
                </div>
                <p className="pricing-desc">{t('lpStarterDesc')}</p>

                <div className="pricing-separator" aria-hidden="true"></div>

                <ul className="pricing-features" role="list">
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpF10Templates')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpF1Account')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpF30Posts')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAutoSchedule')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFShopifyWoo')}
                  </li>
                  <li className="pricing-feature disabled" aria-label={t('lpUnavailableStarter')}>
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAdvAnalytics')}
                  </li>
                  <li className="pricing-feature disabled" aria-label={t('lpUnavailableStarter')}>
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFPrioritySupport')}
                  </li>
                </ul>

                <a className="btn btn-secondary pricing-cta" href="#" role="button" onClick={e => e.preventDefault()}>
                  {t('lpStartTrial')}
                </a>
              </article>

              {/* Pro (featured) */}
              <article className="pricing-card featured animate-on-scroll delay-2" tabIndex={0}>
                <div className="pricing-badge" aria-label={t('lpRecommended')}>{t('lpPopular')}</div>
                <div className="pricing-plan-name">Pro</div>
                <div className="pricing-price">
                  <span className="pricing-currency">&euro;</span>
                  <span className="pricing-amount">79</span>
                  <span className="pricing-period">{t('lpPerMonth')}</span>
                </div>
                <p className="pricing-desc">{t('lpProDesc')}</p>

                <div className="pricing-separator" aria-hidden="true"></div>

                <ul className="pricing-features" role="list">
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAllTemplates')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpF5Accounts')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFUnlimitedPosts')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAdvScheduleReels')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAllPlatforms')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFAdvAnalyticsExport')}
                  </li>
                  <li className="pricing-feature">
                    <CheckSvg size={18} sw={2.5} />
                    {t('lpFPrioritySupport247')}
                  </li>
                </ul>

                <a className="btn btn-primary pricing-cta" href="#" role="button" onClick={e => e.preventDefault()}>
                  {t('lpChoosePro')}
                </a>
              </article>
            </div>

            {/* Pricing note */}
            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 14, color: 'var(--text-muted)' }} className="animate-on-scroll">
              {t('lpPricingNote')}
            </p>
          </div>
        </section>

        {/* ==================== CTA FINAL ==================== */}
        <section className="cta-final" aria-label={t('lpCtaFinal')}>
          {/* Decorative circles */}
          <div className="cta-decor cta-decor-1" aria-hidden="true"></div>
          <div className="cta-decor cta-decor-2" aria-hidden="true"></div>
          <div className="cta-decor cta-decor-3" aria-hidden="true"></div>

          <div className="container">
            <div className="cta-final-inner">
              <h2 className="cta-final-title animate-on-scroll">
                {t('lpCtaTitle').split('\n')[0]}<br />{t('lpCtaTitle').split('\n')[1]}
              </h2>
              <p className="cta-final-subtitle animate-on-scroll delay-1">
                {t('lpCtaSubtitle')}
              </p>
              <div className="cta-final-actions animate-on-scroll delay-2">
                <a className="btn btn-white btn-lg" href="#pricing" onClick={e => smoothScroll(e, '#pricing')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {t('lpStartFreeNow')}
                </a>
              </div>
              <p className="cta-final-note animate-on-scroll delay-3">{t('lpCtaNote')}</p>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-inner">
            {/* Brand */}
            <div className="footer-brand">
              <a className="navbar-logo" href="#" aria-label={t('lpAutoPostHome')} onClick={e => { e.preventDefault(); scrollToTop() }}>
                <div className="navbar-logo-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="navbar-logo-text">Auto<span>Post</span></span>
              </a>
              <p className="footer-brand-desc">
                {t('lpFooterDesc')}
              </p>
              <div className="footer-social" aria-label={t('lpFooterSocial')}>
                <a className="footer-social-link" href="#" aria-label="Facebook AutoPost" onClick={e => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a className="footer-social-link" href="#" aria-label="Instagram AutoPost" onClick={e => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a className="footer-social-link" href="#" aria-label="LinkedIn AutoPost" onClick={e => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Produs */}
            <nav aria-label={t('lpFooterProductLinks')}>
              <p className="footer-col-title">{t('lpFooterProduct')}</p>
              <ul className="footer-links" role="list">
                <li><a href="#features" onClick={e => smoothScroll(e, '#features')}>{t('lpFooterFeatures')}</a></li>
                <li><a href="#pricing" onClick={e => smoothScroll(e, '#pricing')}>{t('lpPricing')}</a></li>
                <li><a href="#how-it-works" onClick={e => smoothScroll(e, '#how-it-works')}>{t('lpFooterHowItWorks')}</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Roadmap</a></li>
              </ul>
            </nav>

            {/* Resurse */}
            <nav aria-label={t('lpFooterResourceLinks')}>
              <p className="footer-col-title">{t('lpFooterResources')}</p>
              <ul className="footer-links" role="list">
                <li><a href="#">{t('lpFooterDocs')}</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">{t('lpFooterTutorials')}</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </nav>

            {/* Companie */}
            <nav aria-label={t('lpFooterCompanyLinks')}>
              <p className="footer-col-title">{t('lpFooterCompany')}</p>
              <ul className="footer-links" role="list">
                <li><a href="#">{t('lpFooterAbout')}</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">{t('lpFooterTerms')}</a></li>
                <li><a href="#">{t('lpFooterPrivacy')}</a></li>
                <li><a href="#">GDPR</a></li>
              </ul>
            </nav>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              {t('lpFooterCopyright')}
            </p>
            <nav className="footer-bottom-links" aria-label={t('lpFooterLegal')}>
              <a href="#">{t('lpFooterTermsShort')}</a>
              <a href="#">{t('lpFooterPrivacyShort')}</a>
              <a href="#">Cookies</a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <button
        className={`scroll-top${scrollTopVisible ? ' visible' : ''}`}
        aria-label={t('lpBackToTop')}
        onClick={scrollToTop}
        type="button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  )
}
