import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CardData, GamePhase, GameSlot, SlotType, PlayerStats, InventoryItem } from '../types';
import { Card } from './Card';
import { Skull, Eye, CircleDollarSign, ArrowRight, Ghost, Flame, Layers, MousePointerClick, ShieldCheck, Backpack, RefreshCw, X } from 'lucide-react';

interface GameScreenProps {
  phase: GamePhase;
  stats: PlayerStats;
  currentHand: CardData | null;
  slots: GameSlot[];
  sacrificesLeft: number;
  deckCount: number;
  blindPot: number; 
  onPlace: (slotIndex: number) => void;
  onBlind: (slotIndex: number) => void;
  onSacrifice: () => void;
  onPeek: () => void; 
  onResolveBlind: (slotIndex: number, cardIndex: number) => void;
  onEndGame: (win: boolean, profit: number) => void;
  messages: string[];
  peekingCards: CardData[] | null; 
  confirmPeek: (useBlind: boolean) => void;
  // Tutorial Props
  isTutorialMode?: boolean;
  highlightTarget?: string; 
  onTutorialClick?: (target: string) => void;
  onSkipTutorial?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  phase,
  stats,
  currentHand,
  slots,
  sacrificesLeft,
  deckCount,
  onPlace,
  onBlind,
  onSacrifice,
  onPeek,
  onResolveBlind,
  onEndGame,
  messages,
  peekingCards,
  confirmPeek,
  isTutorialMode = false,
  highlightTarget,
  onTutorialClick,
  onSkipTutorial
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isVoidMode, setIsVoidMode] = useState(false);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset void mode when hand changes
  useEffect(() => {
    setIsVoidMode(false);
  }, [currentHand]);

  const isPlaying = phase === GamePhase.PLAYING;
  const isRevelation = phase === GamePhase.REVELATION;
  const isGameOver = phase === GamePhase.GAME_OVER;
  const isRoundWin = phase === GamePhase.ROUND_WIN;

  // Calculate potential profit breakdown
  const calculateProfit = () => {
    let openSum = 0;
    let blindSum = 0;

    slots.forEach(slot => {
      // Normal Open Slots: x1 Value
      if (slot.type === SlotType.OPEN && slot.value) {
        openSum += slot.value;
      }
      // Resolved Blind Slots: x5 Value
      if (slot.type === SlotType.BLIND && slot.selectedValue) {
        blindSum += slot.selectedValue;
      }
    });

    return {
      openTotal: openSum,
      blindTotal: blindSum * 5,
      total: openSum + (blindSum * 5)
    };
  };

  const { openTotal, blindTotal, total: potentialProfit } = calculateProfit();
  const finalProfit = potentialProfit + (stats.activeBuffs.smallBet ? 50 : 0);
  const canVoidCast = deckCount >= 2;
  const hasGoggles = stats.loadout.some(i => i.itemId === 'void_goggles');
  const hasExtraSacrifice = stats.loadout.some(i => i.itemId === 'extra_sacrifice');

  const isMoveDangerous = useCallback((slotIndex: number, val: number) => {
    let leftBound = 0;
    for (let i = slotIndex - 1; i >= 0; i--) {
      const s = slots[i];
      const v = s.selectedValue || s.value;
      if (v !== undefined) {
        leftBound = v;
        break;
      }
    }
    let rightBound = Infinity;
    for (let i = slotIndex + 1; i < slots.length; i++) {
      const s = slots[i];
      const v = s.selectedValue || s.value;
      if (v !== undefined) {
        rightBound = v;
        break;
      }
    }
    return val < leftBound || val > rightBound;
  }, [slots]);

  // --- Tutorial Highlighting Logic ---
  const getHighlightClass = (id: string) => {
    if (!isTutorialMode) return '';
    if (highlightTarget === id) return 'z-50 relative ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-900 shadow-[0_0_50px_rgba(99,102,241,0.5)]';
    
    // NEW: Keep Hand Card visible when target is a slot, to show context
    if (id === 'hand-card' && highlightTarget?.startsWith('slot-')) {
      return 'z-50 relative grayscale-0 opacity-100';
    }

    return 'opacity-40 pointer-events-none filter grayscale';
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-2 md:p-4 relative">
      
      {/* Tutorial Dimmer Overlay */}
      {isTutorialMode && (
        <>
          <div className="fixed inset-0 bg-slate-950/20 z-40 backdrop-blur-[0.3px] transition-all duration-500"></div>
          {onSkipTutorial && (
            <button 
              onClick={onSkipTutorial}
              className="fixed top-4 right-4 z-[60] px-4 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white border border-slate-700 rounded-full flex items-center gap-2 text-xs uppercase tracking-widest transition-all"
            >
              <X size={14} /> 跳过训练
            </button>
          )}
        </>
      )}

      {/* Top Bar: Stats & Info */}
      {/* Ensure header stays below dimmer in tutorial unless targeted (not currently used) */}
      <header className={`flex justify-between items-center mb-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 ${isTutorialMode ? 'relative z-30' : ''}`}>
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase">当前区域</span>
            <span className={`font-mono font-bold ${stats.activeTier?.color.split(' ')[0] || 'text-slate-200'}`}>
              {stats.activeTier?.name || '未知'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase">剩余牌库</span>
            <span className="text-slate-200 font-mono font-bold">{deckCount} 张</span>
          </div>
           <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase">换牌机会</span>
            <div className="flex gap-1 mt-1">
              {[...Array(3 + (hasExtraSacrifice ? 1 : 0))].map((_, i) => (
                 <Flame 
                   key={i} 
                   size={14} 
                   className={i < sacrificesLeft ? "text-orange-500 fill-orange-500" : "text-slate-700"} 
                 />
              ))}
            </div>
          </div>
        </div>
        
        {/* Messages Log */}
        <div className="flex-1 mx-8 h-12 overflow-hidden relative hidden md:block">
           <div className="absolute bottom-0 w-full flex flex-col items-center">
             {messages.slice(-2).map((msg, i) => (
               <p key={i} className={`text-sm ${i === 1 ? 'text-slate-200' : 'text-slate-500'} animate-in slide-in-from-bottom-2`}>
                 {msg}
               </p>
             ))}
             <div ref={messagesEndRef} />
           </div>
        </div>

        <div className="flex flex-col items-end">
             <span className="text-xs text-slate-500 uppercase">当前资金</span>
             <div className="flex items-center gap-2 text-xl font-mono text-white font-bold">
               <CircleDollarSign size={18} className="text-yellow-500" />
               {stats.chips}
             </div>
        </div>
      </header>

      {/* Loadout Bar - Hidden in Tutorial */}
      {!isTutorialMode && (
        <div className="flex items-center gap-3 mb-6 px-2 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded border border-slate-800">
             <Backpack size={12} /> 战术背包
           </div>
           <div className="flex gap-2 flex-wrap">
              {stats.loadout.length === 0 && (
                <span className="text-xs text-slate-600 italic">未携带任何装备</span>
              )}
              {stats.loadout.map((item) => (
                <div 
                  key={item.uuid} 
                  className={`
                     px-2 py-1 rounded border text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-sm
                     ${item.isSoulbound 
                        ? 'bg-yellow-950/20 border-yellow-900/50 text-yellow-500' 
                        : 'bg-slate-800 border-slate-700 text-indigo-300'}
                  `}
                >
                   {item.name}
                   {item.isSoulbound && <ShieldCheck size={10} />}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Main Board Area */}
      {/* REMOVED 'z-30' from here to allow children with z-50 to pop above the z-40 dimmer */}
      <div className="flex-1 flex flex-col justify-center items-center gap-12 relative">
        
        {/* Slots */}
        <div className="flex gap-2 md:gap-4 overflow-x-auto w-full justify-center p-4">
          {slots.map((slot, index) => {
             const isBlind = slot.type === SlotType.BLIND;
             const slotHighlightClass = getHighlightClass(`slot-${index}`);
             
             // Revelation Phase
             if (isRevelation && isBlind && !slot.value) {
                return (
                  <div key={slot.id} className={`flex flex-col gap-2 p-2 bg-slate-800/50 rounded-xl border border-purple-500/30 animate-in zoom-in-50 ${slotHighlightClass}`}>
                    <p className="text-xs text-center text-purple-300 mb-1">选择保留</p>
                    <div className="flex gap-2">
                      {slot.blindCards?.map((card, cIndex) => (
                        <Card 
                          key={card.id} 
                          card={card} 
                          small 
                          onClick={() => onResolveBlind(index, card.value)}
                          highlight={false}
                          warning={isMoveDangerous(index, card.value)}
                        />
                      ))}
                    </div>
                  </div>
                );
             }

             const isDangerousMove = isPlaying && !peekingCards && currentHand && !slot.value && !isVoidMode && !isBlind
                ? isMoveDangerous(index, currentHand.value)
                : false;

             return (
               <div key={slot.id} className={`relative group ${slotHighlightClass}`}>
                 <Card 
                    card={slot.value ? { id: 'slot-val', value: slot.value } : undefined}
                    hidden={isBlind && !slot.value}
                    isSlot={true}
                    highlight={isPlaying && !slot.value && !peekingCards && (isVoidMode ? true : false)} 
                    warning={isDangerousMove}
                    onClick={() => {
                       if (isPlaying && !peekingCards && !slot.value) {
                         if (isVoidMode) {
                           if (canVoidCast) {
                             onBlind(index);
                             if (!isTutorialMode) setIsVoidMode(false);
                           }
                         } else {
                           onPlace(index);
                         }
                       }
                       if (isPlaying && peekingCards && !slot.value) confirmPeek(true);
                    }}
                    variant={isBlind ? 'void' : 'normal'}
                 />
                 
                 {/* Interaction Overlay */}
                 {isPlaying && !slot.value && !peekingCards && (
                   <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isVoidMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isVoidMode ? (
                        <div className="bg-purple-900/80 p-2 rounded-full border border-purple-500 shadow-lg shadow-purple-500/50 animate-bounce">
                           <Layers size={24} className="text-purple-200" />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-full border ${isDangerousMove ? 'bg-red-900/80 border-red-500' : 'bg-slate-700/80 border-slate-500'}`}>
                           {isDangerousMove ? (
                             <Skull size={24} className="text-red-200" />
                           ) : (
                             <MousePointerClick size={24} className="text-slate-200" />
                           )}
                        </div>
                      )}
                   </div>
                 )}
                 <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-slate-600 font-mono text-sm">
                   {index + 1}
                 </div>
               </div>
             );
          })}
        </div>

        {/* Player Action Area */}
        <div className="relative h-56 w-full flex justify-center items-center">
          
          {/* Peeking Mode Overlay */}
          {peekingCards && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 rounded-2xl border border-indigo-500 flex flex-col items-center justify-center gap-6 animate-in fade-in">
               {/* ... (Peeking content unchanged) ... */}
            </div>
          )}

          {/* Normal Play State */}
          {isPlaying && !peekingCards && (
            <div className="flex flex-col items-center w-full max-w-2xl">
               
               <div className="flex items-center gap-8 md:gap-16">
                 
                 {/* Sacrifice Button */}
                 <div className={getHighlightClass('btn-sacrifice')}>
                   <button 
                      onClick={onSacrifice}
                      disabled={sacrificesLeft <= 0}
                      className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                   >
                      <RefreshCw size={24} className="group-hover:animate-spin mb-1" />
                      <span className="text-[10px] font-bold">换牌</span>
                   </button>
                 </div>

                 {/* Hand */}
                 <div className={`relative w-32 h-44 flex items-center justify-center ${getHighlightClass('hand-card')}`}>
                    
                    {isVoidMode ? (
                      <div className="relative w-24 h-36 cursor-pointer animate-in zoom-in-95 duration-200" onClick={() => !isTutorialMode && setIsVoidMode(false)}>
                         <div className="absolute top-0 left-0 translate-x-1 translate-y-1 rotate-3">
                           <Card hidden variant="void" />
                         </div>
                         <div className="absolute top-0 left-0 -translate-x-1 -translate-y-1 -rotate-3">
                           <Card hidden variant="void" highlight />
                         </div>
                         <div className="absolute -bottom-8 w-full text-center whitespace-nowrap">
                            <span className="text-purple-400 text-xs font-bold tracking-widest uppercase bg-slate-900/80 px-2 py-1 rounded">隐藏置入</span>
                         </div>
                      </div>
                    ) : (
                      <div className="relative cursor-pointer animate-in zoom-in-95 duration-200" onClick={() => canVoidCast && !isTutorialMode && setIsVoidMode(true)}>
                        <Card card={currentHand || undefined} highlight />
                        <div className="absolute -bottom-8 w-full text-center whitespace-nowrap">
                           <span className="text-slate-400 text-xs font-bold tracking-widest uppercase bg-slate-900/80 px-2 py-1 rounded">当前符文</span>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Right: Mode Toggle / Goggles */}
                 <div className="flex flex-col gap-3">
                    <div className={getHighlightClass('btn-void-toggle')}>
                      <button
                        onClick={() => {
                          setIsVoidMode(!isVoidMode);
                          if(onTutorialClick) onTutorialClick('btn-void-toggle');
                        }}
                        disabled={!canVoidCast}
                        className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border transition-all ${
                          isVoidMode 
                            ? 'bg-purple-900/30 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                        } ${!canVoidCast ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        {isVoidMode ? <Layers size={24} className="mb-1" /> : <MousePointerClick size={24} className="mb-1" />}
                        <span className="text-[10px] font-bold">{isVoidMode ? '取消隐藏' : '隐藏模式'}</span>
                      </button>
                    </div>
                    
                    {/* Goggles (Conditional Render) */}
                    {hasGoggles && !isTutorialMode && (
                      <button 
                        onClick={onPeek}
                        disabled={deckCount < 2}
                        className="flex items-center justify-center gap-1 py-1 px-2 rounded-full bg-indigo-900/20 border border-indigo-500/50 text-indigo-400 text-[10px] hover:bg-indigo-900/40 transition-colors disabled:opacity-30"
                      >
                        <Eye size={12} />
                        使用透镜
                      </button>
                    )}
                 </div>

               </div>
               
               <div className="mt-8 text-center h-6">
                 {isVoidMode ? (
                   <p className="text-purple-400 text-sm animate-pulse">
                     <span className="font-bold">高风险模式：</span> 消耗手牌，盲抽2张牌隐藏置入。结算时翻开，收益x5。
                   </p>
                 ) : (
                   <p className="text-slate-500 text-sm">
                     <span className="font-bold">安全模式：</span> 将 {currentHand?.value} 放入任意空槽位。
                   </p>
                 )}
               </div>

            </div>
          )}

          {/* Win / Loss States */}
          {(isGameOver || isRoundWin) && (
            <div className={`bg-slate-800/90 border border-slate-600 p-8 rounded-2xl flex flex-col items-center gap-4 text-center backdrop-blur-md shadow-2xl animate-in zoom-in-90 z-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md ${isTutorialMode ? 'z-[70] border-indigo-500' : ''}`}>
               {isRoundWin ? (
                 <>
                   <h2 className="text-3xl font-bold text-green-400 mb-2">{isTutorialMode ? '协议校准完成' : '撤离成功'}</h2>
                   <div className="flex flex-col gap-1 text-sm text-slate-300 mb-4 w-full">
                      <div className="flex justify-between">
                         <span>常规回收 (x1)</span>
                         <span className="text-slate-300 font-mono">+{openTotal}</span>
                      </div>
                      <div className={`flex justify-between ${isTutorialMode ? 'animate-pulse text-purple-300' : ''}`}>
                         <span>隐藏盲注 (x5)</span>
                         <span className="text-purple-400 font-mono">+{blindTotal}</span>
                      </div>
                      {stats.activeBuffs.smallBet && (
                         <div className="flex justify-between">
                           <span>小额加注</span>
                           <span className="text-green-400 font-mono">+50</span>
                        </div>
                      )}
                      <div className="h-px w-full bg-slate-600 my-2"></div>
                      <div className="flex justify-between text-lg font-bold text-white">
                         <span>总计收益</span>
                         <span>{finalProfit}</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => onEndGame(true, finalProfit)}
                     className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 w-full justify-center"
                   >
                     {isTutorialMode ? '返回主菜单' : '带回物资'} <ArrowRight size={18} />
                   </button>
                 </>
               ) : (
                 <>
                   <h2 className="text-3xl font-bold text-red-500 mb-2">任务失败</h2>
                   <button 
                     onClick={() => onEndGame(false, 0)}
                     className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 w-full justify-center"
                   >
                     返回 <Ghost size={18} />
                   </button>
                 </>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}