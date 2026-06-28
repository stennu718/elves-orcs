// Zustand store for game state management with devtools and persistence
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { selectSpies, countSpiesInCouncil, checkAccusation, toggleNote, CHARACTERS } from '../game/logic';
import type { NoteStatus, CharacterId } from '../game/logic';
import { DEFAULT_CONFIG } from '../game/config';
import type { GameConfig } from '../game/config';
import type { BotDifficulty } from '../game/bot';
import { isSoundEnabled, playSound } from '../game/sound';

export type GamePhase = 'playing' | 'won' | 'lost';

export interface MissionEntry {
  day: number;
  council: CharacterId[];
  spiesCount: number;
}

interface GameStore {
  // Game state
  phase: GamePhase;
  spies: CharacterId[];
  day: number;
  history: MissionEntry[];
  currentCouncil: CharacterId[];
  notes: Record<string, NoteStatus>;
  isAccusing: boolean;
  accused: CharacterId[];

  // Settings
  config: GameConfig;
  darkMode: boolean;
  soundOn: boolean;
  language: string;
  botDifficulty: BotDifficulty;

  // AI auto-play
  autoPlay: boolean;
  autoSpeed: number;

  // Stats
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;

  // Actions
  startNewGame: () => void;
  selectCharacter: (id: CharacterId) => void;
  changeNote: (id: CharacterId, status: NoteStatus) => void;
  dispatchCouncil: () => void;
  executeAccusation: () => void;
  startAccusation: () => void;
  cancelAccusation: () => void;
  toggleAutoPlay: () => void;
  setAutoSpeed: (speed: number) => void;
  toggleDarkMode: () => void;
  toggleSound: () => void;
  setLanguage: (lang: string) => void;
  setBotDifficulty: (d: BotDifficulty) => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        phase: 'playing',
        spies: selectSpies(),
        day: 1,
        history: [],
        currentCouncil: [],
        notes: {},
        isAccusing: false,
        accused: [],

        config: DEFAULT_CONFIG,
        darkMode: true,
        soundOn: true,
        language: 'en',
        botDifficulty: 'medium',

        autoPlay: false,
        autoSpeed: DEFAULT_CONFIG.autoPlaySpeed.normal,

        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        bestStreak: 0,

        startNewGame: () => {
          set({
            phase: 'playing',
            spies: selectSpies(),
            day: 1,
            history: [],
            currentCouncil: [],
            notes: {},
            isAccusing: false,
            accused: [],
            autoPlay: false,
          });
        },

        selectCharacter: (id) => {
          const state = get();
          if (state.phase !== 'playing') return;

          const currentlyAccusing = state.isAccusing || state.day > state.config.maxDay;

          if (currentlyAccusing) {
            if (state.accused.includes(id)) {
              set({ accused: state.accused.filter(x => x !== id) });
              if (isSoundEnabled()) playSound('deselect');
            } else if (state.accused.length < state.config.spyCount) {
              set({ accused: [...state.accused, id] });
              if (isSoundEnabled()) playSound('select');
            }
          } else {
            if (state.currentCouncil.includes(id)) {
              set({ currentCouncil: state.currentCouncil.filter(x => x !== id) });
              if (isSoundEnabled()) playSound('deselect');
            } else if (state.currentCouncil.length < state.config.councilSize) {
              set({ currentCouncil: [...state.currentCouncil, id] });
              if (isSoundEnabled()) playSound('select');
            }
          }
        },

        changeNote: (id, status) => {
          set((state) => ({
            notes: {
              ...state.notes,
              [id]: toggleNote(state.notes[id] || 'unknown', status),
            },
          }));
          if (isSoundEnabled()) playSound('note');
        },

        dispatchCouncil: () => {
          const state = get();
          if (state.currentCouncil.length !== state.config.councilSize) return;

          const spiesCount = countSpiesInCouncil(state.currentCouncil, state.spies);
          const newEntry: MissionEntry = {
            day: state.day,
            council: state.currentCouncil,
            spiesCount,
          };

          const nextDay = state.day + 1;
          const mustAccuse = nextDay > state.config.maxDay;

          set({
            history: [newEntry, ...state.history],
            currentCouncil: [],
            day: nextDay,
            isAccusing: mustAccuse,
            accused: [],
          });

          if (isSoundEnabled()) playSound('dispatch');
        },

        executeAccusation: () => {
          const state = get();
          if (state.accused.length !== state.config.spyCount) return;

          const correct = checkAccusation(state.accused, state.spies);
          const newPhase: GamePhase = correct ? 'won' : 'lost';

          set((s) => ({
            phase: newPhase,
            gamesPlayed: s.gamesPlayed + 1,
            gamesWon: correct ? s.gamesWon + 1 : s.gamesWon,
            currentStreak: correct ? s.currentStreak + 1 : 0,
            bestStreak: correct ? Math.max(s.bestStreak, s.currentStreak + 1) : s.bestStreak,
          }));

          if (isSoundEnabled()) playSound(correct ? 'victory' : 'defeat');
        },

        startAccusation: () => {
          set({ isAccusing: true, accused: [] });
          if (isSoundEnabled()) playSound('accuse');
        },

        cancelAccusation: () => {
          set({ isAccusing: false, accused: [] });
        },

        toggleAutoPlay: () => {
          const state = get();
          if (state.autoPlay) {
            set({ autoPlay: false });
          } else {
            get().startNewGame();
            set({ autoPlay: true });
          }
        },

        setAutoSpeed: (speed) => set({ autoSpeed: speed }),

        toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

        toggleSound: () => {
          const newState = !get().soundOn;
          set({ soundOn: newState });
        },

        setLanguage: (lang) => set({ language: lang }),

        setBotDifficulty: (d) => set({ botDifficulty: d }),
      }),
      {
        name: 'kings-and-spies-storage',
        partialize: (state) => ({
          darkMode: state.darkMode,
          soundOn: state.soundOn,
          language: state.language,
          botDifficulty: state.botDifficulty,
          gamesPlayed: state.gamesPlayed,
          gamesWon: state.gamesWon,
          currentStreak: state.currentStreak,
          bestStreak: state.bestStreak,
        }),
      }
    ),
    { name: 'GameStore' }
  )
);
