import React, { useState, useEffect } from 'react';
import { Promo } from '../types';
import { Sparkles, ChevronLeft, ChevronRight, Gift, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoTickerProps {
  promos: Promo[];
  onApplyPromo: (code: string) => void;
}

export default function PromoTicker({ promos, onApplyPromo }: PromoTickerProps) {
  const activePromos = promos.filter(p => p.active);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activePromos.length);
    }, 8000); // cycle every 8 seconds
    return () => clearInterval(interval);
  }, [activePromos.length]);

  if (activePromos.length === 0) return null;

  const currentPromo = activePromos[currentIndex];

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activePromos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activePromos.length) % activePromos.length);
  };

  return (
    <div id="promo-ticker-container" className="bg-indigo-50 border-y border-indigo-100 text-indigo-950 py-2.5 px-4 flex items-center justify-between relative overflow-hidden text-sm shadow-xs">
      {/* Visual background sparkle */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-8 opacity-5 pointer-events-none text-indigo-900">
        <Gift size={100} />
      </div>

      <div className="flex items-center gap-3 w-full max-w-7xl mx-auto z-10">
        <span className="flex items-center gap-1.5 bg-indigo-600 text-white font-bold text-xs px-2 py-1 rounded-full uppercase tracking-wider shrink-0 animate-pulse">
          <Sparkles size={13} />
          PROMO AKTIF
        </span>

        {/* Scrolling text zone */}
        <div className="flex-1 overflow-hidden relative min-h-[24px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPromo.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center flex-wrap gap-2 md:gap-4 text-xs md:text-sm"
            >
              <strong className="font-semibold text-indigo-900">{currentPromo.title}:</strong>
              <span className="text-slate-700">{currentPromo.description}</span>
              
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={(e) => handleCopy(currentPromo.code, e)}
                  className="inline-flex items-center gap-1 bg-white hover:bg-indigo-100/50 border border-indigo-200 text-indigo-900 px-2 py-0.5 rounded text-xs font-mono transition-colors active:scale-95 cursor-pointer"
                  title="Salin kode promo"
                >
                  {copiedCode === currentPromo.code ? (
                    <>
                      <Check size={11} className="text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={11} />
                      <span>{currentPromo.code}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onApplyPromo(currentPromo.code)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-0.5 rounded text-xs font-medium transition-colors active:scale-95 cursor-pointer"
                >
                  Gunakan
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel controls */}
        {activePromos.length > 1 && (
          <div className="flex items-center gap-1 shrink-0 ml-4">
            <button
              onClick={handlePrev}
              className="p-1 rounded-full hover:bg-indigo-100 text-indigo-800 transition-colors cursor-pointer"
              aria-label="Promo sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-indigo-700 font-mono">
              {currentIndex + 1}/{activePromos.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded-full hover:bg-indigo-100 text-indigo-800 transition-colors cursor-pointer"
              aria-label="Promo selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
