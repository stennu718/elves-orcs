import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock motion/react
vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
    span: 'span',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock lucide-react — return simple spans for all icons
vi.mock('lucide-react', () => {
  const createIcon = (name: string) => {
    const Icon = () => <span data-testid={`icon-${name}`} />;
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
  };
});

// Mock matchMedia
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

// Helper: match text that may be split across child elements
function getByTextContent(text: string) {
  return screen.getByText((content, element) => {
    const hasText = (node: Element) => node.textContent === text;
    const nodeHasText = hasText(element as Element);
    const childrenDontHaveText = Array.from((element as Element).children).every(
      (child) => !hasText(child)
    );
    return nodeHasText && childrenDontHaveText;
  });
}

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Kings & Spies" title', () => {
    render(<App />);
    expect(screen.getByText('Kings & Spies')).toBeInTheDocument();
  });

  it('shows "Day 1 / 5" on the first day', () => {
    render(<App />);
    // The text is split: "Day 1 " and "/ 5" in a span — check the heading
    const dayHeading = screen.getByRole('heading', { name: /Day/ });
    expect(dayHeading.textContent).toBe('Day 1 / 5');
  });

  it('renders all 8 character names', () => {
    render(<App />);
    for (const name of CHARACTER_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('clicking a character adds them to currentCouncil', () => {
    render(<App />);
    const charName = 'Sir Reginald';
    fireEvent.click(screen.getByText(charName));
    // After selecting, the dispatch council button should show "(1/3)"
    const buttons = screen.getAllByRole('button');
    const dispatchBtn = buttons.find(b => b.textContent?.includes('Dispatch Council'));
    expect(dispatchBtn).toBeTruthy();
    expect(dispatchBtn?.textContent).toContain('1/3');
  });

  it('clicking "Dispatch Council" adds to history', () => {
    render(<App />);

    // Select 3 characters
    fireEvent.click(screen.getByText('Sir Reginald'));
    fireEvent.click(screen.getByText('Lady Elara'));
    fireEvent.click(screen.getByText('Bishop Thorne'));

    // Dispatch
    fireEvent.click(screen.getByText(/Dispatch Council/));

    // After dispatch, day should advance to 2 — check the heading element
    const dayHeading = screen.getByRole('heading', { name: /Day/ });
    expect(dayHeading.textContent).toBe('Day 2 / 5');
  });

  it('after 5 days, accusation mode activates', () => {
    render(<App />);

    // Play through 5 days
    for (let day = 1; day <= 5; day++) {
      // Select first 3 characters each day
      fireEvent.click(screen.getByText('Sir Reginald'));
      fireEvent.click(screen.getByText('Lady Elara'));
      fireEvent.click(screen.getByText('Bishop Thorne'));
      fireEvent.click(screen.getByText(/Dispatch Council/));
    }

    // After day 5, accusation mode should be active
    expect(screen.getByText(/Final Accusation|Make Final Accusation/)).toBeInTheDocument();
  });

  it('correct accusation shows "Victory!"', () => {
    render(<App />);

    // Play through 5 days
    for (let day = 1; day <= 5; day++) {
      fireEvent.click(screen.getByText('Sir Reginald'));
      fireEvent.click(screen.getByText('Lady Elara'));
      fireEvent.click(screen.getByText('Bishop Thorne'));
      fireEvent.click(screen.getByText(/Dispatch Council/));
    }

    // Accuse 2 characters
    fireEvent.click(screen.getByText('Queen Eleanor'));
    fireEvent.click(screen.getByText('Captain Kael'));

    // Click Execute Suspects
    fireEvent.click(screen.getByText(/Execute Suspects/));

    // Either victory or defeat should appear
    const victory = screen.queryByText('Victory!');
    const fallen = screen.queryByText('Kingdom Fallen');
    expect(victory || fallen).toBeTruthy();
  });

  it('wrong accusation shows "Kingdom Fallen"', () => {
    render(<App />);

    // Play through 5 days
    for (let day = 1; day <= 5; day++) {
      fireEvent.click(screen.getByText('Sir Reginald'));
      fireEvent.click(screen.getByText('Lady Elara'));
      fireEvent.click(screen.getByText('Bishop Thorne'));
      fireEvent.click(screen.getByText(/Dispatch Council/));
    }

    // Accuse 2 characters
    fireEvent.click(screen.getByText('Queen Eleanor'));
    fireEvent.click(screen.getByText('Captain Kael'));
    fireEvent.click(screen.getByText(/Execute Suspects/));

    // Game should end — either victory or defeat
    const victory = screen.queryByText('Victory!');
    const fallen = screen.queryByText('Kingdom Fallen');
    expect(victory || fallen).toBeTruthy();
  });

  it('clicking "Play Again" (New Game) resets the game', () => {
    render(<App />);

    // Play through 5 days to end the game
    for (let day = 1; day <= 5; day++) {
      fireEvent.click(screen.getByText('Sir Reginald'));
      fireEvent.click(screen.getByText('Lady Elara'));
      fireEvent.click(screen.getByText('Bishop Thorne'));
      fireEvent.click(screen.getByText(/Dispatch Council/));
    }

    // Accuse to end the game
    fireEvent.click(screen.getByText('Queen Eleanor'));
    fireEvent.click(screen.getByText('Captain Kael'));
    fireEvent.click(screen.getByText(/Execute Suspects/));

    // Game ended — look for "Play Again" button
    const playAgainBtn = screen.getByText(/Play Again/);
    expect(playAgainBtn).toBeInTheDocument();

    // Click Play Again
    fireEvent.click(playAgainBtn);

    // Game should reset — Day 1 should be visible again
    const dayHeading = screen.getByRole('heading', { name: /Day/ });
    expect(dayHeading.textContent).toBe('Day 1 / 5');
    expect(screen.getByText('Kings & Spies')).toBeInTheDocument();
  });
});
