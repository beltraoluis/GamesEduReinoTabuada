import React from 'react';
import { MASCOT_LIST, ACCESSORY_HATS } from '../services/mathEngine';

interface MascotBadgeProps {
  mascotId: string;
  hatId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  animate?: boolean;
}

export const MascotBadge: React.FC<MascotBadgeProps> = ({
  mascotId,
  hatId = 'none',
  size = 'md',
  showName = false,
  animate = true,
}) => {
  const mascot = MASCOT_LIST.find((m) => m.id === mascotId) || MASCOT_LIST[0];
  const hat = ACCESSORY_HATS.find((h) => h.id === hatId && h.id !== 'none');

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  const hatPositionClasses = {
    sm: 'bottom-[58%]',
    md: 'bottom-[60%]',
    lg: 'bottom-[60%]',
    xl: 'bottom-[60%]',
  };

  const hatEmojiSizeClasses = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const hatImageSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center inline-block">
      <div
        className={`relative rounded-full flex items-center justify-center border-2 border-white shadow-md ${
          mascot.color
        } ${sizeClasses[size]} ${animate ? 'hover:scale-110 transition-transform' : ''}`}
      >
        {/* Accessory Hat */}
        {hat && (
          hat.image ? (
            <img
              src={hat.image}
              alt={hat.name}
              draggable={false}
              className={`absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none object-contain filter drop-shadow ${hatPositionClasses[size]} ${hatImageSizeClasses[size]}`}
            />
          ) : (
            <span
              className={`absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none leading-none filter drop-shadow ${hatPositionClasses[size]} ${hatEmojiSizeClasses[size]}`}
              role="img"
              aria-label={hat.name}
            >
              {hat.emoji}
            </span>
          )
        )}

        {/* Mascot Face */}
        <span className="select-none filter drop-shadow-sm">{mascot.emoji}</span>
      </div>

      {showName && (
        <span className="mt-1 text-xs font-bold text-slate-700 max-w-[100px] text-center truncate">
          {mascot.name.split(',')[0]}
        </span>
      )}
    </div>
  );
};
