export type Squad = { id: string; name: string; theme: string; description: string; members: number; level: number; points: number; visibility: 'Public' | 'Private'; code: string; icon: string };
export type SharedMoment = { id: string; squadId?: string; note: string; image?: string; date: string };
export type SquadState = { squads: Squad[]; joined: string[]; selected: string | null; reactions: string[]; moments: SharedMoment[] };
export const GROUP_SAVE_KEY = 'afterglow-squad-preview-v1';
export const THEMES = ['Forest Hiking', 'Snow Adventure', 'Ocean Escape', 'Rolling Hills Ride', 'Sunrise Stretch', 'Night Stargazing'];
export const DEMO_SQUADS: Squad[] = [
  { id: 'warm-light', name: 'Warm Light Squad', theme: 'Forest Hiking', description: 'Complete recovery tasks together to gain success!', members: 5, level: 5, points: 650, visibility: 'Public', code: 'WARMLIGHT', icon: 'forest' },
  { id: 'mountain', name: 'Mountain Trekkers', theme: 'Snow Adventure', description: 'For those who love the quiet of snow peaks.', members: 8, level: 7, points: 650, visibility: 'Public', code: 'MOUNTAIN', icon: 'mountain' },
  { id: 'ocean', name: 'Ocean Breeze', theme: 'Ocean Escape', description: 'Let the waves carry your worries away.', members: 6, level: 4, points: 480, visibility: 'Public', code: 'OCEAN', icon: 'ocean' },
  { id: 'hill', name: 'Hill Riders', theme: 'Rolling Hills Ride', description: 'Gentle hills, gentle hearts.', members: 4, level: 3, points: 360, visibility: 'Public', code: 'HILL', icon: 'bike' },
];
export const emptySquadState = (): SquadState => ({ squads: [], joined: [], selected: null, reactions: [], moments: [] });
export function readSquadState(raw: string | null): SquadState {
  try {
    const data = JSON.parse(raw || '{}');
    const squads: Squad[] = Array.isArray(data.squads) ? data.squads.filter((s: Squad) => typeof s.id === 'string' && typeof s.name === 'string' && s.name.length <= 24 && THEMES.includes(s.theme) && typeof s.code === 'string' && Number.isFinite(s.points) && Number.isFinite(s.members)) : [];
    const ids = new Set([...DEMO_SQUADS, ...squads].map(s => s.id));
    return { squads, joined: Array.isArray(data.joined) ? [...new Set<string>(data.joined.filter((id: string) => ids.has(id)))] : [], selected: ids.has(data.selected) ? data.selected : null, reactions: Array.isArray(data.reactions) ? data.reactions.filter((s: unknown) => typeof s === 'string').slice(0, 100) : [], moments: Array.isArray(data.moments) ? data.moments.filter((m: SharedMoment) => typeof m.note === 'string' && typeof m.id === 'string' && typeof m.date === 'string' && (!m.image || /^data:image\/(png|jpeg|webp);base64,/.test(m.image))).slice(0, 4) : [] };
  } catch { return emptySquadState(); }
}
export function findInvite(squads: Squad[], code: string) {
  const normalized = code.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return squads.find(s => s.code === normalized);
}
export function recoveryPoints(squad: Squad, exp: number) { return Math.min(1000, Math.max(0, squad.points + exp)); }
