"use client";

import { useEffect, useRef, useState } from 'react';
import { DATA_PERMISSIONS, INTRO_SLIDES, QUESTIONS, WATCHES, starterPlan, type RecoveryProfile } from './flow';
import styles from './onboarding.module.css';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const art = (name: string) => `${BASE_PATH}/assets/onboarding/${name}.webp`;
const DEVICE_KEY = 'afterglow-device-preferences-v1';

function Art({ name, className = '', alt = '' }: { name: string; className?: string; alt?: string }) {
  return <img className={className} src={art(name)} alt={alt} draggable={false} />;
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    activity: <><circle cx="14" cy="4" r="2" /><path d="m10 9 3-2 3 4 4 1M6 12l4-3 2 6-5 6m5-6 4 6M4 6l3 2" /></>,
    heart: <><path d="M12 21S3 16 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 12-9 12Z" /><path d="M5 12h4l2-4 3 8 2-4h3" /></>,
    moon: <><path d="M18 16A8 8 0 0 1 9 5 8 8 0 1 0 18 16Z" /><path d="M15 4h5l-5 5h5" /></>,
    clock: <><circle cx="12" cy="13" r="8" /><path d="M12 8v5l3 2M10 2h4M4 5l-2 2" /></>,
    flame: <><path d="M13 2s1 6-3 9c0-3-2-4-2-4s-4 6-4 10a8 8 0 0 0 16 0c0-5-3-8-3-8s-1 5-3 6c-2-3-1-8-1-13Z" /></>,
    mountain: <><path d="m2 20 7-15 5 10 3-7 6 12ZM6 12l3 2 3-2M15 14l2 2 2-1" /></>,
    water: <><path d="M3 3v14M7 3v14M3 7h4M3 12h4M2 21q3-3 6 0 3-3 6 0 3-3 8 0M11 12h10M12 8h2M17 8h2" /></>,
    dumbbell: <><path d="m5 3 4 4-3 3-4-4m13 8 4 4 3-3-4-4M7 9l8 8M3 10l7-7m4 18 7-7" /></>,
    other: <><path d="m12 2 10 10-10 10L2 12Z" /><path d="M8 12h8M12 8v8" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.activity}</svg>;
}

type Props = {
  step: number;
  setStep: (step: number) => void;
  finish: () => void;
  profile: RecoveryProfile;
  updateProfile: (update: Partial<RecoveryProfile>) => void;
};

