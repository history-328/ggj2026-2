export enum GamePhase {
  MENU = 'MENU',
  PREPARATION = 'PREPARATION', // Replaces SHOP, now includes warehouse management
  PLAYING = 'PLAYING',
  REVELATION = 'REVELATION',
  GAME_OVER = 'GAME_OVER',
  ROUND_WIN = 'ROUND_WIN',
  BANKRUPTCY = 'BANKRUPTCY',
  VICTORY = 'VICTORY'
}

export enum SlotType {
  EMPTY = 'EMPTY',
  OPEN = 'OPEN',
  BLIND = 'BLIND'
}

export interface CardData {
  id: string;
  value: number;
  isJackpot?: boolean;
}

export interface GameSlot {
  id: number;
  type: SlotType;
  value?: number;
  blindCards?: CardData[];
  selectedValue?: number;
}

// New Item System
export interface InventoryItem {
  uuid: string; // Unique instance ID
  itemId: string; // Reference to ShopItem ID
  name: string;
  isSoulbound: boolean; // If true, persists on death
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'PASSIVE' | 'CONSUMABLE';
  isSoulbound: boolean; // Default property for new items
}

export interface TierConfig {
  id: string;
  name: string;
  subtext: string;
  cost: number;
  slots: number;
  deckSize: number;
  color: string;
}

export interface PlayerStats {
  chips: number;
  runs: number;
  activeTier: TierConfig | null;
  
  // New Inventory System
  warehouse: InventoryItem[];
  loadout: InventoryItem[];
  unlockedLoadoutSlots: number; // 1 to 5

  activeBuffs: {
    smallBet: boolean; // Renamed from doubleDown
    extraSacrificeUsed: number;
  };
  hasWon: boolean;
}