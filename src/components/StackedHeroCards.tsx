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
  periodNumber?: number;
}

interface StackedHeroCardsProps {
  cards: StackedHeroCardData[];
  initialIndex?: number;
  onMarkAttendance: () => void;
}

type CardLayout = 'left' | 'right' | 'watermark';

interface CardTheme {
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  subtitleColor: string;
  iconBg: string;
  iconColor: string;
  accentText: string;
  shadow: string;
  illustrationColor: string;
  radius: string;
  layout: CardLayout;
  pattern: React.ReactNode;
}

const THEMES: CardTheme[] = [
  {
    bgGradient:
      'from-[#E0E7FF] via-[#C7D2FE] to-[#DDD6FE] dark:from-[#312E81] dark:via-[#4C1D95] dark:to-[#1E1B4B]',
    borderColor: 'border-indigo-300/70 dark:border-indigo-400/40',
    titleColor: 'text-[#1E1B4B] dark:text-white',
    subtitleColor: 'text-[#4338CA] dark:text-indigo-200',
    iconBg: 'bg-indigo-600',
    iconColor: 'text-white',
    accentText: 'text-indigo-700',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(79,70,229,0.3)]',
    illustrationColor: 'text-indigo-600/80 dark:text-indigo-200/80',
    radius: 'rounded-[28px]',
    layout: 'left',
    pattern: (
      <>
        <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-indigo-500/20 dark:bg-indigo-200/10" />
        <div className="absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-violet-500/20 dark:bg-violet-200/10" />
        <div className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-white/30 dark:bg-white/5" />
      </>
    ),
  },
  {
    bgGradient:
      'from-[#CCFBF1] via-[#A7F3D0] to-[#6EE7B7] dark:from-[#134E4A] dark:via-[#065F46] dark:to-[#022C22]',
    borderColor: 'border-teal-300/70 dark:border-teal-400/40',
    titleColor: 'text-[#134E4A] dark:text-white',
    subtitleColor: 'text-[#0F766E] dark:text-teal-200',
    iconBg: 'bg-teal-600',
    iconColor: 'text-white',
    accentText: 'text-teal-700',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(13,148,136,0.3)]',
    illustrationColor: 'text-teal-600/80 dark:text-teal-200/80',
    radius: 'rounded-[32px]',
    layout: 'right',
    pattern: (
      <>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(13,148,136,0.16) 0px, rgba(13,148,136,0.16) 10px, transparent 10px, transparent 22px)',
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 10px, transparent 10px, transparent 22px)',
          }}
        />
      </>
    ),
  },
  {
    bgGradient:
      'from-[#FFEDD5] via-[#FECDD3] to-[#FDA4AF] dark:from-[#9A3412] dark:via-[#9F1239] dark:to-[#4C0519]',
    borderColor: 'border-orange-300/70 dark:border-orange-400/40',
    titleColor: 'text-[#7C2D12] dark:text-white',
    subtitleColor: 'text-[#C2410C] dark:text-orange-200',
    iconBg: 'bg-orange-600',
    iconColor: 'text-white',
    accentText: 'text-orange-700',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(234,88,12,0.3)]',
    illustrationColor: 'text-orange-700/20 dark:text-white/15',
    radius: 'rounded-[24px]',
    layout: 'watermark',
    pattern: (
      <svg
        className="absolute inset-x-0 bottom-0 h-24 w-full text-orange-500/20 dark:text-orange-200/15"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M0,54 C60,14 120,94 200,54 C280,14 340,94 400,54 L400,100 L0,100 Z" />
        <path d="M0,74 C70,40 130,108 210,74 C290,40 340,108 400,74 L400,100 L0,100 Z" opacity="0.7" />
      </svg>
    ),
  },
  {
    bgGradient:
      'from-[#E0F2FE] via-[#BAE6FD] to-[#93C5FD] dark:from-[#0C4A6E] dark:via-[#075985] dark:to-[#0F172A]',
    borderColor: 'border-sky-300/70 dark:border-sky-400/40',
    titleColor: 'text-[#0C4A6E] dark:text-white',
    subtitleColor: 'text-[#0369A1] dark:text-sky-200',
    iconBg: 'bg-sky-600',
    iconColor: 'text-white',
    accentText: 'text-sky-700',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(2,132,199,0.3)]',
    illustrationColor: 'text-sky-600/80 dark:text-sky-200/80',
    radius: 'rounded-[28px]',
    layout: 'left',
    pattern: (
      <>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              'radial-gradient(rgba(2,132,199,0.22) 1.5px, transparent 1.6px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.14) 1.5px, transparent 1.6px)',
            backgroundSize: '16px 16px',
          }}
        />
      </>
    ),
  },
  {
    bgGradient:
      'from-[#FAE8FF] via-[#F0ABFC] to-[#D8B4FE] dark:from-[#701A75] dark:via-[#6B21A8] dark:to-[#3B0764]',
    borderColor: 'border-fuchsia-300/70 dark:border-fuchsia-400/40',
    titleColor: 'text-[#701A75] dark:text-white',
    subtitleColor: 'text-[#A21CAF] dark:text-fuchsia-200',
    iconBg: 'bg-fuchsia-600',
    iconColor: 'text-white',
    accentText: 'text-fuchsia-700',
    shadow: 'shadow-[0_12px_30px_-5px_rgba(192,38,211,0.3)]',
    illustrationColor: 'text-fuchsia-600/80 dark:text-fuchsia-200/80',
    radius: 'rounded-[32px]',
    layout: 'right',
    pattern: (
      <svg
        className="absolute inset-0 h-full w-full text-fuchsia-600/20 dark:text-white/10"
        viewBox="0 0 400 224"
        preserveAspectRatio="none"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        <circle cx="330" cy="40" r="70" strokeWidth="2" />
        <circle cx="300" cy="70" r="92" strokeWidth="2" />
        <circle cx="70" cy="190" r="58" strokeWidth="2" />
        <circle cx="40" cy="160" r="82" strokeWidth="2" />
      </svg>
    ),
  },
];

