"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { HomeIcon } from '../home/HomeDashboard';
import type { StarterGoal } from '../onboarding/flow';
import { DEMO_SQUADS, GROUP_SAVE_KEY, THEMES, emptySquadState, findInvite, readSquadState, recoveryPoints, type Squad, type SquadState } from './model';
import styles from './group.module.css';

type View = 'hub' | 'recommend' | 'create' | 'squad' | 'progress' | 'pk' | 'moments' | 'album';
type Dialog = 'invite' | 'rules' | 'share' | 'about' | null;
type Props = { scene: ReactNode; name: string; totalExp: number; goals: StarterGoal[]; completed: string[]; onDecorate: () => void; onGoal: (id: string, label: string) => void };

function Icon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    squad: <><circle cx="12" cy="6" r="2"/><circle cx="4" cy="7" r="2"/><circle cx="20" cy="7" r="2"/><path d="M8 11h8v7a4 4 0 0 1-8 0v-7ZM4 12H1v6h4M20 12h3v6h-4"/></>,
    mountain: <><path d="m1 20 7-12 6 12H1Zm9-9 5-8 8 17H13M5 14l3 2 3-2M13 7l2 2 2-2"/></>,
    forest: <><path d="m7 3-5 8h3l-4 6h12l-4-6h3L7 3Zm11 0-4 7h3l-3 5h9l-3-5h3l-5-7ZM7 17v5M18 15v7"/></>,
    ocean: <><circle cx="15" cy="5" r="2"/><path d="m6 9 5-2 3 5 6 2M10 11l-3 5 5 2M12 18l-2 4M2 21q3-3 6 0 3-3 6 0 3-3 8 0"/></>,
    bike: <><circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-10 6 10M8 7h5M13 3h4l2 14M8 11h9"/></>,
    key: <><circle cx="15" cy="7" r="5"/><path d="m11 11-9 9v3h4v-3h3v-3h3M15 6h.1"/></>,
    search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
    heart: <path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/>,
    send: <path d="m2 10 20-8-7 20-3-9-10-3Zm10 3L22 2"/>,
    eye: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/></>,
    lock: <><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V6a5 5 0 0 1 10 0v4"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 10v7M12 6h.01"/></>,
    photo: <><rect x="2" y="3" width="20" height="18" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m2 18 7-6 4 4 3-3 6 5"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] || icons.squad}</svg>;
}

