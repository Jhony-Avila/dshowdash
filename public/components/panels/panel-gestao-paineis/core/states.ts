/* ═══════════════════════════════════════════════════════════════
 * panel-gestao-paineis/core/states.ts
 * @version 1.0.0
 * Panel state machine
 * ═══════════════════════════════════════════════════════════════ */

export const PHASES = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
  SAVING: 'SAVING',
} as const;

export type Phase = typeof PHASES[keyof typeof PHASES];

export function isValidTransition(from: Phase, to: Phase): boolean {
  const transitions: Record<Phase, Phase[]> = {
    IDLE: ['LOADING'],
    LOADING: ['READY', 'ERROR'],
    READY: ['LOADING', 'SAVING', 'ERROR'],
    SAVING: ['READY', 'ERROR'],
    ERROR: ['LOADING', 'IDLE'],
  };
  return transitions[from]?.includes(to) ?? false;
}
