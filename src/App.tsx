import React, { useState, useEffect } from 'react';
import { Sword, Scroll, Book, Coins, ShoppingBag, VenetianMask, Crown, Shield, Check, Skull, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type NoteStatus = 'unknown' | 'innocent' | 'spy';

interface Character {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
}

const CHARACTERS: Character[] = [
  { id: 'knight', name: 'Sir Reginald', role: 'The Knight', icon: Sword },
  { id: 'diplomat', name: 'Lady Elara', role: 'The Diplomat', icon: Scroll },
  { id: 'bishop', name: 'Bishop Thorne', role: 'The Bishop', icon: Book },
  { id: 'treasurer', name: 'Lord Vance', role: 'The Treasurer', icon: Coins },
  { id: 'merchant', name: 'Madam Silk', role: 'The Merchant', icon: ShoppingBag },
  { id: 'jester', name: 'Jester Puck', role: 'The Jester', icon: VenetianMask },
  { id: 'queen', name: 'Queen Eleanor', role: 'The Queen', icon: Crown },
  { id: 'guard', name: 'Captain Kael', role: 'The Guard', icon: Shield },
];

export default function App() {
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [spies, setSpies] = useState<string[]>([]);
  const [day, setDay] = useState(1);
  const [history, setHistory] = useState<{ day: number, council: string[], spiesCount: number }[]>([]);
  const [currentCouncil, setCurrentCouncil] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, NoteStatus>>({});
  const [isAccusing, setIsAccusing] = useState(false);
  const [accused, setAccused] = useState<string[]>([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
    setSpies([shuffled[0].id, shuffled[1].id]);
    setGameState('playing');
    setDay(1);
    setHistory([]);
    setCurrentCouncil([]);
    setNotes({});
    setIsAccusing(false);
    setAccused([]);
  };

  const handleSelect = (id: string) => {
    if (isAccusing) {
      if (accused.includes(id)) {
        setAccused(accused.filter(x => x !== id));
      } else if (accused.length < 2) {
        setAccused([...accused, id]);
      }
    } else {
      if (currentCouncil.includes(id)) {
        setCurrentCouncil(currentCouncil.filter(x => x !== id));
      } else if (currentCouncil.length < 3) {
        setCurrentCouncil([...currentCouncil, id]);
      }
    }
  };

  const handleNoteChange = (id: string, status: NoteStatus) => {
    setNotes(prev => ({
      ...prev,
      [id]: prev[id] === status ? 'unknown' : status
    }));
  };

  const dispatchCouncil = () => {
    if (currentCouncil.length !== 3) return;
    const spiesCount = currentCouncil.filter(id => spies.includes(id)).length;
    setHistory([{ day, council: currentCouncil, spiesCount }, ...history]);
    setCurrentCouncil([]);

    const nextDay = day + 1;
    setDay(nextDay);
    if (nextDay > 5) {
      setIsAccusing(true);
      setAccused([]);
    }
  };

  const executeAccusation = () => {
    if (accused.length !== 2) return;
    const correct = accused.every(id => spies.includes(id));
    if (correct) {
      setGameState('won');
    } else {
      setGameState('lost');
    }
  };

  const mustAccuse = day > 5;
  const currentlyAccusing = isAccusing || mustAccuse;

  if (gameState !== 'playing') {
    const isWin = gameState === 'won';
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
            {isWin ? 'Victory!' : 'Kingdom Fallen'}
          </h1>
          
          <p className="text-slate-300 mb-8 leading-relaxed">
            {isWin
              ? "You successfully identified the spies and saved the kingdom from ruin. The throne is secure."
              : "You executed the wrong people. The real spies have overthrown the throne and the kingdom is lost."}
          </p>

          <div className="mb-8 text-left bg-slate-900/80 p-5 rounded-xl border border-slate-800 shadow-inner">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-4">The Real Spies Were:</h3>
            <div className="space-y-3">
              {spies.map(id => {
                const char = CHARACTERS.find(c => c.id === id)!;
                return (
                  <div key={id} className="flex items-center gap-3 text-slate-200 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-red-950/50 flex items-center justify-center text-red-400">
                      <char.icon size={16} />
                    </div>
                    <div>
                      <div className="font-medium">{char.name}</div>
                      <div className="text-slate-500 text-xs">{char.role}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            onClick={startNewGame}
            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw size={18} /> Play Again
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
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-amber-500 mb-3 drop-shadow-sm">Kings & Spies</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
            Find the 2 hidden spies in your court before Day 5 ends.
          </p>
        </header>

        {/* Instructions */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mb-8 text-sm text-slate-400 max-w-3xl mx-auto text-center shadow-sm backdrop-blur-sm">
          <p>
            <strong className="text-amber-500 font-medium">How to play:</strong> You have 5 days to find the 2 hidden spies. Each day, send 3 characters on a mission. The log will tell you how many spies were on that mission. Use the <Check size={14} className="inline text-emerald-500/70 mx-1"/> and <Skull size={14} className="inline text-red-500/70 mx-1"/> buttons to take notes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left: Roster */}
          <div className="lg:col-span-4 order-2 lg:order-1 space-y-4">
            <h2 className="text-xl font-serif text-amber-400 border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>The Court</span>
              <span className="text-xs font-sans text-slate-500 tracking-widest uppercase">8 Suspects</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {CHARACTERS.map(c => {
                const isSelected = currentlyAccusing ? accused.includes(c.id) : currentCouncil.includes(c.id);
                const note = notes[c.id];
                
                return (
                  <div
                    key={c.id}
                    className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer group
                      ${isSelected
                        ? currentlyAccusing
                          ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    onClick={() => handleSelect(c.id)}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors
                      ${isSelected 
                        ? currentlyAccusing ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
                        : 'bg-slate-950 text-slate-400 group-hover:text-amber-400/70'
                      }`}
                    >
                      <c.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-200 truncate">{c.name}</div>
                      <div className="text-xs text-slate-500 truncate">{c.role}</div>
                    </div>
                    <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleNoteChange(c.id, 'innocent')}
                        className={`p-2 rounded-lg transition-colors ${note === 'innocent' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-800 text-slate-600'}`}
                        title="Mark as Innocent"
                      >
                        <Check size={16}/>
                      </button>
                      <button
                        onClick={() => handleNoteChange(c.id, 'spy')}
                        className={`p-2 rounded-lg transition-colors ${note === 'spy' ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-800 text-slate-600'}`}
                        title="Mark as Spy"
                      >
                        <Skull size={16}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle: Action Area */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-6">
            {!currentlyAccusing ? (
              <>
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                  <h2 className="text-3xl font-serif text-white mb-2">Day {day} <span className="text-slate-600">/ 5</span></h2>
                  <p className="text-sm text-slate-400">Assemble a council of 3 to investigate.</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
                  <h3 className="text-center text-slate-500 mb-6 text-xs uppercase tracking-widest font-bold">Current Council</h3>
                  <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2].map(i => {
                      const char = currentCouncil[i] ? CHARACTERS.find(c => c.id === currentCouncil[i]) : null;
                      return (
                        <div key={i} className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center bg-slate-950/50 relative">
                          <AnimatePresence mode="wait">
                            {char ? (
                              <motion.div
                                key={char.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col items-center w-full p-1"
                              >
                                <char.icon className="text-amber-400 mb-2" size={24} />
                                <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider truncate w-full text-center px-1">{char.name.split(' ')[0]}</span>
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
                      )
                    })}
                  </div>
                  <button
                    disabled={currentCouncil.length !== 3}
                    onClick={dispatchCouncil}
                    className={`w-full py-4 rounded-xl font-medium transition-all ${
                      currentCouncil.length === 3
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Dispatch Council ({currentCouncil.length}/3)
                  </button>
                </div>

                {day > 1 && (
                  <button
                    onClick={() => {
                      setIsAccusing(true);
                      setAccused([]);
                    }}
                    className="w-full py-4 rounded-xl border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
                  >
                    <AlertTriangle size={18} /> Make Final Accusation
                  </button>
                )}
              </>
            ) : (
              <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                
                <h3 className="text-center text-red-400 mb-3 text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> Final Accusation
                </h3>
                
                {mustAccuse && <p className="text-red-400 text-center mb-4 font-medium animate-pulse">Time is up! You must make your final accusation.</p>}
                {!mustAccuse && <p className="text-center text-slate-300 text-sm mb-6">Select exactly 2 suspects to execute. If you are wrong, the kingdom falls.</p>}
                
                <div className="flex justify-center gap-6 mb-8 mt-4">
                  {[0, 1].map(i => {
                    const char = accused[i] ? CHARACTERS.find(c => c.id === accused[i]) : null;
                    return (
                      <div key={i} className="w-24 h-24 rounded-2xl border-2 border-dashed border-red-900/50 flex items-center justify-center bg-slate-950/50 relative">
                        <AnimatePresence mode="wait">
                          {char ? (
                            <motion.div
                              key={char.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex flex-col items-center w-full p-2"
                            >
                              <char.icon className="text-red-400 mb-2" size={32} />
                              <span className="text-[11px] text-slate-300 font-medium uppercase tracking-wider truncate w-full text-center px-1">{char.name.split(' ')[0]}</span>
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
                    )
                  })}
                </div>
                
                <button
                  disabled={accused.length !== 2}
                  onClick={executeAccusation}
                  className={`w-full py-4 rounded-xl font-medium transition-all mb-4 ${
                    accused.length === 2
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Execute Suspects ({accused.length}/2)
                </button>
                
                {!mustAccuse && (
                  <button
                    onClick={() => {
                      setIsAccusing(false);
                      setAccused([]);
                    }}
                    className="w-full py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors text-sm font-medium"
                  >
                    Cancel Accusation
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: History */}
          <div className="lg:col-span-4 order-3 lg:order-3 space-y-4">
            <h2 className="text-xl font-serif text-amber-400 border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>Mission Log</span>
              <span className="text-xs font-sans text-slate-500 tracking-widest uppercase">{history.length} Records</span>
            </h2>
            
            <div className="space-y-3">
              <AnimatePresence>
                {history.map((entry) => (
                  <motion.div
                    key={entry.day}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 shadow-sm backdrop-blur-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-amber-500 font-serif text-base">Day {entry.day}</span>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${entry.spiesCount === 0 ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50' : 'bg-red-950/50 text-red-400 border border-red-900/50'}`}>
                        {entry.spiesCount} {entry.spiesCount === 1 ? 'Spy' : 'Spies'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {entry.council.map(id => {
                        const char = CHARACTERS.find(c => c.id === id)!;
                        return (
                          <div key={id} className="flex-1 bg-slate-950/80 rounded-lg p-3 flex flex-col items-center justify-center text-center border border-slate-800/50">
                            <char.icon size={18} className="text-slate-400 mb-2" />
                            <span className="text-[10px] text-slate-300 leading-tight uppercase tracking-wider font-medium">{char.name.split(' ')[0]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {history.length === 0 && (
                <div className="text-center p-10 text-slate-500 text-sm border-2 border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
                  No missions dispatched yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
