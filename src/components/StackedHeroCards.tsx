import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hand,
  MapPin,
  User,
} from 'lucide-react';

export type HeroCardStatusTone = 'marked' | 'upcoming' | 'not-marked';

export interface StackedHeroCardData {
  id: string;
  title: string;
  subtitle: string;
  teacher: string | null;
  detail: string | null;
  statusLabel: string;
  statusTone: HeroCardStatusTone;
  canMarkAttendance: boolean;
}

interface StackedHeroCardsProps {
  cards: StackedHeroCardData[];
  initialIndex?: number;
  onMarkAttendance: () => void;
}

interface CardMeta {
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  badgeBg: string;
  badgeTextColor: string;
  iconBg: string;
  iconColor: string;
  ctaBg: string;
  shadow: string;
  illustrationColor: string;
  iconComponent: React.ReactNode;
}

const getCardMeta = (tone: HeroCardStatusTone): CardMeta => {
  if (tone === 'marked') {
    return {
      bgGradient:
        'from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0] dark:from-[#022C22] dark:via-[#064E3B] dark:to-[#0F172A]',
      borderColor: 'border-emerald-300 dark:border-emerald-500/60',
      titleColor: 'text-[#064E3B] dark:text-white',
      subtitleColor: 'text-[#059669] dark:text-emerald-300',
      badgeBg: 'bg-emerald-500/15',
      badgeTextColor: 'text-[#047857] dark:text-emerald-300',
      iconBg: 'bg-[#10B981]',
      iconColor: 'text-white',
      ctaBg:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/30',
      shadow: 'shadow-[0_12px_30px_-5px_rgba(16,185,129,0.3)]',
      illustrationColor: 'text-emerald-600/80 dark:text-emerald-300/80',
      iconComponent: <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />,
    };
  }

  if (tone === 'not-marked') {
    return {
      bgGradient:
        'from-[#FFE4E6] via-[#FECDD3] to-[#FDA4AF] dark:from-[#4C0519] dark:via-[#881337] dark:to-[#0F172A]',
      borderColor: 'border-rose-300 dark:border-rose-500/60',
      titleColor: 'text-[#881337] dark:text-white',
      subtitleColor: 'text-[#E11D48] dark:text-rose-300',
      badgeBg: 'bg-rose-500/15',
      badgeTextColor: 'text-[#9F1239] dark:text-rose-300',
      iconBg: 'bg-[#E11D48]',
      iconColor: 'text-white',
      ctaBg:
        'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-500/30',
      shadow: 'shadow-[0_12px_30px_-5px_rgba(225,29,72,0.3)]',
      illustrationColor: 'text-rose-600/80 dark:text-rose-300/80',
      iconComponent: <AlertCircle className="w-4.5 h-4.5 stroke-[2.2]" />,
    };
  }

  return {
    bgGradient:
      'from-[#E0E7FF] via-[#C7D2FE] to-[#A5B4FC] dark:from-[#1E1B4B] dark:via-[#312E81] dark:to-[#0F172A]',
    borderColor: 'border-indigo-300 dark:border-indigo-500/60',
    titleColor: 'text-[#1E1B4B] dark:text-white',
    subtitleColor: 'text-[#4F46E5] dark:text-indigo-300',
    badgeBg: 'bg-indigo-500/15',
    badgeTextColor: 'text-[#3730A3] dark:text-indigo-300',
    iconBg: 'bg-[#4F46E5]',
    iconColor: 'text-white',
    ctaBg:
      'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/30',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(79,70,229,0.3)]',
    illustrationColor: 'text-indigo-600/80 dark:text-indigo-300/80',
    iconComponent: <Clock3 className="w-4.5 h-4.5 stroke-[2.2]" />,
  };
};

