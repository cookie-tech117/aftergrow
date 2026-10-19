export type RecoveryLog = { id:string; date:string; mood:string; focus:string; exp?:number; createdAt?:number; goalId?:string; minutes?:number };
export type DiaryView = 'overview'|'mood'|'tasks'|'reflections'|'wall';
export const CHAT_KEY='afterglow-lin-chat-v2';
export const DIARY_KEY='afterglow-recovery-diary-v2';
export const TRAITS=['Curiosity','Resilience','Compassion','Logic','Confidence','Security'] as const;
export type Trait=typeof TRAITS[number];
export type ChatLine={id:string;role:'lin'|'user';text:string;time:number;kind?:'breathing'|'completed'};
export type TalkState={messages:ChatLine[];trait:Trait;accessory:string;lastSession:string;pending:boolean};
export function initialTalk():TalkState{return {messages:[{id:'welcome',role:'lin',text:"Hi there! I’m Lin, your emotional recovery companion. How are you feeling today?",time:Date.now()}],trait:'Curiosity',accessory:'leaf',lastSession:'',pending:false};}
export function readTalk(raw:string|null):TalkState {try{const d=JSON.parse(raw||'null');if(!d)return initialTalk();return {messages:Array.isArray(d.messages)?d.messages.filter((m:ChatLine)=>typeof m.id==='string'&&['lin','user'].includes(m.role)&&typeof m.text==='string'&&Number.isFinite(m.time)).slice(-60):initialTalk().messages,trait:TRAITS.includes(d.trait)?d.trait:'Curiosity',accessory:['leaf','trail','calm','star','fog','crystal'].includes(d.accessory)?d.accessory:'leaf',lastSession:typeof d.lastSession==='string'?d.lastSession:'',pending:d.pending===true};}catch{return initialTalk();}}
export function linReply(text:string,trait:Trait,activities:number):{text:string;kind?:'breathing'} {
 const t=text.toLowerCase();
 if(/recovery|progress|恢复|进度/.test(t))return {text:`You’ve completed ${activities} recovery ${activities===1?'activity':'activities'}. Small, steady steps count. You can explore your patterns in Insights or your Recovery Journal.`};
 if(/activity|should i do|活动|做什么/.test(t))return {text:'A short breathing pause is one gentle option. You can choose a different activity or stop whenever you need.',kind:'breathing'};
 if(/stress|anxious|anxiety|overwhelm|relax|焦虑|紧张|压力|放松/.test(t))return {text:'I hear you. Feeling unsettled can be a lot to carry. We don’t have to solve everything right now—would a gentle breathing pause feel helpful?',kind:'breathing'};
 if(/tired|exhaust|疲|累/.test(t))return {text:'It’s okay to need rest. We can keep this small: a sip of water, a comfortable shoulder release, or simply a quiet moment.'};
 if(/sad|lonely|low|难过|孤独/.test(t))return {text:'Thank you for telling me. You don’t have to put a positive spin on it. Would you like to name one thing you’re carrying today?'};
 const endings:Record<Trait,string>={Curiosity:'What feels most important to you in this moment?',Resilience:'What is one small, manageable next step?',Compassion:'What would being kind to yourself look like right now?',Logic:'Would it help to separate what happened from how it felt?',Confidence:'Is there a small thing you handled well today?',Security:'What helps this moment feel a little steadier?'};
 return {text:`Thank you for sharing that with me. There’s room for your experience here. ${endings[trait]}`};
}
export type WallKind='sticker'|'photo'|'badge'|'note';
export type WallItem={id:string;kind:WallKind;asset:string;text:string;x:number;y:number;scale:number;rotation:number};
export type DiaryState={moods:Record<string,number>;walls:Record<string,WallItem[]>;drafts:Record<string,WallItem[]>};
export const emptyDiary=():DiaryState=>({moods:{},walls:{},drafts:{}});
export const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
export function normalizeItems(value:unknown):WallItem[]{if(!Array.isArray(value))return [];return value.filter((i:WallItem)=>typeof i.id==='string'&&['sticker','photo','badge','note'].includes(i.kind)&&typeof i.asset==='string'&&typeof i.text==='string'&&[i.x,i.y,i.scale,i.rotation].every(Number.isFinite)&&(!i.asset.startsWith('data:')||/^data:image\/(png|jpeg|webp);base64,/.test(i.asset))).slice(0,24).map(i=>({...i,text:i.text.slice(0,180),x:clamp(i.x,8,92),y:clamp(i.y,8,92),scale:clamp(i.scale,.5,2),rotation:((i.rotation%360)+360)%360}));}
export function readDiary(raw:string|null):DiaryState{try{const d=JSON.parse(raw||'null');if(!d)return emptyDiary();const clean=(v:unknown)=>Object.fromEntries(Object.entries(v&&typeof v==='object'?v:{}).filter(([key])=>/^\d{4}-\d{2}$/.test(key)).map(([key,val])=>[key,normalizeItems(val)]));return {moods:Object.fromEntries(Object.entries(d.moods||{}).filter(([key,v])=>/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isInteger(v)&&Number(v)>=0&&Number(v)<=4).map(([key,value])=>[key,Number(value)])),walls:clean(d.walls),drafts:clean(d.drafts)};}catch{return emptyDiary();}}
export function dayKey(date:Date|number=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function monthKey(date:Date|number=new Date()){return dayKey(date).slice(0,7);}
export function shiftMonth(key:string,amount:number){const [y,m]=key.split('-').map(Number);const date=new Date(Date.UTC(y,m-1+amount,15));return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;}
export function monthLabel(key:string){return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',month:'long',year:'numeric'}).format(new Date(key+'-15T04:00:00Z'));}
export function calendarDates(endKey:string){const [y,m]=endKey.split('-').map(Number);const last=new Date(Date.UTC(y,m,0,4));const end=new Date(last.getTime()+((7-last.getUTCDay())%7)*86400000);return Array.from({length:91},(_,i)=>dayKey(new Date(end.getTime()-(90-i)*86400000)));}
