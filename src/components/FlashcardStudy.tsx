import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Word, StudyDirection, StudyFilter } from '../types';
import { tts } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Volume2,
  Check,
  X,
  Star,
  Sparkles,
  PenTool,
  Award,
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Rotate3D,
  Lightbulb,
  Headphones,
  FileText,
  HelpCircle
} from 'lucide-react';

interface FlashcardStudyProps {
  onOpenStrokeWriter?: (hanzi: string) => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({ onOpenStrokeWriter }) => {
  const {
    words,
    dueWordsCount,
    totalWordsCount,
    starredWordsCount,
    hsk1WordsCount,
    customWordsCount,
    recordReview,
    toggleStar,
    settings,
    setActiveTab
  } = useApp();

  // Study Config State
  const [direction, setDirection] = useState<StudyDirection>('hanzi-to-meaning');
  const [filterMode, setFilterMode] = useState<StudyFilter>('unmastered');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'hsk1' | 'custom'>('all');
  const [isStudying, setIsStudying] = useState<boolean>(false);

  // Active Session State
  const [sessionQueue, setSessionQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState<{ remembered: number; forgotten: number }>({
    remembered: 0,
    forgotten: 0
  });

  // Filter words based on user selection
  const getFilteredWords = useCallback((): Word[] => {
    let pool = [...words];

    // Filter by Scope (HSK 1 original vs Custom user words)
    if (scopeFilter === 'hsk1') {
      pool = pool.filter(w => w.source === 'hsk1' || w.lesson?.includes('HSK 1'));
    } else if (scopeFilter === 'custom') {
      pool = pool.filter(w => w.source === 'custom' || w.source === 'ai' || (!w.lesson?.includes('HSK 1') && w.source !== 'hsk1'));
    }

    if (filterMode === 'unmastered') {
      return pool.filter(w => w.box < 5);
    }
    if (filterMode === 'starred') {
      return pool.filter(w => w.isStarred);
    }
    if (filterMode === 'mastered') {
      return pool.filter(w => w.box >= 5);
    }
    return pool;
  }, [words, filterMode, scopeFilter]);

  // Start study session
  const startStudy = () => {
    let pool = getFilteredWords();
    if (pool.length === 0) {
      pool = [...words];
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSessionQueue(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionCompleted(false);
    setSessionStats({ remembered: 0, forgotten: 0 });
    setIsStudying(true);
    soundEffects.playClick();
  };

  const currentWord: Word | undefined = sessionQueue[currentIndex];

  // Reset flip and hint state when switching card
  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
  }, [currentIndex]);

  // Play audio for current word
  // Play audio for current word
  const playAudio = useCallback(() => {
    if (!currentWord) return;
    soundEffects.playClick();
    tts.speak(currentWord.hanzi, settings.voiceRate, settings.voicePitch);
  }, [currentWord, settings.voiceRate, settings.voicePitch]);

  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [isTransitioningCard, setIsTransitioningCard] = useState<boolean>(false);

  // Swipe / Drag Gesture State using Unified Pointer Events
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const pointerStartRef = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Lock body scrolling when in study mode
  useEffect(() => {
    if (isStudying && !sessionCompleted) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      const prevOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
        document.body.style.overscrollBehavior = prevOverscroll;
      };
    }
  }, [isStudying, sessionCompleted]);

