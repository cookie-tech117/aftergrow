"use client";

import { useRef, type CSSProperties, type ReactNode } from 'react';
import type { StarterGoal } from '../onboarding/flow';
import { HOME_WEATHER, nextWeather, type IslandWeather } from './weather';
import styles from './home.module.css';
import HomeTour from './HomeTour';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function HomeIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    breathing: <><path d="M3 9h11c5 0 5-6 1-6-2 0-3 1-3 2M3 13h16M3 17h10c4 0 4 5 1 5-2 0-2-1-2-2" /><circle cx="21" cy="13" r=".4" /></>,
    stretch: <><path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3" /><circle cx="12" cy="12" r="2" /></>,
    focus: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="3" /></>,
    check: <><path d="M12 5v17M12 6C8 3 4 4 2 5v15c4-2 8-1 10 1 2-2 6-3 10-1V5c-4-2-8-1-10 1Z" /></>,
    water: <><path d="M9 2c0 5 5 6 5 10a5 5 0 0 1-10 0c0-2 2-5 5-10Z" /><path d="M16 5c1 3 5 5 5 8a4 4 0 0 1-5 4M7 12c0 1 1 2 2 2M11 21h5" /></>,
    star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" /></>,
    rain: <><path d="M5 14a4 4 0 1 1 1-8 6 6 0 0 1 11 1 4 4 0 1 1 2 7H5ZM7 18l-1 3M12 18l-1 3M17 18l-1 3" /></>,
    snow: <><path d="M12 1v22M2 6l20 12M2 18 22 6M9 3l3 3 3-3M9 21l3-3 3 3M3 9l4-1-1-4M21 15l-4 1 1 4M3 15l4 1-1 4M21 9l-4-1 1-4" /></>,
    fog: <><path d="M3 7h18M5 12h14M2 17h20M8 22h8" /></>,
    sunrise: <><path d="M2 17h20M3 21h18M6 17a6 6 0 0 1 12 0M12 1v5M3 7l3 3M21 7l-3 3M1 12h3M20 12h3" /></>,
    night: <><path d="M19 15A8 8 0 0 1 9 4 9 9 0 1 0 19 15Z" /><path d="M18 2v5M15.5 4.5h5" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.star}</svg>;
}

type Props = {
  name: string;
  day: number;
  weather: IslandWeather;
  totalExp: number;
  goals: StarterGoal[];
  completed: string[];
  scene: ReactNode;
  onWeather: () => void;
  onDecorate: () => void;
  onTalk: () => void;
  onGoal: (id: string, label: string) => void;
  onAddGoal: () => void;
  tourStep?: number;
  onTourStep?: (step: number) => void;
  onTourFinish?: () => void;
};