export const StackedHeroCards: React.FC<StackedHeroCardsProps> = React.memo(
  ({ cards, initialIndex = 0, onMarkAttendance }) => {
    const clampedInitial = Math.min(
      Math.max(initialIndex, 0),
      Math.max(cards.length - 1, 0),
    );
    const [activeIndex, setActiveIndex] = useState(clampedInitial);
    const [isInteracting, setIsInteracting] = useState(false);
    const [throwVector, setThrowVector] = useState<{ x: number; y: number; rot: number }>({
      x: -380,
      y: 0,
      rot: -5,
    });

    useEffect(() => {
      setActiveIndex(clampedInitial);
    }, [clampedInitial, cards.length]);

    const nextCard = useCallback(() => {
      if (cards.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, [cards.length]);

    const prevCard = useCallback(() => {
      if (cards.length === 0) return;
      setActiveIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, [cards.length]);

    useEffect(() => {
      if (isInteracting || cards.length <= 1) return;
      const interval = setInterval(() => {
        setThrowVector({ x: -380, y: 0, rot: -5 });
        nextCard();
      }, 5000);
      return () => clearInterval(interval);
    }, [nextCard, isInteracting, cards.length]);

    if (!cards || cards.length === 0) return null;

    const stackConfigs = [
      { x: 0, y: 0, scale: 1.0, zIndex: 30, opacity: 1.0 },
      { x: 12, y: 3, scale: 0.97, zIndex: 20, opacity: 0.88 },
      { x: 22, y: 6, scale: 0.94, zIndex: 10, opacity: 0.72 },
    ];

    const visibleLayers = [0, 1, 2].map((offsetIndex) => {
      const cardIndex = (activeIndex + offsetIndex) % cards.length;
      return {
        card: cards[cardIndex],
        offsetIndex,
        config: stackConfigs[offsetIndex],
        cardIndex,
      };
    });

    return (
      <section className="relative select-none w-full max-w-full overflow-hidden touch-pan-y">
        <div
          className="relative h-[236px] w-full flex items-center justify-start px-0.5 transform-gpu"
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
        >
          <AnimatePresence initial={false}>
            {visibleLayers
              .slice()
              .reverse()
              .map(({ card, offsetIndex, config, cardIndex }) => {
                const meta = getCardMeta(card.statusTone);
                const isFront = offsetIndex === 0;

                return (
                  <motion.div
                    key={card.id || `card-layer-${offsetIndex}`}
                    drag={isFront ? 'x' : false}
                    dragDirectionLock
                    dragMomentum={false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    dragSnapToOrigin
                    onDragStart={() => setIsInteracting(true)}
                    onDragEnd={(_, info) => {
                      setIsInteracting(false);
                      const offsetX = info.offset.x;
                      const velX = info.velocity.x;

                      if (offsetX < -40 || velX < -140) {
                        setThrowVector({ x: -380, y: 0, rot: -5 });
                        nextCard();
                      } else if (offsetX > 40 || velX > 140) {
                        setThrowVector({ x: 380, y: 0, rot: 5 });
                        prevCard();
                      }
                    }}
                    onClick={() => {
                      if (!isFront) setActiveIndex(cardIndex);
                    }}
                    initial={{
                      x: config.x + 20,
                      y: config.y,
                      scale: config.scale * 0.96,
                      opacity: 0,
                      rotate: 0,
                    }}
                    animate={{
                      x: config.x,
                      y: config.y,
                      scale: config.scale,
                      opacity: config.opacity,
                      zIndex: config.zIndex,
                      rotate: 0,
                    }}
                    exit={{
                      x: throwVector.x,
                      y: throwVector.y,
                      rotate: throwVector.rot,
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.22, ease: 'easeOut' },
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    style={{ zIndex: config.zIndex, transformOrigin: 'center center' }}
                    className={`absolute top-0 left-0 w-[92%] sm:w-[88%] h-[224px] rounded-[24px] bg-gradient-to-br ${meta.bgGradient} p-4 sm:p-5 ${meta.shadow} border ${meta.borderColor} flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing box-border transform-gpu will-change-[transform,opacity]`}
                  >
                    <div className="flex justify-between items-center gap-2.5 z-10 w-full min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9.5 h-9.5 rounded-xl ${meta.iconBg} ${meta.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                        >
                          {meta.iconComponent}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-[16px] sm:text-[18px] font-black tracking-tight leading-tight truncate ${meta.titleColor}`}
                          >
                            {card.title}
                          </h3>
                          <p
                            className={`text-[12px] sm:text-[13px] font-bold truncate ${meta.subtitleColor} mt-0.5`}
                          >
                            {card.subtitle}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 ${meta.badgeBg} ${meta.badgeTextColor}`}
                      >
                        {card.statusLabel}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 z-10 my-1 w-full min-w-0">
                      <div className="space-y-1.5 min-w-0 flex-1 pr-1">
                        {card.teacher && (
                          <p className="text-[14.5px] sm:text-[16px] font-black text-[#0F172A] dark:text-slate-100 leading-tight flex items-center gap-1.5 min-w-0">
                            <User className="w-4 h-4 shrink-0 opacity-70" />
                            <span className="truncate">{card.teacher}</span>
                          </p>
                        )}
                        {card.detail && (
                          <p className="text-[11.5px] sm:text-[12.5px] font-semibold text-[#475569] dark:text-slate-400 flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{card.detail}</span>
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-white/35 dark:bg-white/5 blur-[2px]" />
                        <div
                          className={`relative w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-800/80 border ${meta.borderColor} flex items-center justify-center rotate-[-6deg] shadow-lg ${meta.illustrationColor}`}
                        >
                          {React.cloneElement(
                            meta.iconComponent as React.ReactElement<{ className?: string }>,
                            { className: 'w-6 h-6 stroke-[2.4]' },
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 z-10 pt-1 w-full min-w-0">
                      {isFront && card.canMarkAttendance && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAttendance();
                          }}
                          className={`h-11 px-4 sm:px-5 rounded-xl text-[13px] sm:text-[14px] font-black active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 ${meta.ctaBg}`}
                        >
                          <span>Mark attendance</span>
                          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] shrink-0">
            <button
              type="button"
              onClick={() => {
                setThrowVector({ x: 300, y: -100, rot: 20 });
                prevCard();
              }}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4 text-[#334155] dark:text-slate-300" />
            </button>
            <span className="font-mono font-black text-[12px] text-[#334155] dark:text-slate-300">
              {activeIndex + 1}/{cards.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setThrowVector({ x: -300, y: -100, rot: -20 });
                nextCard();
              }}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer flex items-center justify-center"
              title="Next"
            >
              <ChevronRight className="w-4 h-4 text-[#334155] dark:text-slate-300" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isInteracting && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
                <Hand className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                Swipe
              </span>
            )}
            {cards.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setIsInteracting(false);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-7 h-2 bg-[#7C3AED] shadow-2xs'
                      : 'w-2 h-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  title={`Card ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>
    );
  },
);
