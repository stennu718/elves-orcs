// Pure game logic functions — testable without React

export const CHARACTERS = [
  { id: 'knight', name: 'Sir Reginald', role: 'The Knight' },
  { id: 'diplomat', name: 'Lady Elara', role: 'The Diplomat' },
  { id: 'bishop', name: 'Bishop Thorne', role: 'The Bishop' },
  { id: 'treasurer', name: 'Lord Vance', role: 'The Treasurer' },
  { id: 'merchant', name: 'Madam Silk', role: 'The Merchant' },
  { id: 'jester', name: 'Jester Puck', role: 'The Jester' },
  { id: 'queen', name: 'Queen Eleanor', role: 'The Queen' },
  { id: 'guard', name: 'Captain Kael', role: 'The Guard' },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];
export const MAX_DAY = 5;
export const COUNCIL_SIZE = 3;
export const SPY_COUNT = 2;

/**
 * Select N random spies from the character list.
 * Uses provided random() for testability (pass Math.random for prod, ()=>0.3 for tests).
 */
export function selectSpies(random: () => number = Math.random): CharacterId[] {
  const arr = [...CHARACTERS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, SPY_COUNT).map(c => c.id) as CharacterId[];
}

/** Count how many spies are in the given council. */
export function countSpiesInCouncil(council: string[], spies: string[]): number {
  return council.filter(id => spies.includes(id)).length;
}

/** Check if the accusation is correct (all accused are spies, and exactly SPY_COUNT). */
export function checkAccusation(accused: string[], spies: string[]): boolean {
  if (accused.length !== SPY_COUNT) return false;
  return accused.every(id => spies.includes(id));
}

/** Toggle note status: clicking the same status resets to 'unknown'. */
export type NoteStatus = 'unknown' | 'innocent' | 'spy';

export function toggleNote(current: NoteStatus, clicked: NoteStatus): NoteStatus {
  return current === clicked ? 'unknown' : clicked;
}

/** Calculate combinations C(n, k) */
export function combinations(n: number, k: number): number {
  if (k === 0 || k === n) return 1;
  if (k > n) return 0;
  return combinations(n - 1, k - 1) + combinations(n - 1, k);
}
