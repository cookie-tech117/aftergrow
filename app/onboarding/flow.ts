export type RecoveryProfile = {
  displayName: string;
  activity: string;
  postActivity: string;
  currentState: string;
  support: string;
  dailyTime: string;
  checkInTime: string;
};

export const INTRO_SLIDES = [
  { title: 'Turn your adventure into an island', body: 'Every activity becomes a living emotional island, shaped by your movement, mood, and recovery.', art: 'intro-island' },
  { title: 'Understand your emotional journey', body: 'See how your energy rises, falls, and recovers after intense activity through gentle visual stories.', art: 'intro-emotions' },
  { title: 'Recover with Lin and your squad', body: 'Get personalized healing guidance, grow your island, and recover together with companions who understand you.', art: 'intro-squad' },
] as const;

export const QUESTIONS = [
  { id: 'activity', title: 'What kind of intense experience are you recovering from?', options: ['Snow Sports', 'Water Sports', 'Outdoor Adventure', 'Training / Competition', 'Other'], progress: 0 },
  { id: 'postActivity', title: 'How do you usually feel after an intense activity?', options: ['Excited but restless', 'Tired and low energy', 'Empty after the peak', 'Anxious about performance', 'Unmotivated to restart', 'Physically sore'], progress: 0 },
  { id: 'currentState', title: 'What best describes your mood today?', options: ['Clear and calm', 'A little stressed', 'Emotionally tired', 'Anxious or overwhelmed', 'Calm but unmotivated', 'Up and down a lot'], progress: 1 },
  { id: 'support', title: 'What kind of support would help you recover best?', options: ['Emotional comfort', 'Save the happy memory', 'Quiet body relaxation', 'Help understanding my feelings', 'A clear recovery plan', 'Recover with friends'], progress: 2 },
] as const;

export const WATCHES = [
  { name: 'Apple Watch 7', art: 'watch-apple' },
  { name: 'xiaomi Watch S3', art: 'watch-xiaomi' },
  { name: 'HUAWEI WATCH GT5', art: 'watch-huawei' },
  { name: 'WHOOP 4.0', art: 'watch-whoop' },
] as const;

export const DATA_PERMISSIONS = [
  { label: 'Allow access to workout records', icon: 'activity', color: '#5b9859' },
  { label: 'Allow access to heart rate data', icon: 'heart', color: '#818597' },
  { label: 'Allow access to sleep data', icon: 'moon', color: '#4b70ff' },
  { label: 'Allow access to activity duration', icon: 'clock', color: '#e7bd00' },
  { label: 'Allow access to calories burned', icon: 'flame', color: '#a8a1ed' },
] as const;

export type StarterGoal = { id: string; title: string; icon: string; label: string; minutes: number; exp: number; note: string };
const BREATH: StarterGoal = { id: 'breathing', title: 'Breathing Reset', icon: '≋', label: 'Breathing', minutes: 3, exp: 5, note: 'calm your nervous system' };
const STRETCH: StarterGoal = { id: 'stretch', title: 'Neck & Shoulder Release', icon: '✥', label: 'Stretching', minutes: 5, exp: 8, note: 'reduce body tension' };
const JOURNAL: StarterGoal = { id: 'check', title: 'One-Sentence Check-in', icon: '▣', label: 'Journal', minutes: 1, exp: 5, note: 'name how you feel' };
const WATER: StarterGoal = { id: 'water', title: 'Take One Sip', icon: '♧', label: 'Hydrate', minutes: 1, exp: 3, note: 'gentle body care' };

export function starterPlan(profile: RecoveryProfile): StarterGoal[] {
  const plan = [BREATH, STRETCH, JOURNAL, WATER];
  if (profile.support === 'A clear recovery plan') {
    plan[1] = { id: 'focus', title: 'A Gentle Focus Reset', icon: '◎', label: 'Focus', minutes: 15, exp: 10, note: 'begin with one small intention' };
  } else if (profile.support === 'Save the happy memory') {
    plan[2] = { ...JOURNAL, title: 'Save a Happy Moment', note: 'keep one memory from your adventure' };
  } else if (profile.support === 'Help understanding my feelings') {
    plan[2] = { ...JOURNAL, title: 'Name This Feeling', note: 'give your emotions a little space' };
  }
  if (profile.postActivity === 'Physically sore' || profile.support === 'Quiet body relaxation') {
    return [plan[1], BREATH, plan[2], WATER];
  }
  return plan;
}
