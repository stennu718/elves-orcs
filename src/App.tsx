import React, { useEffect, useCallback, useMemo } from 'react';
import { Sword, Scroll, Book, Coins, ShoppingBag, VenetianMask, Crown, Shield, Check, Skull, AlertTriangle, RefreshCw, Sun, Moon, Volume2, VolumeX, Globe, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from './store/gameStore';
import { CHARACTERS } from './game/logic';
import type { CharacterId, NoteStatus } from './game/logic';
import { CHARACTER_DEFS } from './game/config';
import type { BotDifficulty } from './game/bot';
import { createBot, recordMission, chooseCouncil, makeAccusation } from './game/bot';
import { playSound, setSoundEnabled } from './game/sound';
import './i18n';
import i18n from './i18n';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Sword, Scroll, Book, Coins, ShoppingBag, VenetianMask, Crown, Shield,
  Check, Skull, AlertTriangle, RefreshCw, Sun, Moon, Volume2, VolumeX, Globe, BarChart3,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Sword;
}

// Memoized character card component
const CharacterCard = React.memo(function CharacterCard({
  charDef,
  isSelected,
  isAccusing,
  note,
  onSelect,
  onNoteChange,
  name,
  role,
  t,
}: {
  charDef: typeof CHARACTER_DEFS[0];
  isSelected: boolean;
  isAccusing: boolean;
  note: NoteStatus;
  onSelect: (id: CharacterId) => void;
  onNoteChange: (id: CharacterId, status: NoteStatus) => void;
  name: string;
  role: string;
  t: (key: string) => string;
}) {
  const Icon = getIcon(charDef.icon);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${name}, ${role}${isSelected ? `, ${t('accessibility.selected')}` : `, ${t('accessibility.notSelected')}`}`}
      className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer group
        ${isSelected
          ? isAccusing
            ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
            : 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
        }`}
      onClick={() => onSelect(charDef.id as CharacterId)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(charDef.id as CharacterId); } }}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors shrink-0
        ${isSelected
          ? isAccusing ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
          : 'bg-slate-950 text-slate-400 group-hover:text-amber-400/70'
        }`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-200 truncate">{name}</div>
        <div className="text-xs text-slate-500 truncate">{role}</div>
      </div>
      <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onNoteChange(charDef.id as CharacterId, 'innocent')}
          className={`p-2 rounded-lg transition-colors ${note === 'innocent' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-600'}`}
          title={t('notes.markInnocent')}
          aria-label={`${t('notes.markInnocent')}: ${name}`}
        >
          <Check size={16}/>
        </button>
        <button
          onClick={() => onNoteChange(charDef.id as CharacterId, 'spy')}
          className={`p-2 rounded-lg transition-colors ${note === 'spy' ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-800 text-slate-600'}`}
          title={t('notes.markSpy')}
          aria-label={`${t('notes.markSpy')}: ${name}`}
        >
          <Skull size={16}/>
        </button>
      </div>
    </div>
  );
});

