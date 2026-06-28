import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock('lucide-react', () => {
  const createIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Sword: createIcon('Sword'),
    Scroll: createIcon('Scroll'),
    Book: createIcon('Book'),
    Coins: createIcon('Coins'),
    ShoppingBag: createIcon('ShoppingBag'),
    VenetianMask: createIcon('VenetianMask'),
    Crown: createIcon('Crown'),
    Shield: createIcon('Shield'),
    Check: createIcon('Check'),
    Skull: createIcon('Skull'),
    AlertTriangle: createIcon('AlertTriangle'),
    RefreshCw: createIcon('RefreshCw'),
    Sun: createIcon('Sun'),
    Moon: createIcon('Moon'),
    Volume2: createIcon('Volume2'),
    VolumeX: createIcon('VolumeX'),
    Globe: createIcon('Globe'),
    BarChart3: createIcon('BarChart3'),
  };
});

// Mock zustand store
vi.mock('../src/store/gameStore', () => {
  const { useState, useEffect } = require('react');
  return {
    useGameStore: () => ({
      phase: 'playing',
      spies: ['queen', 'guard'],
      day: 1,
      history: [],
      currentCouncil: [],
      notes: {},
      isAccusing: false,
      accused: [],
      config: { maxDay: 5, councilSize: 3, spyCount: 2, characterCount: 8, autoPlaySpeed: { slow: 1200, normal: 800, fast: 400 } },
      darkMode: true,
      soundOn: true,
      language: 'en',
      botDifficulty: 'medium',
      autoPlay: false,
      autoSpeed: 800,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      bestStreak: 0,
      startNewGame: vi.fn(),
      selectCharacter: vi.fn(),
      changeNote: vi.fn(),
      dispatchCouncil: vi.fn(),
      executeAccusation: vi.fn(),
      startAccusation: vi.fn(),
      cancelAccusation: vi.fn(),
      toggleAutoPlay: vi.fn(),
      setAutoSpeed: vi.fn(),
      toggleDarkMode: vi.fn(),
      toggleSound: vi.fn(),
      setLanguage: vi.fn(),
      setBotDifficulty: vi.fn(),
    }),
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })),
});

const CHARACTER_NAMES = [
  'Sir Reginald',
  'Lady Elara',
  'Bishop Thorne',
  'Lord Vance',
  'Madam Silk',
  'Jester Puck',
  'Queen Eleanor',
  'Captain Kael',
];

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders title', () => {
    render(<App />);
    expect(screen.getByText('Kings & Spies')).toBeInTheDocument();
  });

  it('shows Day 1 on first render', () => {
    render(<App />);
    const dayHeading = screen.getByRole('heading', { name: /Day/ });
    expect(dayHeading.textContent).toContain('Day 1');
  });

  it('renders all 8 character names', () => {
    render(<App />);
    for (const name of CHARACTER_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders settings buttons', () => {
    render(<App />);
    expect(screen.getByTitle('Dark Mode')).toBeInTheDocument();
    expect(screen.getByTitle('Sound Effects')).toBeInTheDocument();
  });

  it('renders AI controls', () => {
    render(<App />);
    expect(screen.getByText(/Watch AI Play/)).toBeInTheDocument();
  });

  it('renders instructions', () => {
    render(<App />);
    expect(screen.getByText(/How to play/)).toBeInTheDocument();
  });

  it('renders mission log section', () => {
    render(<App />);
    expect(screen.getByText(/Mission Log/)).toBeInTheDocument();
  });

  it('renders court section', () => {
    render(<App />);
    expect(screen.getByText(/The Court/)).toBeInTheDocument();
  });

  it('renders language selector', () => {
    render(<App />);
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
  });

  it('renders no missions message initially', () => {
    render(<App />);
    expect(screen.getByText(/No missions dispatched yet/)).toBeInTheDocument();
  });
});