export default function Onboarding({ step, setStep, finish, profile, updateProfile }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedWatch, setSelectedWatch] = useState('');
  const [permissions, setPermissions] = useState([true, true, false, false, true]);
  const [accountNote, setAccountNote] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (step !== 12) return;
    const timer = window.setTimeout(() => setStep(13), 2400);
    return () => window.clearTimeout(timer);
  }, [step, setStep]);

  const go = (next: number) => { setAccountNote(''); setStep(next); };
  const back = (next: number) => <button className={styles.back} type="button" aria-label="Go back" onClick={() => go(next)}>‹</button>;
  const homeBar = <div className={styles.homeBar} aria-hidden="true" />;
  const primary = (text: string, onClick: () => void, disabled = false) => <button type="button" className={styles.primary} disabled={disabled} onClick={onClick}>{text}</button>;
  const secondary = (text: string, onClick: () => void) => <button type="button" className={styles.secondary} onClick={onClick}>{text}</button>;
  const confetti = <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>;

  if (step === 0) return (
    <section className={`ag-onboarding ${styles.root} ${styles.welcome}`} aria-label="Welcome to Afterglow" style={{ backgroundImage: `url("${art('welcome')}")` }}>
      <div className={styles.welcomeCopy}>
        <h1 ref={headingRef} tabIndex={-1}>Welcome to<br />Afterglow</h1>
        <p>Turn every adventure into<br />an island of healing.</p>
      </div>
      <div className={styles.welcomeActions}>
        {primary('Create an account', () => go(1))}
        {secondary('Log in', () => go(3))}
      </div>
      {homeBar}
    </section>
  );

  if (step >= 1 && step <= 3) {
    const creating = step === 2;
    return (
      <section className={`ag-onboarding ${styles.root} ${styles.account}`} aria-label="Your Afterglow account" style={{ backgroundImage: `url("${art('welcome')}")` }}>
        {back(step === 1 ? 0 : 1)}
        <div className={styles.accountSheet}>
          <h1 ref={headingRef} tabIndex={-1}>{step === 1 ? 'Create an account' : creating ? 'Sign up' : 'Log in'}</h1>
          {step === 1 ? <>
            <div className={styles.providers}>
              {['Apple', 'Google', 'Wechat', 'Apple'].map((provider, index) => (
                <button key={`${provider}-${index}`} type="button" onClick={() => { go(2); setAccountNote(`${provider} sign-in is not connected. You can explore with an email instead.`); }}>Continue with {provider}</button>
              ))}
              <button className={styles.emailProvider} type="button" onClick={() => go(2)}>Continue with Email</button>
            </div>
            <p className={styles.accountSwitch}>Already have an account? <button type="button" onClick={() => go(3)}>Log in</button></p>
          </> : <form className={styles.accountForm} onSubmit={(event) => { event.preventDefault(); setPassword(''); go(4); }}>
            {creating && <input aria-label="Name" autoComplete="given-name" placeholder="Name" maxLength={40} value={profile.displayName} onChange={(event) => updateProfile({ displayName: event.target.value })} required />}
            <input aria-label="Email address" type="email" autoComplete="email" placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <div className={styles.passwordField}>
              <input aria-label="Password" type={showPassword ? 'text' : 'password'} autoComplete={creating ? 'new-password' : 'current-password'} placeholder="Password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg></button>
            </div>
            {!creating && <button className={styles.forgot} type="button" onClick={() => setAccountNote('This is an interactive preview. No password or online account is saved; you can continue with the form to explore.')}>Forgot Password?</button>}
            {accountNote && <p className={styles.accountNote} role="status">{accountNote}</p>}
            <button className={styles.primary} type="submit">{creating ? 'Sign up' : 'Log in'}</button>
            <p className={styles.accountSwitch}>{creating ? 'Already have an account?' : 'Don’t have an account?'} <button type="button" onClick={() => go(creating ? 3 : 2)}>{creating ? 'Log in' : 'Sign up'}</button></p>
          </form>}
        </div>
        {homeBar}
      </section>
    );
  }

  if (step >= 4 && step <= 6) {
    const slide = INTRO_SLIDES[step - 4];
    return <section className={`ag-onboarding ${styles.root} ${styles.intro}`} aria-label={`Introduction ${step - 3} of 3`}>
      {step > 4 && back(step - 1)}
      <button className={styles.skip} type="button" onClick={() => go(7)}>Skip</button>
      <div className={styles.introCopy}>
        <h1 ref={headingRef} tabIndex={-1}>{slide.title}</h1>
        <p>{slide.body}</p>
        <div className={styles.dots} aria-label={`Page ${step - 3} of 3`}>{INTRO_SLIDES.map((_, i) => <button aria-label={`Introduction ${i + 1}`} aria-current={i === step - 4 ? 'step' : undefined} className={i === step - 4 ? styles.dotActive : ''} key={i} onClick={() => go(i + 4)} type="button" />)}</div>
      </div>
      <div className={styles.introArt}><Art name={slide.art} alt={slide.title} /></div>
      <div className={styles.introActions}>{primary('Next', () => go(step + 1))}</div>
      {homeBar}
    </section>;
  }

  if (step === 7) return <section className={`ag-onboarding ${styles.root} ${styles.meet}`} aria-label="Meet Lin">
    {back(6)}{confetti}
    <Art name="lin" className={styles.linArt} alt="Lin, your tiny plant companion" />
    <div className={styles.meetCopy}><h1 ref={headingRef} tabIndex={-1}>Hi, I’m Lin!</h1><p>I’m a tiny plant companion who helps you recover. I’ll guide you through 4 quick questions and use your answers to shape your personal island.</p></div>
    <div className={styles.footer}>{primary('Start with Lin', () => go(8))}{secondary('Skip for now', () => go(12))}</div>
    {homeBar}
  </section>;

  if (step >= 8 && step <= 11) {
    const index = step - 8;
    const question = QUESTIONS[index];
    return <section className={`ag-onboarding ${styles.root} ${styles.quiz}`} aria-label={`Personalization question ${index + 1} of 4`}>
      <div className={styles.progress} aria-label={`${index + 1} of 4 questions`}>
        {['Know you', 'Understand you', 'Support you'].map((label, i) => <div key={label} className={i === question.progress ? styles.progressActive : ''} aria-current={i === question.progress ? 'step' : undefined}><i>{i + 1}</i><span>{label}</span></div>)}
      </div>
      <div className={styles.questionBack}>{back(step === 8 ? 7 : step - 1)}</div>
      <div className={styles.questionSheet}>
        <h1 ref={headingRef} tabIndex={-1} id="onboarding-question">{question.title}</h1>
        <div className={`${styles.options} ${index === 0 ? styles.activityOptions : ''}`} role="group" aria-labelledby="onboarding-question">
          {question.options.map((option, i) => <button key={option} type="button" className={profile[question.id] === option ? styles.optionSelected : ''} aria-pressed={profile[question.id] === option} onClick={() => updateProfile({ [question.id]: option })}>{index === 0 && <Icon name={['activity', 'water', 'mountain', 'dumbbell', 'other'][i]} />}<span>{option}</span></button>)}
        </div>
        <div className={styles.footer}>
          {primary('Continue', () => go(step + 1), !question.options.some((option) => option === profile[question.id]))}
          {index < 2 && secondary('Skip for now', () => go(step + 1))}
        </div>
      </div>
      {homeBar}
    </section>;
  }

  if (step === 12) return <section className={`ag-onboarding ${styles.root} ${styles.shaping}`} aria-label="Generating your personal island">
    <Art name="shaping-island" className={styles.shapingArt} alt="Lin shaping a peaceful island surrounded by autumn trees" />
    <div className={styles.shapingCopy} role="status" aria-live="polite"><h1 ref={headingRef} tabIndex={-1}>Lin is shaping your<br />island...</h1><p>Finding the right landscape, recovery rhythm, and support style for you.</p></div>
    <div className={styles.loadingDots} aria-hidden="true"><i /><i /><i /></div>
    {homeBar}
  </section>;

  if (step === 13) {
    const plan = starterPlan(profile);
    return <section className={`ag-onboarding ${styles.root} ${styles.ready}`} aria-label="Your starter recovery plan">
      <div className={styles.readySheet}>
        <h1 ref={headingRef} tabIndex={-1}>Your first island is<br />ready!</h1>
        <p className={styles.readySubtitle}>Based on your activity, mood, and<br />body state.</p>
        <Art name="starter-island" className={styles.readyArt} alt="Your first forest island with orange trees and a snowy peak" />
        <section className={styles.plan} aria-label="Your personalized recovery plan">
          <div className={styles.binders} aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <h2>{profile.displayName.trim() || 'Cookie'}’s starter recovery plan</h2>
          <p>Easy goals to bring your island back to light.</p>
          {plan.map((goal, i) => <div className={styles.planRow} key={goal.id}><i className={styles[`planIcon${i}`]} aria-hidden="true">{goal.icon}</i><div><h3>{goal.title}</h3><span>{goal.minutes} min · {goal.note}</span></div></div>)}
        </section>
        <div className={styles.readyActions}><p>You can make today’s plan lighter anytime.</p>{primary('Enter My Island', () => go(14))}</div>
      </div>
      {homeBar}
    </section>;
  }

  if (step >= 14 && step <= 16) return <section className={`ag-onboarding ${styles.root} ${styles.device}`} aria-label={step === 16 ? 'Data access preferences' : 'Connect your smartwatch'}>
    {back(step - 1)}
    <div className={`${styles.deviceSheet} ${step === 14 ? styles.deviceIntro : ''}`}>
      <h1 ref={headingRef} tabIndex={-1}>{step === 16 ? 'Allow Data Access' : 'Connect your smartwatch'}</h1>
      <p className={styles.deviceSubtitle}>{step === 16 ? 'Lin only uses this data to personalize your recovery experience.' : 'Let Lin understand your body better through activity and recovery data.'}</p>
      {step === 14 ? <Art name="watch-preview" className={styles.watchArt} alt="An illustrated smartwatch showing activity and heart rate" /> : step === 15 ? <div className={styles.watchList} role="group" aria-label="Choose your watch">{WATCHES.map((watch) => <button type="button" key={watch.name} className={selectedWatch === watch.name ? styles.optionSelected : ''} aria-pressed={selectedWatch === watch.name} onClick={() => setSelectedWatch(watch.name)}><Art name={watch.art} /><span>{watch.name}</span></button>)}</div> : <div className={styles.permissionList}>{DATA_PERMISSIONS.map((permission, i) => <button type="button" role="switch" key={permission.label} aria-checked={permissions[i]} className={permissions[i] ? styles.optionSelected : ''} onClick={() => setPermissions((current) => current.map((value, j) => j === i ? !value : value))}><span style={{ color: permission.color }}><Icon name={permission.icon} /></span><span>{permission.label}</span></button>)}</div>}
      <div className={styles.footer}>
        {primary(step === 14 ? 'Connect a device' : 'Continue', () => {
          if (step === 16) {
            window.localStorage.setItem(DEVICE_KEY, JSON.stringify({ watch: selectedWatch, permissions, mode: 'preview' }));
          }
          go(step + 1);
        }, step === 15 && !selectedWatch)}
        {secondary('Skip for now', finish)}
        {step === 14 && <p className={styles.deviceLater}>You can connect a device later in Settings.</p>}
      </div>
    </div>
    {homeBar}
  </section>;

  return <section className={`ag-onboarding ${styles.root} ${styles.connected}`} aria-label="Watch connection preview complete">
    {back(16)}
    <div className={styles.deviceSheet}>
      <h1 ref={headingRef} tabIndex={-1}>Watch connected<br />successfully!</h1>
      <p className={styles.connectedSubtitle}>Your activity, heart rate, and rest data will help shape more accurate emotional insights and recovery suggestions.</p>
      <Art name="watch-connected" className={styles.connectedArt} alt="Lin celebrating beside a glowing smartwatch" />
      <div className={styles.introActions}>{primary('Started', finish)}<p className={styles.previewNote}>Connection preview · no health data synced</p></div>
    </div>
    {homeBar}
  </section>;
}