  // Navigate to another card instantly with slide transition animation
  const goToCard = useCallback((newIndex: number, dir?: 'next' | 'prev') => {
    setIsFlipped(false);
    setShowHint(false);
    setDragOffset(0);
    setSlideDirection(dir || (newIndex > currentIndex ? 'next' : 'prev'));
    setIsTransitioningCard(true);
    setCurrentIndex(newIndex);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsTransitioningCard(false);
      }, 50);
    });
  }, [currentIndex]);

  // Toggle Flip Card (3D Flip Animation)
  const handleToggleFlip = () => {
    soundEffects.playClick();
    setIsFlipped(prev => !prev);
  };

  // Toggle Hint
  const handleToggleHint = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    setShowHint(prev => !prev);
  };

  // Navigate Previous Card (Mũi tên Trái / Phím A - Trượt từ trái sang)
  const handlePrevCard = () => {
    if (currentIndex > 0) {
      soundEffects.playClick();
      goToCard(currentIndex - 1, 'prev');
    }
  };

  // Navigate Next Card (Mũi tên Phải / Phím D - Trượt từ phải sang)
  const handleNextCard = () => {
    if (currentIndex + 1 < sessionQueue.length) {
      soundEffects.playClick();
      goToCard(currentIndex + 1, 'next');
    }
  };

  // Unified Pointer Down Handler (Supports Mobile Touch + Desktop Mouse flawlessly)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, [data-interactive="true"]')) {
      return;
    }

    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    pointerStartRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  // Unified Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || pointerStartRef.current.id !== e.pointerId) return;

    const diffX = e.clientX - pointerStartRef.current.x;
    if (Math.abs(diffX) > 6) {
      hasMovedRef.current = true;
      setDragOffset(diffX);
    }
  };

  // Unified Pointer Up / Cancel Handler
  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || pointerStartRef.current.id !== e.pointerId) return;

    const startInfo = pointerStartRef.current;
    pointerStartRef.current = null;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const SWIPE_THRESHOLD = 45; // 45px swipe distance to switch card
    if (dragOffset < -SWIPE_THRESHOLD) {
      if (currentIndex + 1 < sessionQueue.length) {
        handleNextCard();
      } else {
        soundEffects.playClick();
      }
    } else if (dragOffset > SWIPE_THRESHOLD) {
      if (currentIndex > 0) {
        handlePrevCard();
      } else {
        soundEffects.playClick();
      }
    } else if (!hasMovedRef.current && Date.now() - startInfo.time < 400) {
      // Clean tap on the card without dragging -> flip card
      handleToggleFlip();
    }

    setDragOffset(0);
  };

  // Handle User Answer: Remembered (✓ Nhớ - Phím 2 - Trượt sang từ tiếp theo)
  const handleRemembered = () => {
    if (!currentWord) return;
    soundEffects.playSuccess();
    recordReview(currentWord.id, true);
    setSessionStats(prev => ({ ...prev, remembered: prev.remembered + 1 }));

    if (currentIndex + 1 < sessionQueue.length) {
      goToCard(currentIndex + 1, 'next');
    } else {
      setSessionCompleted(true);
      soundEffects.playLevelUp();
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  // Handle User Answer: Forgotten (✕ Chưa nhớ - Phím 1 - Trượt sang từ tiếp theo)
  const handleForgotten = () => {
    if (!currentWord) return;
    soundEffects.playWrong();
    recordReview(currentWord.id, false);
    setSessionStats(prev => ({ ...prev, forgotten: prev.forgotten + 1 }));

    if (currentIndex + 1 < sessionQueue.length) {
      goToCard(currentIndex + 1, 'next');
    } else {
      setSessionCompleted(true);
      soundEffects.playLevelUp();
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStudying || sessionCompleted || !currentWord) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFlip();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === '1') {
        e.preventDefault();
        handleForgotten();
      } else if (e.key === '2') {
        e.preventDefault();
        handleRemembered();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHint(prev => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        toggleStar(currentWord.id);
        soundEffects.playClick();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (onOpenStrokeWriter) onOpenStrokeWriter(currentWord.hanzi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudying, sessionCompleted, currentWord, currentIndex, sessionQueue.length, isFlipped, handlePrevCard, handleNextCard, handleRemembered, handleForgotten, toggleStar, onOpenStrokeWriter]);

  // ================= RENDER: ACTIVE STUDY MODE =================

  if (isStudying) {
    if (sessionCompleted) {
      return (
        <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#1f1a17] border border-[#2e2621] text-center shadow-2xl space-y-4 sm:space-y-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-[#28382d] border border-[#3e5e48] flex items-center justify-center text-[#5eb786]">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#f5ede4] mb-1">Tuyệt vời! Đã hoàn thành buổi ôn</h2>
              <p className="text-xs text-[#8e837a]">
                Bạn đã ôn tập xong {sessionQueue.length} từ vựng với hệ thống lặp lại ngắt quãng (SRS Leitner).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-xs mx-auto">
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1a261d] border border-[#2d4734]">
                <span className="block text-xl sm:text-2xl font-black text-[#5eb786]">
                  {sessionStats.remembered}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#8e837a]">Đã nhớ (Lên hộp)</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#2b1917] border border-[#4d2522]">
                <span className="block text-xl sm:text-2xl font-black text-[#e05344]">
                  {sessionStats.forgotten}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#8e837a]">Chưa nhớ (Ôn lại)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
              <button
                onClick={startStudy}
                className="flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ôn lại lần nữa</span>
              </button>
              <button
                onClick={() => setIsStudying(false)}
                className="px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#27211d] hover:bg-[#322a25] text-[#d8cebe] font-bold text-xs border border-[#3d332c] transition-all cursor-pointer"
              >
                Quay về trang chính
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!currentWord) return null;

    const progressPercent = ((currentIndex + 1) / sessionQueue.length) * 100;

    return (
      <div className="w-full max-w-xl mx-auto px-2.5 sm:px-4 py-1 space-y-2.5 sm:space-y-3.5">
        {/* Study Header with Progress Bar, Direction Badge and Exit Button */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setIsStudying(false)}
            className="p-1.5 sm:p-2 rounded-xl bg-[#1f1a17] hover:bg-[#28221e] text-[#8e837a] hover:text-white border border-[#2e2621] transition-colors shrink-0 cursor-pointer"
            title="Thoát ôn tập"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Direction indicator tag */}
          <span className="text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded-lg bg-[#27211d] text-[#e5a044] border border-[#382f29] shrink-0">
            {direction === 'hanzi-to-meaning'
              ? '🔀 Chữ ➔ Nghĩa'
              : direction === 'meaning-to-hanzi'
              ? '📝 Nghĩa ➔ Chữ'
              : '🔊 Nghe ➔ Chữ'}
          </span>

          {/* Progress bar line */}
          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full bg-[#27211d] overflow-hidden">
              <div
                className="h-full bg-[#df5343] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Ratio indicator (e.g. 1/40) */}
          <div className="text-xs font-mono font-bold text-[#8e837a] shrink-0">
            {currentIndex + 1}/{sessionQueue.length}
          </div>
        </div>

        {/* ================= REAL 3D FLIP FLASHCARD CONTAINER (WITH SWIPE GESTURES & SLIDE ANIMATION) ================= */}
        <div
          className="w-full select-none relative touch-none overscroll-none"
          style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {/* Real-time Swipe Feedback Badge Indicator */}
          {dragOffset < -25 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 px-3.5 py-2 rounded-xl bg-[#df5343] text-white font-bold text-xs shadow-2xl z-30 flex items-center gap-1.5 pointer-events-none animate-in fade-in"
              style={{ opacity: Math.min(1, Math.abs(dragOffset) / 50) }}
            >
              <span>Đi tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}

          {dragOffset > 25 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 px-3 py-1.5 rounded-xl bg-[#27211d] border border-[#3d332c] text-[#e5a044] font-bold text-xs shadow-2xl z-30 flex items-center gap-1.5 pointer-events-none animate-in fade-in"
              style={{ opacity: Math.min(1, Math.abs(dragOffset) / 50) }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Lùi lại</span>
            </div>
          )}

          {/* Stationary Card Container (No dragging movement, pure instant stability) */}
          <div
            key={currentIndex}
            className={`w-full ${
              slideDirection === 'next'
                ? 'animate-slide-next'
                : slideDirection === 'prev'
                ? 'animate-slide-prev'
                : ''
            }`}
          >
            <div
              className={`w-full min-h-[360px] sm:min-h-[420px] relative flip-card-inner perspective-1000 cursor-pointer rounded-2xl sm:rounded-3xl touch-none select-none ${
                isFlipped ? 'is-flipped' : ''
              } ${isTransitioningCard ? 'no-anim' : ''}`}
              style={{
                touchAction: 'none',
                userSelect: 'none'
              }}
            >
            {/* ================= CARD FRONT (rotateY: 0deg) ================= */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#1f1a17] hover:border-[#3d332c] border border-[#2e2621] shadow-2xl flex flex-col items-center justify-between text-center transition-colors touch-none select-none"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                touchAction: 'none'
              }}
            >
              {/* Top Meta: Box & Lesson & Star & Pen */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 rounded-lg bg-[#27211d] text-[#8e837a] border border-[#382f29] font-semibold">
                    Hộp {currentWord.box}/5
                  </span>
                  {currentWord.lesson && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#191512] text-[#8e837a] border border-[#2a221d] hidden xs:inline truncate max-w-[140px] sm:max-w-[180px]">
                      {currentWord.lesson}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(currentWord.id);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                      currentWord.isStarred
                        ? 'bg-[#33261a] text-[#e5a044] border-[#59421e]'
                        : 'bg-[#191512] text-[#6b625b] hover:text-[#d8cebe] border-[#2e2621]'
                    }`}
                    title="Đánh dấu chữ khó (S)"
                  >
                    <Star className={`w-3.5 h-3.5 ${currentWord.isStarred ? 'fill-[#e5a044]' : ''}`} />
                  </button>

                  {onOpenStrokeWriter && (
                    <button
                      type="button"
                      data-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStrokeWriter(currentWord.hanzi);
                      }}
                      className="p-1.5 sm:p-2 rounded-xl bg-[#191512] hover:bg-[#28221e] text-[#5bb3e0] border border-[#2e2621] transition-all cursor-pointer"
                      title="Tập viết chữ này (W)"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Center Content: Varies dynamically by Study Direction */}
              <div className="flex flex-col items-center justify-center my-auto space-y-3 sm:space-y-4 py-2 sm:py-4 w-full">
                {/* 1. DIRECTION: CHỮ ➔ NGHĨA */}
                {direction === 'hanzi-to-meaning' && (
                  <>
                    <h1 className="font-chinese text-6xl sm:text-8xl font-normal text-[#f5ede4] tracking-wider select-none leading-none">
                      {currentWord.hanzi}
                    </h1>

                    <button
                      type="button"
                      data-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#27211d] hover:bg-[#322a25] text-[#f5ede4] border border-[#3d332c] text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#df5343]" />
                      <span>Phát âm</span>
                    </button>
                  </>
                )}

                {/* 2. DIRECTION: NGHĨA ➔ CHỮ */}
                {direction === 'meaning-to-hanzi' && (
                  <div className="space-y-2 sm:space-y-3 max-w-md">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#df5343] bg-[#2b1917] px-2.5 py-0.5 rounded-full border border-[#4d2522]">
                      Hãy nhớ lại Chữ Hán
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-[#f5ede4] leading-tight">
                      {currentWord.vietnamese}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#6b625b]">
                      (Chữ Hán này được viết và phát âm như thế nào?)
                    </p>
                  </div>
                )}

                {/* 3. DIRECTION: NGHE ➔ CHỮ */}
                {direction === 'audio-to-hanzi' && (
                  <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                    <button
                      type="button"
                      data-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio();
                      }}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-[#27211d] hover:bg-[#322a25] border-2 border-[#df5343] flex items-center justify-center text-[#df5343] shadow-xl active:scale-95 transition-all group-hover:border-[#eb5f50] cursor-pointer"
                      title="Bấm để nghe lại phát âm"
                    >
                      <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
                    </button>

                    <span className="text-xs font-bold text-[#f5ede4]">
                      Đang nghe phát âm...
                    </span>
                    <p className="text-[11px] sm:text-xs text-[#8e837a]">
                      Bấm vào loa để nghe lại và đoán xem đây là chữ Hán nào
                    </p>
                  </div>
                )}

                {/* Hint Button & Hint Drawer */}
                <div className="w-full max-w-sm pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    data-interactive="true"
                    onClick={handleToggleHint}
                    className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border flex items-center gap-1.5 mx-auto transition-all cursor-pointer ${
                      showHint
                        ? 'bg-[#332815] text-[#e5a044] border-[#59421e]'
                        : 'bg-[#191512] text-[#8e837a] hover:text-[#d8cebe] border-[#2e2621]'
                    }`}
                    title="Mở gợi ý bộ thủ hoặc chiết tự nếu chưa nhớ ra"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#e5a044]" />
                    <span>{showHint ? 'Ẩn gợi ý' : '💡 Gợi ý nếu chưa nhớ (H)'}</span>
                  </button>

                  {showHint && (
                    <div className="mt-2 p-2.5 rounded-xl sm:rounded-2xl bg-[#161311] border border-[#33261a] text-xs text-[#d8cebe] text-left space-y-1 animate-in fade-in zoom-in-95">
                      {currentWord.radicals && (
                        <p>
                          <span className="text-[#e5a044] font-bold">🧩 Bộ thủ:</span>{' '}
                          <span className="text-[#f5ede4]">{currentWord.radicals}</span>
                        </p>
                      )}
                      {currentWord.mnemonic ? (
                        <p>
                          <span className="text-[#5eb786] font-bold">💡 Mẹo gợi nhớ:</span>{' '}
                          <span className="text-[#f5ede4]">{currentWord.mnemonic}</span>
                        </p>
                      ) : (
                        <p className="text-[#8e837a] italic">
                          Hãy quan sát các nét bút và cấu trúc của chữ để kích hoạt trí nhớ.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Flip Hint */}
              <div className="text-[10px] sm:text-[11px] text-[#6b625b] group-hover:text-[#8e837a] transition-colors flex items-center gap-1.5">
                <Rotate3D className="w-3.5 h-3.5" />
                <span>Chạm để lật (Space) • Vuốt ↔️ để chuyển từ</span>
              </div>
            </div>

            {/* ================= CARD BACK (rotateY: 180deg) ================= */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#1f1a17] hover:border-[#3d332c] border border-[#2e2621] shadow-2xl flex flex-col items-center justify-between text-center transition-colors group overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              {/* Top Header */}
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 rounded-lg bg-[#27211d] text-[#8e837a] border border-[#382f29] font-semibold">
                    Hộp {currentWord.box}/5
                  </span>
                  {currentWord.lesson && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#191512] text-[#8e837a] border border-[#2a221d] hidden xs:inline truncate max-w-[140px] sm:max-w-[180px]">
                      {currentWord.lesson}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    data-interactive="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(currentWord.id);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                      currentWord.isStarred
                        ? 'bg-[#33261a] text-[#e5a044] border-[#59421e]'
                        : 'bg-[#191512] text-[#6b625b] hover:text-[#d8cebe] border-[#2e2621]'
                    }`}
                    title="Đánh dấu chữ khó (S)"
                  >
                    <Star className={`w-3.5 h-3.5 ${currentWord.isStarred ? 'fill-[#e5a044]' : ''}`} />
                  </button>

                  {onOpenStrokeWriter && (
                    <button
                      type="button"
                      data-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStrokeWriter(currentWord.hanzi);
                      }}
                      className="p-1.5 sm:p-2 rounded-xl bg-[#191512] hover:bg-[#28221e] text-[#5bb3e0] border border-[#2e2621] transition-all cursor-pointer"
                      title="Tập viết chữ này (W)"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Center: Full Word Details */}
              <div className="flex flex-col items-center justify-center my-auto space-y-2 py-1.5 w-full max-w-md">
                <h2 className="font-chinese text-3xl sm:text-5xl text-[#f5ede4] font-bold">
                  {currentWord.hanzi}
                </h2>

                <p className="text-xl sm:text-3xl font-bold text-[#f05d48] tracking-wide">
                  {currentWord.pinyin}
                </p>

                <div>
                  <p className="text-base sm:text-xl text-[#f5ede4] font-bold">
                    {currentWord.vietnamese}
                  </p>
                  {currentWord.hanViet && (
                    <p className="text-[11px] sm:text-xs text-[#8e837a] mt-0.5">
                      Âm Hán Việt: <span className="text-[#bfb5a7] font-semibold">{currentWord.hanViet}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  data-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#27211d] hover:bg-[#322a25] text-[#f5ede4] border border-[#3d332c] text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#df5343]" />
                  <span>Nghe lại</span>
                </button>

                {/* Radicals, Mnemonic, Examples */}
                <div className="w-full text-left space-y-1.5 pt-1 border-t border-[#2e2621]">
                  {(currentWord.radicals || currentWord.mnemonic) && (
                    <div className="p-2 rounded-xl bg-[#161311] border border-[#27201c] text-xs text-[#d8cebe] space-y-0.5">
                      {currentWord.radicals && (
                        <p>
                          <span className="text-[#e5a044] font-semibold">🧩 Bộ thủ:</span>{' '}
                          <span>{currentWord.radicals}</span>
                        </p>
                      )}
                      {currentWord.mnemonic && (
                        <p>
                          <span className="text-[#5eb786] font-semibold">💡 Mẹo nhớ:</span>{' '}
                          <span>{currentWord.mnemonic}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {currentWord.exampleSentence && (
                    <div className="p-2 rounded-xl bg-[#161311] border border-[#27201c] text-xs space-y-0.5">
                      <p className="font-chinese text-xs sm:text-sm text-[#f5ede4]">
                        📝 {currentWord.exampleSentence}
                      </p>
                      {currentWord.examplePinyin && (
                        <p className="text-[10px] sm:text-[11px] text-[#f05d48]">
                          {currentWord.examplePinyin}
                        </p>
                      )}
                      {currentWord.exampleVietnamese && (
                        <p className="text-[11px] sm:text-xs text-[#8e837a] italic">
                          ➔ {currentWord.exampleVietnamese}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Flip Back Hint */}
              <div className="text-[10px] sm:text-[11px] text-[#6b625b] group-hover:text-[#8e837a] transition-colors flex items-center gap-1.5">
                <Rotate3D className="w-3.5 h-3.5" />
                <span>Chạm để lật lại (Space) • Vuốt ↔️ để chuyển từ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* ================= CONTROLS: FREE NAVIGATION (← / →) & SRS RATINGS (1 / 2) ================= */}
        <div className="space-y-2 pt-0.5">
          {/* Row 1: Free Navigation (Lùi lại [←] / Lật thẻ [Space] / Đi tiếp [→]) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Lùi lại (Mũi tên Trái / A) */}
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
              className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#1f1a17] hover:bg-[#27211d] disabled:opacity-40 disabled:pointer-events-none text-[11px] sm:text-xs font-bold text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Lùi lại từ trước (Phím Mũi tên Trái hoặc Phím A)"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Lùi lại (←)</span>
            </button>

            {/* Lật thẻ 3D (Space) */}
            <button
              type="button"
              onClick={handleToggleFlip}
              className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#27211d] hover:bg-[#322a25] text-[11px] sm:text-xs font-bold text-[#e5a044] border border-[#3d332c] transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              title="Lật thẻ 3D (Phím Space)"
            >
              <Rotate3D className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{isFlipped ? 'Mặt trước' : 'Lật xem nghĩa'}</span>
            </button>

            {/* Đi tiếp (Mũi tên Phải / D) */}
            <button
              type="button"
              onClick={handleNextCard}
              disabled={currentIndex === sessionQueue.length - 1}
              className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl sm:rounded-2xl bg-[#1f1a17] hover:bg-[#27211d] disabled:opacity-40 disabled:pointer-events-none text-[11px] sm:text-xs font-bold text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Đi tiếp từ sau (Phím Mũi tên Phải hoặc Phím D)"
            >
              <span>Đi tiếp (→)</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Row 2: SRS Assessment Buttons (Phím 1: Chưa nhớ / Phím 2: Đã nhớ) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* ✕ Chưa nhớ (Phím 1) */}
            <button
              type="button"
              onClick={handleForgotten}
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl bg-[#2b1917] hover:bg-[#38201d] text-[#e05344] hover:text-[#eb5f50] border border-[#4d2522] font-bold text-xs sm:text-base transition-all active:scale-98 shadow-sm cursor-pointer"
              title="Đánh dấu chưa nhớ (Phím 1)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>✕ Chưa nhớ (1)</span>
            </button>

            {/* ✓ Đã nhớ (Phím 2) */}
            <button
              type="button"
              onClick={handleRemembered}
              className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 rounded-xl sm:rounded-2xl bg-[#5eb786] hover:bg-[#4ea877] text-[#0f2619] font-extrabold text-xs sm:text-base transition-all active:scale-98 shadow-md cursor-pointer"
              title="Đánh dấu đã nhớ (Phím 2)"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              <span>✓ Đã nhớ (2)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: DASHBOARD VIEW =================
  const filteredWordsCount = getFilteredWords().length;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-1 space-y-3 sm:space-y-4">
      {/* SECTION 1: CHIỀU HỌC & CHẾ ĐỘ ÔN */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8e837a] mb-0.5">
            CHIỀU HỌC
          </h3>
          <p className="text-xs text-[#d8cebe]">
            Bạn muốn kiểm tra theo hướng nào?
          </p>
        </div>

        {/* 3 Distinct Direction Switchers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Option 1: Chữ -> Nghĩa */}
          <button
            onClick={() => setDirection('hanzi-to-meaning')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              direction === 'hanzi-to-meaning'
                ? 'bg-[#2b1917] border-[#df5343] text-white shadow-md'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#221b17]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <span className="text-xs sm:text-sm font-bold text-[#df5343]">🔀 Chữ ➔ Nghĩa</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#8e837a]">
              Mặt trước hiện <strong>Chữ Hán</strong> ➔ Lật xem <strong>Nghĩa & Pinyin</strong>
            </p>
          </button>

          {/* Option 2: Nghĩa -> Chữ */}
          <button
            onClick={() => setDirection('meaning-to-hanzi')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              direction === 'meaning-to-hanzi'
                ? 'bg-[#33261a] border-[#e5a044] text-white shadow-md'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#221b17]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <span className="text-xs sm:text-sm font-bold text-[#e5a044]">📝 Nghĩa ➔ Chữ 汉</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#8e837a]">
              Mặt trước hiện <strong>Tiếng Việt</strong> ➔ Thử nhớ lại <strong>Chữ Hán</strong>
            </p>
          </button>

          {/* Option 3: Nghe -> Chữ */}
          <button
            onClick={() => setDirection('audio-to-hanzi')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              direction === 'audio-to-hanzi'
                ? 'bg-[#1a261d] border-[#5eb786] text-white shadow-md'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#221b17]'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
              <span className="text-xs sm:text-sm font-bold text-[#5eb786]">🔊 Nghe ➔ Chữ</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#8e837a]">
              Phát âm <strong>Âm thanh</strong> ➔ Đoán xem là <strong>Chữ Hán</strong> nào
            </p>
          </button>
        </div>

        {/* Scope Filter: Từ gốc HSK 1 vs Từ tự thêm */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] sm:text-[11px] text-[#8e837a] shrink-0">Nguồn từ:</span>
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all cursor-pointer ${
              scopeFilter === 'all'
                ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
            }`}
          >
            Tất cả ({totalWordsCount})
          </button>

          <button
            onClick={() => setScopeFilter('hsk1')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all cursor-pointer ${
              scopeFilter === 'hsk1'
                ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
            }`}
          >
            Gốc HSK 1 ({hsk1WordsCount})
          </button>

          <button
            onClick={() => setScopeFilter('custom')}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border transition-all cursor-pointer ${
              scopeFilter === 'custom'
                ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
            }`}
          >
            Tự thêm & AI ({customWordsCount})
          </button>
        </div>
      </div>

      {/* SECTION 2: BỘ LỌC TỪ ÔN TẬP */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8e837a] mb-0.5">
            BỘ LỌC TỪ
          </h3>
          <p className="text-xs text-[#d8cebe]">
            Chọn nhóm từ bạn muốn đưa vào buổi ôn tập này
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setFilterMode('unmastered')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'unmastered'
                ? 'bg-[#2b1917] border-[#df5343] text-white'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <span className="block text-base sm:text-lg font-bold text-[#df5343]">
              {words.filter(w => w.box < 5).length}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold">Chưa thuộc</span>
          </button>

          <button
            onClick={() => setFilterMode('starred')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'starred'
                ? 'bg-[#33261a] border-[#e5a044] text-white'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <span className="block text-base sm:text-lg font-bold text-[#e5a044]">
              {starredWordsCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold">Từ khó ⭐</span>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-[#27211d] border-[#8e837a] text-white'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <span className="block text-base sm:text-lg font-bold text-[#f5ede4]">
              {totalWordsCount}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold">Tất cả từ</span>
          </button>

          <button
            onClick={() => setFilterMode('mastered')}
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
              filterMode === 'mastered'
                ? 'bg-[#1a261d] border-[#5eb786] text-white'
                : 'bg-[#191512] border-[#2e2621] text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <span className="block text-base sm:text-lg font-bold text-[#5eb786]">
              {words.filter(w => w.box >= 5).length}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold">Đã thuộc</span>
          </button>
        </div>

        {/* Start Button */}
        <div className="pt-1 sm:pt-2">
          <button
            onClick={startStudy}
            disabled={filteredWordsCount === 0}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#df5343] hover:bg-[#eb5f50] disabled:opacity-50 text-white font-bold text-xs sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>BẮT ĐẦU ÔN TẬP ({filteredWordsCount} TỪ)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
