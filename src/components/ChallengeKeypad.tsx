import React from 'react';
import { Delete, SendHorizontal } from 'lucide-react';

interface ChallengeKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  isPrependMode: boolean;
  onTogglePrepend: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export const ChallengeKeypad: React.FC<ChallengeKeypadProps> = ({
  onDigit,
  onBackspace,
  onClear,
  isPrependMode,
  onTogglePrepend,
  onSubmit,
  disabled = false,
  canSubmit = true,
}) => {
  return (
    <div
      className="w-full max-w-sm mx-auto grid grid-cols-3 gap-2 sm:gap-2.5 select-none"
      role="group"
      aria-label="Teclado numérico"
    >
      {DIGIT_ROWS.flat().map((digit) => (
        <button
          key={digit}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(digit)}
          aria-label={`Dígito ${digit}`}
          className="min-h-[56px] sm:min-h-[60px] rounded-2xl bg-purple-900/80 hover:bg-purple-800/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-400/40 hover:border-amber-300/70 text-white font-black font-fun text-2xl sm:text-3xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label="Apagar último dígito"
        className="min-h-[56px] sm:min-h-[60px] rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-500/50 text-slate-100 font-black text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        <Delete className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span>Apagar</span>
      </button>

      <button
        key="0"
        type="button"
        disabled={disabled}
        onClick={() => onDigit('0')}
        aria-label="Dígito 0"
        className="min-h-[56px] sm:min-h-[60px] rounded-2xl bg-purple-900/80 hover:bg-purple-800/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-400/40 hover:border-amber-300/70 text-white font-black font-fun text-2xl sm:text-3xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        0
      </button>

      <button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={onSubmit}
        aria-label="Enviar resposta"
        className="min-h-[56px] sm:min-h-[60px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed border-2 border-amber-200 text-slate-950 font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span>Enviar</span>
        <SendHorizontal className="w-5 h-5 shrink-0" aria-hidden="true" />
      </button>

      <div className="col-span-3 grid grid-cols-2 gap-2 sm:gap-2.5">
        <button
          type="button"
          disabled={disabled || !canSubmit}
          onClick={onClear}
          aria-label="Limpar resposta inteira"
          className="min-h-[48px] rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-500/50 text-slate-100 font-black text-sm shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          Limpar
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onTogglePrepend}
          aria-label="Alternar digitação de caracteres à esquerda"
          aria-pressed={isPrependMode}
          className={`min-h-[48px] rounded-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-2 font-black text-sm shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
            isPrependMode
              ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-200 text-slate-950'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-500/50 text-slate-100'
          }`}
        >
          Digitar à esquerda
        </button>
      </div>
    </div>
  );
};