const getStatusChipClasses = (tone: HeroCardStatusTone): string => {
  if (tone === 'marked') {
    return 'bg-white/90 text-emerald-700 border-white/60';
  }
  if (tone === 'not-marked') {
    return 'bg-white/90 text-rose-700 border-white/60';
  }
  return 'bg-white/90 text-slate-600 border-white/60';
};

const getStatusIcon = (tone: HeroCardStatusTone): React.ReactNode => {
  if (tone === 'marked') {
    return <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />;
  }
  if (tone === 'not-marked') {
    return <AlertCircle className="w-4.5 h-4.5 stroke-[2.2]" />;
  }
  return <Clock3 className="w-4.5 h-4.5 stroke-[2.2]" />;
};

const getThemeForCard = (
  card: StackedHeroCardData,
  fallbackIndex: number,
): CardTheme => {
  const rawIndex =
    typeof card.periodNumber === 'number'
      ? card.periodNumber - 1
      : fallbackIndex;
  return THEMES[((rawIndex % THEMES.length) + THEMES.length) % THEMES.length];
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
                const theme = getThemeForCard(card, cardIndex);
                const statusIcon = getStatusIcon(card.statusTone);
                const isFront = offsetIndex === 0;
                const iconTile = (
                  <div
                    className={`w-9.5 h-9.5 rounded-xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center shadow-xs shrink-0`}
                  >
                    {statusIcon}
                  </div>
                );

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
                    className={`absolute top-0 left-0 w-[92%] sm:w-[88%] h-[224px] ${theme.radius} bg-gradient-to-br ${theme.bgGradient} p-4 sm:p-5 ${theme.shadow} border ${theme.borderColor} flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing box-border transform-gpu will-change-[transform,opacity]`}
                  >
                    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                      {theme.pattern}
                    </div>

                    {theme.layout === 'watermark' && (
                      <div
                        className={`pointer-events-none absolute -bottom-6 -right-4 z-0 ${theme.illustrationColor}`}
                      >
                        {React.cloneElement(
                          statusIcon as React.ReactElement<{ className?: string }>,
                          { className: 'w-40 h-40 stroke-[1.5]' },
                        )}
                      </div>
                    )}

                    {theme.layout === 'right' ? (
                      <div className="relative z-10 flex justify-between items-start gap-2.5 w-full min-w-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 border shadow-sm ${getStatusChipClasses(card.statusTone)}`}
                        >
                          {card.statusLabel}
                        </span>

                        <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1">
                          <div className="min-w-0 flex-1 text-right">
                            <h3
                              className={`text-[16px] sm:text-[18px] font-black tracking-tight leading-tight truncate ${theme.titleColor}`}
                            >
                              {card.title}
                            </h3>
                            <p
                              className={`text-[12px] sm:text-[13px] font-bold truncate ${theme.subtitleColor} mt-0.5`}
                            >
                              {card.subtitle}
                            </p>
                          </div>
                          {iconTile}
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 flex justify-between items-center gap-2.5 w-full min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {iconTile}

                          <div className="min-w-0 flex-1">
                            <h3
                              className={`text-[16px] sm:text-[18px] font-black tracking-tight leading-tight truncate ${theme.titleColor}`}
                            >
                              {card.title}
                            </h3>
                            <p
                              className={`text-[12px] sm:text-[13px] font-bold truncate ${theme.subtitleColor} mt-0.5`}
                            >
                              {card.subtitle}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 border shadow-sm ${getStatusChipClasses(card.statusTone)}`}
                        >
                          {card.statusLabel}
                        </span>
                      </div>
                    )}

                    <div className="relative z-10 flex justify-between items-center gap-2 my-1 w-full min-w-0">
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

                      {theme.layout !== 'watermark' && (
                        <div className="shrink-0 relative w-16 h-16 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-white/35 dark:bg-white/5 blur-[2px]" />
                          <div
                            className={`relative w-11 h-11 rounded-2xl bg-white/70 dark:bg-slate-800/80 border ${theme.borderColor} flex items-center justify-center rotate-[-6deg] shadow-lg ${theme.illustrationColor}`}
                          >
                            {React.cloneElement(
                              statusIcon as React.ReactElement<{ className?: string }>,
                              { className: 'w-6 h-6 stroke-[2.4]' },
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex justify-end items-center gap-2 pt-1 w-full min-w-0">
                      {isFront && card.canMarkAttendance && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAttendance();
                          }}
                          className={`h-11 px-4 sm:px-5 rounded-xl text-[13px] sm:text-[14px] font-black active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-white hover:bg-white/90 border border-white/70 ${theme.accentText}`}
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
