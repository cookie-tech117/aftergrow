"use client";

import { useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { HOME_TOUR_STEPS, tourLayout, type TourRect } from './tour';
import s from './tour.module.css';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
type Props = {
  step: number; day: number; onStep: (step: number) => void; onFinish: () => void;
  root: RefObject<HTMLDivElement | null>; scroll: RefObject<HTMLDivElement | null>;
};

export default function HomeTour({ step, day, onStep, onFinish, root, scroll }: Props) {
  const maskId = useId().replace(/:/g, '');
  const panel = useRef<HTMLDivElement>(null), next = useRef<HTMLButtonElement>(null);
  const [geometry, setGeometry] = useState<{ width: number; height: number; highlight: TourRect | null; panel: { x: number; y: number; width: number } } | null>(null);
  const info = HOME_TOUR_STEPS[step] || HOME_TOUR_STEPS[1];

  useLayoutEffect(() => {
    const container = root.current, scroller = scroll.current;
    if (!container || !scroller) return;
    const background = scroller as HTMLDivElement & { inert: boolean };
    background.inert = true;
    const nav = container.closest('.phone-app')?.querySelector<HTMLElement>('.bottom-nav');
    if (nav) nav.inert = true;
    const bounds = () => {
      const r = container.getBoundingClientRect();
      return { r, width: r.width, height: nav ? Math.min(r.height, nav.getBoundingClientRect().top - r.top + 16 * r.width / 394) : r.height - 58 };
    };
    const target = () => container.querySelector<HTMLElement>(`[data-home-tour="${info.id}"]`);
    const reveal = () => {
      const { height, width } = bounds(), element = target(), unit = width / 393;
      if (step <= 2) scroller.scrollTo({ top: 0, behavior: 'instant' });
      else if (element) {
        const r = element.getBoundingClientRect(), top = r.top - container.getBoundingClientRect().top;
        const wanted = Math.max(270 * unit, height - r.height - 30 * unit);
        scroller.scrollTo({ top: scroller.scrollTop + top - wanted, behavior: 'instant' });
      }
    };
    const measure = () => {
      const { r, width, height } = bounds(), element = target(), e = element?.getBoundingClientRect();
      const rect = e ? { x: e.left - r.left, y: e.top - r.top, width: e.width, height: e.height } : null;
      setGeometry({ width, height, ...tourLayout(step, width, height, rect, panel.current?.offsetHeight || 154 * width / 393) });
    };
    reveal(); measure(); next.current?.focus({ preventScroll: true });
    const observer = new ResizeObserver(() => { reveal(); measure(); });
    observer.observe(container); if (panel.current) observer.observe(panel.current);
    if (nav) observer.observe(nav);
    scroller.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const previous = document.activeElement;
    return () => {
      observer.disconnect(); scroller.removeEventListener('scroll', measure); window.removeEventListener('resize', measure);
      background.inert = false; if (nav) nav.inert = false;
      if (previous instanceof HTMLElement && previous.isConnected && !panel.current?.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, [step, info.id, root, scroll]);

  const advance = () => step === 4 ? onFinish() : onStep(step + 1);
  const trapKeys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onFinish(); }
    if (e.key === 'Tab') {
      const buttons = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); }
    }
  };

  if (step === 0) return <section className={s.streak} role="dialog" aria-modal="true" aria-label="Daily recovery streak" onKeyDown={trapKeys}>
    <div className={s.streakHero}><div className={s.rays} aria-hidden="true"/><img src={`${BASE}/assets/home/tour-streak.webp`} alt="Lin welcomes your recovery journey"/><strong>{day}</strong><h1>DAY RECOVERY STREAK</h1></div>
    <div className={s.week} aria-label={`${Math.min(day, 7)} of 7 recovery days`}>
      {['M','T','W','T','F','S','S'].map((label, i) => <div key={i}><small>{label}</small><span className={i === Math.min(day - 1, 6) ? s.currentDay : i < day - 1 ? s.pastDay : ''}>{i < day - 1 ? '✓' : i === Math.min(day - 1, 6) ? Math.min(day, 7) : ''}</span></div>)}
    </div>
    <p>Day {day} of 7 of Recovery. Keep a gentle<br/>rhythm to help your island clear the fog.</p>
    <button ref={next} type="button" onClick={advance}>Let’s go</button>
  </section>;

  return <div className={s.overlay} role="dialog" aria-modal="true" aria-label="Explore your recovery space" aria-describedby={`tour-copy-${maskId}`} onKeyDown={trapKeys}>
    {geometry && <svg className={s.shade} width="100%" height="100%" aria-hidden="true">
      <defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={geometry.width} height={geometry.height}><rect width={geometry.width} height={geometry.height} fill="white"/>{geometry.highlight && <rect {...geometry.highlight} rx={14 * geometry.width / 393} fill="black"/>}</mask></defs>
      <rect width={geometry.width} height={geometry.height} fill="#344532" fillOpacity=".52" mask={`url(#${maskId})`}/>
      {geometry.highlight && <rect {...geometry.highlight} rx={14 * geometry.width / 393} fill="none" stroke="#eff9db" strokeWidth="2"/>}
    </svg>}
    <div ref={panel} className={`${s.panel} ${step === 1 ? s.welcome : s.detail}`} style={{ left: geometry?.panel.x, top: geometry?.panel.y ?? '43%', width: geometry?.panel.width }}>
      <img className={s.lin} src={`${BASE}/assets/home/tour-${info.id}.webp`} alt=""/>
      <p id={`tour-copy-${maskId}`} aria-live="polite">{info.copy}</p>
      <div className={s.actions}><button type="button" onClick={onFinish}>Skip</button><button ref={next} type="button" onClick={advance}>{info.action}</button></div>
      <span className={s.srOnly}>Step {step} of 4</span>
    </div>
  </div>;
}