export default function GroupHub({ scene, name, totalExp, goals, completed, onDecorate, onGoal }: Props) {
  const [view, setView] = useState<View>('hub');
  const [state, setState] = useState<SquadState>(emptySquadState);
  const [hydrated, setHydrated] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [squadName, setSquadName] = useState('');
  const [theme, setTheme] = useState(THEMES[0]);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public');
  const [invite, setInvite] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [period, setPeriod] = useState<'Daily' | 'Weekly'>('Daily');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState('');
  const [formError, setFormError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const saved = readSquadState(window.localStorage.getItem(GROUP_SAVE_KEY));
    setState(saved); if (saved.selected) setView('squad'); setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(GROUP_SAVE_KEY, JSON.stringify(state)); }
    catch { setNotice('Your device storage is full. Remove a photo before adding another.'); }
  }, [state, hydrated]);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); headingRef.current?.focus({ preventScroll: true }); }, [view]);
  useEffect(() => { if (!notice) return; const t=window.setTimeout(()=>setNotice(''),2800); return()=>window.clearTimeout(t); }, [notice]);
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const sheet = document.getElementById('squad-dialog');
    const focusable = () => Array.from(sheet?.querySelectorAll<HTMLElement>('button,input,textarea,[tabindex="0"]') || []).filter(e => !e.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDialog(null);
      if (event.key !== 'Tab') return;
      const items=focusable(), first=items[0], last=items[items.length-1];
      if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);previous?.focus();};
  }, [dialog]);

  const squads = [...DEMO_SQUADS, ...state.squads];
  const squad = squads.find(s=>s.id===state.selected) || DEMO_SQUADS[0];
  const squadMoments = state.moments.filter(moment => moment.squadId === squad.id || (!moment.squadId && squad.id === 'warm-light'));
  const personalExp = totalExp;
  const points = recoveryPoints(squad, personalExp);
  const progress = Math.round(points/10);
  const teamGoals = ['breathing','stretch','check'].map(id=>goals.find(g=>g.id===id)).filter((g):g is StarterGoal=>!!g);
  const memberNames = ['Cookie','Mia','Leo','Anna', name === 'Cookie' ? 'You' : name];
  const activity = [
    {id:'breath',who:'Cookie',text:'completed Breathing Reset',detail:'The squad island gained +5 recovery points.',time:'2 min ago'},
    {id:'photo',who:'Mia',text:'shared one recovery photo',detail:'Added to Warm Cabin memories.',time:'15 min ago'},
    {id:'encourage',who:'Leo',text:'sent encouragement to the squad',detail:'Mood shifted from tired to calm.',time:'Today'},
    {id:'anna',who:'Anna',text:'sent encouragement',detail:'The squad unlocked a small light decoration.',time:'Today'},
  ];
  const openView=(next:View)=>{setNotice('');setView(next);};
  const join=(item:Squad)=>{setState(s=>({...s,selected:item.id,joined:s.joined.includes(item.id)?s.joined:[...s.joined,item.id]})); setDialog(null);setView('squad');};
  const react=(id:string,message='A little encouragement added.')=>{setState(s=>({...s,reactions:s.reactions.includes(id)?s.reactions.filter(x=>x!==id):[...s.reactions,id]}));if(!state.reactions.includes(id))setNotice(message);};
  const createSquad=(event:FormEvent)=>{event.preventDefault();if(!squadName.trim()){setFormError('Give your squad a name first.');return;} const item:Squad={id:crypto.randomUUID(),name:squadName.trim(),theme,description:description.trim()||'One small recovery step, together.',visibility,level:1,members:1,points:0,icon:theme==='Snow Adventure'?'mountain':theme==='Ocean Escape'?'ocean':theme==='Rolling Hills Ride'?'bike':'forest',code:crypto.randomUUID().slice(0,8).toUpperCase()};setState(s=>({...s,squads:[...s.squads,item],joined:[...s.joined,item.id],selected:item.id}));setView('squad');setFormError('');};
  const submitInvite=(event:FormEvent)=>{event.preventDefault();const found=findInvite(squads,invite);if(found)join(found);else setInviteError('We couldn’t find that code on this device. Try WARMLIGHT for the preview.');};
  const choosePhoto=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1024*1024){setFormError('Choose a PNG, JPG or WebP photo smaller than 1 MB.');return;}const reader=new FileReader();reader.onload=()=>{setPhoto(String(reader.result));setFormError('');};reader.onerror=()=>setFormError('That photo could not be opened. Please try another.');reader.readAsDataURL(file);};
  const share=(event:FormEvent)=>{event.preventDefault();if(!note.trim()&&!photo){setFormError('Add a note or a photo first.');return;}setState(s=>({...s,moments:[{id:crypto.randomUUID(),squadId:squad.id,note:note.trim(),image:photo||undefined,date:new Date().toISOString()},...s.moments].slice(0,4)}));setDialog(null);setNote('');setPhoto('');setFormError('');setNotice('Your moment is saved on this device.');};
  const back=()=>openView(view==='recommend'||view==='create'?'hub':'squad');
  const title = { hub:'Squad Hub', recommend:'Recommend Hubs', create:'Create Squad', squad:'', progress:'Squad Progress', pk:'Squad PK', moments:'Squad Moments', album:'Shared Memories' }[view];
  const header = <header className={styles.header}>{view!=='hub'&&<button type="button" className={styles.back} onClick={back} aria-label="Back">‹</button>}<h1 ref={headingRef} tabIndex={-1}>{title}</h1>{view==='moments'&&<button className={styles.smallPill} onClick={()=>openView('pk')}>PK Board</button>}</header>;
  const pill=(label:string,fn:()=>void)=><button type="button" className={styles.smallPill} onClick={fn}>{label}</button>;
  const avatar=(person:string)=><span className={styles.avatar}>{person[0]}<i/></span>;
  const actions=(id:string)=><div className={styles.reactions}><button type="button" aria-label={`Send encouragement to ${id}`} aria-pressed={state.reactions.includes(`cheer-${id}`)} onClick={()=>react(`cheer-${id}`)}><Icon name="send"/></button><button type="button" aria-label={`Like ${id}`} aria-pressed={state.reactions.includes(`like-${id}`)} onClick={()=>react(`like-${id}`)}><Icon name="heart"/></button></div>;
  const squadCard=(item:Squad)=><button type="button" className={styles.squadCard} key={item.id} onClick={()=>join(item)} aria-label={`${state.joined.includes(item.id)?'Open':'Join'} ${item.name}`}><i className={styles.squadIcon}><Icon name={item.icon}/></i><div><strong>{item.name}</strong><p>{item.description}</p><small><Icon name="squad"/>{item.members} members <em>{item.theme}</em></small></div><b>Lv.{item.level}</b></button>;

  return <div className={`screen ${styles.root}`}>
    <div className={styles.scroll} ref={scrollRef}>
      {view!=='squad'&&header}
      {view==='hub'&&<>
        <button type="button" className={styles.createBanner} onClick={()=>openView('create')}><i><Icon name="squad"/></i><span><strong>Create a Squad</strong><small>Start your own recovery squad<br/>and invite friends</small></span><b>＋ Create</b></button>
        <button type="button" className={styles.primary} onClick={()=>{setInvite('');setInviteError('');setDialog('invite');}}><Icon name="key"/>Have an invite code?</button>
        {!!state.joined.length&&<><div className={styles.sectionHeading}><h2>Your Squads</h2></div>{squads.filter(s=>state.joined.includes(s.id)).map(squadCard)}</>}
        <div className={`${styles.sectionHeading} ${styles.recommendHeading}`}><h2>Recommended</h2><button type="button" onClick={()=>openView('recommend')}>View All</button></div>
        {DEMO_SQUADS.slice(1).map(squadCard)}
      </>}
      {view==='recommend'&&<>
        <label className={styles.search}><Icon name="search"/><input aria-label="Search squads" placeholder="Search squads by name or theme to join" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        <div className={styles.sectionHeading}><h2>Recommended</h2><span>{squads.filter(s=>s.visibility==='Public').length} squads</span></div>
        {squads.filter(s=>s.visibility==='Public'&&`${s.name} ${s.theme}`.toLowerCase().includes(query.toLowerCase())).map(squadCard)}
        {!squads.some(s=>s.visibility==='Public'&&`${s.name} ${s.theme}`.toLowerCase().includes(query.toLowerCase()))&&<p className={styles.empty}>No squads match that search. Try a theme like “Snow”.</p>}
      </>}
      {view==='create'&&<form className={styles.createForm} onSubmit={createSquad}>
        <label>Squad Name<input required maxLength={24} placeholder="Enter your squad name" value={squadName} onChange={e=>setSquadName(e.target.value)}/><small>{squadName.length}/24</small></label>
        <fieldset><legend>Recovery Theme</legend><div className={styles.themes}>{THEMES.map(item=><button key={item} type="button" aria-pressed={theme===item} onClick={()=>setTheme(item)}>{item}</button>)}</div></fieldset>
        <label>Description<textarea maxLength={120} placeholder="What is your squad about?" value={description} onChange={e=>setDescription(e.target.value)}/><small>{description.length}/120</small></label>
        <fieldset><legend>Visibility</legend><div className={styles.visibility}>{(['Public','Private'] as const).map(item=><button type="button" key={item} aria-pressed={visibility===item} onClick={()=>setVisibility(item)}><Icon name={item==='Public'?'globe':'lock'}/>{item}</button>)}</div></fieldset>
        <p className={styles.info}><Icon name="info"/>Public squads appear in recommendations. Private squads require an invite code to join.</p>
        {formError&&<p role="alert" className={styles.error}>{formError}</p>}
        <button className={styles.primary} type="submit">＋ Done</button>
      </form>}
      {view==='squad'&&<>
        <div className={styles.squadToolbar}><button type="button" onClick={()=>openView('hub')}><Icon name="search"/>Create / Join Squad<span>＋</span></button><button className={styles.pkButton} onClick={()=>openView('pk')}>PK</button></div>
        <section className={styles.islandArea} aria-label="Your squad island"><button className={styles.island} type="button" onClick={onDecorate} aria-label="Decorate squad island with the Home island tools">{scene}</button><button className={styles.decorate} onClick={onDecorate}>★ Decorate</button></section>
        <section className={styles.summary}><div><h2>{squad.name}</h2><button type="button" onClick={()=>openView('progress')}><Icon name="eye"/>View Squad<br/>Progress</button></div><p>{points} / 1000 recovery points <span>{progress}%</span></p><div className={styles.bar}><i style={{width:`${progress}%`}}/></div><small>{squad.description}</small></section>
        <div className={styles.teamHeading}><h2>Today&apos;s Team Goals</h2><p>Completing these also grows your personal island.</p></div>
        <section className={styles.teamGoals} aria-label="Today's team recovery goals">{teamGoals.map((goal,i)=>{const done=completed.includes(goal.id);const count=Math.min(4,3-i+Number(done));return <button type="button" key={goal.id} onClick={()=>onGoal(goal.id,goal.label)} aria-label={`${goal.title}, ${done?'completed':`${goal.exp} EXP`}`}><i className={styles.goalIcon} data-kind={goal.id}><HomeIcon name={goal.id}/></i><span><strong>{goal.title}</strong><small>{goal.minutes} min · +{goal.exp} EXP {count}/4 done</small><em>{[0,1,2,3].map(n=><b key={n} data-done={n<count}/>)}</em></span><b className={`${styles.goalCheck} ${done?styles.checked:''}`}>{done?'✓':''}</b></button>;})}</section>
        <div className={styles.sectionHeading}><h2>Online Teammates</h2></div><div className={styles.teammates}>{['Cookie','Mia','Leo','You'].map(person=><button type="button" key={person} onClick={()=>openView('progress')}>{avatar(person)}<small>{person}</small></button>)}</div>
        <div className={styles.sectionHeading}><h2>Recent Squad Activity</h2></div><div className={styles.activityCards}>{squadMoments.slice(0,1).map(moment=><article key={moment.id}>{avatar(name)}<div><p><strong>You</strong> shared a recovery moment</p><small>Just now</small></div>{actions(moment.id)}</article>)}{activity.slice(0,3).map(item=><article key={item.id}>{avatar(item.who)}<div><p><strong>{item.who}</strong> {item.text}</p><small>{item.time}</small></div>{actions(item.id)}</article>)}</div>
        <section className={styles.memoryCard}><div className={styles.sectionHeading}><h2>Shared Memories</h2><button onClick={()=>openView('album')}>View Memory Album ›</button></div><button type="button" className={styles.memoryTiles} onClick={()=>openView('album')} aria-label="Open shared memories">{[0,1,2,3].map(i=><span key={i}>{squadMoments[i]?.image&&<img src={squadMoments[i].image} alt="Shared squad moment"/>}{squadMoments[i]&&!squadMoments[i].image&&<Icon name="photo"/>}</span>)}</button><small>{squadMoments.length} moments saved on this device</small></section>
        <button type="button" className={styles.previewNote} onClick={()=>setDialog('about')}><Icon name="info"/>Squad preview · shared updates are saved on this device.</button>
      </>}
      {view==='progress'&&<>
        <section className={styles.summary}><div className={styles.progressIdentity}><span className={styles.badge}><Icon name="squad"/></span><div><h2>{squad.name}</h2><small>Day 2 of 3 · Squad Lv. {squad.level}<br/>{squad.members} members</small></div></div><div className={styles.bar}><i style={{width:`${progress}%`}}/></div><small>Overall recovery progress: {progress}%</small></section>
        <section className={styles.streak}><h2>Streak days logged: 5/7</h2><div>{['M','T','W','T','F','S','S'].map((day,i)=><span key={i}><i data-done={i<5}>{i<5?'✓':''}</i><small>{day}</small></span>)}</div></section>
        <div className={styles.sectionHeading}><h2>Member Recovery Progress</h2></div><div className={styles.memberList}>{memberNames.map((person,i)=>{const count=i===4?Math.min(5,completed.length):[4,3,3,2][i];return <article key={`${person}-${i}`}>{avatar(person)}<div><strong>{person}</strong><p><span className={styles.bar}><i style={{width:`${count*20}%`}}/></span><small>{count} / 5 tasks</small></p></div>{actions(person)}</article>;})}</div>
        <div className={styles.sectionHeading}><h2>Friend Activity</h2></div><section className={styles.friendActivity}>{activity.map(item=><article key={item.id}>{avatar(item.who)}<div><p><strong>{item.who}</strong> {item.text}.</p><p>{item.detail}</p><small>{item.time}</small></div></article>)}</section>
      </>}
      {view==='pk'&&<>
        <div className={styles.pkIntro}><p>Friendly recovery ranking</p><div role="group" aria-label="Ranking period">{(['Daily','Weekly'] as const).map(p=><button key={p} type="button" aria-pressed={p===period} onClick={()=>setPeriod(p)}>{p}</button>)}</div></div>
        <section className={styles.podium}><div className={styles.sectionHeading}><h2>{period==='Daily'?'Today’s':'This week’s'} gentle competition</h2><button onClick={()=>setDialog('rules')}>Rules</button></div><div className={styles.winners}>{[{rank:2,name:'Misty Crew',points:1840,color:'#92d7e6'},{rank:1,name:squad.name,points:2120+personalExp,color:'#f5c768'},{rank:3,name:'Blue Hill',points:1630,color:'#a095d7'}].map(item=><div key={item.rank} data-rank={item.rank}><span style={{background:item.color}}>{item.rank===1&&<b>★</b>}{item.rank}</span><strong>{item.name.replace(' Squad','')}</strong><em>{((period==='Weekly'?item.points*4:item.points)).toLocaleString('en-US')} pts</em></div>)}</div><p className={styles.rankNote}>Your squad is #1 {period==='Daily'?'today':'this week'} · +280 recovery pts</p></section>
        <section className={styles.leaderboard}><h2>Leaderboard</h2>{[squad.name,'Misty Crew','Blue Hill Team','Forest Steps'].map((item,i)=><div key={item}><b>{i+1}</b><span>{item}</span><p>{((period==='Weekly'?4:1)*([2120+personalExp,1840,1630,1420][i])).toLocaleString('en-US')}<small>+{[12,9,8,6][i]} calm</small></p></div>)}</section>
        <section className={styles.softCard}><h2>Low-pressure PK</h2><p>Rank is based on steady recovery points, not task quantity. Rest days still count.</p><button type="button" onClick={()=>openView('moments')}>View moments →</button></section>
      </>}
      {view==='moments'&&<>
        <p className={styles.subtitle}>See how teammates are recovering</p><section className={styles.cheerCard}>{avatar('You')}<div><h2>Send a small cheer</h2><p>Mia just completed a breathing reset.</p><button type="button" className={styles.smallPill} aria-pressed={state.reactions.includes('cheer-mia')} onClick={()=>react('cheer-mia','Your cheer is added to this preview.')}>{state.reactions.includes('cheer-mia')?'Cheer sent ✓':'Send cheer'}</button></div></section>
        <section className={styles.momentsCard}><h2>Friend activity</h2>{[
          ['Mia','completed Breathing Reset','felt calmer after 3 min','Give a leaf'],['Leo','saved a trail photo','added it to squad memory','View memory'],['Anna','checked in','body still tired, chose lighter task','Reply'],['Cookie','shared a badge','Healing flower bloomed','Celebrate'],
        ].map(([who,text,detail,label],i)=><article key={who}>{avatar(who)}<div><p><strong>{who}</strong> {text}</p><small>{detail}</small>{pill(state.reactions.includes(`moment-${i}`)?'Added ✓':label,()=>i===1?openView('album'):i===2?setDialog('share'):react(`moment-${i}`))}</div></article>)}</section>
        <button className={styles.shareCard} type="button" onClick={()=>{setFormError('');setDialog('share');}}><span><strong>Share with squad</strong><small>Post one recovery note, photo, or<br/>badge from today.</small></span><b>＋</b></button>
      </>}
      {view==='album'&&<>
        <p className={styles.subtitle}>Keep the small moments that helped you recover.</p>{!squadMoments.length?<div className={styles.albumEmpty}><Icon name="photo"/><h2>Your first shared memory</h2><p>Add a recovery note or photo to start your squad album.</p><button className={styles.primary} onClick={()=>setDialog('share')}>＋ Add a moment</button></div>:<div className={styles.album}>{squadMoments.map(moment=><article key={moment.id}>{moment.image&&<img src={moment.image} alt={moment.note||'Recovery photo'}/>}<p>{moment.note}</p><small>Shared by {name} · {new Date(moment.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</small></article>)}<button className={styles.primary} onClick={()=>setDialog('share')}>＋ Add a moment</button></div>}
      </>}
    </div>
    {notice&&<div className={styles.notice} role="status">{notice}</div>}
    {dialog&&<div className={styles.backdrop} onClick={()=>setDialog(null)}><section id="squad-dialog" className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="squad-dialog-title" onClick={e=>e.stopPropagation()}><button type="button" className={styles.close} onClick={()=>setDialog(null)} aria-label="Close dialog">×</button>
      <h2 id="squad-dialog-title">{dialog==='invite'?'Join your squad':dialog==='rules'?'A gentler kind of competition':dialog==='share'?'Share a recovery moment':'Your squad space'}</h2>
      {dialog==='invite'&&<form onSubmit={submitInvite}><label>Invite code<input value={invite} onChange={e=>{setInvite(e.target.value);setInviteError('');}} placeholder="e.g. WARMLIGHT" maxLength={24} required autoCapitalize="characters"/></label><p>Try WARMLIGHT to explore the sample squad. Codes and memberships in this preview stay on this device.</p>{inviteError&&<p className={styles.error} role="alert">{inviteError}</p>}<button className={styles.primary} type="submit">Join Squad</button></form>}
      {dialog==='rules'&&<><p>Take a gentle recovery step to add points. Breathing adds 5 points, stretching 8, journaling 5, and hydration 3.</p><p>Daily and weekly boards are illustrative preview rankings. Rest days count too—there is no penalty for taking your time.</p><button className={styles.primary} onClick={()=>setDialog(null)}>Got it</button></>}
      {dialog==='about'&&<><p>Explore the squad experience with sample teammates. Your notes, cheers, memberships, and island decorations are saved locally—not sent to other people.</p><p><strong>Invite code: {squad.code}</strong></p><p>The island uses the same model, placed items, and editing tools as Home.</p><button className={styles.primary} onClick={()=>setDialog(null)}>Got it</button></>}
      {dialog==='share'&&<form onSubmit={share}><label>A small moment from today<textarea placeholder="What helped you feel a little better?" value={note} maxLength={240} onChange={e=>setNote(e.target.value)}/></label><input className={styles.file} type="file" accept="image/png,image/jpeg,image/webp" ref={fileRef} onChange={choosePhoto}/><button type="button" className={styles.photoButton} onClick={()=>fileRef.current?.click()}><Icon name="photo"/>{photo?'Change photo':'Add photo (up to 1 MB)'}</button>{photo&&<img className={styles.photoPreview} src={photo} alt="Photo to add to your moment"/>}<p>Saved on this device for the squad preview.</p>{formError&&<p className={styles.error} role="alert">{formError}</p>}<button className={styles.primary} type="submit">Save moment</button></form>}
    </section></div>}
  </div>;
}
