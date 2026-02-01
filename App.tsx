import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, PlayerStats, GameSlot, SlotType, CardData, ShopItem, TierConfig, InventoryItem } from './types';
import { INITIAL_CHIPS, INITIAL_SACRIFICES, FREEDOM_COST, SLOT_UNLOCK_COSTS, MAX_LOADOUT_SLOTS } from './constants';
import { TUTORIAL_STEPS, TUTORIAL_DECK, TUTORIAL_HAND } from './tutorialData';
import { ShopScreen } from './components/ShopScreen';
import { GameScreen } from './components/GameScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { Ghost, Trophy, Crown, RefreshCw, AlertTriangle, Terminal } from 'lucide-react';

// Use a function to generate fresh state to avoid reference mutation bugs
const getInitialStats = (): PlayerStats => ({
  chips: INITIAL_CHIPS,
  runs: 0,
  activeTier: null,
  warehouse: [],
  loadout: [],
  unlockedLoadoutSlots: 1, // Start with 1 slot
  activeBuffs: {
    smallBet: false,
    extraSacrificeUsed: 0
  },
  hasWon: false
});

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(getInitialStats);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [messages, setMessages] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Session State
  const [deck, setDeck] = useState<CardData[]>([]);
  const [hand, setHand] = useState<CardData | null>(null);
  const [slots, setSlots] = useState<GameSlot[]>([]);
  const [sacrificesLeft, setSacrificesLeft] = useState(INITIAL_SACRIFICES);
  
  // Tutorial State
  const [isTutorial, setIsTutorial] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  // Interaction State
  const [peekingCards, setPeekingCards] = useState<CardData[] | null>(null);

  const addMessage = useCallback((msg: string) => {
    setMessages(prev => [...prev.slice(-4), msg]);
  }, []);

  // --- Debug / Cheat ---
  const handleAddMoney = useCallback(() => {
    setStats(prev => ({ ...prev, chips: prev.chips + 100 }));
    addMessage("测试指令：+100 筹码");
  }, [addMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Numpad1') {
        handleAddMoney();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddMoney]);

  // --- Inventory Management Logic ---

  const handlePurchaseFreedom = () => {
    if (stats.chips >= FREEDOM_COST) {
      setStats(prev => ({ ...prev, chips: prev.chips - FREEDOM_COST }));
      setPhase(GamePhase.VICTORY);
    }
  };

  const handleBuy = (item: ShopItem) => {
    if (item.id === 'freedom_contract') {
      handlePurchaseFreedom();
      return;
    }

    if (stats.chips >= item.cost) {
      const newItem: InventoryItem = {
        uuid: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        isSoulbound: item.isSoulbound
      };

      setStats(prev => ({
        ...prev,
        chips: prev.chips - item.cost,
        warehouse: [...prev.warehouse, newItem]
      }));
    }
  };

  const handleEquip = (item: InventoryItem) => {
    if (stats.loadout.length >= stats.unlockedLoadoutSlots) {
      // Do nothing, slot full
      // Ideally show toast
      return;
    }
    setStats(prev => ({
      ...prev,
      warehouse: prev.warehouse.filter(i => i.uuid !== item.uuid),
      loadout: [...prev.loadout, item]
    }));
  };

  const handleUnequip = (item: InventoryItem) => {
    setStats(prev => ({
      ...prev,
      loadout: prev.loadout.filter(i => i.uuid !== item.uuid),
      warehouse: [...prev.warehouse, item]
    }));
  };

  const handleUnlockSlot = () => {
    const nextSlotIndex = stats.unlockedLoadoutSlots; // 1-based logic matches index in cost array for NEXT slot
    const cost = SLOT_UNLOCK_COSTS[nextSlotIndex];
    if (stats.chips >= cost && stats.unlockedLoadoutSlots < MAX_LOADOUT_SLOTS) {
      setStats(prev => ({
        ...prev,
        chips: prev.chips - cost,
        unlockedLoadoutSlots: prev.unlockedLoadoutSlots + 1
      }));
    }
  };

  const consumeLoadoutItem = (itemId: string): boolean => {
    // Find item in loadout
    const itemIndex = stats.loadout.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return false;

    // Remove 1 instance
    const newLoadout = [...stats.loadout];
    newLoadout.splice(itemIndex, 1);

    setStats(prev => ({
      ...prev,
      loadout: newLoadout
    }));
    return true;
  };

  // --- Core Game Logic ---

  const generateDeck = (tier: TierConfig) => {
    const cards: CardData[] = [];
    
    // Check for Expansion Chips
    const expansionCount = stats.loadout.filter(i => i.itemId === 'expansion_chip').length;
    const max = tier.deckSize + (expansionCount * 5);
    
    for (let i = 1; i <= max; i++) {
      cards.push({ id: `card-${i}`, value: i });
    }
    
    // Check Loadout for Jackpot (Greed Amulet)
    const hasJackpot = stats.loadout.some(i => i.itemId === 'jackpot_amulet');
    if (hasJackpot) {
      cards.push({ id: 'jackpot-100', value: 100, isJackpot: true });
    }
    
    // Fisher-Yates Shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  };

  const drawCard = (currentDeck: CardData[]): { card: CardData | null, newDeck: CardData[] } => {
    if (currentDeck.length === 0) return { card: null, newDeck: [] };
    const [card, ...rest] = currentDeck;
    return { card, newDeck: rest };
  };

  // --- Start Game Logic (Normal & Tutorial) ---

  const startTier = (tier: TierConfig) => {
    if (stats.chips < tier.cost) return;
    
    const hasExtraSacrifice = stats.loadout.some(i => i.itemId === 'extra_sacrifice');
    
    setStats(prev => ({ 
      ...prev, 
      chips: prev.chips - tier.cost,
      activeTier: tier,
      activeBuffs: { 
        smallBet: prev.loadout.some(i => i.itemId === 'small_bet'), 
        extraSacrificeUsed: 0 
      }
    }));

    const newDeck = generateDeck(tier);
    const { card, newDeck: remainingDeck } = drawCard(newDeck);
    
    setDeck(remainingDeck);
    setHand(card);
    setSlots(Array(tier.slots).fill(null).map((_, i) => ({ id: i, type: SlotType.EMPTY })));
    setSacrificesLeft(INITIAL_SACRIFICES + (hasExtraSacrifice ? 1 : 0));
    setMessages([]);
    addMessage(`进入 ${tier.name}。装备已锁定。`);
    
    setPhase(GamePhase.PLAYING);
  };

  const startTutorial = () => {
    setIsTutorial(true);
    setTutorialStepIndex(0);
    
    // Setup fake tier for UI
    const fakeTier: TierConfig = {
      id: 'tutorial',
      name: '模拟训练',
      subtext: '协议校准',
      cost: 0,
      slots: 4,
      deckSize: 10,
      color: 'text-indigo-400 border-indigo-500'
    };

    setStats(prev => ({
      ...prev,
      activeTier: fakeTier,
      activeBuffs: { smallBet: false, extraSacrificeUsed: 0 }
    }));

    // Setup Rigged Deck
    setDeck([...TUTORIAL_DECK]);
    setHand({ ...TUTORIAL_HAND });
    setSlots(Array(4).fill(null).map((_, i) => ({ id: i, type: SlotType.EMPTY })));
    setSacrificesLeft(3); // Give plenty
    setMessages([]);
    addMessage("进入模拟训练程序。");

    setPhase(GamePhase.PLAYING);
  };

  const skipTutorial = () => {
    setIsTutorial(false);
    setPhase(GamePhase.MENU);
  };

  const checkGameEndCondition = useCallback(() => {
    if (!stats.activeTier) return;
    
    const maxSlots = stats.activeTier.slots;
    const filledCount = slots.filter(s => s.type !== SlotType.EMPTY).length;
    
    if (filledCount === maxSlots) {
      setPhase(GamePhase.REVELATION);
      addMessage("仪式完成。揭示时刻到来...");
      
      const blindCount = slots.filter(s => s.type === SlotType.BLIND).length;
      if (blindCount === 0) {
        verifySequence(slots);
      }
    } else if (!hand && deck.length === 0) {
      setPhase(GamePhase.GAME_OVER);
      addMessage("虚空枯竭。无牌可用。");
    }
  }, [slots, hand, deck, stats.activeTier, addMessage]);

  // Player Actions with Tutorial Interception

  const handlePlaceRune = (slotIndex: number) => {
    // Tutorial Check
    if (isTutorial) {
      const step = TUTORIAL_STEPS[tutorialStepIndex];
      if (step.requiredAction !== 'place' || step.allowedSlotIndex !== slotIndex) {
        return; // Block action
      }
      // Advance step
      if (tutorialStepIndex < TUTORIAL_STEPS.length - 1) {
        setTutorialStepIndex(prev => prev + 1);
      }
    }

    if (!hand) return;
    const newSlots = [...slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], type: SlotType.OPEN, value: hand.value, selectedValue: 0 };
    setSlots(newSlots);
    const { card, newDeck } = drawCard(deck);
    setHand(card);
    setDeck(newDeck);
    addMessage(`在基座 ${slotIndex + 1} 放置了 ${hand.value}`);
  };

  const handleCastVoid = (slotIndex: number) => {
    // Tutorial Check
    if (isTutorial) {
       const step = TUTORIAL_STEPS[tutorialStepIndex];
       // Special case: tutorial usually asks to click 'toggle' first, then click slot.
       // Here we assume void mode is active and we are clicking the slot
       if (step.requiredAction !== 'place' || step.allowedSlotIndex !== slotIndex) {
         return;
       }
       // Advance step
       if (tutorialStepIndex < TUTORIAL_STEPS.length - 1) {
         setTutorialStepIndex(prev => prev + 1);
       }
    }

    if (deck.length < 2) {
      addMessage("牌库不足");
      return;
    }
    const blindCards = [deck[0], deck[1]];
    const newDeck = deck.slice(2);
    const newSlots = [...slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], type: SlotType.BLIND, blindCards: blindCards };
    setSlots(newSlots);
    setDeck(newDeck);
    const { card, newDeck: finalDeck } = drawCard(newDeck);
    setHand(card);
    setDeck(finalDeck);
    addMessage(`向基座 ${slotIndex + 1} 进行了隐藏出牌。`);
  };

  const handleSacrifice = () => {
    // Tutorial Check
    if (isTutorial) {
      const step = TUTORIAL_STEPS[tutorialStepIndex];
      if (step.requiredAction !== 'sacrifice') return;
      // Advance step
      if (tutorialStepIndex < TUTORIAL_STEPS.length - 1) {
        setTutorialStepIndex(prev => prev + 1);
      }
    }

    if (sacrificesLeft <= 0) return;
    
    if (sacrificesLeft > INITIAL_SACRIFICES) {
       const consumed = consumeLoadoutItem('extra_sacrifice');
       if (consumed) {
         addMessage("消耗了备用换牌。");
       }
    }
    
    const { card, newDeck } = drawCard(deck);
    setDeck(newDeck);
    setHand(card);
    setSacrificesLeft(prev => prev - 1);
    addMessage("进行了换牌。");
  };

  const handlePeek = () => {
    const hasGoggles = stats.loadout.some(i => i.itemId === 'void_goggles');
    if (hasGoggles && deck.length >= 2) {
       const cardsToPeek = [deck[0], deck[1]];
       setPeekingCards(cardsToPeek);
    }
  };

  const confirmPeek = (useBlind: boolean) => {
    setPeekingCards(null);
    consumeLoadoutItem('void_goggles');

    if (useBlind) {
      addMessage("透镜生效。");
    } else {
      handleSacrifice();
    }
  };

  useEffect(() => {
    if (phase === GamePhase.PLAYING) {
      checkGameEndCondition();
    }
  }, [slots, phase, checkGameEndCondition]);

  const verifySequence = (finalSlots: GameSlot[]) => {
    let prev = 0;
    let win = true;
    for (const slot of finalSlots) {
      const val = slot.selectedValue || slot.value || 0;
      if (val < prev) { 
        win = false;
        break;
      }
      prev = val;
    }
    if (win) {
      setPhase(GamePhase.ROUND_WIN);
    } else {
      setPhase(GamePhase.GAME_OVER);
    }
  };

  const handleResolveBlind = (slotIndex: number, chosenValue: number) => {
    // Tutorial Check
    if (isTutorial) {
      const step = TUTORIAL_STEPS[tutorialStepIndex];
      if (step.requiredAction !== 'resolve') return;
      // End tutorial sequence, basically
    }

    const newSlots = [...slots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], selectedValue: chosenValue, value: chosenValue };
    setSlots(newSlots);
    const unresolved = newSlots.filter(s => s.type === SlotType.BLIND && !s.selectedValue);
    if (unresolved.length === 0) {
      verifySequence(newSlots);
    }
  };

  const handleEndGame = (win: boolean, profit: number) => {
    if (isTutorial) {
      setIsTutorial(false);
      setPhase(GamePhase.MENU);
      // Give a small starting bonus for finishing tutorial?
      if (win) {
        setStats(prev => ({ ...prev, chips: prev.chips + 50 })); 
      }
      return;
    }

    if (win) {
      const hasSmallBet = stats.loadout.some(i => i.itemId === 'small_bet');
      if (hasSmallBet) {
         consumeLoadoutItem('small_bet');
      }

      setStats(prev => ({
        ...prev,
        chips: prev.chips + profit, 
        runs: prev.runs + 1,
        activeTier: null
      }));
      setPhase(GamePhase.PREPARATION);
    } else {
      const survivingLoadout = stats.loadout.filter(item => item.isSoulbound);
      
      setStats(prev => ({ 
        ...prev, 
        chips: prev.chips,
        activeTier: null,
        loadout: survivingLoadout
      }));
      
      setPhase(GamePhase.PREPARATION);
    }
  };

  // --- Menu Actions ---

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setStats(getInitialStats());
    setPhase(GamePhase.MENU);
    setShowResetConfirm(false);
  };

  const handleContinuePlaying = () => {
    setStats(prev => ({ ...prev, hasWon: true }));
    setPhase(GamePhase.PREPARATION);
  };

  const handleBackToMenu = () => {
    setPhase(GamePhase.MENU);
  };

  // New callback for interactions that don't trigger game logic (like toggles)
  const handleTutorialInteraction = (targetId: string) => {
    if (!isTutorial) return;
    const step = TUTORIAL_STEPS[tutorialStepIndex];
    if (step.highlightTarget === targetId) {
      if (step.requiredAction === 'toggle-void') {
        setTutorialStepIndex(prev => prev + 1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {phase === GamePhase.MENU && (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center space-y-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
          <div className="space-y-4 animate-in slide-in-from-bottom-10 duration-700">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-indigo-900 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] font-serif tracking-tight">
              隐藏序列
            </h1>
            <p className="text-xl text-slate-500 font-serif tracking-widest mt-2">MASK THE SEQUENCE</p>
          </div>
          
          <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 max-w-md text-sm text-slate-400 leading-relaxed">
            <p className="mb-4">规则变更：<span className="text-yellow-500">撤离机制</span>已上线。</p>
            <p>在整备室配置你的<span className="text-indigo-400">战术背包</span>。</p>
            <p>带入的装备若未撤离将被<span className="text-red-500">虚空吞噬</span>（灵魂绑定除外）。</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={() => setPhase(GamePhase.PREPARATION)}
              className="group relative px-8 py-4 bg-indigo-950 border border-indigo-500/50 rounded-full hover:bg-indigo-900 transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            >
              <span className="text-xl font-bold text-indigo-300 group-hover:text-white flex items-center justify-center gap-3">
                进入整备室 <Ghost className="animate-bounce" />
              </span>
            </button>
            
            <button 
              onClick={startTutorial}
              className="px-4 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Terminal size={16} /> 模拟训练 (新手)
            </button>
            
            <button 
              onClick={handleResetClick}
              className="px-4 py-2 text-slate-500 hover:text-red-500 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> 重置存档
            </button>
          </div>
        </div>
      )}

      {phase === GamePhase.PREPARATION && (
        <ShopScreen 
          stats={stats} 
          onBuy={handleBuy} 
          onStartLevel={startTier} 
          onPurchaseFreedom={handlePurchaseFreedom}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onUnlockSlot={handleUnlockSlot}
          onBack={handleBackToMenu}
        />
      )}

      {(phase === GamePhase.PLAYING || phase === GamePhase.REVELATION || phase === GamePhase.GAME_OVER || phase === GamePhase.ROUND_WIN) && (
        <>
          <GameScreen 
            phase={phase}
            stats={stats}
            currentHand={hand}
            slots={slots}
            sacrificesLeft={sacrificesLeft}
            deckCount={deck.length}
            blindPot={0}
            onPlace={handlePlaceRune}
            onBlind={handleCastVoid}
            onSacrifice={handleSacrifice}
            onPeek={handlePeek}
            onResolveBlind={handleResolveBlind}
            onEndGame={handleEndGame}
            messages={messages}
            peekingCards={peekingCards}
            confirmPeek={confirmPeek}
            isTutorialMode={isTutorial}
            highlightTarget={isTutorial ? TUTORIAL_STEPS[tutorialStepIndex].highlightTarget : undefined}
            onTutorialClick={handleTutorialInteraction}
            onSkipTutorial={isTutorial ? skipTutorial : undefined}
          />
          
          {isTutorial && phase === GamePhase.PLAYING && (
            <TutorialOverlay 
              text={TUTORIAL_STEPS[tutorialStepIndex].text}
              onSkip={skipTutorial}
            />
          )}
        </>
      )}

      {/* ... Victory and Reset Modals ... */}
      {phase === GamePhase.VICTORY && (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-yellow-100 animate-in fade-in duration-1000 p-8">
           <Crown size={80} className="mb-6 text-yellow-500 animate-bounce" />
           <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">赎身成功</h1>
           <p className="text-xl text-slate-300 mb-8 max-w-lg text-center leading-relaxed">
             你支付了契约金。虚空的束缚已解开。你带着剩余的财富回到了现实世界。
           </p>
           <div className="text-sm font-mono text-slate-500 mb-12">
              总场次: {stats.runs} | 最终结余: {stats.chips}
           </div>
           
           <div className="flex gap-4">
             <button 
               onClick={() => {
                  setStats(getInitialStats());
                  setPhase(GamePhase.MENU);
               }}
               className="px-8 py-3 bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white rounded-full transition-colors font-bold"
             >
               结束旅程
             </button>
             <button 
               onClick={handleContinuePlaying}
               className="px-8 py-3 bg-yellow-900/20 border border-yellow-600 text-yellow-500 hover:bg-yellow-900/40 rounded-full transition-colors font-bold flex items-center gap-2"
             >
               继续游戏 <Trophy size={16} />
             </button>
           </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-3 bg-red-900/20 rounded-full text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-200">重置存档</h3>
                <p className="text-slate-400 text-sm mt-2">
                  确定要删除所有游戏进度吗？<br/>
                  战术背包、仓库和资金将被清空。
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 py-2 bg-red-900/50 hover:bg-red-900/80 border border-red-900 text-red-400 hover:text-red-200 rounded-lg font-bold transition-colors"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEBUG BUTTON */}
      <button 
        onClick={handleAddMoney}
        className="fixed bottom-2 right-2 opacity-10 hover:opacity-100 bg-red-900/50 hover:bg-red-800 text-white text-[10px] px-2 py-1 rounded z-50 font-mono transition-opacity"
        title="测试作弊: +100 (Hotkey: Numpad 1)"
      >
        DEV: +100
      </button>

    </div>
  );
}