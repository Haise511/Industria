import { useEffect } from 'react'
import type { ApiNotification } from '../api'
import { PrimaryButton } from './PrimaryButton'
import { haptic } from '../telegram'
import './NotificationSheet.css'

interface Props {
  notification: ApiNotification | null
  onClose: () => void
  onCta?: (n: ApiNotification) => void
}

function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.16)" />
      <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function NotificationSheet({ notification, onClose, onCta }: Props) {
  // Close on ESC for desktop testing
  useEffect(() => {
    if (!notification) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [notification, onClose])

  if (!notification) return null

  const handleClose = () => { haptic('light'); onClose() }
  const handleCta = () => {
    haptic('light')
    if (onCta) onCta(notification)
    else onClose()
  }

  return (
    <div className="nsheet-overlay" onClick={handleClose}>
      <div
        className="nsheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="nsheet-close" onClick={handleClose} aria-label="Закрыть">
          <CloseGlyph />
          <span>Закрыть</span>
        </button>

        <h2 className="nsheet-title">{notification.title ?? notification.text}</h2>
        {notification.body && <p className="nsheet-body">{notification.body}</p>}

        <div className="nsheet-cta">
          <PrimaryButton onClick={handleCta}>Подробнее</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
