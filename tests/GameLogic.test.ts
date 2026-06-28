import { describe, it, expect } from 'vitest';
import {
  CHARACTERS, selectSpies, countSpiesInCouncil, checkAccusation,
  toggleNote, combinations, MAX_DAY, COUNCIL_SIZE, SPY_COUNT,
  isValidCouncil, isValidAccusation, calculateSpyProbability,
  calculateInformationScore, generateAllCouncils, generateAllAccusations,
} from '../src/game/logic';
import type { NoteStatus } from '../src/game/logic';

// Seeded PRNG for deterministic tests
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

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

  it('Fisher-Yates shuffle produces uniform distribution', () => {
    const counts: Record<string, number> = {};
    const rng = seededRandom(42);
    const iterations = 8000;
    for (let i = 0; i < iterations; i++) {
      const spies = selectSpies(rng);
      for (const s of spies) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    // Each character should appear roughly equally often
    const expected = (iterations * 2) / 8;
    for (const id of CHARACTERS.map(c => c.id)) {
      const count = counts[id] || 0;
      expect(count).toBeGreaterThan(expected * 0.7);
      expect(count).toBeLessThan(expected * 1.3);
    }
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

  it('counts correctly with empty spies', () => {
    expect(countSpiesInCouncil(['knight', 'diplomat', 'bishop'], [])).toBe(0);
  });

  it('counts correctly when all are spies', () => {
    expect(countSpiesInCouncil(['queen', 'guard', 'knight'], ['queen', 'guard', 'knight'])).toBe(3);
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

  it('duplicate in accusation fails', () => {
    expect(checkAccusation(['queen', 'queen'], ['queen', 'guard'])).toBe(false);
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

  it('toggles from innocent back to unknown', () => {
    expect(toggleNote('innocent' as NoteStatus, 'innocent' as NoteStatus)).toBe('unknown');
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

  it('C(n,k) = C(n, n-k)', () => {
    expect(combinations(8, 3)).toBe(combinations(8, 5));
    expect(combinations(7, 2)).toBe(combinations(7, 5));
  });

  it('C(n,1) = n', () => {
    expect(combinations(8, 1)).toBe(8);
    expect(combinations(5, 1)).toBe(5);
  });

  it('C(n,k) = 0 when k > n', () => {
    expect(combinations(3, 5)).toBe(0);
  });

  it('only 1 correct accusation out of 28 possible', () => {
    const totalCombinations = combinations(8, 2);
    const correctCombinations = 1;
    const winProbability = correctCombinations / totalCombinations;
    expect(winProbability).toBeCloseTo(0.0357, 3);
  });
});

describe('isValidCouncil', () => {
  it('valid council of 3 unique characters', () => {
    expect(isValidCouncil(['knight', 'diplomat', 'bishop'])).toBe(true);
  });

  it('invalid: wrong size', () => {
    expect(isValidCouncil(['knight', 'diplomat'])).toBe(false);
    expect(isValidCouncil(['knight', 'diplomat', 'bishop', 'queen'])).toBe(false);
  });

  it('invalid: duplicates', () => {
    expect(isValidCouncil(['knight', 'knight', 'diplomat'])).toBe(false);
  });

  it('invalid: empty', () => {
    expect(isValidCouncil([])).toBe(false);
  });
});

describe('isValidAccusation', () => {
  it('valid accusation of 2 unique characters', () => {
    expect(isValidAccusation(['queen', 'guard'])).toBe(true);
  });

  it('invalid: wrong size', () => {
    expect(isValidAccusation(['queen'])).toBe(false);
    expect(isValidAccusation(['queen', 'guard', 'knight'])).toBe(false);
  });

  it('invalid: duplicates', () => {
    expect(isValidAccusation(['queen', 'queen'])).toBe(false);
  });
});

describe('calculateSpyProbability', () => {
  it('returns base probability with no history', () => {
    const prob = calculateSpyProbability('knight', []);
    expect(prob).toBeCloseTo(2 / 8, 2);
  });

  it('returns 0 for confirmed innocent (on mission with 0 spies)', () => {
    const history = [{ council: ['knight', 'diplomat', 'bishop'], spiesCount: 0 }];
    const prob = calculateSpyProbability('knight', history);
    expect(prob).toBe(0);
  });

  it('returns higher probability for spy on mission with spies', () => {
    const history = [{ council: ['knight', 'diplomat', 'bishop'], spiesCount: 2 }];
    const prob = calculateSpyProbability('knight', history);
    expect(prob).toBeGreaterThan(0);
  });
});

describe('calculateInformationScore', () => {
  it('returns 0 with no history', () => {
    expect(calculateInformationScore([])).toBe(0);
  });

  it('returns higher score for informative missions', () => {
    const history = [
      { council: ['knight', 'diplomat', 'bishop'], spiesCount: 0 },
      { council: ['knight', 'diplomat', 'queen'], spiesCount: 1 },
    ];
    const score = calculateInformationScore(history);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('generateAllCouncils', () => {
  it('generates exactly 56 councils', () => {
    const councils = generateAllCouncils();
    expect(councils).toHaveLength(56);
  });

  it('each council has 3 unique characters', () => {
    const councils = generateAllCouncils();
    for (const c of councils) {
      expect(c).toHaveLength(3);
      expect(new Set(c).size).toBe(3);
    }
  });

  it('all councils are unique', () => {
    const councils = generateAllCouncils();
    const keys = councils.map(c => c.sort().join(','));
    expect(new Set(keys).size).toBe(56);
  });
});

describe('generateAllAccusations', () => {
  it('generates exactly 28 accusations', () => {
    const accusations = generateAllAccusations();
    expect(accusations).toHaveLength(28);
  });

  it('each accusation has 2 unique characters', () => {
    const accusations = generateAllAccusations();
    for (const a of accusations) {
      expect(a).toHaveLength(2);
      expect(new Set(a).size).toBe(2);
    }
  });
});
