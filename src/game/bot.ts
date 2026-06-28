// Bot AI with strategic deduction and difficulty levels
import { selectSpies, countSpiesInCouncil, checkAccusation, CHARACTERS } from './logic';
import type { CharacterId } from './logic';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface MissionRecord {
  council: CharacterId[];
  spyCount: number;
}

interface BotState {
  difficulty: BotDifficulty;
  missions: MissionRecord[];
  suspects: Set<CharacterId>;       // Characters that could be spies
  innocents: Set<CharacterId>;      // Characters confirmed innocent
}

export function createBot(difficulty: BotDifficulty): BotState {
  return {
    difficulty,
    missions: [],
    suspects: new Set(CHARACTERS.map(c => c.id)),
    innocents: new Set(),
  };
}

export function recordMission(bot: BotState, council: CharacterId[], spyCount: number): void {
  bot.missions.push({ council, spyCount });

  if (bot.difficulty === 'easy') return; // Easy bots don't deduce

  // Deductive reasoning
  if (spyCount === 0) {
    // All council members are innocent
    council.forEach(id => {
      bot.innocents.add(id);
      bot.suspects.delete(id);
    });
  } else if (spyCount === council.length) {
    // All council members are spies (only works if council.length <= spyCount)
    council.forEach(id => {
      bot.suspects.add(id);
    });
  }

  if (bot.difficulty === 'hard') {
    // Hard bots do advanced elimination
    // If we know N innocents and spyCount == council.length - N_remaining_suspects_in_council
    // we can narrow down further
    const suspectsInCouncil = council.filter(id => bot.suspects.has(id));
    if (spyCount === suspectsInCouncil.length && suspectsInCouncil.length > 0) {
      // All suspects in council ARE the spies
      // Anyone not in council and not confirmed innocent must be innocent
      const allIds = CHARACTERS.map(c => c.id);
      allIds.forEach(id => {
        if (!council.includes(id) && !bot.suspects.has(id)) {
          bot.innocents.add(id);
        }
      });
    }
  }
}

export function chooseCouncil(bot: BotState, config: { councilSize: number }): CharacterId[] {
  const allIds = CHARACTERS.map(c => c.id);

  if (bot.difficulty === 'easy') {
    // Random selection
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.councilSize);
  }

  // Medium/Hard: strategic selection
  // Prefer to test suspects that haven't been tested together
  const suspects = allIds.filter(id => bot.suspects.has(id) && !bot.innocents.has(id));
  const untested = allIds.filter(id => !bot.innocents.has(id));

  if (suspects.length <= config.councilSize) {
    // Test all suspects + fill with random untested
    const remaining = untested.filter(id => !suspects.includes(id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    return [...suspects, ...shuffled].slice(0, config.councilSize);
  }

  // Pick suspects that give maximum information
  // Strategy: pick suspects that haven't been on missions together
  const shuffled = suspects.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, config.councilSize);
}

export function makeAccusation(bot: BotState): CharacterId[] | null {
  const suspects = Array.from(bot.suspects).filter(id => !bot.innocents.has(id));

  if (suspects.length === 2) {
    return suspects as CharacterId[];
  }

  if (bot.difficulty === 'easy' || suspects.length < 2) {
    // Random accusation from remaining suspects + random fill
    const allIds = CHARACTERS.map(c => c.id);
    const candidates = suspects.length >= 2 ? suspects : allIds;
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2) as CharacterId[];
  }

  // Medium/Hard: pick the 2 most suspicious
  // Score each suspect by how many missions with high spy counts they appeared in
  const scores = new Map<CharacterId, number>();
  for (const id of suspects) {
    let score = 0;
    for (const mission of bot.missions) {
      if (mission.council.includes(id)) {
        score += mission.spyCount;
      }
    }
    scores.set(id, score);
  }

  const sorted = suspects.sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
  return sorted.slice(0, 2) as CharacterId[];
}

/**
 * Simulate a full bot game and return whether it won.
 * Used for testing bot AI effectiveness.
 */
export function simulateBotGame(
  difficulty: BotDifficulty,
  actualSpies: CharacterId[],
  config: { maxDay: number; councilSize: number; spyCount: number }
): { won: boolean; daysUsed: number; missions: MissionRecord[] } {
  const bot = createBot(difficulty);

  for (let day = 1; day <= config.maxDay; day++) {
    const council = chooseCouncil(bot, { councilSize: config.councilSize });
    const spyCount = countSpiesInCouncil(council, actualSpies);
    recordMission(bot, council, spyCount);
  }

  const accusation = makeAccusation(bot);
  if (!accusation) {
    return { won: false, daysUsed: config.maxDay, missions: bot.missions };
  }

  const won = checkAccusation(accusation, actualSpies);
  return { won, daysUsed: config.maxDay, missions: bot.missions };
}