export default function HomeDashboard({ name, day, weather, totalExp, goals, completed, scene, onWeather, onDecorate, onTalk, onGoal, onAddGoal, tourStep = -1, onTourStep, onTourFinish }: Props) {
  const rootRef = useRef<HTMLDivElement>(null), scrollRef = useRef<HTMLDivElement>(null);
  const weatherSettings = HOME_WEATHER[weather];
  const remaining = goals.filter((goal) => !completed.includes(goal.id)).length;
  const currentExp = totalExp % 20;
  const level = Math.floor(totalExp / 20) + 1;
  return <div ref={rootRef} className={`screen ${styles.root}`} data-weather={weather} style={{ background: weatherSettings.background, '--weather-particle': weatherSettings.particle } as CSSProperties}>
    <div ref={scrollRef} className={styles.scroll}>
      <header className={styles.greeting}>
        <button className={styles.avatar} type="button" aria-label="Talk with Lin" onClick={onTalk}><img src={`${BASE_PATH}/assets/home/lin-avatar.webp`} alt="Lin" /></button>
        <div className={styles.greetingCard}><h1>Good morning, {name}</h1><p>Day {day} of Recovery. {weatherSettings.message}</p></div>
      </header>

      <section className={styles.islandArea} aria-label="Your living island">
        <button className={styles.weatherButton} type="button" onClick={onWeather} aria-label={`Weather: ${weatherSettings.label}. Switch to ${HOME_WEATHER[nextWeather(weather)].label}`} title={`Switch weather to ${HOME_WEATHER[nextWeather(weather)].label}`}><HomeIcon name={weather === 'sunny' ? 'sun' : weather} /><span aria-live="polite">{weatherSettings.label}</span><span className={styles.cycle} aria-hidden="true">↻</span></button>
        <button data-home-tour="island" className={styles.island} type="button" onClick={onDecorate} aria-label="Open your interactive 3D Heart Island">
          {scene}
          <div className={styles.motes} aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
          {(weather === 'rain' || weather === 'snow') && <div className={`${styles.precipitation} ${weather === 'rain' ? styles.rain : styles.snow}`} aria-hidden="true">{Array.from({ length: 30 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>}
          {weather === 'fog' && <div className={styles.fog} aria-hidden="true"><i /><i /><i /></div>}
        </button>
        <button className={styles.decorate} type="button" onClick={onDecorate}><span aria-hidden="true">★</span> Decorate</button>
      </section>

      <section className={styles.level} aria-label={`Island level ${level}. ${currentExp} out of 20 EXP`}>
        <div className={styles.levelHeading}><h2><HomeIcon name="star" />Island Lv. {level}</h2><span>{currentExp} / 20 EXP</span></div>
        <div className={styles.progress} role="progressbar" aria-label="Island experience" aria-valuemin={0} aria-valuemax={20} aria-valuenow={currentExp}><i style={{ width: `${currentExp * 5}%` }} /></div>
        <p>Complete goals to gain EXP and grow your island.</p>
      </section>

      <div className={styles.dailyHeading}><h2>Daily Goals</h2><span aria-live="polite">{remaining ? `${remaining} ${remaining === 1 ? 'goal' : 'goals'} left for today!` : 'A little brighter today ✓'}</span></div>
      <section className={styles.goals} aria-label="Daily recovery goals">
        <div data-home-tour="goals" className={styles.goalList}>{goals.slice(0, 3).map((goal) => {
          const done = completed.includes(goal.id);
          return <button className={`${styles.goal} ${done ? styles.done : ''}`} type="button" key={goal.id} onClick={() => onGoal(goal.id, goal.label)} aria-label={`${goal.title}, ${goal.minutes} minutes, ${done ? 'completed' : `${goal.exp} EXP`}`}>
            <span className={styles.goalIcon} data-kind={goal.id}><HomeIcon name={goal.id} /></span>
            <span className={styles.goalText}><strong>{goal.title}</strong><small>{goal.minutes} min · {goal.exp} EXP</small></span>
            <span className={styles.exp}>+{goal.exp}</span><span className={styles.check} aria-hidden="true">{done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 4 4 10-9" /></svg> : null}</span>
          </button>;
        })}</div>
        {goals.slice(3).map((goal) => {
          const done = completed.includes(goal.id);
          return <button className={`${styles.goal} ${done ? styles.done : ''}`} type="button" key={goal.id} onClick={() => onGoal(goal.id, goal.label)} aria-label={`${goal.title}, ${goal.minutes} minutes, ${done ? 'completed' : `${goal.exp} EXP`}`}>
            <span className={styles.goalIcon} data-kind={goal.id}><HomeIcon name={goal.id} /></span>
            <span className={styles.goalText}><strong>{goal.title}</strong><small>{goal.minutes} min · {goal.exp} EXP</small></span>
            <span className={styles.exp}>+{goal.exp}</span><span className={styles.check} aria-hidden="true">{done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 4 4 10-9" /></svg> : null}</span>
          </button>;
        })}
        <button data-home-tour="add" className={styles.addGoal} type="button" onClick={onAddGoal}><span aria-hidden="true">＋</span> Add a Goal</button>
      </section>
    </div>
    {tourStep >= 0 && onTourStep && onTourFinish && <HomeTour step={tourStep} day={day} root={rootRef} scroll={scrollRef} onStep={onTourStep} onFinish={() => { scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); onTourFinish(); }} />}
  </div>;
}
