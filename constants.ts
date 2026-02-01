import { ShopItem, TierConfig } from './types';

export const FREEDOM_COST = 800;
export const INITIAL_CHIPS = 40; // Reduced from 50
export const INITIAL_SACRIFICES = 1; // Reduced from 3
export const MAX_LOADOUT_SLOTS = 5;

// Cost to unlock slots: 2nd slot costs 50, 3rd 100, etc.
// Index 0 is free (already unlocked), Index 1 is cost for 2nd slot...
export const SLOT_UNLOCK_COSTS = [0, 50, 100, 200, 500];

export const TIERS: TierConfig[] = [
  {
    id: 'tier_1',
    name: '贫民窟',
    subtext: '外围区域',
    cost: 0,
    slots: 4,
    deckSize: 15,
    color: 'text-slate-400 border-slate-600'
  },
  {
    id: 'tier_2',
    name: '机密场',
    subtext: '常规博弈',
    cost: 50, // Increased from 5
    slots: 5,
    deckSize: 20,
    color: 'text-purple-400 border-purple-500'
  },
  {
    id: 'tier_3',
    name: '核心区',
    subtext: '高风险禁区',
    cost: 100, // Increased from 20
    slots: 6,
    deckSize: 30,
    color: 'text-red-500 border-red-600 shadow-red-900/20'
  }
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'freedom_contract',
    name: '赎身契约',
    description: '最终目标。支付800筹码，购回自由身，通关游戏。',
    cost: 800,
    type: 'CONSUMABLE', // Consumed immediately
    isSoulbound: true
  },
  {
    id: 'jackpot_amulet',
    name: '贪婪护符', // Renamed from Jackpot
    description: '携带时，牌库中增加一张数字 100 的牌。灵魂绑定（死亡不掉落）。',
    cost: 100,
    type: 'PASSIVE',
    isSoulbound: true // Persistent
  },
  {
    id: 'expansion_chip',
    name: '扩容芯片',
    description: '被动道具。牌库上限 +5。可叠加，死亡掉落。',
    cost: 30,
    type: 'PASSIVE',
    isSoulbound: false
  },
  {
    id: 'extra_sacrifice',
    name: '备用换牌', // Renamed from 备用祭品
    description: '局内增加 1 次换牌机会。', // Renamed from 献祭
    cost: 5, // Reduced from 15
    type: 'CONSUMABLE',
    isSoulbound: false
  },
  {
    id: 'void_goggles',
    name: '虚空透镜',
    description: '消耗品。查看盲注的两张牌。',
    cost: 100,
    type: 'CONSUMABLE',
    isSoulbound: false
  },
  {
    id: 'small_bet',
    name: '小额加注',
    description: '消耗品。本局获胜额外获得 50 筹码。',
    cost: 30,
    type: 'CONSUMABLE',
    isSoulbound: false
  }
];