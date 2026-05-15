import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft2 } from 'iconsax-react'
import { haptic } from '../telegram'
import './BottomSheetShell.css'

const EXIT_MS = 220

interface Props {
  title?: ReactNode
  children: ReactNode
  cta?: ReactNode               // sticky bottom action (PrimaryButton etc.)
  onBack?: () => void           // override default nav(-1)
  onClose?: () => void          // override default nav('/feed')
  hideBack?: boolean
  closeTo?: string              // default close target (defaults to /feed)
}

function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="7" fill="rgba(255,255,255,0.18)" />
      <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function BottomSheetShell({ title, children, cta, onBack, onClose, hideBack, closeTo = '/feed' }: Props) {
  const nav = useNavigate()
  const [closing, setClosing] = useState(false)

  const triggerClose = () => {
    if (closing) return
    haptic('light')
    setClosing(true)
    window.setTimeout(() => onClose ? onClose() : nav(closeTo, { replace: true }), EXIT_MS)
  }
  const handleBack = () => {
    if (closing) return
    haptic('light')
    onBack ? onBack() : nav(-1)
  }

  // ESC closes the sheet (desktop testing convenience).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') triggerClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`bsheet-root${closing ? ' is-closing' : ''}`}>
      <div className="bsheet-backdrop" onClick={triggerClose} />
      <div className="bsheet" role="dialog" aria-modal="true">
        <div className="bsheet-pills">
          {!hideBack ? (
            <button className="bsheet-pill" onClick={handleBack}>
              <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
              <span>Назад</span>
            </button>
          ) : <span />}
          <button className="bsheet-pill" onClick={triggerClose}>
            <CloseGlyph />
            <span>Закрыть</span>
          </button>
        </div>

        {title !== undefined && (
          typeof title === 'string'
            ? <h1 className="bsheet-title">{title}</h1>
            : title
        )}

        <div className="bsheet-body">{children}</div>

        {cta && <div className="bsheet-cta">{cta}</div>}
      </div>
    </div>
  )
}
