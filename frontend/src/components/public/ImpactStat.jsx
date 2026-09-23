import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';

function asWholeNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? Math.round(numericValue) : null;
}

/**
 * A compact, viewport-triggered counter for the public impact indicators.
 * It only runs after the value is supplied by the public API and honours the
 * visitor's reduced-motion preference.
 */
export default function ImpactStat({ value, label, locale, icon: Icon, delay = 0 }) {
  const target = asWholeNumber(value);
  const hostRef = useRef(null);
  const frameRef = useRef();
  const timerRef = useRef();
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setIsVisible(true);
      observer.disconnect();
    }, { threshold: 0.22 });

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || target === null || typeof window === 'undefined') return undefined;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setDisplayValue(target);
      return undefined;
    }

    let startedAt;
    // A short linear ramp keeps the intermediate numbers visible instead of
    // jumping almost immediately to the final value.
    const duration = Math.min(2600, Math.max(850, target * 24));

    const draw = (timestamp) => {
      if (!startedAt) startedAt = timestamp;
      const progress = Math.min((timestamp - startedAt) / duration, 1);
      setDisplayValue(progress === 1 ? target : Math.floor(target * progress));
      if (progress < 1) frameRef.current = window.requestAnimationFrame(draw);
    };

    setDisplayValue(0);
    timerRef.current = window.setTimeout(() => {
      frameRef.current = window.requestAnimationFrame(draw);
    }, delay);

    return () => {
      window.clearTimeout(timerRef.current);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [delay, isVisible, target]);

  const formattedValue = target === null
    ? '—'
    : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(displayValue);

  return <Reveal as="div" className="stat-tile" delay={delay}>
    <span className="stat-tile__icon" aria-hidden="true">{Icon && <Icon size={24} strokeWidth={2} />}</span>
    <strong ref={hostRef} aria-label={target === null ? label : `${new Intl.NumberFormat(locale).format(target)} ${label}`}>
      <span aria-hidden="true">{formattedValue}</span>
    </strong>
    <small>{label}</small>
  </Reveal>;
}
