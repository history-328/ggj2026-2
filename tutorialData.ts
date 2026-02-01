import { CardData } from './types';

export interface TutorialStep {
  id: number;
  text: string;
  highlightTarget: 'slot-0' | 'slot-1' | 'slot-2' | 'slot-3' | 'btn-sacrifice' | 'btn-void-toggle' | 'hand-card';
  requiredAction: 'place' | 'sacrifice' | 'toggle-void' | 'resolve';
  allowedSlotIndex?: number;
}

// Rigged Deck Logic (1-15 Range):
// Initial Hand: 3
// Draw 1: 5 (For Slot 1)
// Draw 2: 1 (Bad card, < 5, forces Swap)
// Draw 3: 8 (After swap)
// Draw 4: 10 (Hidden card 1)
// Draw 5: 12 (Hidden card 2)
// Draw 6: 15 (Final card)
export const TUTORIAL_DECK: CardData[] = [
  { id: 'tut-5', value: 5 },
  { id: 'tut-1', value: 1 },
  { id: 'tut-8', value: 8 },
  { id: 'tut-10', value: 10 },
  { id: 'tut-12', value: 12 },
  { id: 'tut-15', value: 15 },
];

export const TUTORIAL_HAND: CardData = { id: 'tut-3', value: 3 };

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    text: "系统校准中... 欢迎来到边缘。规则只有一条：序列必须严格递增。将手牌 [3] 放入第一个基座。",
    highlightTarget: 'slot-0',
    requiredAction: 'place',
    allowedSlotIndex: 0
  },
  {
    id: 1,
    text: "很好。数值 [5] 大于 [3]，这是安全的链接。继续构建序列。",
    highlightTarget: 'slot-1',
    requiredAction: 'place',
    allowedSlotIndex: 1
  },
  {
    id: 2,
    text: "警告：监测到死局。手牌 [1] 小于前序节点 [5]。强行放置将导致序列崩溃。\n点击【换牌】消耗一次机会重置当前符文。",
    highlightTarget: 'btn-sacrifice',
    requiredAction: 'sacrifice'
  },
  {
    id: 3,
    text: "危机解除。但在虚空中，常规收益只能勉强糊口。\n开启【隐藏模式】。这需要消耗手牌并盲抽两张填入。",
    highlightTarget: 'btn-void-toggle',
    requiredAction: 'toggle-void'
  },
  {
    id: 4,
    text: "高风险伴随高回报。若盲注数值正确，结算收益将翻 5 倍。\n将虚空注注入基座 3。",
    highlightTarget: 'slot-2',
    requiredAction: 'place', // In code this triggers blind cast
    allowedSlotIndex: 2
  },
  {
    id: 5,
    text: "收尾阶段。完成最后的序列链接。",
    highlightTarget: 'slot-3',
    requiredAction: 'place',
    allowedSlotIndex: 3
  },
  {
    id: 6,
    text: "仪式完成。现在，直面真理。点击盲注卡牌揭示结果。",
    highlightTarget: 'slot-2', // Re-highlight the blind slot for resolution
    requiredAction: 'resolve',
    allowedSlotIndex: 2
  }
];