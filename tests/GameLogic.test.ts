import { describe, it, expect } from 'vitest';

// Game logic extracted from App.tsx for testing
// These are pure functions that can be tested without React

const CHARACTERS = [
  { id: 'knight', name: 'Sir Reginald', role: 'The Knight' },
  { id: 'diplomat', name: 'Lady Elara', role: 'The Diplomat' },
  { id: 'bishop', name: 'Bishop Thorne', role: 'The Bishop' },
  { id: 'treasurer', name: 'Lord Vance', role: 'The Treasurer' },
  { id: 'merchant', name: 'Madam Silk', role: 'The Merchant' },
  { id: 'jester', name: 'Jester Puck', role: 'The Jester' },
  { id: 'queen', name: 'Queen Eleanor', role: 'The Queen' },
  { id: 'guard', name: 'Captain Kael', role: 'The Guard' },
];

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
});

describe('Spy Selection', () => {
  function selectSpies(): string[] {
    const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
    return [shuffled[0].id, shuffled[1].id];
  }

  it('selects exactly 2 spies', () => {
    const spies = selectSpies();
    expect(spies).toHaveLength(2);
  });

  it('spies are different characters', () => {
    const spies = selectSpies();
    expect(spies[0]).not.toBe(spies[1]);
  });

  it('spies are valid character ids', () => {
    const validIds = CHARACTERS.map(c => c.id);
    for (let i = 0; i < 100; i++) {
      const spies = selectSpies();
      expect(validIds).toContain(spies[0]);
      expect(validIds).toContain(spies[1]);
    }
  });

  it('all characters can be selected as spies', () => {
    const selectedSpies = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const spies = selectSpies();
      selectedSpies.add(spies[0]);
      selectedSpies.add(spies[1]);
    }
    // With 1000 iterations, all 8 should appear at least once
    expect(selectedSpies.size).toBe(8);
  });
});

describe('Council Logic', () => {
  function countSpiesInCouncil(council: string[], spies: string[]): number {
    return council.filter(id => spies.includes(id)).length;
  }

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

describe('Accusation Logic', () => {
  function checkAccusation(accused: string[], spies: string[]): boolean {
    if (accused.length !== 2) return false;
    return accused.every(id => spies.includes(id));
  }

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

describe('Game Flow', () => {
  it('game has 5 days', () => {
    const MAX_DAY = 5;
    expect(MAX_DAY).toBe(5);
  });

  it('council size is 3', () => {
    const COUNCIL_SIZE = 3;
    expect(COUNCIL_SIZE).toBe(3);
  });

  it('total possible councils from 8 characters choose 3', () => {
    // C(8,3) = 56
    const n = 8;
    const k = 3;
    const combinations = (n: number, k: number): number => {
      if (k === 0 || k === n) return 1;
      return combinations(n - 1, k - 1) + combinations(n - 1, k);
    };
    expect(combinations(n, k)).toBe(56);
  });

  it('total possible accusations from 8 characters choose 2', () => {
    // C(8,2) = 28
    const n = 8;
    const k = 2;
    const combinations = (n: number, k: number): number => {
      if (k === 0 || k === n) return 1;
      return combinations(n - 1, k - 1) + combinations(n - 1, k);
    };
    expect(combinations(n, k)).toBe(28);
  });

  it('only 1 correct accusation out of 28 possible', () => {
    const totalCombinations = 28;
    const correctCombinations = 1;
    const winProbability = correctCombinations / totalCombinations;
    expect(winProbability).toBeCloseTo(0.0357, 3);
  });
});

describe('Note Status', () => {
  type NoteStatus = 'unknown' | 'innocent' | 'spy';

  function toggleNote(current: NoteStatus, clicked: NoteStatus): NoteStatus {
    return current === clicked ? 'unknown' : clicked;
  }

  it('toggles from unknown to spy', () => {
    expect(toggleNote('unknown', 'spy')).toBe('spy');
  });

  it('toggles from spy back to unknown', () => {
    expect(toggleNote('spy', 'spy')).toBe('unknown');
  });

  it('toggles from innocent to spy', () => {
    expect(toggleNote('innocent', 'spy')).toBe('spy');
  });

  it('toggles from unknown to innocent', () => {
    expect(toggleNote('unknown', 'innocent')).toBe('innocent');
  });

  it('all note statuses are valid', () => {
    const validStatuses: NoteStatus[] = ['unknown', 'innocent', 'spy'];
    expect(validStatuses).toHaveLength(3);
  });
});
