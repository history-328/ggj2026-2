import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card?: CardData;
  hidden?: boolean;
  isSlot?: boolean;
  onClick?: () => void;
  highlight?: boolean;
  warning?: boolean; // New prop for danger indication
  disabled?: boolean;
  variant?: 'normal' | 'void' | 'gold';
  small?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  hidden, 
  isSlot, 
  onClick, 
  highlight, 
  warning,
  disabled,
  variant = 'normal',
  small
}) => {
  
  const baseClasses = `
    relative flex items-center justify-center rounded-lg border-2 
    transition-all duration-300 card-shadow select-none
    ${small ? 'w-16 h-24 text-xl' : 'w-24 h-36 text-3xl'}
    ${isSlot ? 'border-dashed' : 'border-solid'}
    ${onClick && !disabled ? 'cursor-pointer hover:-translate-y-1 hover:brightness-110' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const variantClasses = {
    normal: 'bg-slate-800 border-slate-600 text-slate-200',
    void: 'bg-indigo-950 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    gold: 'bg-yellow-950 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  };

  const activeVariant = card?.isJackpot ? 'gold' : (hidden ? 'void' : variant);
  
  // Warning override styles
  const warningClasses = warning 
    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
    : '';

  // Slot (Empty)
  if (!card && !hidden) {
    return (
      <div 
        onClick={!disabled ? onClick : undefined}
        className={`
          ${baseClasses} 
          bg-slate-900/50 text-slate-600
          ${warning ? warningClasses : 'border-slate-700'} 
          ${highlight && !warning ? 'border-purple-400 bg-purple-900/20' : ''}
        `}
      >
        {isSlot && <span className="text-sm opacity-50">基座</span>}
      </div>
    );
  }

  // Hidden (Card back)
  if (hidden) {
    return (
      <div 
        onClick={!disabled ? onClick : undefined}
        className={`${baseClasses} ${variantClasses.void}`}
      >
        <div className="absolute inset-2 border border-purple-800 rounded opacity-50 flex items-center justify-center">
          <span className="text-2xl opacity-50">?</span>
        </div>
      </div>
    );
  }

  // Visible Card
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        ${baseClasses} 
        ${variantClasses[activeVariant as keyof typeof variantClasses]} 
        ${highlight && !warning ? 'ring-2 ring-white scale-105' : ''}
        ${warningClasses}
      `}
    >
      <div className="font-mono font-bold tracking-tighter">
        {card?.value}
      </div>
      {card?.isJackpot && (
        <div className="absolute bottom-1 text-[10px] text-yellow-500 font-bold uppercase tracking-widest">
          JACKPOT
        </div>
      )}
    </div>
  );
};