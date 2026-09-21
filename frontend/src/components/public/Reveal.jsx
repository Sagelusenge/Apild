import { useEffect } from 'react';
import './Reveal.css';

/**
 * Observes public blocks marked with data-reveal. New cards inserted after
 * API requests are picked up through MutationObserver, while every target is
 * unobserved once revealed so scrolling never replays the motion.
 */
export function useRevealObserver(rootRef, { rootMargin = '0px 0px -8% 0px', threshold = 0.08 } = {}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let observer;

    const reveal = (element) => {
      if (!element || element.dataset.revealed === 'true') return;
      element.dataset.revealed = 'true';
      element.classList.add('is-revealed');
      observer?.unobserve(element);
    };

    const targets = () => [...root.querySelectorAll('[data-reveal]:not([data-revealed])')];
    const reduceMotion = () => Boolean(motionQuery?.matches);
    const revealAll = () => targets().forEach(reveal);

    if ('IntersectionObserver' in window && !reduceMotion()) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { rootMargin, threshold });
    }

    const observeTargets = () => {
      if (reduceMotion() || !observer) {
        revealAll();
        return;
      }
      targets().forEach((element) => observer.observe(element));
    };

    const respectReducedMotion = (event) => {
      if (event.matches) {
        observer?.disconnect();
        revealAll();
      } else {
        observeTargets();
      }
    };

    const revealFocusedTarget = (event) => {
      const target = event.target.closest?.('[data-reveal]');
      if (target) reveal(target);
    };

    const mutationObserver = typeof window.MutationObserver === 'function'
      ? new window.MutationObserver(observeTargets)
      : null;
    observeTargets();
    mutationObserver?.observe(root, { childList: true, subtree: true });
    motionQuery?.addEventListener?.('change', respectReducedMotion);
    root.addEventListener('focusin', revealFocusedTarget);

    return () => {
      observer?.disconnect();
      mutationObserver?.disconnect();
      motionQuery?.removeEventListener?.('change', respectReducedMotion);
      root.removeEventListener('focusin', revealFocusedTarget);
    };
  }, [rootMargin, rootRef, threshold]);
}

export function PublicRevealObserver({ rootRef }) {
  useRevealObserver(rootRef);
  return null;
}

export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  direction = 'up',
  style,
  ...props
}) {
  const classes = ['reveal', className].filter(Boolean).join(' ');

  return <Tag
    {...props}
    data-reveal={direction}
    className={classes}
    style={{ '--reveal-delay': `${Math.max(0, delay)}ms`, ...style }}
  >
    {children}
  </Tag>;
}
