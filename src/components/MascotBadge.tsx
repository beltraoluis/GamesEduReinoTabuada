import React from 'react';
import { MASCOT_LIST, ACCESSORY_HATS } from '../services/mathEngine';

interface MascotBadgeProps {
  mascotId: string;
  hatId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  animate?: boolean;
}

type BadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface AccessoryPlacement {
  position: Record<BadgeSize, string>;
  perMascotPosition?: Record<string, string>;
  emojiSize: Record<BadgeSize, string>;
  imageSize: Record<BadgeSize, string>;
  extraClass?: string;
}

const DEFAULT_PLACEMENT: AccessoryPlacement = {
  position: {
    sm: 'bottom-[58%] left-1/2 -translate-x-1/2',
    md: 'bottom-[60%] left-1/2 -translate-x-1/2',
    lg: 'bottom-[60%] left-1/2 -translate-x-1/2',
    xl: 'bottom-[60%] left-1/2 -translate-x-1/2',
  },
  emojiSize: {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  },
  imageSize: {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    xl: 'w-12 h-12',
  },
};

const ACCESSORY_PLACEMENTS: Record<string, AccessoryPlacement> = {
  cap: {
    ...DEFAULT_PLACEMENT,
    position: {
      sm: 'bottom-[49%] left-[48%] -translate-x-1/2',
      md: 'bottom-[50%] left-[48%] -translate-x-1/2',
      lg: 'bottom-[50%] left-[48%] -translate-x-1/2',
      xl: 'bottom-[50%] left-[48%] -translate-x-1/2',
    },
    extraClass: '-rotate-6',
  },
  sunglasses: {
    position: {
      sm: 'top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2',
      md: 'top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2',
      lg: 'top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2',
      xl: 'top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    perMascotPosition: {
      dino: 'top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2',
      lunna: 'top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2',
      estrela: 'top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    emojiSize: DEFAULT_PLACEMENT.emojiSize,
    imageSize: {
      sm: 'w-[18px] h-auto',
      md: 'w-[27px] h-auto',
      lg: 'w-[42px] h-auto',
      xl: 'w-[54px] h-auto',
    },
  },
  flower: {
    ...DEFAULT_PLACEMENT,
    position: {
      sm: 'bottom-[55%] left-[67%] -translate-x-1/2',
      md: 'bottom-[56%] left-[67%] -translate-x-1/2',
      lg: 'bottom-[56%] left-[67%] -translate-x-1/2',
      xl: 'bottom-[56%] left-[67%] -translate-x-1/2',
    },
    emojiSize: {
      sm: 'text-[9.8px]',
      md: 'text-[14px]',
      lg: 'text-[21px]',
      xl: 'text-[25.2px]',
    },
    imageSize: {
      sm: 'w-[14px] h-[14px]',
      md: 'w-[22px] h-[22px]',
      lg: 'w-[31px] h-[31px]',
      xl: 'w-[34px] h-[34px]',
    },
  },
};

export const MascotBadge: React.FC<MascotBadgeProps> = ({
  mascotId,
  hatId = 'none',
  size = 'md',
  showName = false,
  animate = true,
}) => {
  const mascot = MASCOT_LIST.find((m) => m.id === mascotId) || MASCOT_LIST[0];
  const hat = ACCESSORY_HATS.find((h) => h.id === hatId && h.id !== 'none');
  const placement = (hat && ACCESSORY_PLACEMENTS[hat.id]) || DEFAULT_PLACEMENT;
  const hatPositionClass = placement.perMascotPosition?.[mascot.id] ?? placement.position[size];

  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl',
  };

  return (
    <div className="flex flex-col items-center justify-center inline-block">
      <div
        className={`relative rounded-full flex items-center justify-center border-2 border-white shadow-md ${
          mascot.color
        } ${sizeClasses[size]} ${animate ? 'hover:scale-110 transition-transform' : ''}`}
      >
        {/* Accessory */}
        {hat && (
          hat.image ? (
            <img
              src={hat.image}
              alt={hat.name}
              draggable={false}
              className={`absolute z-10 pointer-events-none select-none object-contain filter drop-shadow ${hatPositionClass} ${placement.imageSize[size]} ${placement.extraClass ?? ''}`}
            />
          ) : (
            <span
              className={`absolute z-10 pointer-events-none select-none leading-none filter drop-shadow ${hatPositionClass} ${placement.emojiSize[size]} ${placement.extraClass ?? ''}`}
              role="img"
              aria-label={hat.name}
            >
              {hat.emoji}
            </span>
          )
        )}

        {/* Mascot Face */}
        {mascot.image ? (
          <img
            src={mascot.image}
            alt={mascot.name}
            draggable={false}
            className="w-[1.15em] h-[1.15em] object-contain select-none filter drop-shadow-sm"
          />
        ) : (
          <span className="select-none filter drop-shadow-sm">{mascot.emoji}</span>
        )}
      </div>

      {showName && (
        <span className="mt-1 text-xs font-bold text-slate-700 max-w-[100px] text-center truncate">
          {mascot.name.split(',')[0]}
        </span>
      )}
    </div>
  );
};