export default function App() {
  const { t } = useTranslation();
  const store = useGameStore();

  // Sync sound setting
  useEffect(() => {
    setSoundEnabled(store.soundOn);
  }, [store.soundOn]);

  // Sync language
  useEffect(() => {
    i18n.changeLanguage(store.language);
  }, [store.language]);

  // Apply dark/light mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', store.darkMode ? 'dark' : 'light');
  }, [store.darkMode]);

  // Auto-play logic with bot AI
  useEffect(() => {
    if (!store.autoPlay || store.phase !== 'playing') return;

    // We need a persistent bot state for the auto-play
    let bot = createBot(store.botDifficulty);

    const timer = setTimeout(() => {
      const state = useGameStore.getState();
      const currentlyAccusing = state.isAccusing || state.day > state.config.maxDay;

      if (currentlyAccusing) {
        const accusation = makeAccusation(bot);
        if (accusation) {
          useGameStore.setState({ accused: accusation });
          // Execute after a brief pause
          setTimeout(() => {
            useGameStore.getState().executeAccusation();
          }, state.autoSpeed * 0.5);
        }
      } else if (state.currentCouncil.length < state.config.councilSize) {
        const council = chooseCouncil(bot, { councilSize: state.config.councilSize });
        // Add one character at a time for visual effect
        const nextChar = council.find(c => !state.currentCouncil.includes(c));
        if (nextChar) {
          useGameStore.getState().selectCharacter(nextChar);
        }
      } else if (state.currentCouncil.length === state.config.councilSize) {
        // Record mission in bot before dispatching
        const spies = useGameStore.getState().spies;
        const council = state.currentCouncil;
        const spyCount = council.filter(id => spies.includes(id)).length;
        recordMission(bot, council as CharacterId[], spyCount);
        useGameStore.getState().dispatchCouncil();
        // Reset bot for next round
        bot = createBot(store.botDifficulty);
        // Re-record previous missions
        const history = useGameStore.getState().history;
        for (const entry of [...history].reverse()) {
          recordMission(bot, entry.council as CharacterId[], entry.spiesCount);
        }
      }
    }, store.autoSpeed);

    return () => clearTimeout(timer);
  }, [store.autoPlay, store.currentCouncil, store.phase, store.autoSpeed, store.day, store.isAccusing, store.botDifficulty, store.accused]);

  const currentlyAccusing = store.isAccusing || store.day > store.config.maxDay;

  const handleSelect = useCallback((id: CharacterId) => {
    store.selectCharacter(id);
  }, [store]);

  const handleNoteChange = useCallback((id: CharacterId, status: NoteStatus) => {
    store.changeNote(id, status);
  }, [store]);

  // Character names from i18n
  const characterNames = useMemo(() => {
    const map: Record<string, { name: string; role: string }> = {};
    for (const def of CHARACTER_DEFS) {
      map[def.id] = {
        name: t(def.nameKey),
        role: t(def.roleKey),
      };
    }
    return map;
  }, [t]);

  // Game over screen
  if (store.phase !== 'playing') {
    const isWin = store.phase === 'won';
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-amber-500/30">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className={`max-w-md w-full p-8 rounded-2xl border ${isWin ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'} text-center relative overflow-hidden`}
        >
          <div className={`absolute top-0 left-0 w-full h-1 ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} />

          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border-4 ${isWin ? 'bg-emerald-900/50 text-emerald-400 border-emerald-900' : 'bg-red-900/50 text-red-400 border-red-900'}`}>
            {isWin ? <Crown size={40} /> : <Skull size={40} />}
          </div>

          <h1 className="text-4xl font-serif text-white mb-4">
            {isWin ? t('result.victory') : t('result.defeat')}
          </h1>

          <p className="text-slate-300 mb-8 leading-relaxed">
            {isWin ? t('result.victoryMsg') : t('result.defeatMsg')}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
              <div className="text-lg font-bold text-amber-400">{store.gamesPlayed}</div>
              <div className="text-xs text-slate-500">Played</div>
            </div>
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
              <div className="text-lg font-bold text-emerald-400">{store.gamesWon}</div>
              <div className="text-xs text-slate-500">Won</div>
            </div>
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
              <div className="text-lg font-bold text-amber-400">{store.bestStreak}</div>
              <div className="text-xs text-slate-500">Best Streak</div>
            </div>
          </div>

          <div className="mb-8 text-left bg-slate-900/80 p-5 rounded-xl border border-slate-800 shadow-inner">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">{t('result.realSpies')}</h3>
            <div className="space-y-3">
              {store.spies.map(id => {
                const names = characterNames[id];
                const def = CHARACTER_DEFS.find(c => c.id === id)!;
                const Icon = getIcon(def.icon);
                return (
                  <div key={id} className="flex items-center gap-3 text-slate-200 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-red-950/50 flex items-center justify-center text-red-400">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-medium">{names?.name}</div>
                      <div className="text-slate-500 text-xs">{names?.role}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => store.startNewGame()}
            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw size={18} /> {t('result.playAgain')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 selection:bg-amber-500/30 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with settings */}
        <header className="text-center mb-8 relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <button
              onClick={() => store.toggleDarkMode()}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors"
              title={t('settings.darkMode')}
              aria-label={t('settings.darkMode')}
            >
              {store.darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-400" />}
            </button>
            <button
              onClick={() => store.toggleSound()}
              className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors"
              title={t('settings.sound')}
              aria-label={t('settings.sound')}
            >
              {store.soundOn ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-slate-500" />}
            </button>
            <div className="relative">
              <select
                value={store.language}
                onChange={(e) => store.setLanguage(e.target.value)}
                className="appearance-none p-2 pl-8 rounded-lg bg-slate-900/60 border border-slate-800 hover:bg-slate-800 transition-colors text-sm cursor-pointer"
                aria-label={t('settings.language')}
              >
                <option value="en">EN</option>
                <option value="et">ET</option>
                <option value="ru">RU</option>
              </select>
              <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-amber-500 mb-3 drop-shadow-sm">{t('app.title')}</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
            {t('app.subtitle')}
          </p>
        </header>

        {/* Instructions */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mb-8 text-sm text-slate-400 max-w-3xl mx-auto text-center shadow-sm backdrop-blur-sm">
          <p>
            <strong className="text-amber-500 font-medium">{t('app.howToPlay')}:</strong>{' '}
            {t('app.howToPlayDesc')}
          </p>
        </div>

        {/* Auto-Play Controls */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mb-8 max-w-3xl mx-auto shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={() => store.toggleAutoPlay()}
                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  store.autoPlay
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {store.autoPlay ? t('ai.stopAI') : t('ai.watchAI')}
              </button>
              {store.autoPlay && (
                <span className="text-xs text-amber-400 animate-pulse">{t('ai.aiPlaying')}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {store.autoPlay && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{t('ai.speed')}</span>
                  {([1200, 800, 400] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => store.setAutoSpeed(speed)}
                      className={`px-2 py-1 rounded text-xs ${store.autoSpeed === speed ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {speed === 1200 ? t('ai.slow') : speed === 800 ? t('ai.normal') : t('ai.fast')}
                    </button>
                  ))}
                </div>
              )}
              {store.autoPlay && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{t('ai.difficulty')}</span>
                  {(['easy', 'medium', 'hard'] as BotDifficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => store.setBotDifficulty(d)}
                      className={`px-2 py-1 rounded text-xs ${store.botDifficulty === d ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {t(`ai.${d}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Left: Roster */}
          <div className="lg:col-span-4 order-2 lg:order-1 space-y-4" aria-label={t('accessibility.roster')}>
            <h2 className="text-xl font-serif text-amber-400 border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>{t('game.theCourt')}</span>
              <span className="text-xs font-sans text-slate-500 tracking-widest uppercase">{t('game.suspects', { count: 8 })}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {CHARACTER_DEFS.map(def => {
                const isSelected = currentlyAccusing
                  ? store.accused.includes(def.id)
                  : store.currentCouncil.includes(def.id);
                const note = store.notes[def.id] || 'unknown';
                const names = characterNames[def.id];

                return (
                  <CharacterCard
                    key={def.id}
                    charDef={def}
                    isSelected={isSelected}
                    isAccusing={currentlyAccusing}
                    note={note}
                    onSelect={handleSelect}
                    onNoteChange={handleNoteChange}
                    name={names?.name || ''}
                    role={names?.role || ''}
                    t={t}
                  />
                );
              })}
            </div>
          </div>

          {/* Middle: Action Area */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-6" aria-label={t('accessibility.missionArea')}>
            {!currentlyAccusing ? (
              <>
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                  <h2 className="text-3xl font-serif text-white mb-2">
                    {t('game.day', { day: store.day, max: store.config.maxDay })}
                  </h2>
                  <p className="text-sm text-slate-400">{t('game.assembleCouncil', { size: store.config.councilSize })}</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                  <h3 className="text-center text-slate-500 mb-6 text-xs uppercase tracking-widest font-bold">{t('game.currentCouncil')}</h3>
                  <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2].map(i => {
                      const charId = store.currentCouncil[i];
                      const def = charId ? CHARACTER_DEFS.find(c => c.id === charId) : null;
                      const Icon = def ? getIcon(def.icon) : null;
                      const name = charId ? characterNames[charId]?.name : null;

                      return (
                        <div key={i} className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-950/50 relative">
                          <AnimatePresence mode="wait">
                            {def && Icon && name ? (
                              <motion.div
                                key={def.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col items-center w-full p-1"
                              >
                                <Icon className="text-amber-400 mb-2" size={24} />
                                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider truncate w-full text-center px-1">
                                  {name.split(' ')[0]}
                                </span>
                              </motion.div>
                            ) : (
                              <motion.span
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-slate-700 font-serif text-2xl"
                              >
                                {i + 1}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    disabled={store.currentCouncil.length !== store.config.councilSize}
                    onClick={() => store.dispatchCouncil()}
                    className={`w-full py-4 rounded-xl font-medium transition-all ${
                      store.currentCouncil.length === store.config.councilSize
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {t('game.dispatchCouncil', { count: store.currentCouncil.length, size: store.config.councilSize })}
                  </button>
                </div>

                {store.day > 1 && (
                  <button
                    onClick={() => store.startAccusation()}
                    className="w-full py-4 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                  >
                    <AlertTriangle size={18} /> {t('game.makeAccusation')}
                  </button>
                )}
              </>
            ) : (
              <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                <h3 className="text-center text-red-400 mb-3 text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> {t('game.finalAccusation')}
                </h3>

                {store.day > store.config.maxDay && (
                  <p className="text-red-400 text-center mb-4 font-medium animate-pulse">{t('game.timeUp')}</p>
                )}
                {store.day <= store.config.maxDay && (
                  <p className="text-center text-slate-300 text-sm mb-6">{t('game.selectTwo')}</p>
                )}

                <div className="flex justify-center gap-6 mb-8 mt-4">
                  {[0, 1].map(i => {
                    const charId = store.accused[i];
                    const def = charId ? CHARACTER_DEFS.find(c => c.id === charId) : null;
                    const Icon = def ? getIcon(def.icon) : null;
                    const name = charId ? characterNames[charId]?.name : null;

                    return (
                      <div key={i} className="w-24 h-24 rounded-2xl border-2 border-dashed border-red-900/50 flex items-center justify-center bg-slate-950/50 relative">
                        <AnimatePresence mode="wait">
                          {def && Icon && name ? (
                            <motion.div
                              key={def.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex flex-col items-center w-full p-2"
                            >
                              <Icon className="text-red-400 mb-2" size={32} />
                              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider truncate w-full text-center px-1">
                                {name.split(' ')[0]}
                              </span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <Skull className="text-red-900/30" size={32} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={store.accused.length !== store.config.spyCount}
                  onClick={() => store.executeAccusation()}
                  className={`w-full py-4 rounded-xl font-medium transition-all mb-4 ${
                    store.accused.length === store.config.spyCount
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {t('game.executeSuspects', { count: store.accused.length })}
                </button>

                {store.day <= store.config.maxDay && (
                  <button
                    onClick={() => store.cancelAccusation()}
                    className="w-full py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors text-sm font-medium"
                  >
                    {t('game.cancelAccusation')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: History */}
          <div className="lg:col-span-4 order-3 lg:order-3 space-y-4" aria-label={t('accessibility.history')}>
            <h2 className="text-xl font-serif text-amber-400 border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>{t('game.missionLog')}</span>
              <span className="text-xs font-sans text-slate-500 tracking-widest uppercase">
                {t('game.records', { count: store.history.length })}
              </span>
            </h2>

            <div className="space-y-3">
              <AnimatePresence>
                {store.history.map((entry) => (
                  <motion.div
                    key={entry.day}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-amber-500 font-serif text-base">
                        {t('game.day', { day: entry.day, max: store.config.maxDay })}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        entry.spiesCount === 0
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                          : 'bg-red-950/50 text-red-400 border border-red-900/50'
                      }`}>
                        {entry.spiesCount} {entry.spiesCount === 1 ? t('game.spy') : t('game.spies')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {entry.council.map(id => {
                        const def = CHARACTER_DEFS.find(c => c.id === id);
                        const Icon = def ? getIcon(def.icon) : null;
                        const name = characterNames[id]?.name;
                        return (
                          <div key={id} className="flex-1 bg-slate-950/80 rounded-lg p-3 flex flex-col items-center justify-center text-center border border-slate-800/50">
                            {Icon && <Icon size={18} className="text-slate-400 mb-2" />}
                            <span className="text-[10px] text-slate-300 leading-tight uppercase tracking-wider font-medium">
                              {name?.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {store.history.length === 0 && (
                <div className="text-center p-10 text-slate-500 text-sm border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
                  {t('game.noMissions')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
