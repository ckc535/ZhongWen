import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Word } from '../types';
import { GeminiService } from '../services/geminiService';
import { tts } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import {
  Search,
  Sparkles,
  Volume2,
  Star,
  Edit3,
  Trash2,
  PenTool,
  RotateCcw,
  X,
  Loader2,
  BookOpen,
  UserCheck,
  FolderPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface WordManagementProps {
  onOpenStrokeWriter?: (hanzi: string) => void;
  onOpenBulkAdd?: () => void;
  onOpenLessonImporter?: () => void;
}

export const WordManagement: React.FC<WordManagementProps> = ({
  onOpenStrokeWriter,
  onOpenBulkAdd,
  onOpenLessonImporter
}) => {
  const {
    words,
    addWord,
    updateWord,
    deleteWord,
    toggleStar,
    resetToHsk1Starter,
    settings,
    hsk1WordsCount,
    customWordsCount
  } = useApp();

  // Full 8 New Word Input States (matching Rich HSK schema)
  const [inputHanzi, setInputHanzi] = useState<string>('');
  const [inputPinyin, setInputPinyin] = useState<string>('');
  const [inputHanViet, setInputHanViet] = useState<string>('');
  const [inputVietnamese, setInputVietnamese] = useState<string>('');
  const [inputRadicals, setInputRadicals] = useState<string>('');
  const [inputMnemonic, setInputMnemonic] = useState<string>('');
  const [inputExampleSentence, setInputExampleSentence] = useState<string>('');
  const [inputExampleVietnamese, setInputExampleVietnamese] = useState<string>('');
  const [inputSource, setInputSource] = useState<'hsk1' | 'custom'>('custom');

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isAiEditLoading, setIsAiEditLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Category Tab Filter (Tất cả / Từ gốc HSK 1 / Từ tự thêm)
  const [categoryTab, setCategoryTab] = useState<'all' | 'hsk1' | 'custom'>('all');

  // Search & Status Filters (Tất cả / Chưa thuộc / Đã thuộc / Từ khó)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered' | 'starred'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Status Change Menu Popover
  const [statusMenuWordId, setStatusMenuWordId] = useState<string | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  // Edit Word State
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryTab, filterStatus, searchQuery, pageSize]);

  // Play audio
  const handlePlayAudio = (e: React.MouseEvent, hanzi: string) => {
    e.stopPropagation();
    soundEffects.playClick();
    tts.speak(hanzi, settings.voiceRate, settings.voicePitch);
  };

  // Trigger Gemini AI Auto-Fill for all 8 fields
  const handleAutoFill = async () => {
    const hasHanzi = Boolean(inputHanzi.trim());
    const hasPinyin = Boolean(inputPinyin.trim());
    const hasVietnamese = Boolean(inputVietnamese.trim());
    const hasHanViet = Boolean(inputHanViet.trim());

    if (!hasHanzi && !hasPinyin && !hasVietnamese && !hasHanViet) {
      setAiError('Vui lòng nhập ít nhất 1 ô (Chữ Hán, Pinyin hoặc Nghĩa) để AI tự động điền các ô còn lại.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const result = await GeminiService.autoFillWord(
        {
          hanzi: inputHanzi.trim(),
          pinyin: inputPinyin.trim(),
          vietnamese: inputVietnamese.trim() || inputHanViet.trim()
        },
        settings.geminiApiKey,
        settings.geminiModel
      );

      if (result.hanzi) setInputHanzi(result.hanzi);
      if (result.pinyin) setInputPinyin(result.pinyin);
      if (result.hanViet) setInputHanViet(result.hanViet);
      if (result.vietnamese) setInputVietnamese(result.vietnamese);
      if (result.radicals) setInputRadicals(result.radicals);
      if (result.mnemonic) setInputMnemonic(result.mnemonic);
      if (result.exampleSentence) setInputExampleSentence(result.exampleSentence);
      if (result.exampleVietnamese) setInputExampleVietnamese(result.exampleVietnamese);

      soundEffects.playSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tự động điền';
      setAiError(message);
      soundEffects.playWrong();
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger Gemini AI Auto-Fill for Editing Word Modal
  const handleAutoFillEditingWord = async () => {
    if (!editingWord) return;
    setIsAiEditLoading(true);

    try {
      const result = await GeminiService.autoFillWord(
        {
          hanzi: editingWord.hanzi?.trim(),
          pinyin: editingWord.pinyin?.trim(),
          vietnamese: editingWord.vietnamese?.trim() || editingWord.hanViet?.trim()
        },
        settings.geminiApiKey,
        settings.geminiModel
      );

      setEditingWord(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hanzi: result.hanzi || prev.hanzi,
          pinyin: result.pinyin || prev.pinyin,
          hanViet: result.hanViet || prev.hanViet,
          vietnamese: result.vietnamese || prev.vietnamese,
          radicals: result.radicals || prev.radicals,
          mnemonic: result.mnemonic || prev.mnemonic,
          exampleSentence: result.exampleSentence || prev.exampleSentence,
          exampleVietnamese: result.exampleVietnamese || prev.exampleVietnamese
        };
      });

      soundEffects.playSuccess();
    } catch (err: unknown) {
      soundEffects.playWrong();
    } finally {
      setIsAiEditLoading(false);
    }
  };

  // Handle Add Single Word with all 8 rich fields + Source selector
  const handleAddWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hanziTrimmed = inputHanzi.trim();

    if (!hanziTrimmed && !inputVietnamese.trim()) {
      setAiError('Vui lòng nhập Chữ Hán hoặc Nghĩa tiếng Việt');
      return;
    }

    if (hanziTrimmed && words.some(w => w.hanzi === hanziTrimmed)) {
      setAiError(`Chữ "${hanziTrimmed}" đã có sẵn trong danh sách từ vựng rồi!`);
      soundEffects.playWrong();
      return;
    }

    try {
      await addWord({
        hanzi: hanziTrimmed || '?',
        pinyin: inputPinyin.trim() || '',
        hanViet: inputHanViet.trim() || '',
        vietnamese: inputVietnamese.trim() || '',
        radicals: inputRadicals.trim() || '',
        mnemonic: inputMnemonic.trim() || '',
        exampleSentence: inputExampleSentence.trim() || '',
        exampleVietnamese: inputExampleVietnamese.trim() || '',
        box: 1,
        isStarred: false,
        source: inputSource,
        lesson: inputSource === 'hsk1' ? 'New HSK 1' : 'Từ tự thêm',
        hskLevel: inputSource === 'hsk1' ? 1 : undefined
      });

      soundEffects.playSuccess();
      setInputHanzi('');
      setInputPinyin('');
      setInputHanViet('');
      setInputVietnamese('');
      setInputRadicals('');
      setInputMnemonic('');
      setInputExampleSentence('');
      setInputExampleVietnamese('');
      setAiError(null);
    } catch (err: any) {
      setAiError(err.message || 'Lỗi khi thêm từ');
      soundEffects.playWrong();
    }
  };

  // Check if any new word input is non-empty
  const hasAnyInput = Boolean(
    inputHanzi ||
    inputPinyin ||
    inputHanViet ||
    inputVietnamese ||
    inputRadicals ||
    inputMnemonic ||
    inputExampleSentence ||
    inputExampleVietnamese
  );

  // Clear all input fields for adding new word
  const handleClearAllInputs = () => {
    soundEffects.playClick();
    setInputHanzi('');
    setInputPinyin('');
    setInputHanViet('');
    setInputVietnamese('');
    setInputRadicals('');
    setInputMnemonic('');
    setInputExampleSentence('');
    setInputExampleVietnamese('');
    setAiError(null);
  };

  // Handle Status Option Select (Chưa thuộc / Đã thuộc / Từ khó)
  const handleSetStatus = (e: React.MouseEvent, word: Word, status: 'unmastered' | 'mastered' | 'starred') => {
    e.stopPropagation();
    e.preventDefault();
    soundEffects.playSuccess();

    if (status === 'unmastered') {
      updateWord(word.id, { box: 1, isStarred: false });
    } else if (status === 'mastered') {
      updateWord(word.id, { box: 5, isStarred: false });
    } else if (status === 'starred') {
      updateWord(word.id, { isStarred: true });
    }
    setStatusMenuWordId(null);
  };

  // 1. Words filtered by Category Tab (used for consistent count badges)
  const categoryWords = useMemo(() => {
    return words.filter(word => {
      const isHsk = word.source === 'hsk1' || (word.lesson && word.lesson.toLowerCase().includes('hsk'));
      if (categoryTab === 'hsk1') {
        return isHsk;
      } else if (categoryTab === 'custom') {
        return !isHsk;
      }
      return true;
    });
  }, [words, categoryTab]);

  // Fixed counts for all 4 status filter tabs
  const allCategoryCount = categoryWords.length;
  const unmasteredCount = useMemo(() => categoryWords.filter(w => w.box < 5).length, [categoryWords]);
  const masteredCount = useMemo(() => categoryWords.filter(w => w.box >= 5).length, [categoryWords]);
  const starredCount = useMemo(() => categoryWords.filter(w => w.isStarred).length, [categoryWords]);

  // 2. Filtered words list (applying search query, status filter, and sorted newest first)
  const filteredWords = useMemo(() => {
    return categoryWords
      .filter(word => {
        // Search query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchHanzi = word.hanzi.toLowerCase().includes(q);
          const matchPinyin = word.pinyin.toLowerCase().includes(q);
          const matchVi = word.vietnamese.toLowerCase().includes(q);
          const matchHanViet = word.hanViet ? word.hanViet.toLowerCase().includes(q) : false;
          if (!matchHanzi && !matchPinyin && !matchVi && !matchHanViet) return false;
        }

        // Status filter (Tất cả / Chưa thuộc / Đã thuộc / Từ khó)
        if (filterStatus === 'unmastered') {
          if (word.box >= 5) return false;
        } else if (filterStatus === 'mastered') {
          if (word.box < 5) return false;
        } else if (filterStatus === 'starred') {
          if (!word.isStarred) return false;
        }

        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [categoryWords, searchQuery, filterStatus]);

  // Pagination calculation
  const totalItems = filteredWords.length;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === 0 ? 0 : (validCurrentPage - 1) * pageSize;
  const endIndex = pageSize === 0 ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const paginatedWords = pageSize === 0 ? filteredWords : filteredWords.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-1 space-y-4">
      {/* Click outside backdrop for status popover */}
      {statusMenuWordId && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setStatusMenuWordId(null)}
        />
      )}

      {/* ================= SECTION 1: THÊM CHỮ MỚI (ĐẦY ĐỦ 6 FIELD) ================= */}
      <div className="p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a231e] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#df5343]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#d8cebe]">
              THÊM CHỮ MỚI
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {hasAnyInput && (
              <button
                type="button"
                onClick={handleClearAllInputs}
                className="text-xs text-[#8e837a] hover:text-[#e05344] flex items-center gap-1 font-semibold transition-all cursor-pointer"
                title="Xóa trắng toàn bộ form"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa form</span>
              </button>
            )}

            {onOpenLessonImporter && (
              <button
                onClick={onOpenLessonImporter}
                className="text-xs text-[#5eb786] hover:text-[#4ea877] flex items-center gap-1 font-semibold transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Nạp bài HSK 4, 5...</span>
              </button>
            )}

            {onOpenBulkAdd && (
              <button
                onClick={onOpenBulkAdd}
                className="text-xs text-[#df5343] hover:text-[#eb5f50] flex items-center gap-1 font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Thêm nhiều từ (Bulk Add)</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleAddWordSubmit} className="space-y-3">
          {/* Row 1: Chữ Hán, Pinyin, Âm Hán Việt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Chữ Hán */}
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
                Chữ Hán *
              </label>
              <input
                type="text"
                value={inputHanzi}
                onChange={(e) => setInputHanzi(e.target.value)}
                placeholder="Ví dụ: 李月"
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 font-chinese text-lg font-bold text-[#f5ede4] placeholder-[#4e453e] focus:outline-none"
              />
            </div>

            {/* 2. Pinyin */}
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
                Pinyin
              </label>
              <input
                type="text"
                value={inputPinyin}
                onChange={(e) => setInputPinyin(e.target.value)}
                placeholder="Ví dụ: Lǐ Yuè"
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs font-bold text-[#f05d48] placeholder-[#4e453e] focus:outline-none"
              />
            </div>

            {/* 3. Âm Hán Việt */}
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
                Âm Hán Việt
              </label>
              <input
                type="text"
                value={inputHanViet}
                onChange={(e) => setInputHanViet(e.target.value)}
                placeholder="Ví dụ: Lý Nguyệt"
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Nghĩa tiếng Việt */}
          <div>
            <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
              Nghĩa tiếng Việt *
            </label>
            <input
              type="text"
              value={inputVietnamese}
              onChange={(e) => setInputVietnamese(e.target.value)}
              placeholder="Ví dụ: Lý Nguyệt (tên riêng người)"
              className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
            />
          </div>

          {/* Row 3: Bộ thủ cấu thành & Mẹo nhớ mặt chữ (Chiết tự) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center gap-1">
                <span className="text-[#e5a044]">🧩</span>
                <span>Bộ thủ cấu thành</span>
              </label>
              <input
                type="text"
                value={inputRadicals}
                onChange={(e) => setInputRadicals(e.target.value)}
                placeholder="Ví dụ: 李 (họ Lý) + 月 (mặt trăng)"
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center gap-1">
                <span className="text-[#5eb786]">💡</span>
                <span>Mẹo nhớ cách nhìn / Chiết tự</span>
              </label>
              <input
                type="text"
                value={inputMnemonic}
                onChange={(e) => setInputMnemonic(e.target.value)}
                placeholder="Ví dụ: Họ Lý (李) sáng như vầng trăng (月) tròn."
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Câu ví dụ & Dịch nghĩa câu ví dụ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
                Câu ví dụ (tiếng Trung)
              </label>
              <input
                type="text"
                value={inputExampleSentence}
                onChange={(e) => setInputExampleSentence(e.target.value)}
                placeholder="Ví dụ: 她叫李月。"
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">
                Dịch nghĩa câu ví dụ
              </label>
              <input
                type="text"
                value={inputExampleVietnamese}
                onChange={(e) => setInputExampleVietnamese(e.target.value)}
                placeholder="Ví dụ: Cô ấy tên là Lý Nguyệt."
                className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#d8cebe] placeholder-[#4e453e] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Nguồn từ vựng (Gốc New HSK vs Tự thêm / AI) */}
          <div>
            <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center justify-between">
              <span>Nguồn từ vựng</span>
              <span className="text-[10px] text-[#6e635a]">Chọn phân loại khi học & tra cứu</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#161311] border border-[#2e2621] rounded-xl">
              <button
                type="button"
                onClick={() => setInputSource('hsk1')}
                className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  inputSource === 'hsk1'
                    ? 'bg-[#1b2f23] text-[#5eb786] shadow-sm border border-[#315740]'
                    : 'text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#1f1a17]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Gốc New HSK 1</span>
              </button>
              <button
                type="button"
                onClick={() => setInputSource('custom')}
                className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  inputSource === 'custom'
                    ? 'bg-[#33261a] text-[#e5a044] shadow-sm border border-[#553c24]'
                    : 'text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#1f1a17]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Tự thêm / AI</span>
              </button>
            </div>
          </div>

          {/* Actions: AI Auto-fill & Submit Button */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2a231e]">
            <p className="text-[11px] text-[#8e837a] hidden sm:block">
              💡 Nhập 1 ô bất kỳ rồi bấm <strong>"AI Điền"</strong> để tự động phân tích chiết tự & 7 ô còn lại.
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClearAllInputs}
                disabled={!hasAnyInput}
                className="h-10 px-3.5 rounded-xl bg-[#221c19] hover:bg-[#2c231f] border border-[#382f29] hover:border-[#4d3f35] text-xs font-semibold text-[#8e837a] hover:text-[#e05344] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                title="Xóa trắng tất cả các ô vừa nhập"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa hết</span>
              </button>

              <button
                type="button"
                onClick={handleAutoFill}
                disabled={isAiLoading}
                className="h-10 px-4 rounded-xl bg-[#27211d] hover:bg-[#322a25] border border-[#382f29] hover:border-[#4d3f35] text-xs font-bold text-[#e5a044] flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                title="Tự động điền tất cả các ô còn lại bằng AI"
              >
                {isAiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#e5a044]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-[#e5a044]" />
                )}
                <span>AI Điền</span>
              </button>

              <button
                type="submit"
                className="h-10 px-6 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                + Thêm Chữ Mới
              </button>
            </div>
          </div>

          {aiError && (
            <p className="text-xs text-[#e05344] bg-[#2b1917] p-2.5 rounded-xl border border-[#4d2522]">
              {aiError}
            </p>
          )}
        </form>
      </div>

      {/* ================= SECTION 2: DANH SÁCH CHỮ & BỘ LỌC ================= */}
      <div className="p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-4">
        {/* Header with Source Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#f5ede4]">
              DANH SÁCH CHỮ ({words.length})
            </h2>
          </div>

          {/* 3 Source Tabs: Tất cả / Gốc New HSK 1 / Tự thêm & AI */}
          <div className="flex items-center gap-1 bg-[#161311] p-1 rounded-xl border border-[#2e2621]">
            <button
              onClick={() => setCategoryTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                categoryTab === 'all'
                  ? 'bg-[#df5343] text-white shadow-sm'
                  : 'text-[#8e837a] hover:text-[#d8cebe]'
              }`}
            >
              Tất cả ({words.length})
            </button>
            <button
              onClick={() => setCategoryTab('hsk1')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                categoryTab === 'hsk1'
                  ? 'bg-[#27211d] text-[#f5ede4] shadow-sm'
                  : 'text-[#8e837a] hover:text-[#d8cebe]'
              }`}
            >
              <BookOpen className="w-3 h-3 text-[#5eb786]" />
              <span>Gốc New HSK 1 ({hsk1WordsCount})</span>
            </button>
            <button
              onClick={() => setCategoryTab('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                categoryTab === 'custom'
                  ? 'bg-[#27211d] text-[#f5ede4] shadow-sm'
                  : 'text-[#8e837a] hover:text-[#d8cebe]'
              }`}
            >
              <UserCheck className="w-3 h-3 text-[#e5a044]" />
              <span>Tự thêm / AI ({customWordsCount})</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e837a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm chữ Hán, pinyin hoặc nghĩa..."
            className="w-full h-10 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-xl pl-10 pr-4 text-xs text-[#f5ede4] placeholder-[#6b625b] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e837a] hover:text-[#f5ede4]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4 Status Filter Buttons: Tất cả / Chưa thuộc / Đã thuộc / ⭐ Từ khó */}
        <div className="space-y-1.5">
          <p className="text-[11px] text-[#8e837a]">
            💡 Bấm nhãn <strong>Chưa thuộc / Đã thuộc</strong> để mở menu đổi trạng thái học — hoặc bấm ⭐ để đánh dấu từ khó.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  filterStatus === 'all'
                    ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                    : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                }`}
              >
                Tất cả ({allCategoryCount})
              </button>

              <button
                onClick={() => setFilterStatus('unmastered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'unmastered'
                    ? 'bg-[#2b1917] text-[#e05344] border-[#4d2522]'
                    : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                }`}
              >
                <span>Chưa thuộc ({unmasteredCount})</span>
              </button>

              <button
                onClick={() => setFilterStatus('mastered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'mastered'
                    ? 'bg-[#1e2a22] text-[#62ba89] border-[#2d4734]'
                    : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đã thuộc ({masteredCount})</span>
              </button>

              <button
                onClick={() => setFilterStatus('starred')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  filterStatus === 'starred'
                    ? 'bg-[#332815] text-[#e5a044] border-[#59421e]'
                    : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current text-[#e5a044]" />
                <span>Từ khó ({starredCount})</span>
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1 text-[11px] text-[#8e837a]">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#161311] border border-[#2e2621] text-[#d8cebe] rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option value={10}>10 từ</option>
                <option value={15}>15 từ</option>
                <option value={25}>25 từ</option>
                <option value={50}>50 từ</option>
                <option value={0}>Tất cả</option>
              </select>
            </div>
          </div>
        </div>

        {/* Word List */}
        <div className="space-y-2">
          {paginatedWords.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#2e2621] rounded-2xl">
              <p className="text-xs text-[#8e837a]">
                Không tìm thấy chữ Hán nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            paginatedWords.map((word) => {
              const isMastered = word.box >= 5;
              const isMenuOpen = statusMenuWordId === word.id;

              return (
                <div
                  key={word.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-[#161311] hover:bg-[#1a1614] border border-[#27201c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors relative"
                >
                  {/* Top on Mobile / Left on Desktop: Hanzi + Pinyin + Vietnamese meaning + hanViet */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Hanzi */}
                    <span
                      onClick={() => onOpenStrokeWriter?.(word.hanzi)}
                      className="font-chinese text-2xl sm:text-3xl text-[#f5ede4] font-bold shrink-0 cursor-pointer hover:text-[#df5343] transition-colors"
                      title="Bấm để xem nét viết"
                    >
                      {word.hanzi}
                    </span>

                    {/* Word Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#f05d48]">
                          {word.pinyin}
                        </span>
                        {word.hanViet && (
                          <span className="text-[10px] sm:text-xs text-[#8e837a]">
                            ({word.hanViet})
                          </span>
                        )}
                        {(word.source === 'hsk1' || (word.lesson && word.lesson.toLowerCase().includes('hsk'))) ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#182a20] text-[#5eb786] border border-[#2d4d38] font-semibold flex items-center gap-1" title={word.lesson || 'Gốc New HSK 1'}>
                            <BookOpen className="w-2.5 h-2.5" />
                            <span>{word.lesson || 'HSK 1'}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#27211d] text-[#e5a044] border border-[#3d332c] font-semibold flex items-center gap-1" title={word.lesson || 'Từ tự thêm'}>
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>{word.lesson || 'Tự thêm'}</span>
                          </span>
                        )}
                        {/* Audio speaker button directly next to pinyin */}
                        <button
                          onClick={(e) => handlePlayAudio(e, word.hanzi)}
                          className="p-1 rounded-md text-[#8e837a] hover:text-[#df5343] hover:bg-[#27211d] transition-colors cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-[#d8cebe] truncate mt-0.5" title={word.vietnamese}>
                        {word.vietnamese}
                      </p>
                    </div>
                  </div>

                  {/* Bottom on Mobile / Right on Desktop: Interactive Status Dropdown, Star, Edit, Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t border-[#241e1a] sm:border-t-0 shrink-0">
                    {/* Interactive Status Dropdown Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusMenuWordId(isMenuOpen ? null : word.id);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          word.isStarred
                            ? 'bg-[#332815] text-[#e5a044] border-[#59421e] hover:bg-[#3d301a]'
                            : isMastered
                            ? 'bg-[#1e2a22] text-[#62ba89] border-[#2d4734] hover:bg-[#25382b]'
                            : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe] hover:bg-[#322a25]'
                        }`}
                        title="Bấm để đổi trạng thái học (Chưa thuộc / Đã thuộc / Từ khó)"
                      >
                        {word.isStarred ? (
                          <Star className="w-3 h-3 fill-current text-[#e5a044]" />
                        ) : isMastered ? (
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#df5343]" />
                        )}
                        <span>
                          {word.isStarred ? 'Từ khó' : isMastered ? 'Đã thuộc' : 'Chưa thuộc'}
                        </span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {/* Floating Status Selection Menu */}
                      {isMenuOpen && (
                        <div
                          ref={statusMenuRef}
                          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-44 rounded-2xl bg-[#1f1a17] border border-[#382f29] shadow-2xl p-1.5 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8e837a] border-b border-[#2e2621]">
                            Đổi trạng thái học
                          </div>

                          <button
                            type="button"
                            onPointerDown={(e) => handleSetStatus(e, word, 'unmastered')}
                            onClick={(e) => handleSetStatus(e, word, 'unmastered')}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors cursor-pointer ${
                              !isMastered && !word.isStarred
                                ? 'bg-[#2b1917] text-[#e05344] font-bold'
                                : 'text-[#d8cebe] hover:bg-[#27211d]'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-[#df5343]" />
                            <span>Chưa thuộc</span>
                          </button>

                          <button
                            type="button"
                            onPointerDown={(e) => handleSetStatus(e, word, 'mastered')}
                            onClick={(e) => handleSetStatus(e, word, 'mastered')}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors cursor-pointer ${
                              isMastered && !word.isStarred
                                ? 'bg-[#1e2a22] text-[#62ba89] font-bold'
                                : 'text-[#d8cebe] hover:bg-[#27211d]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-[#62ba89]" />
                            <span>✓ Đã thuộc</span>
                          </button>

                          <button
                            type="button"
                            onPointerDown={(e) => handleSetStatus(e, word, 'starred')}
                            onClick={(e) => handleSetStatus(e, word, 'starred')}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2 text-left transition-colors cursor-pointer ${
                              word.isStarred
                                ? 'bg-[#332815] text-[#e5a044] font-bold'
                                : 'text-[#d8cebe] hover:bg-[#27211d]'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current text-[#e5a044]" />
                            <span>⭐ Từ khó</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Quick Star Toggle Button */}
                      <button
                        onClick={() => toggleStar(word.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          word.isStarred ? 'text-[#e5a044]' : 'text-[#5a5047] hover:text-[#8e837a]'
                        }`}
                        title={word.isStarred ? 'Bỏ gắn sao từ khó' : 'Đánh dấu từ khó'}
                      >
                        <Star className={`w-3.5 h-3.5 ${word.isStarred ? 'fill-[#e5a044]' : ''}`} />
                      </button>

                      {/* Stroke Writer Button */}
                      {onOpenStrokeWriter && (
                        <button
                          onClick={() => onOpenStrokeWriter(word.hanzi)}
                          className="p-1.5 rounded-lg text-[#5a5047] hover:text-[#5bb3e0] transition-colors cursor-pointer"
                          title="Xem thứ tự nét viết"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingWord(word)}
                        className="p-1.5 rounded-lg text-[#5a5047] hover:text-[#d8cebe] transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa chữ "${word.hanzi}"?`)) {
                            deleteWord(word.id);
                            soundEffects.playClick();
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#5a5047] hover:text-[#df5343] transition-colors cursor-pointer"
                        title="Xóa chữ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= PAGINATION BAR ================= */}
        {pageSize > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#2e2621]">
            <span className="text-xs text-[#8e837a]">
              Hiển thị <strong className="text-[#f5ede4]">{startIndex + 1}</strong> –{' '}
              <strong className="text-[#f5ede4]">{endIndex}</strong> trong tổng số{' '}
              <strong className="text-[#f5ede4]">{totalItems}</strong> chữ
            </span>

            <div className="flex items-center gap-1">
              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage === 1}
                className="px-2.5 py-1.5 rounded-xl bg-[#161311] hover:bg-[#27211d] text-xs font-semibold text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= validCurrentPage - 1 && pageNum <= validCurrentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all ${
                        validCurrentPage === pageNum
                          ? 'bg-[#df5343] text-white border-[#df5343] shadow-md'
                          : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#f5ede4] hover:bg-[#27211d]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === validCurrentPage - 2 ||
                  pageNum === validCurrentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="text-xs text-[#554b42] px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage === totalPages}
                className="px-2.5 py-1.5 rounded-xl bg-[#161311] hover:bg-[#27211d] text-xs font-semibold text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Word Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg p-5 sm:p-7 rounded-3xl bg-[#1f1a17] border border-[#382f29] shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2e2621] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#28211c] border border-[#3e3229] flex items-center justify-center text-[#df5343]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
                    Chỉnh sửa chữ Hán
                  </h3>
                  <p className="text-[11px] text-[#8e837a]">
                    Cập nhật thông tin chi tiết hoặc phân loại lại nguồn từ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillEditingWord}
                  disabled={isAiEditLoading}
                  className="px-2.5 py-1 rounded-xl bg-[#27211d] hover:bg-[#332815] border border-[#3e3226] text-[#e5a044] text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  title="Nhờ AI tự động điền lại toàn bộ thông tin cho chữ này"
                >
                  {isAiEditLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e5a044]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#e5a044]" />
                  )}
                  <span>AI Điền lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingWord(null)}
                  className="p-1 rounded-xl bg-[#161311] hover:bg-[#27211d] text-[#8e837a] hover:text-white border border-[#2e2621] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Form Fields */}
            <div className="space-y-3">
              {/* Row 1: Chữ Hán, Pinyin, Âm Hán Việt */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Chữ Hán *</label>
                  <input
                    type="text"
                    value={editingWord.hanzi}
                    onChange={(e) => setEditingWord({ ...editingWord, hanzi: e.target.value })}
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 font-chinese text-lg font-bold text-white focus:outline-none focus:border-[#df5343]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Pinyin</label>
                  <input
                    type="text"
                    value={editingWord.pinyin}
                    onChange={(e) => setEditingWord({ ...editingWord, pinyin: e.target.value })}
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs font-bold text-[#f05d48] focus:outline-none focus:border-[#df5343]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Âm Hán Việt</label>
                  <input
                    type="text"
                    value={editingWord.hanViet || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, hanViet: e.target.value })}
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                  />
                </div>
              </div>

              {/* Row 2: Nghĩa tiếng Việt */}
              <div>
                <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Nghĩa tiếng Việt *</label>
                <input
                  type="text"
                  value={editingWord.vietnamese}
                  onChange={(e) => setEditingWord({ ...editingWord, vietnamese: e.target.value })}
                  className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                />
              </div>

              {/* Row 3: Bộ thủ & Chiết tự */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center gap-1">
                    <span className="text-[#e5a044]">🧩</span>
                    <span>Bộ thủ cấu thành</span>
                  </label>
                  <input
                    type="text"
                    value={editingWord.radicals || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, radicals: e.target.value })}
                    placeholder="Ví dụ: 女 (nữ) + 子 (tử)"
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center gap-1">
                    <span className="text-[#5eb786]">💡</span>
                    <span>Mẹo nhớ / Chiết tự</span>
                  </label>
                  <input
                    type="text"
                    value={editingWord.mnemonic || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, mnemonic: e.target.value })}
                    placeholder="Ví dụ: Gia đình có con gái và con trai là tốt đẹp."
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                  />
                </div>
              </div>

              {/* Row 4: Ví dụ & Dịch nghĩa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Câu ví dụ (tiếng Trung)</label>
                  <input
                    type="text"
                    value={editingWord.exampleSentence || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleSentence: e.target.value })}
                    placeholder="Ví dụ: 她叫李月。"
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#8e837a] mb-1 font-medium">Dịch nghĩa câu ví dụ</label>
                  <input
                    type="text"
                    value={editingWord.exampleVietnamese || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, exampleVietnamese: e.target.value })}
                    placeholder="Ví dụ: Cô ấy tên là Lý Nguyệt."
                    className="w-full h-10 bg-[#161311] border border-[#2e2621] rounded-xl px-3 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                  />
                </div>
              </div>

              {/* Row 5: Nguồn từ vựng (Moved to bottom) */}
              <div>
                <label className="block text-[11px] text-[#8e837a] mb-1 font-medium flex items-center justify-between">
                  <span>Phân loại nguồn từ</span>
                  <span className="text-[10px] text-[#6e635a]">Đổi nhóm giáo trình New HSK hoặc Tự thêm</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#161311] border border-[#2e2621] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditingWord({
                      ...editingWord,
                      source: 'hsk1',
                      hskLevel: 1,
                      lesson: 'New HSK 1'
                    })}
                    className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      (editingWord.source === 'hsk1' || editingWord.lesson?.includes('HSK'))
                        ? 'bg-[#1b2f23] text-[#5eb786] shadow-sm border border-[#315740]'
                        : 'text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#1f1a17]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Gốc New HSK 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWord({
                      ...editingWord,
                      source: 'custom',
                      hskLevel: undefined,
                      lesson: 'Từ tự thêm'
                    })}
                    className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      (editingWord.source !== 'hsk1' && !editingWord.lesson?.includes('HSK'))
                        ? 'bg-[#33261a] text-[#e5a044] shadow-sm border border-[#553c24]'
                        : 'text-[#8e837a] hover:text-[#d8cebe] hover:bg-[#1f1a17]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tự thêm / AI</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2e2621]">
              <button
                type="button"
                onClick={() => setEditingWord(null)}
                className="px-4 py-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#8e837a] hover:text-white border border-[#382f29] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  updateWord(editingWord.id, editingWord);
                  setEditingWord(null);
                  soundEffects.playSuccess();
                }}
                className="px-6 py-2 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-xs font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
