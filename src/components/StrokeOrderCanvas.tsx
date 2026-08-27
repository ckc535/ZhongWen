import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Word } from '../types';
import { tts } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import HanziWriter from 'hanzi-writer';
import {
  PenTool,
  Play,
  RotateCcw,
  Volume2,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface StrokeOrderCanvasProps {
  initialChar?: string;
  onClose?: () => void;
}

export const StrokeOrderCanvas: React.FC<StrokeOrderCanvasProps> = ({ initialChar, onClose }) => {
  const { words, settings } = useApp();

  // Find initial word index
  const initialIndex = useMemo(() => {
    if (!initialChar || words.length === 0) return 0;
    const clean = initialChar.trim();
    const idx = words.findIndex(w => w.hanzi.includes(clean) || w.hanzi === clean);
    return idx >= 0 ? idx : 0;
  }, [initialChar, words]);

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(initialIndex);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customWordObj, setCustomWordObj] = useState<Partial<Word> | null>(null);

  const [practiceMessage, setPracticeMessage] = useState<string>('Bấm "Xem nét mẫu" để xem hoạt ảnh hoặc "Tập viết tay" để tự vẽ');
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);

  const writerContainerRef = useRef<HTMLDivElement>(null);
  const writerInstanceRef = useRef<HanziWriter | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll refs for horizontal chips carousel
  const isCarouselMouseDownRef = useRef<boolean>(false);
  const carouselStartXRef = useRef<number>(0);
  const carouselScrollLeftRef = useRef<number>(0);
  const hasDraggedCarouselRef = useRef<boolean>(false);

  const handleCarouselMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isCarouselMouseDownRef.current = true;
    hasDraggedCarouselRef.current = false;
    carouselStartXRef.current = e.pageX - (carouselRef.current?.offsetLeft || 0);
    carouselScrollLeftRef.current = carouselRef.current?.scrollLeft || 0;
  };

  const handleCarouselMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCarouselMouseDownRef.current || !carouselRef.current) return;
    const x = e.pageX - (carouselRef.current.offsetLeft || 0);
    const walk = (x - carouselStartXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedCarouselRef.current = true;
    }
    carouselRef.current.scrollLeft = carouselScrollLeftRef.current - walk;
  };

  const handleCarouselMouseUp = () => {
    isCarouselMouseDownRef.current = false;
  };

  const handleCarouselWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (carouselRef.current && e.deltaY !== 0) {
      carouselRef.current.scrollLeft += e.deltaY * 0.8;
    }
  };

  // Active word to practice
  const activeWord: Partial<Word> | undefined = isCustomMode
    ? customWordObj || { hanzi: '你', pinyin: 'nǐ', vietnamese: 'bạn' }
    : words[currentWordIndex] || words[0] || { hanzi: '你', pinyin: 'nǐ', vietnamese: 'bạn' };

  // Split word into individual Chinese characters (e.g. "很高兴" -> ["很", "高", "兴"])
  const characters = useMemo(() => {
    if (!activeWord?.hanzi) return ['你'];
    // Filter out non-chinese punctuation if any
    const chars = activeWord.hanzi.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
    return chars.length > 0 ? chars : [activeWord.hanzi.charAt(0) || '你'];
  }, [activeWord]);

  // Current single character to render in Tian Zi Ge
  const currentChar = characters[selectedCharIndex] || characters[0] || '你';

  // Filtered words for search dropdown / quick picker
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words;
    const q = searchQuery.toLowerCase().trim();
    return words.filter(w =>
      w.hanzi.includes(q) ||
      w.pinyin.toLowerCase().includes(q) ||
      w.vietnamese.toLowerCase().includes(q)
    );
  }, [words, searchQuery]);

  // Reset selected char index when word changes
  useEffect(() => {
    setSelectedCharIndex(0);
  }, [currentWordIndex, isCustomMode]);

  // Initialize and render HanziWriter for currentChar
  useEffect(() => {
    if (!writerContainerRef.current) return;
    writerContainerRef.current.innerHTML = '';
    setIsQuizMode(false);

    try {
      writerInstanceRef.current = HanziWriter.create(writerContainerRef.current, currentChar, {
        width: 220,
        height: 220,
        padding: 15,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 180,
        strokeColor: '#df5343', // Warm coral stroke
        outlineColor: '#3a322c', // Dark subtle outline
        drawingColor: '#5eb786', // User stroke drawing (green)
        showCharacter: true,
        showHintAfterMisses: 2,
        highlightColor: '#5eb786',
        strokeFadeDuration: 350
      });

      writerInstanceRef.current.animateCharacter({
        onComplete: () => {
          setPracticeMessage(`Chữ "${currentChar}" - Bấm "Tập viết tay" để tự vẽ nét!`);
        }
      });
    } catch (e) {
      console.warn('HanziWriter init error:', e);
    }
  }, [currentChar]);

  // Animate strokes demonstration
  const handleAnimate = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setIsQuizMode(false);
    setPracticeMessage('Đang hiển thị thứ tự nét viết chuẩn...');
    writerInstanceRef.current.showCharacter();
    writerInstanceRef.current.animateCharacter({
      onComplete: () => {
        setPracticeMessage(`Đã hoàn thành nét vẽ chữ "${currentChar}"!`);
      }
    });
  };

  // Start Interactive Stroke Writing Quiz
  const handleStartPractice = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setIsQuizMode(true);
    setPracticeMessage('✍️ Hãy dùng chuột hoặc ngón tay để vẽ theo từng nét!');
    writerInstanceRef.current.hideCharacter();
    writerInstanceRef.current.quiz({
      onMistake: (strokeData) => {
        soundEffects.playWrong();
        setPracticeMessage(`⚠️ Sai nét thứ ${strokeData.strokeNum + 1}! Hãy thử lại theo nét mờ.`);
      },
      onCorrectStroke: (strokeData) => {
        soundEffects.playClick();
        setPracticeMessage(`✓ Chính xác nét thứ ${strokeData.strokeNum + 1}! Tiếp tục nào.`);
      },
      onComplete: () => {
        soundEffects.playSuccess();
        setPracticeMessage(`🎉 Xuất sắc! Bạn đã hoàn thành đúng 100% chữ "${currentChar}".`);
      }
    });
  };

  // Reset drawing
  const handleReset = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setIsQuizMode(false);
    setPracticeMessage('Đã làm mới bảng vẽ.');
    writerInstanceRef.current.showCharacter();
  };

  // Play audio for current character or full word
  const handlePlayAudio = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playClick();
    tts.speak(activeWord?.hanzi || currentChar, settings.voiceRate, settings.voicePitch);
  };

  // Navigate to previous word in database
  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      soundEffects.playClick();
      setIsCustomMode(false);
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  // Navigate to next word in database
  const handleNextWord = () => {
    if (currentWordIndex + 1 < words.length) {
      soundEffects.playClick();
      setIsCustomMode(false);
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  // Select a word from database
  const handleSelectWord = (idx: number) => {
    if (hasDraggedCarouselRef.current) return;
    soundEffects.playClick();
    setIsCustomMode(false);
    setCurrentWordIndex(idx);
    setSearchQuery('');
  };

  // Submit custom word/character input
  const handleApplyCustomInput = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    soundEffects.playClick();
    setIsCustomMode(true);
    setCustomWordObj({
      hanzi: clean,
      pinyin: '',
      vietnamese: 'Chữ tự nhập'
    });
    setCustomInput('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-1 space-y-4">
      {/* ================= CARD 1: WORD SELECTOR & QUICK CAROUSEL ================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-xl space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#28211c] border border-[#3e3229] flex items-center justify-center text-[#5bb3e0]">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#5bb3e0]">
                TẬP VIẾT & THỨ TỰ NÉT CHỮ HÁN
              </h2>
              <p className="text-[11px] text-[#8e837a]">
                Chọn bất kỳ từ nào trong kho ({words.length} từ) hoặc tự gõ chữ để tập viết nét chuẩn
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-[#27211d] text-[#8e837a] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Word Search & Custom Input Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          {/* Search in database */}
          <div className="sm:col-span-7 relative">
            <Search className="w-3.5 h-3.5 text-[#6b625b] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm nhanh từ trong kho từ vựng..."
              className="w-full bg-[#161311] border border-[#2e2621] focus:border-[#5bb3e0] rounded-xl pl-8 pr-3 py-2 text-xs text-[#d8cebe] placeholder-[#6b625b] focus:outline-none"
            />
          </div>

          {/* Custom Hanzi Input Form */}
          <form onSubmit={handleApplyCustomInput} className="sm:col-span-5 flex items-center gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="✍️ Gõ chữ Hán bất kỳ..."
              className="flex-1 bg-[#161311] border border-[#2e2621] focus:border-[#5bb3e0] rounded-xl px-3 py-2 text-xs text-[#d8cebe] placeholder-[#6b625b] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-3 py-2 rounded-xl bg-[#28211c] hover:bg-[#382f28] disabled:opacity-40 text-[#5bb3e0] border border-[#3e3229] text-xs font-bold shrink-0 transition-colors cursor-pointer"
            >
              Tập viết
            </button>
          </form>
        </div>

        {/* Search Results Dropdown (if search query active) */}
        {searchQuery.trim() && (
          <div className="max-h-40 overflow-y-auto p-1.5 rounded-xl bg-[#161311] border border-[#2e2621] space-y-1 animate-in fade-in">
            {filteredWords.length === 0 ? (
              <p className="text-xs text-[#8e837a] text-center py-2">Không tìm thấy từ nào phù hợp.</p>
            ) : (
              filteredWords.slice(0, 10).map((w) => {
                const originalIndex = words.findIndex(item => item.id === w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleSelectWord(originalIndex)}
                    className="w-full p-2 rounded-lg hover:bg-[#27211d] flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-chinese text-base font-bold text-[#f5ede4]">{w.hanzi}</span>
                      <span className="text-xs text-[#f05d48] font-semibold">{w.pinyin}</span>
                      <span className="text-xs text-[#8e837a] truncate max-w-[200px]">- {w.vietnamese}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#5bb3e0]" />
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Horizontal Chips Carousel of Words in Database */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e837a]">
              Chọn nhanh từ trong kho từ:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  carouselRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
                }}
                className="p-1 rounded-lg bg-[#161311] hover:bg-[#27211d] text-[#8e837a] hover:text-[#d8cebe] border border-[#2e2621] transition-colors cursor-pointer"
                title="Cuộn sang trái"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  carouselRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
                }}
                className="p-1 rounded-lg bg-[#161311] hover:bg-[#27211d] text-[#8e837a] hover:text-[#d8cebe] border border-[#2e2621] transition-colors cursor-pointer"
                title="Cuộn sang phải"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            onMouseDown={handleCarouselMouseDown}
            onMouseMove={handleCarouselMouseMove}
            onMouseUp={handleCarouselMouseUp}
            onMouseLeave={handleCarouselMouseUp}
            onWheel={handleCarouselWheel}
            className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar select-none cursor-grab active:cursor-grabbing touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {words.slice(0, 40).map((w, idx) => {
              const isSelected = !isCustomMode && currentWordIndex === idx;
              return (
                <button
                  key={w.id || idx}
                  type="button"
                  onClick={() => handleSelectWord(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#5bb3e0] text-[#0f222d] shadow-sm font-extrabold scale-105'
                      : 'bg-[#161311] hover:bg-[#27211d] text-[#d8cebe] border border-[#2e2621]'
                  }`}
                  title={`${w.hanzi} (${w.pinyin}): ${w.vietnamese}`}
                >
                  <span className="font-chinese text-sm">{w.hanzi}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= CARD 2: TIAN ZI GE CANVAS & STROKE CONTROLS ================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-5">
        {/* Active Word Header Navigation (Prev / Next) */}
        <div className="flex items-center justify-between gap-2 border-b border-[#2e2621] pb-3">
          <button
            type="button"
            onClick={handlePrevWord}
            disabled={isCustomMode || currentWordIndex === 0}
            className="px-3 py-1.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-[#8e837a] hover:text-[#f5ede4] border border-[#382f29] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Từ trước</span>
          </button>

          {/* Multi-Character Selector (e.g. If word is "很高兴", show buttons for 很, 高, 兴) */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {characters.map((char, cIdx) => {
              const isCharSelected = selectedCharIndex === cIdx;
              return (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedCharIndex(cIdx);
                  }}
                  className={`px-3.5 py-1 rounded-xl text-sm font-chinese font-bold transition-all cursor-pointer ${
                    isCharSelected
                      ? 'bg-[#df5343] text-white shadow-md scale-105'
                      : 'bg-[#161311] text-[#8e837a] hover:text-[#d8cebe] border border-[#2e2621]'
                  }`}
                  title={`Tập viết nét chữ "${char}"`}
                >
                  {char}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNextWord}
            disabled={isCustomMode || currentWordIndex >= words.length - 1}
            className="px-3 py-1.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] disabled:opacity-30 disabled:pointer-events-none text-xs font-bold text-[#8e837a] hover:text-[#f5ede4] border border-[#382f29] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Từ sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Tian Zi Ge Canvas Box */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative p-2 rounded-2xl bg-[#161311] border border-[#3a2f28] shadow-lg tian-zi-ge flex items-center justify-center">
            <div ref={writerContainerRef} className="cursor-crosshair select-none" />

            <button
              onClick={() => handlePlayAudio()}
              className="absolute bottom-2 right-2 p-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#df5343] border border-[#382f29] shadow-sm transition-all cursor-pointer"
              title="Nghe phát âm chữ này"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status Message & Word Meta */}
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-[#f5ede4]">
              {practiceMessage}
            </p>
            {activeWord && (
              <p className="text-xs text-[#8e837a]">
                <strong className="text-[#f5ede4] font-chinese text-sm">{activeWord.hanzi}</strong>
                {activeWord.pinyin && (
                  <> • Pinyin: <span className="text-[#f05d48] font-bold">{activeWord.pinyin}</span></>
                )}
                {activeWord.vietnamese && (
                  <> • Nghĩa: <span className="text-[#d8cebe]">{activeWord.vietnamese}</span></>
                )}
                {activeWord.hanViet && (
                  <> • Hán Việt: <span className="text-[#bfb5a7] font-semibold">{activeWord.hanViet}</span></>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons: Xem mẫu / Tập viết tay / Làm lại */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={handleAnimate}
            className="py-2.5 px-2 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Xem nét mẫu</span>
          </button>

          <button
            onClick={handleStartPractice}
            className="py-2.5 px-2 rounded-xl bg-[#5eb786] hover:bg-[#4ea877] text-[#0f2619] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Tập viết tay</span>
          </button>

          <button
            onClick={handleReset}
            className="py-2.5 px-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] font-bold text-xs border border-[#382f29] transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
        </div>

        {/* Character Mnemonic & Radicals Details */}
        {activeWord && (activeWord.mnemonic || activeWord.radicals || activeWord.exampleSentence) && (
          <div className="p-3.5 rounded-2xl bg-[#161311] border border-[#2e2621] text-xs space-y-1.5">
            <span className="text-[#e5a044] font-bold block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Chiết tự & Mẹo ghi nhớ:
            </span>
            {activeWord.radicals && (
              <p className="text-[#d8cebe]">
                <strong className="text-[#e5a044]">🧩 Bộ thủ:</strong> {activeWord.radicals}
              </p>
            )}
            {activeWord.mnemonic && (
              <p className="text-[#8e837a]">
                <strong className="text-[#5eb786]">💡 Mẹo nhớ:</strong> {activeWord.mnemonic}
              </p>
            )}
            {activeWord.exampleSentence && (
              <p className="text-[#8e837a] pt-1 border-t border-[#27211c]">
                <strong className="text-[#5bb3e0]">📝 Ví dụ:</strong> <span className="font-chinese text-[#f5ede4]">{activeWord.exampleSentence}</span>
                {activeWord.exampleVietnamese && <span className="italic"> ({activeWord.exampleVietnamese})</span>}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
