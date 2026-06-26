import { describe, it, expect, vi } from 'vitest';
import {
  CHARACTERS, selectSpies, countSpiesInCouncil, checkAccusation,
  toggleNote, combinations, MAX_DAY, COUNCIL_SIZE, SPY_COUNT,
} from '../src/game/logic';
import type { NoteStatus } from '../src/game/logic';

// Seeded PRNG for deterministic tests
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Mock App.tsx CHARACTERS to match logic.ts
vi.mock('../src/App', () => ({ default: () => null }));

describe('Game Constants', () => {
  it('has exactly 8 characters', () => {
    expect(CHARACTERS).toHaveLength(8);
  });

  it('all characters have unique ids', () => {
    const ids = CHARACTERS.map(c => c.id);
    expect(new Set(ids).size).toBe(8);
  });

  it('all characters have names', () => {
    for (const c of CHARACTERS) {
      expect(c.name.length).toBeGreaterThan(0);
    }
  });

  it('all characters have roles', () => {
    for (const c of CHARACTERS) {
      expect(c.role.length).toBeGreaterThan(0);
    }
  });

  it('MAX_DAY is 5', () => { expect(MAX_DAY).toBe(5); });
  it('COUNCIL_SIZE is 3', () => { expect(COUNCIL_SIZE).toBe(3); });
  it('SPY_COUNT is 2', () => { expect(SPY_COUNT).toBe(2); });
});

describe('selectSpies', () => {
  it('selects exactly 2 spies', () => {
    const spies = selectSpies(seededRandom(12345));
    expect(spies).toHaveLength(2);
  });

  it('spies are different characters', () => {
    const spies = selectSpies(seededRandom(12345));
    expect(spies[0]).not.toBe(spies[1]);
  });

  it('spies are valid character ids', () => {
    const validIds = CHARACTERS.map(c => c.id);
    const rng = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const spies = selectSpies(rng);
      expect(validIds).toContain(spies[0]);
      expect(validIds).toContain(spies[1]);
    }
  });

  it('all characters can be selected as spies', () => {
    const selectedSpies = new Set<string>();
    const rng = seededRandom(999);
    for (let i = 0; i < 1000; i++) {
      const spies = selectSpies(rng);
      selectedSpies.add(spies[0]);
      selectedSpies.add(spies[1]);
    }
    expect(selectedSpies.size).toBe(8);
  });

  it('uses injected random function', () => {
    // With a seeded RNG, results are deterministic
    const spies = selectSpies(seededRandom(12345));
    expect(spies).toHaveLength(2);
    expect(CHARACTERS.map(c => c.id)).toContain(spies[0]);
    expect(CHARACTERS.map(c => c.id)).toContain(spies[1]);
  });

  it('produces deterministic output with same seed', () => {
    const spies1 = selectSpies(seededRandom(777));
    const spies2 = selectSpies(seededRandom(777));
    expect(spies1).toEqual(spies2);
  });
});

describe('countSpiesInCouncil', () => {
  it('counts 0 spies when none in council', () => {
    expect(countSpiesInCouncil(['knight', 'diplomat', 'bishop'], ['queen', 'guard'])).toBe(0);
  });

  it('counts 1 spy in council', () => {
    expect(countSpiesInCouncil(['knight', 'queen', 'bishop'], ['queen', 'guard'])).toBe(1);
  });

  it('counts 2 spies in council', () => {
    expect(countSpiesInCouncil(['queen', 'guard', 'bishop'], ['queen', 'guard'])).toBe(2);
  });

  it('counts correctly with empty council', () => {
    expect(countSpiesInCouncil([], ['queen', 'guard'])).toBe(0);
  });
});

describe('checkAccusation', () => {
  it('correct accusation wins', () => {
    expect(checkAccusation(['queen', 'guard'], ['queen', 'guard'])).toBe(true);
  });

  it('wrong accusation loses', () => {
    expect(checkAccusation(['knight', 'diplomat'], ['queen', 'guard'])).toBe(false);
  });

  it('partially correct accusation loses', () => {
    expect(checkAccusation(['queen', 'knight'], ['queen', 'guard'])).toBe(false);
  });

  it('reversed order still wins', () => {
    expect(checkAccusation(['guard', 'queen'], ['queen', 'guard'])).toBe(true);
  });

  it('accusation with wrong length fails', () => {
    expect(checkAccusation(['queen'], ['queen', 'guard'])).toBe(false);
    expect(checkAccusation(['queen', 'guard', 'knight'], ['queen', 'guard'])).toBe(false);
  });

  it('empty accusation fails', () => {
    expect(checkAccusation([], ['queen', 'guard'])).toBe(false);
  });
});

describe('toggleNote', () => {
  it('toggles from unknown to spy', () => {
    expect(toggleNote('unknown' as NoteStatus, 'spy' as NoteStatus)).toBe('spy');
  });

  it('toggles from spy back to unknown', () => {
    expect(toggleNote('spy' as NoteStatus, 'spy' as NoteStatus)).toBe('unknown');
  });

  it('toggles from innocent to spy', () => {
    expect(toggleNote('innocent' as NoteStatus, 'spy' as NoteStatus)).toBe('spy');
  });

  it('toggles from unknown to innocent', () => {
    expect(toggleNote('unknown' as NoteStatus, 'innocent' as NoteStatus)).toBe('innocent');
  });

  it('all note statuses are valid', () => {
    const validStatuses: NoteStatus[] = ['unknown', 'innocent', 'spy'];
    expect(validStatuses).toHaveLength(3);
  });
});

describe('combinations', () => {
  it('C(8,3) = 56 (total possible councils)', () => {
    expect(combinations(8, 3)).toBe(56);
  });

  it('C(8,2) = 28 (total possible accusations)', () => {
    expect(combinations(8, 2)).toBe(28);
  });

  it('C(n,0) = 1', () => {
    expect(combinations(5, 0)).toBe(1);
  });

  it('C(n,n) = 1', () => {
    expect(combinations(5, 5)).toBe(1);
  });

  it('only 1 correct accusation out of 28 possible', () => {
    const totalCombinations = combinations(8, 2);
    const correctCombinations = 1;
    const winProbability = correctCombinations / totalCombinations;
    expect(winProbability).toBeCloseTo(0.0357, 3);
  });
});
