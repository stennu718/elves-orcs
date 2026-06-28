// Pure game logic functions — testable without React
// Enhanced with scoring, probability calculation, and validation

import { DEFAULT_CONFIG } from './config';

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
export const MAX_DAY = DEFAULT_CONFIG.maxDay;
export const COUNCIL_SIZE = DEFAULT_CONFIG.councilSize;
export const SPY_COUNT = DEFAULT_CONFIG.spyCount;

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
  // Use iterative approach for large values to avoid stack overflow
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

/** Validate that a council has the correct size and no duplicates */
export function isValidCouncil(council: string[]): boolean {
  if (council.length !== COUNCIL_SIZE) return false;
  return new Set(council).size === council.length;
}

/** Validate that an accusation has the correct size and no duplicates */
export function isValidAccusation(accused: string[]): boolean {
  if (accused.length !== SPY_COUNT) return false;
  return new Set(accused).size === accused.length;
}

/** Calculate the probability that a given character is a spy based on mission history */
export function calculateSpyProbability(
  characterId: string,
  history: { council: string[]; spiesCount: number }[],
  spyCount: number = SPY_COUNT
): number {
  const totalChars = CHARACTERS.length;
  // Base probability
  let prob = spyCount / totalChars;

  if (history.length === 0) return prob;

  // If character was on a mission with count == council size, likely a spy
  // If character was on a mission with count == 0, definitely innocent
  let confirmedInnocent = false;
  let spyScore = 0;
  let totalMissions = 0;

  for (const mission of history) {
    if (mission.council.includes(characterId)) {
      totalMissions++;
      if (mission.spiesCount === 0) {
        confirmedInnocent = true;
        break;
      }
      spyScore += mission.spiesCount / mission.council.length;
    }
  }

  if (confirmedInnocent) return 0;

  if (totalMissions > 0) {
    prob = spyScore / totalMissions;
  }

  return Math.min(Math.max(prob, 0), 1);
}

/** Calculate a score for the current game state (0-100) based on information gathered */
export function calculateInformationScore(
  history: { council: string[]; spiesCount: number }[],
  maxDay: number = MAX_DAY
): number {
  if (history.length === 0) return 0;

  const totalCouncilSlots = maxDay * COUNCIL_SIZE;
  const usedSlots = history.reduce((sum, m) => sum + m.council.length, 0);
  const coverageScore = (usedSlots / totalCouncilSlots) * 40;

  // Reward for informative missions (0 or high spy counts)
  const informativeMissions = history.filter(
    m => m.spiesCount === 0 || m.spiesCount >= 2
  ).length;
  const infoScore = (informativeMissions / history.length) * 60;

  return Math.min(Math.round(coverageScore + infoScore), 100);
}

/** Generate all possible councils (combinations of 3 from 8) */
export function generateAllCouncils(): string[][] {
  const ids = CHARACTERS.map(c => c.id);
  const result: string[][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      for (let k = j + 1; k < ids.length; k++) {
        result.push([ids[i], ids[j], ids[k]]);
      }
    }
  }
  return result;
}

/** Generate all possible accusations (combinations of 2 from 8) */
export function generateAllAccusations(): string[][] {
  const ids = CHARACTERS.map(c => c.id);
  const result: string[][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      result.push([ids[i], ids[j]]);
    }
  }
  return result;
}
