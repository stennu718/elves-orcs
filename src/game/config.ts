// Game configuration — external config for roles, timing, win conditions
export interface GameConfig {
  maxDay: number;
  councilSize: number;
  spyCount: number;
  characterCount: number;
  autoPlaySpeed: {
    slow: number;
    normal: number;
    fast: number;
  };
}

export const DEFAULT_CONFIG: GameConfig = {
  maxDay: 5,
  councilSize: 3,
  spyCount: 2,
  characterCount: 8,
  autoPlaySpeed: {
    slow: 1200,
    normal: 800,
    fast: 400,
  },
};

// Character definitions with i18n keys
export interface CharacterDef {
  id: string;
  nameKey: string;       // i18n key for name
  roleKey: string;       // i18n key for role
  icon: string;          // lucide icon name
}

export const CHARACTER_DEFS: CharacterDef[] = [
  { id: 'knight', nameKey: 'characters.knight.name', roleKey: 'characters.knight.role', icon: 'Sword' },
  { id: 'diplomat', nameKey: 'characters.diplomat.name', roleKey: 'characters.diplomat.role', icon: 'Scroll' },
  { id: 'bishop', nameKey: 'characters.bishop.name', roleKey: 'characters.bishop.role', icon: 'Book' },
  { id: 'treasurer', nameKey: 'characters.treasurer.name', roleKey: 'characters.treasurer.role', icon: 'Coins' },
  { id: 'merchant', nameKey: 'characters.merchant.name', roleKey: 'characters.merchant.role', icon: 'ShoppingBag' },
  { id: 'jester', nameKey: 'characters.jester.name', roleKey: 'characters.jester.role', icon: 'VenetianMask' },
  { id: 'queen', nameKey: 'characters.queen.name', roleKey: 'characters.queen.role', icon: 'Crown' },
  { id: 'guard', nameKey: 'characters.guard.name', roleKey: 'characters.guard.role', icon: 'Shield' },
];
