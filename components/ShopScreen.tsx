import React from 'react';
import { PlayerStats, ShopItem, TierConfig, InventoryItem } from '../types';
import { SHOP_ITEMS, TIERS, FREEDOM_COST, SLOT_UNLOCK_COSTS, MAX_LOADOUT_SLOTS } from '../constants';
import { ShoppingCart, Play, CircleDollarSign, Lock, Crown, Box, Backpack, ArrowRightLeft, ShieldCheck, Skull, ArrowLeft, Medal } from 'lucide-react';

interface ShopScreenProps {
  stats: PlayerStats;
  onBuy: (item: ShopItem) => void;
  onStartLevel: (tier: TierConfig) => void;
  onPurchaseFreedom: () => void;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (item: InventoryItem) => void;
  onUnlockSlot: () => void;
  onBack: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ 
  stats, 
  onBuy, 
  onStartLevel, 
  onPurchaseFreedom,
  onEquip,
  onUnequip,
  onUnlockSlot,
  onBack
}) => {
  
  const nextSlotCost = stats.unlockedLoadoutSlots < MAX_LOADOUT_SLOTS ? SLOT_UNLOCK_COSTS[stats.unlockedLoadoutSlots] : null;

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-2 md:p-4 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700 backdrop-blur-sm mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            title="返回主菜单"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl text-slate-200 font-bold flex items-center gap-2">
              <Crown size={24} className="text-yellow-500" />
              虚空整备室
              {stats.hasWon && (
                <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/50">
                  <Medal size={10} /> 已通关
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-xs">配置装备，选择风险，购买自由。</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           {stats.chips >= FREEDOM_COST && !stats.hasWon && (
            <button 
              onClick={onPurchaseFreedom}
              className="mr-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.5)] hidden md:block"
            >
              购买自由 ({FREEDOM_COST})
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] uppercase tracking-widest">当前资金</span>
            <div className="flex items-center gap-2 text-white font-mono text-2xl font-bold">
              <CircleDollarSign size={20} className="text-yellow-500" />
              {stats.chips}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: 3 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* COL 1: Black Market (Shop) - 3/12 */}
        <div className="lg:col-span-3 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
             <ShoppingCart size={16} className="text-indigo-400" />
             <h3 className="font-bold text-slate-300">黑市补给</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
             {SHOP_ITEMS.map((item) => {
               // Special handling for freedom contract
               if (item.id === 'freedom_contract' && stats.hasWon) return null;

               const canAfford = stats.chips >= item.cost;
               const isFreedom = item.id === 'freedom_contract';
               
               return (
                 <div key={item.id} className={`p-3 rounded-lg border transition-colors ${isFreedom ? 'bg-yellow-900/20 border-yellow-700' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}>
                    <div className="flex justify-between items-start mb-1">
                       <h4 className={`font-bold text-sm ${item.isSoulbound || isFreedom ? 'text-yellow-400' : 'text-slate-200'}`}>
                         {item.name}
                       </h4>
                       <span className="text-yellow-500 font-mono text-sm font-bold">{item.cost}$</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2 leading-tight min-h-[2.5em]">{item.description}</p>
                    <button 
                       onClick={() => onBuy(item)}
                       disabled={!canAfford}
                       className={`w-full py-1.5 rounded text-xs font-bold ${
                         isFreedom
                           ? (canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white animate-pulse' : 'bg-slate-700 text-slate-500 cursor-not-allowed')
                           : (canAfford ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed')
                       }`}
                    >
                      {isFreedom ? '购买自由' : '购买'}
                    </button>
                 </div>
               );
             })}
          </div>
        </div>

        {/* COL 2: Warehouse & Loadout - 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
           
           {/* Loadout Section (Top) */}
           <div className="bg-slate-900/50 rounded-xl border border-indigo-900/50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Backpack size={16} className="text-indigo-400" />
                    <h3 className="font-bold text-slate-300">战术背包 (Loadout)</h3>
                 </div>
                 <span className="text-xs text-indigo-400">仅背包物品生效</span>
              </div>
              
              <div className="p-4 flex justify-center gap-3">
                 {[...Array(MAX_LOADOUT_SLOTS)].map((_, i) => {
                    const isUnlocked = i < stats.unlockedLoadoutSlots;
                    const item = stats.loadout[i];
                    
                    if (!isUnlocked) {
                      const isNext = i === stats.unlockedLoadoutSlots;
                      const canUnlock = isNext && nextSlotCost !== null && stats.chips >= nextSlotCost;
                      return (
                        <div key={i} className="w-16 h-16 rounded border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 gap-1">
                           <Lock size={14} />
                           {isNext && nextSlotCost !== null && (
                             <button 
                               onClick={onUnlockSlot}
                               disabled={!canUnlock}
                               className={`text-[10px] font-mono px-1 rounded ${canUnlock ? 'bg-yellow-900/50 text-yellow-500 hover:bg-yellow-900' : 'text-slate-600'}`}
                             >
                               ${nextSlotCost}
                             </button>
                           )}
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={i} 
                        onClick={() => item && onUnequip(item)}
                        className={`w-16 h-16 rounded border relative group cursor-pointer transition-all ${
                          item 
                            ? item.isSoulbound 
                              ? 'bg-yellow-900/20 border-yellow-700 hover:border-yellow-500' 
                              : 'bg-slate-800 border-indigo-500 hover:bg-slate-700' 
                            : 'bg-slate-900/50 border-slate-700 border-dashed hover:border-slate-500'
                        }`}
                      >
                         {item && (
                           <>
                             <div className="w-full h-full flex items-center justify-center p-1 text-center">
                                <span className={`text-[10px] leading-tight font-bold ${item.isSoulbound ? 'text-yellow-200' : 'text-indigo-200'}`}>{item.name}</span>
                             </div>
                             {item.isSoulbound && (
                               <div className="absolute top-0 right-0 p-0.5 bg-yellow-900 rounded-bl text-yellow-500" title="灵魂绑定：死亡不掉落">
                                  <ShieldCheck size={10} />
                               </div>
                             )}
                             {!item.isSoulbound && (
                               <div className="absolute top-0 right-0 p-0.5 bg-red-900/50 rounded-bl text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="死亡掉落">
                                  <Skull size={10} />
                               </div>
                             )}
                           </>
                         )}
                      </div>
                    );
                 })}
              </div>
           </div>

           {/* Warehouse Section (Bottom, expands) */}
           <div className="bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
                 <Box size={16} className="text-indigo-400" />
                 <h3 className="font-bold text-slate-300">仓库 (Warehouse)</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                 {stats.warehouse.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm">
                     <p>仓库空空如也</p>
                     <p className="text-xs mt-1">从黑市购买物资</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                      {stats.warehouse.map((item) => (
                        <div 
                          key={item.uuid}
                          onClick={() => onEquip(item)}
                          className={`aspect-square rounded border cursor-pointer flex items-center justify-center p-2 text-center relative group transition-all ${
                            item.isSoulbound 
                             ? 'bg-slate-800 border-yellow-900/50 text-yellow-500/80 hover:border-yellow-500 hover:text-yellow-400' 
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-300'
                          }`}
                        >
                           <span className="text-[10px] font-bold leading-tight">{item.name}</span>
                           {item.isSoulbound && (
                             <div className="absolute top-1 right-1 text-yellow-700">
                               <ShieldCheck size={10} />
                             </div>
                           )}
                           <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none rounded" />
                        </div>
                      ))}
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* COL 3: Mission Select - 4/12 */}
        <div className="lg:col-span-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
           <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
             <Play size={16} className="text-indigo-400" />
             <h3 className="font-bold text-slate-300">行动选择</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
             {TIERS.map((tier) => {
                const canAfford = stats.chips >= tier.cost;
                return (
                  <div 
                    key={tier.id}
                    className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${tier.color} ${canAfford ? 'bg-slate-800/80 hover:bg-slate-800' : 'bg-slate-900 opacity-50 grayscale'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{tier.name}</h4>
                        <span className="text-[10px] uppercase tracking-widest opacity-70">{tier.subtext}</span>
                      </div>
                      <div className={`font-mono font-bold text-lg ${tier.cost === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                         {tier.cost === 0 ? '免费' : `$${tier.cost}`}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs opacity-80 mb-4">
                       <div className="bg-black/20 p-1.5 rounded">基座: {tier.slots}</div>
                       <div className="bg-black/20 p-1.5 rounded">牌库: {tier.deckSize}</div>
                    </div>

                    <button
                      onClick={() => canAfford && onStartLevel(tier)}
                      disabled={!canAfford}
                      className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        canAfford 
                          ? 'bg-slate-200 text-slate-900 hover:bg-white' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {canAfford ? '开始行动' : '资金不足'}
                    </button>
                  </div>
                );
             })}
           </div>
        </div>

      </div>
    </div>
  );
};