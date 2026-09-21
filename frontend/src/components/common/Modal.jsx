import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

let scrollLockCount = 0;
let previousBodyStyles = null;

function lockDocumentScroll() {
  if (scrollLockCount === 0) {
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    previousBodyStyles = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight
    };
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  }

  scrollLockCount += 1;

  return () => {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount !== 0 || !previousBodyStyles) return;
    document.body.style.overflow = previousBodyStyles.overflow;
    document.body.style.paddingRight = previousBodyStyles.paddingRight;
    previousBodyStyles = null;
  };
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(focusableSelector)].filter((element) => !element.hasAttribute('hidden'));
}

export default function Modal({ open, title, onClose, children }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockDocumentScroll = lockDocumentScroll();
    const frame = window.requestAnimationFrame(() => {
      (closeButtonRef.current || dialogRef.current)?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusableElements = getFocusableElements(dialogRef.current);
      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      unlockDocumentScroll();
      previousActiveElementRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const close = () => onClose?.();
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Fenêtre de dialogue'} tabIndex={-1}>
        <header>
          {title && <h2 id={titleId}>{title}</h2>}
          <button ref={closeButtonRef} className="icon-button" type="button" onClick={close} aria-label="Fermer"><X /></button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>,
    document.body
  );
}
