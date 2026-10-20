export type TourRect = { x: number; y: number; width: number; height: number };

export const HOME_TOUR_STEPS = [
  { id: 'streak', copy: '', action: 'Let’s go' },
  { id: 'welcome', copy: 'Welcome to your recovery space. Your island grows with your mood, activity, and recovery.', action: 'Show me around' },
  { id: 'island', copy: 'This is your recovery island. Each island represents one recovery journey. Most islands grow over 7 days, with small daily steps.', action: 'Next' },
  { id: 'goals', copy: 'These small goals help your island recover. Follow Lin’s plan or choose small tasks that help you feel grounded.', action: 'Next' },
  { id: 'add', copy: 'Add your own goal. You can add breathing, stretching, journaling, or any small task you need.', action: 'Got it!' },
] as const;

export function tourLayout(step: number, width: number, height: number, target: TourRect | null, panelHeight: number) {
  const unit = width / 393;
  const gap = 20 * unit;
  const highlight = target ? {
    x: Math.max(10 * unit, target.x - 8 * unit),
    y: Math.max(0, target.y - 8 * unit),
    width: Math.min(width - 20 * unit, target.width + 16 * unit),
    height: Math.max(0, Math.min(height, target.y + target.height + 8 * unit) - Math.max(0, target.y - 8 * unit)),
  } : null;
  const preferred = step === 1 ? height * .44 : step === 2 && highlight
    ? highlight.y + highlight.height + 38 * unit
    : highlight ? highlight.y - panelHeight - 20 * unit : height * .44;
  return { highlight, panel: { x: gap, y: Math.max(108 * unit, Math.min(preferred, height - panelHeight - 16 * unit)), width: width - gap * 2 } };
}
