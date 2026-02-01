import React from 'react';
import { Terminal } from 'lucide-react';

interface TutorialOverlayProps {
  text: string;
  onSkip?: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ text }) => {
  return (
    <div className="absolute inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="bg-slate-900/95 border border-indigo-500/50 p-6 rounded-xl max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto animate-in slide-in-from-bottom-4 backdrop-blur-md relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex gap-4">
          <div className="mt-1 shrink-0">
            <div className="p-2 bg-indigo-950 rounded border border-indigo-800">
               <Terminal size={24} className="text-indigo-400" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-indigo-300 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              协议校准 Protocol Calibration
            </h3>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed font-serif whitespace-pre-line">
              {text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};