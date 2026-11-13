import React from 'react';
import { Check, Lock } from 'lucide-react';

export type WardrobeItemState =
  | 'selected'
  | 'owned'
  | 'buyable'
  | 'unaffordable'
  | 'requirement_locked';

export interface WardrobeActionButtonProps {
  state: WardrobeItemState;
  itemName: string;
  cost: number;
  selectedLabel: string;
  ownedLabel: string;
  completedWorldCount: number;
  totalWorlds: number;
  onClick: () => void;
}

const BASE_BUTTON_CLASSES =
  'w-full h-11 px-2 text-xs font-black rounded-xl whitespace-nowrap transition-all flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1';

export const WardrobeActionButton: React.FC<WardrobeActionButtonProps> = ({
  state,
  itemName,
  cost,
  selectedLabel,
  ownedLabel,
  completedWorldCount,
  totalWorlds,
  onClick,
}) => {
  if (state === 'selected') {
    return (
      <button
        type="button"
        aria-pressed={true}
        aria-label={`${selectedLabel}: ${itemName}`}
        onClick={onClick}
        className={`${BASE_BUTTON_CLASSES} bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95`}
      >
        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{selectedLabel}</span>
      </button>
    );
  }

  if (state === 'owned') {
    return (
      <button
        type="button"
        aria-pressed={false}
        aria-label={`${ownedLabel} ${itemName}`}
        onClick={onClick}
        className={`${BASE_BUTTON_CLASSES} bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95`}
      >
        <span>{ownedLabel}</span>
      </button>
    );
  }

  if (state === 'requirement_locked') {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={`${itemName} bloqueado. Conclua todos os ${totalWorlds} reinos da corrida (${completedWorldCount} de ${totalWorlds} concluídos). Preço: ${cost} gemas.`}
        onClick={onClick}
        className={`${BASE_BUTTON_CLASSES} bg-slate-100 text-slate-600 border border-slate-300 cursor-not-allowed`}
      >
        <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="tabular-nums">{cost} 💎</span>
      </button>
    );
  }

  const canAfford = state === 'buyable';

  return (
    <button
      type="button"
      aria-disabled={!canAfford}
      aria-label={
        canAfford
          ? `Desbloquear ${itemName} por ${cost} gemas`
          : `${itemName} custa ${cost} gemas. Gemas insuficientes.`
      }
      onClick={onClick}
      className={`${BASE_BUTTON_CLASSES} ${
        canAfford
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-not-allowed'
      }`}
    >
      <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span className="tabular-nums">{cost} 💎</span>
    </button>
  );
};
