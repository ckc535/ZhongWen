import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChineseMeasureWord,
  MeasureWordCategory,
  MeasureWordNounPair,
  MeasureWordCollocation,
  MeasureWordPracticeQuestion
} from '../types';
import { tts, useTtsSpeaking } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import { GeminiService } from '../services/geminiService';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  BookOpen,
  Lightbulb,
  Check,
  X,
  Boxes,
  ArrowRight,
  Flame,
  PenTool,
  Loader2,
  AlertCircle,
  Wand2
} from 'lucide-react';

interface CategoryTab {
  id: 'all' | MeasureWordCategory;
  label: string;
  icon: string;
  seal: string;
  color: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: 'Tất cả', icon: '🌟', seal: '全', color: '#df5343' },
  { id: 'objects', label: 'Đồ vật & Dụng cụ', icon: '📦', seal: '物', color: '#e5a044' },
  { id: 'animals', label: 'Động vật & Côn trùng', icon: '🐾', seal: '兽', color: '#5eb786' },
  { id: 'clothing', label: 'Trang phục & Phụ kiện', icon: '👕', seal: '衣', color: '#5bb3e0' },
  { id: 'vehicles', label: 'Xe cộ & Giao thông', icon: '🚗', seal: '车', color: '#a78bfa' },
  { id: 'plants_food', label: 'Cây cối & Đồ ăn', icon: '🍎', seal: '食', color: '#f43f5e' },
  { id: 'body_abstract', label: 'Trừu tượng & Sự việc', icon: '💭', seal: '意', color: '#38bdf8' },
  { id: 'general', label: 'Đa dụng chung', icon: '🌐', seal: '通', color: '#f59e0b' }
];

interface QuickNounSuggestion {
  label: string;
  query: string;
  icon: string;
}

const QUICK_NOUN_CHIPS: QuickNounSuggestion[] = [
  { label: 'Áo quần', query: 'áo', icon: '👕' },
  { label: 'Ô dù', query: 'ô', icon: '☂️' },
  { label: 'Bàn ghế', query: 'bàn', icon: '🪑' },
  { label: 'Chó mèo', query: 'mèo', icon: '🐱' },
  { label: 'Cá chim', query: 'cá', icon: '🐟' },
  { label: 'Sách vở', query: 'sách', icon: '📚' },
  { label: 'Xe cộ', query: 'xe', icon: '🚗' },
  { label: 'Bút viết', query: 'bút', icon: '🖊️' },
  { label: 'Giấy vé', query: 'vé', icon: '🎫' },
  { label: 'Chuối quả', query: 'chuối', icon: '🍌' }
];

interface MatchedNounResult {
  noun: MeasureWordNounPair;
  measureWord: ChineseMeasureWord;
  matchedCollocations: MeasureWordCollocation[];
}

interface MeasureWordsViewProps {
  onOpenStrokeWriter?: (hanzi: string) => void;
}

// ==================== HELPER NORMALIZERS ====================
function getMwWord(mw?: ChineseMeasureWord | null): string {
  if (!mw) return '';
  return mw.word || mw.measureWord || '';
}

function getMwVietnamese(mw?: ChineseMeasureWord | null): string {
  if (!mw) return '';
  return mw.vietnamese || mw.vietnameseMeaning || '';
}

function getMwNouns(mw?: ChineseMeasureWord | null): MeasureWordNounPair[] {
  if (!mw) return [];
  return mw.pairedNouns || mw.commonNouns || [];
}

function getMwCollocations(mw?: ChineseMeasureWord | null): MeasureWordCollocation[] {
  if (!mw) return [];
  return mw.collocations || [];
}

function getNounHanzi(n?: MeasureWordNounPair | null): string {
  if (!n) return '';
  return n.nounHanzi || n.hanzi || '';
}

function getNounPinyin(n?: MeasureWordNounPair | null): string {
  if (!n) return '';
  return n.nounPinyin || n.pinyin || '';
}

function getNounVietnamese(n?: MeasureWordNounPair | null): string {
  if (!n) return '';
  return n.nounVietnamese || n.vietnamese || '';
}

function getCollocationPhrase(c?: MeasureWordCollocation | null): string {
  if (!c) return '';
  return c.phraseHanzi || c.phrase || '';
}

function getCollocationPinyin(c?: MeasureWordCollocation | null): string {
  if (!c) return '';
  return c.phrasePinyin || c.pinyin || '';
}

function getCollocationVietnamese(c?: MeasureWordCollocation | null): string {
  if (!c) return '';
  return c.phraseVietnamese || c.vietnamese || '';
}

function getMwSeal(mw?: ChineseMeasureWord | null): string {
  if (!mw) return '量';
  const w = getMwWord(mw);
  return mw.sealChar || w[0] || '量';
}

export const MeasureWordsView: React.FC<MeasureWordsViewProps> = ({ onOpenStrokeWriter }) => {
  const {
    measureWords,
    addMeasureWord,
    updateMeasureWord,
    deleteMeasureWord,
    toggleMeasureWordMastered,
    recordMeasureWordQuiz,
    settings
  } = useApp();

  const isSpeaking = useTtsSpeaking();

  // Navigation Sub-Modes
  const [viewMode, setViewMode] = useState<'noun_search' | 'browse' | 'quiz' | 'flashcards'>('noun_search');

  // Search & Filters
  const [nounQuery, setNounQuery] = useState<string>('');
  const [browseQuery, setBrowseQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | MeasureWordCategory>('all');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'mastered' | 'unmastered'>('all');
  const [expandedMwIds, setExpandedMwIds] = useState<Set<string>>(new Set());

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMw, setEditingMw] = useState<ChineseMeasureWord | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form Fields
  const [formWord, setFormWord] = useState<string>('');
  const [formPinyin, setFormPinyin] = useState<string>('');
  const [formVietnamese, setFormVietnamese] = useState<string>('');
  const [formCategory, setFormCategory] = useState<MeasureWordCategory>('objects');
  const [formCommonLevel, setFormCommonLevel] = useState<'essential' | 'intermediate' | 'advanced'>('essential');
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formTips, setFormTips] = useState<string>('');
  const [formSealChar, setFormSealChar] = useState<string>('');
  const [formOrder, setFormOrder] = useState<number>(99);

  // Form Nested Lists
  const [formNouns, setFormNouns] = useState<MeasureWordNounPair[]>([
    { nounHanzi: '', nounPinyin: '', nounVietnamese: '', emoji: '✨', commonRank: 1 }
  ]);
  const [formCollocations, setFormCollocations] = useState<MeasureWordCollocation[]>([
    { phraseHanzi: '', phrasePinyin: '', phraseVietnamese: '', context: '' }
  ]);
  const [formQuestions, setFormQuestions] = useState<MeasureWordPracticeQuestion[]>([
    { id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }
  ]);

  // AI Direct Noun Lookup State
  const [isAiSearchingNoun, setIsAiSearchingNoun] = useState<boolean>(false);
  const [aiNounResult, setAiNounResult] = useState<Partial<ChineseMeasureWord> | null>(null);

  // Quiz State
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizStreak, setQuizStreak] = useState<number>(0);

  // Flashcards State
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // TTS audio helper
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;
    tts.speak(text);
  };

  // Mastered stats
  const masteredCount = useMemo(() => measureWords.filter(m => m.isMastered).length, [measureWords]);
  const unmasteredCount = measureWords.length - masteredCount;
  const masterPercentage = measureWords.length > 0 ? Math.round((masteredCount / measureWords.length) * 100) : 0;

  // Flattened paired nouns for instant two-way lookup
  const matchedNounResults = useMemo<MatchedNounResult[]>(() => {
    const q = nounQuery.trim().toLowerCase();
    const results: MatchedNounResult[] = [];

    measureWords.forEach(mw => {
      const mwWord = getMwWord(mw);
      const mwWordMatch = mwWord.toLowerCase().includes(q) || (mw.pinyin || '').toLowerCase().includes(q);
      const nouns = getMwNouns(mw);
      const cols = getMwCollocations(mw);

      if (!q) {
        nouns.slice(0, 2).forEach(noun => {
          results.push({
            noun,
            measureWord: mw,
            matchedCollocations: cols.slice(0, 1)
          });
        });
      } else {
        nouns.forEach(noun => {
          const nHanzi = getNounHanzi(noun);
          const nPinyin = getNounPinyin(noun);
          const nVn = getNounVietnamese(noun);

          const nounMatch =
            nHanzi.toLowerCase().includes(q) ||
            nPinyin.toLowerCase().includes(q) ||
            nVn.toLowerCase().includes(q) ||
            mwWordMatch;

          if (nounMatch) {
            const matchedCols = cols.filter(
              c => getCollocationPhrase(c).includes(nHanzi) || getCollocationVietnamese(c).toLowerCase().includes(q)
            );
            results.push({
              noun,
              measureWord: mw,
              matchedCollocations: matchedCols.length > 0 ? matchedCols : cols.slice(0, 1)
            });
          }
        });
      }
    });

    return q ? results : results.slice(0, 16);
  }, [measureWords, nounQuery]);

  // Filtered measure words for Library / Browse View
  const filteredMeasureWords = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    return measureWords.filter(mw => {
      // Category match
      if (selectedCategory !== 'all' && mw.category !== selectedCategory) {
        return false;
      }
      // Mastery filter
      if (masteryFilter === 'mastered' && !mw.isMastered) return false;
      if (masteryFilter === 'unmastered' && mw.isMastered) return false;

      // Search match
      if (q) {
        const mwWord = getMwWord(mw);
        const wordMatch = mwWord.toLowerCase().includes(q) || (mw.pinyin || '').toLowerCase().includes(q);
        const vnMatch = getMwVietnamese(mw).toLowerCase().includes(q);
        const expMatch = (mw.explanation || '').toLowerCase().includes(q);
        const nouns = getMwNouns(mw);
        const nounMatch = nouns.some(
          n =>
            getNounHanzi(n).toLowerCase().includes(q) ||
            getNounPinyin(n).toLowerCase().includes(q) ||
            getNounVietnamese(n).toLowerCase().includes(q)
        );
        return wordMatch || vnMatch || expMatch || nounMatch;
      }
      return true;
    });
  }, [measureWords, browseQuery, selectedCategory, masteryFilter]);

  // Quiz questions pool
  const quizQuestions = useMemo(() => {
    const questions: Array<{
      id: string;
      measureWordId: string;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      sealChar: string;
    }> = [];

    measureWords.forEach(mw => {
      const mwWord = getMwWord(mw);
      const seal = getMwSeal(mw);
      const nouns = getMwNouns(mw);

      if (Array.isArray(mw.practiceQuestions) && mw.practiceQuestions.length > 0) {
        mw.practiceQuestions.forEach(pq => {
          if (pq.question && pq.options && pq.options.length >= 2 && pq.correctAnswer) {
            questions.push({
              id: `${mw.id}-${pq.id}`,
              measureWordId: mw.id,
              question: pq.question,
              options: pq.options,
              correctAnswer: pq.correctAnswer,
              explanation: pq.explanation || `Lượng từ chuẩn xác là: ${mwWord} (${mw.pinyin})`,
              sealChar: seal
            });
          }
        });
      } else if (nouns.length > 0) {
        const randomNoun = nouns[0];
        const nHanzi = getNounHanzi(randomNoun);
        const nVn = getNounVietnamese(randomNoun);
        const otherMws = measureWords.filter(m => m.id !== mw.id).slice(0, 3);
        const options = [
          `一${mwWord}`,
          ...otherMws.map(m => `一${getMwWord(m)}`)
        ].sort(() => 0.5 - Math.random());

        questions.push({
          id: `auto-${mw.id}`,
          measureWordId: mw.id,
          question: `Điền lượng từ thích hợp cho "${nHanzi}" (${nVn}):`,
          options,
          correctAnswer: `一${mwWord}`,
          explanation: `"${nHanzi}" dùng lượng từ "${mwWord}" (${mw.pinyin}) - ${getMwVietnamese(mw)}`,
          sealChar: seal
        });
      }
    });

    return questions.sort(() => 0.5 - Math.random());
  }, [measureWords]);

  // Flashcards pool (pairs of noun & measure word)
  const flashcardItems = useMemo(() => {
    const items: Array<{
      id: string;
      measureWord: ChineseMeasureWord;
      noun: MeasureWordNounPair;
      collocation?: MeasureWordCollocation;
    }> = [];

    measureWords.forEach(mw => {
      const nouns = getMwNouns(mw);
      const cols = getMwCollocations(mw);
      nouns.forEach(n => {
        const nHanzi = getNounHanzi(n);
        const col = cols.find(c => getCollocationPhrase(c).includes(nHanzi)) || cols[0];
        items.push({
          id: `${mw.id}-${nHanzi}`,
          measureWord: mw,
          noun: n,
          collocation: col
        });
      });
    });

    return items.sort(() => 0.5 - Math.random());
  }, [measureWords]);

  // Toggle card expansion
  const toggleExpanded = (id: string) => {
    setExpandedMwIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open modal for Adding
  const handleOpenAddModal = (presetPrompt?: string) => {
    setEditingMw(null);
    setAiPrompt(presetPrompt || '');
    setAiError(null);
    setFormWord('');
    setFormPinyin('');
    setFormVietnamese('');
    setFormCategory('objects');
    setFormCommonLevel('essential');
    setFormExplanation('');
    setFormTips('');
    setFormSealChar('');
    setFormOrder(measureWords.length + 1);
    setFormNouns([{ nounHanzi: '', nounPinyin: '', nounVietnamese: '', emoji: '✨', commonRank: 1 }]);
    setFormCollocations([{ phraseHanzi: '', phrasePinyin: '', phraseVietnamese: '', context: '' }]);
    setFormQuestions([{ id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (mw: ChineseMeasureWord) => {
    setEditingMw(mw);
    setAiPrompt(getMwWord(mw));
    setAiError(null);
    setFormWord(getMwWord(mw));
    setFormPinyin(mw.pinyin || '');
    setFormVietnamese(getMwVietnamese(mw));
    setFormCategory(mw.category || 'objects');
    setFormCommonLevel(mw.commonLevel || 'essential');
    setFormExplanation(mw.explanation || '');
    setFormTips(mw.tips || mw.notesOrTips || '');
    setFormSealChar(getMwSeal(mw));
    setFormOrder(mw.order || 99);

    const nouns = getMwNouns(mw);
    setFormNouns(
      nouns.length > 0
        ? nouns.map(n => ({
            nounHanzi: getNounHanzi(n),
            nounPinyin: getNounPinyin(n),
            nounVietnamese: getNounVietnamese(n),
            emoji: n.emoji || '✨',
            commonRank: n.commonRank || 1
          }))
        : [{ nounHanzi: '', nounPinyin: '', nounVietnamese: '', emoji: '✨', commonRank: 1 }]
    );

    const cols = getMwCollocations(mw);
    setFormCollocations(
      cols.length > 0
        ? cols.map(c => ({
            phraseHanzi: getCollocationPhrase(c),
            phrasePinyin: getCollocationPinyin(c),
            phraseVietnamese: getCollocationVietnamese(c),
            context: c.context || ''
          }))
        : [{ phraseHanzi: '', phrasePinyin: '', phraseVietnamese: '', context: '' }]
    );

    setFormQuestions(
      Array.isArray(mw.practiceQuestions) && mw.practiceQuestions.length > 0
        ? mw.practiceQuestions
        : [{ id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '' }]
    );
    setIsModalOpen(true);
  };

  // Trigger AI Auto-Fill into Form
  const handleAiAutoFill = async (overridePrompt?: string) => {
    const query = (overridePrompt || aiPrompt || formWord).trim();
    if (!query) {
      setAiError('Vui lòng nhập tên danh từ hoặc lượng từ cần AI soạn thảo.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const generated = await GeminiService.autoGenerateMeasureWord(
        query,
        settings.geminiApiKey,
        settings.geminiModel
      );

      const w = getMwWord(generated as any);
      if (w) setFormWord(w);
      if (generated.pinyin) setFormPinyin(generated.pinyin);
      const vn = getMwVietnamese(generated as any);
      if (vn) setFormVietnamese(vn);
      if (generated.category) setFormCategory(generated.category);
      if (generated.commonLevel) setFormCommonLevel(generated.commonLevel);
      if (generated.explanation) setFormExplanation(generated.explanation);
      if (generated.tips || generated.notesOrTips) setFormTips(generated.tips || generated.notesOrTips || '');
      if (generated.sealChar) setFormSealChar(generated.sealChar);

      const nouns = getMwNouns(generated as any);
      if (nouns.length > 0) {
        setFormNouns(
          nouns.map(n => ({
            nounHanzi: getNounHanzi(n),
            nounPinyin: getNounPinyin(n),
            nounVietnamese: getNounVietnamese(n),
            emoji: n.emoji || '✨',
            commonRank: n.commonRank || 1
          }))
        );
      }

      const cols = getMwCollocations(generated as any);
      if (cols.length > 0) {
        setFormCollocations(
          cols.map(c => ({
            phraseHanzi: getCollocationPhrase(c),
            phrasePinyin: getCollocationPinyin(c),
            phraseVietnamese: getCollocationVietnamese(c),
            context: c.context || ''
          }))
        );
      }

      if (Array.isArray(generated.practiceQuestions) && generated.practiceQuestions.length > 0) {
        setFormQuestions(generated.practiceQuestions);
      }

      soundEffects.playReview();
    } catch (err: any) {
      setAiError(err.message || 'Không thể tạo tự động với AI. Vui lòng thử lại.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Direct Noun Lookup in Search Tab
  const handleDirectAiNounSearch = async () => {
    const q = nounQuery.trim();
    if (!q) return;

    setIsAiSearchingNoun(true);
    setAiNounResult(null);

    try {
      const res = await GeminiService.autoGenerateMeasureWord(q, settings.geminiApiKey, settings.geminiModel);
      setAiNounResult(res);
      soundEffects.playReview();
    } catch (err) {
      console.warn('[MeasureWordsView] Direct AI noun lookup error:', err);
    } finally {
      setIsAiSearchingNoun(false);
    }
  };

  // Quick Save AI Result into Collection
  const handleSaveAiResultToCollection = async () => {
    if (!aiNounResult) return;
    const w = getMwWord(aiNounResult as any);
    if (!w) return;

    try {
      await addMeasureWord(aiNounResult);
      soundEffects.playMastered();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setAiNounResult(null);
    } catch (err) {
      console.error('[MeasureWordsView] Save AI result error:', err);
    }
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const word = formWord.trim();
    if (!word) {
      setAiError('Chữ Hán lượng từ không được để trống.');
      return;
    }

    const cleanNouns = formNouns.filter(n => getNounHanzi(n).trim());
    const cleanCollocations = formCollocations.filter(c => getCollocationPhrase(c).trim());
    const cleanQuestions = formQuestions.filter(q => q.question?.trim() && q.correctAnswer?.trim());

    const payload: Partial<ChineseMeasureWord> = {
      word,
      measureWord: word,
      pinyin: formPinyin.trim(),
      vietnamese: formVietnamese.trim(),
      vietnameseMeaning: formVietnamese.trim(),
      category: formCategory,
      commonLevel: formCommonLevel,
      explanation: formExplanation.trim(),
      tips: formTips.trim(),
      notesOrTips: formTips.trim(),
      sealChar: formSealChar.trim() || word[0] || '量',
      order: Number(formOrder) || 99,
      pairedNouns: cleanNouns,
      commonNouns: cleanNouns,
      collocations: cleanCollocations,
      practiceQuestions: cleanQuestions
    };

    if (editingMw) {
      await updateMeasureWord(editingMw.id, payload);
    } else {
      await addMeasureWord(payload);
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
    }

    soundEffects.playMastered();
    setIsModalOpen(false);
  };

  // Delete Confirmation
  const handleDelete = async (mw: ChineseMeasureWord) => {
    const w = getMwWord(mw);
    const vn = getMwVietnamese(mw);
    if (window.confirm(`Bạn có chắc chắn muốn xoá lượng từ "${w}" (${vn})?`)) {
      await deleteMeasureWord(mw.id);
      soundEffects.playMastered();
    }
  };

  // Toggle Mastery Status
  const handleToggleMastered = async (mw: ChineseMeasureWord) => {
    await toggleMeasureWordMastered(mw.id);
    if (!mw.isMastered) {
      soundEffects.playMastered();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
  };

  // Quiz Handling
  const currentQuiz = quizQuestions[currentQuizIndex];

  const handleSelectQuizAnswer = (option: string) => {
    if (isAnswerSubmitted || !currentQuiz) return;
    setSelectedAnswer(option);
    setIsAnswerSubmitted(true);

    const isCorrect = option === currentQuiz.correctAnswer;
    if (isCorrect) {
      soundEffects.playCorrect();
      setQuizScore(prev => prev + 10);
      setQuizStreak(prev => prev + 1);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
    } else {
      soundEffects.playIncorrect();
      setQuizStreak(0);
    }

    recordMeasureWordQuiz(currentQuiz.measureWordId, isCorrect);
  };

  const handleNextQuiz = () => {
    setIsAnswerSubmitted(false);
    setSelectedAnswer(null);
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      soundEffects.playMastered();
      setCurrentQuizIndex(0);
    }
  };

  // Flashcards Handling
  const currentFlashcard = flashcardItems[flashcardIndex];

  const handleNextFlashcard = (remembered: boolean) => {
    if (currentFlashcard) {
      recordMeasureWordQuiz(currentFlashcard.measureWord.id, remembered);
      if (remembered) {
        soundEffects.playCorrect();
      } else {
        soundEffects.playReview();
      }
    }
    setIsFlipped(false);
    if (flashcardIndex < flashcardItems.length - 1) {
      setFlashcardIndex(prev => prev + 1);
    } else {
      soundEffects.playMastered();
      setFlashcardIndex(0);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2">
      {/* ==================== 1. TOP HEADER BANNER ==================== */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1f1a17] via-[#1a1613] to-[#14110f] border border-[#2e2621] shadow-lg mb-3 sm:mb-4 relative overflow-hidden">
        {/* Subtle Chinese Watermark */}
        <div className="absolute -right-4 -bottom-6 text-7xl sm:text-8xl font-serif text-[#df5343]/5 select-none pointer-events-none">
          量词
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Traditional Seal Stamp Badge */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#df5343] to-[#b83829] flex items-center justify-center shadow-md shrink-0 border border-[#ea6a5b]/40">
              <span className="font-serif text-xl sm:text-2xl font-black text-white">量</span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#f5ede4] tracking-tight">
                  Tra Cứu & Học Lượng Từ
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e5a044]/15 text-[#e5a044] border border-[#e5a044]/30">
                  {measureWords.length} lượng từ chuẩn
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#8e837a] mt-0.5">
                Tra cứu danh từ ➔ lượng từ tương ứng, mẹo phân biệt, cụm từ mẫu & trắc nghiệm HSK
              </p>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleOpenAddModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>

            <button
              onClick={() => setViewMode('quiz')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-[#e5a044] border border-[#3d332c] text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-[#e5a044]" />
              <span>Làm bài kiểm tra</span>
            </button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-[#2a221d]">
          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#8e837a] block">Lượng từ cốt lõi</span>
            <span className="text-sm sm:text-base font-black text-[#f5ede4] font-mono">
              {measureWords.length}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#5eb786] block">Đã ghi nhớ</span>
            <span className="text-sm sm:text-base font-black text-[#5eb786] font-mono">
              {masteredCount}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#df5343] block">Cần ôn lại</span>
            <span className="text-sm sm:text-base font-black text-[#df5343] font-mono">
              {unmasteredCount}
            </span>
          </div>

          <div className="hidden sm:block px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-[#8e837a]">Tỷ lệ làm chủ</span>
              <span className="text-[#e5a044] font-bold font-mono">{masterPercentage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#27211d] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#df5343] to-[#5eb786] rounded-full transition-all duration-300"
                style={{ width: `${masterPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#261f1a]">
          <button
            onClick={() => setViewMode('noun_search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'noun_search'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tra theo Danh từ</span>
          </button>

          <button
            onClick={() => setViewMode('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'browse'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kho lượng từ ({measureWords.length})</span>
          </button>

          <button
            onClick={() => setViewMode('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'quiz'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#e5a044]" />
            <span>Trắc nghiệm ({quizQuestions.length})</span>
          </button>

          <button
            onClick={() => setViewMode('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'flashcards'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Thẻ Flashcard ({flashcardItems.length})</span>
          </button>
        </div>
      </div>

      {/* ==================== 2. VIEW MODE: NOUN SEARCH (TRA THEO DANH TỪ) ==================== */}
      {viewMode === 'noun_search' && (
        <div className="space-y-3">
          {/* Search Box with Quick Chips */}
          <div className="p-3 sm:p-4 rounded-2xl bg-[#1a1613] border border-[#2e2621] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8e837a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nounQuery}
                onChange={e => setNounQuery(e.target.value)}
                placeholder="Nhập bất kỳ danh từ nào (áo, mèo, bàn, sách, xe, cá, bút, chuối, 帽子...)..."
                className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] text-sm text-[#f5ede4] placeholder-[#8e837a] outline-none transition-all"
              />
              {nounQuery && (
                <button
                  onClick={() => setNounQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e837a] hover:text-[#f5ede4] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#8e837a] font-medium mr-1">Tra nhanh:</span>
              {QUICK_NOUN_CHIPS.map(chip => (
                <button
                  key={chip.query}
                  onClick={() => setNounQuery(chip.query)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    nounQuery.toLowerCase() === chip.query
                      ? 'bg-[#df5343] text-white shadow-sm'
                      : 'bg-[#221c18] hover:bg-[#2c241f] text-[#cfc5ba] border border-[#2e2621]'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Direct Lookup Card when user searches something */}
          {nounQuery.trim() && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#221b16] to-[#1c1815] border border-[#3d332c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#e5a044] shrink-0" />
                <span className="text-xs text-[#cfc5ba]">
                  Không thấy hoặc muốn AI phân tích sâu hơn về danh từ <strong>"{nounQuery}"</strong>?
                </span>
              </div>
              <button
                onClick={handleDirectAiNounSearch}
                disabled={isAiSearchingNoun}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isAiSearchingNoun ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Tra Cứu Ngay ✨</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Result Card Display */}
          {aiNounResult && (
            <div className="p-4 rounded-2xl bg-[#1c1815] border-2 border-[#e5a044]/50 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#e5a044]/20 text-[#e5a044] border border-[#e5a044]/30">
                    Kết quả AI phân tích
                  </span>
                  <span className="text-xs text-[#8e837a]">cho từ khoá "{nounQuery}"</span>
                </div>
                <button
                  onClick={handleSaveAiResultToCollection}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5eb786] hover:bg-[#4ea675] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Lưu vào kho lượng từ</span>
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#df5343]/15 border border-[#df5343]/30 flex items-center justify-center shrink-0">
                  <span className="font-serif text-2xl font-black text-[#df5343]">{getMwWord(aiNounResult as any)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[#f5ede4]">{getMwWord(aiNounResult as any)}</span>
                    <span className="text-xs font-mono text-[#e5a044]">{aiNounResult.pinyin}</span>
                    <span className="text-xs text-[#cfc5ba]">— {getMwVietnamese(aiNounResult as any)}</span>
                  </div>
                  <p className="text-xs text-[#8e837a] mt-1">{aiNounResult.explanation}</p>
                </div>
              </div>

              {getMwCollocations(aiNounResult as any).length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#14110f] border border-[#2e2621] space-y-1.5">
                  <span className="text-[10px] text-[#8e837a] font-bold uppercase tracking-wider block">
                    Cụm từ chuẩn xác:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {getMwCollocations(aiNounResult as any).map((c, idx) => {
                      const phrase = getCollocationPhrase(c);
                      const pinyin = getCollocationPinyin(c);
                      const vn = getCollocationVietnamese(c);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSpeak(phrase)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1f1a17] hover:bg-[#28221e] border border-[#2e2621] text-xs cursor-pointer group"
                        >
                          <span className="font-bold text-[#f5ede4]">{phrase}</span>
                          <span className="text-[#e5a044] font-mono text-[11px]">{pinyin}</span>
                          <span className="text-[#8e837a] text-[11px]">({vn})</span>
                          <Volume2 className="w-3 h-3 text-[#8e837a] group-hover:text-[#df5343]" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matched Noun Cards Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#8e837a] px-1">
              <span>Tìm thấy <strong>{matchedNounResults.length}</strong> danh từ liên kết</span>
              <span>Bấm biểu tượng loa để nghe phát âm</span>
            </div>

            {matchedNounResults.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[#1a1613] border border-[#2e2621] space-y-2">
                <Boxes className="w-8 h-8 text-[#8e837a] mx-auto opacity-50" />
                <p className="text-sm text-[#cfc5ba]">Chưa tìm thấy danh từ phù hợp với từ khoá "{nounQuery}"</p>
                <button
                  onClick={handleDirectAiNounSearch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#df5343] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#ea6a5b]"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Nhờ AI tra cứu lượng từ cho "{nounQuery}"</span>
                </button>
              </div>
            ) : (
              matchedNounResults.map(({ noun, measureWord, matchedCollocations }, idx) => {
                const nHanzi = getNounHanzi(noun);
                const nPinyin = getNounPinyin(noun);
                const nVn = getNounVietnamese(noun);
                const mwWord = getMwWord(measureWord);

                return (
                  <div
                    key={`${measureWord.id}-${nHanzi}-${idx}`}
                    className="p-3 sm:p-3.5 rounded-2xl bg-[#1a1613] hover:bg-[#201b17] border border-[#2e2621] hover:border-[#3d332c] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Noun info */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl shrink-0">{noun.emoji || '✨'}</span>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              onClick={() => handleSpeak(nHanzi)}
                              className="text-base sm:text-lg font-black text-[#f5ede4] hover:text-[#df5343] cursor-pointer transition-colors"
                              title="Bấm để nghe phát âm danh từ"
                            >
                              {nHanzi}
                            </span>
                            <span className="text-xs font-mono text-[#e5a044]">{nPinyin}</span>
                            <button
                              onClick={() => handleSpeak(nHanzi)}
                              className="p-1 text-[#8e837a] hover:text-[#df5343]"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                            {onOpenStrokeWriter && nHanzi.length > 0 && (
                              <button
                                onClick={() => onOpenStrokeWriter(nHanzi[0])}
                                className="p-1 text-[#8e837a] hover:text-[#5bb3e0]"
                                title="Tập viết nét chữ này"
                              >
                                <PenTool className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#cfc5ba]">{nVn}</p>
                        </div>
                      </div>

                      {/* Right: Measure Word Pill Stamp */}
                      <div
                        onClick={() => handleSpeak(mwWord)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#df5343]/10 hover:bg-[#df5343]/20 border border-[#df5343]/30 cursor-pointer transition-all shrink-0"
                        title="Lượng từ tương ứng (Bấm nghe phát âm)"
                      >
                        <div className="text-center">
                          <span className="text-[10px] text-[#8e837a] block leading-none mb-0.5">Lượng từ</span>
                          <div className="flex items-center gap-1">
                            <span className="font-serif text-base sm:text-lg font-black text-[#df5343]">
                              {mwWord}
                            </span>
                            <span className="text-xs font-mono text-[#e5a044]">{measureWord.pinyin}</span>
                          </div>
                        </div>
                        <Volume2 className="w-3.5 h-3.5 text-[#df5343]" />
                      </div>
                    </div>

                    {/* Collocation example */}
                    {matchedCollocations.length > 0 && (
                      <div className="pt-2 border-t border-[#261f1a] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div
                          onClick={() => handleSpeak(getCollocationPhrase(matchedCollocations[0]))}
                          className="flex items-center gap-1.5 text-[#f5ede4] hover:text-[#df5343] cursor-pointer group"
                        >
                          <span className="text-[10px] text-[#8e837a]">Cụm:</span>
                          <span className="font-bold">{getCollocationPhrase(matchedCollocations[0])}</span>
                          <span className="text-[#e5a044] font-mono text-[11px]">
                            {getCollocationPinyin(matchedCollocations[0])}
                          </span>
                          <span className="text-[#cfc5ba] text-[11px]">
                            ({getCollocationVietnamese(matchedCollocations[0])})
                          </span>
                          <Volume2 className="w-3 h-3 text-[#8e837a] group-hover:text-[#df5343]" />
                        </div>

                        <button
                          onClick={() => {
                            setBrowseQuery(mwWord);
                            setViewMode('browse');
                          }}
                          className="text-[11px] text-[#8e837a] hover:text-[#e5a044] flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <span>Chi tiết lượng từ "{mwWord}"</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== 3. VIEW MODE: BROWSE MEASURE WORDS (KHO LƯỢNG TỪ) ==================== */}
      {viewMode === 'browse' && (
        <div className="space-y-3">
          {/* Category Tabs Ribbon */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-[#df5343] text-white shadow-sm'
                    : 'bg-[#1a1613] hover:bg-[#251e1a] text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search bar & Mastery toggle */}
          <div className="p-3 rounded-2xl bg-[#1a1613] border border-[#2e2621] flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#8e837a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseQuery}
                onChange={e => setBrowseQuery(e.target.value)}
                placeholder="Tìm lượng từ, pinyin, danh từ..."
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] placeholder-[#8e837a] outline-none focus:border-[#df5343]"
              />
              {browseQuery && (
                <button
                  onClick={() => setBrowseQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e837a] hover:text-[#f5ede4]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={() => setMasteryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  masteryFilter === 'all'
                    ? 'bg-[#df5343] text-white font-bold'
                    : 'text-[#8e837a] hover:text-[#f5ede4] bg-[#221c18]'
                }`}
              >
                Tất cả ({measureWords.length})
              </button>
              <button
                onClick={() => setMasteryFilter('mastered')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  masteryFilter === 'mastered'
                    ? 'bg-[#5eb786] text-white font-bold'
                    : 'text-[#8e837a] hover:text-[#f5ede4] bg-[#221c18]'
                }`}
              >
                Đã thuộc ({masteredCount})
              </button>
              <button
                onClick={() => setMasteryFilter('unmastered')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  masteryFilter === 'unmastered'
                    ? 'bg-[#e5a044] text-white font-bold'
                    : 'text-[#8e837a] hover:text-[#f5ede4] bg-[#221c18]'
                }`}
              >
                Chưa thuộc ({unmasteredCount})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredMeasureWords.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#1a1613] border border-[#2e2621] space-y-2">
                <Boxes className="w-8 h-8 text-[#8e837a] mx-auto opacity-50" />
                <p className="text-sm text-[#cfc5ba]">Không tìm thấy lượng từ nào phù hợp</p>
                <button
                  onClick={() => {
                    setBrowseQuery('');
                    setSelectedCategory('all');
                    setMasteryFilter('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-xs text-[#e5a044] font-bold"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              filteredMeasureWords.map(mw => {
                const isExpanded = expandedMwIds.has(mw.id);
                const mwWord = getMwWord(mw);
                const mwVn = getMwVietnamese(mw);
                const mwSeal = getMwSeal(mw);
                const nouns = getMwNouns(mw);
                const cols = getMwCollocations(mw);

                return (
                  <div
                    key={mw.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#1a1613] hover:bg-[#1e1915] border border-[#2e2621] transition-all space-y-3"
                  >
                    {/* Header line: Seal + Hanzi + Pinyin + Meaning + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Red Seal Stamp */}
                        <div
                          onClick={() => handleSpeak(mwWord)}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#df5343] to-[#b33628] border border-[#ea6a5b]/50 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform shrink-0"
                          title="Bấm để nghe phát âm"
                        >
                          <span className="font-serif text-2xl font-black text-white">{mwSeal}</span>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span
                              onClick={() => handleSpeak(mwWord)}
                              className="text-xl sm:text-2xl font-black text-[#f5ede4] hover:text-[#df5343] cursor-pointer transition-colors"
                            >
                              {mwWord}
                            </span>
                            <span className="text-sm font-mono text-[#e5a044] font-bold">{mw.pinyin}</span>
                            <button
                              onClick={() => handleSpeak(mwWord)}
                              className="p-1 text-[#8e837a] hover:text-[#df5343]"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            {onOpenStrokeWriter && mwWord.length > 0 && (
                              <button
                                onClick={() => onOpenStrokeWriter(mwWord[0])}
                                className="p-1 text-[#8e837a] hover:text-[#5bb3e0]"
                                title="Tập viết nét"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-[#cfc5ba]">{mwVn}</p>
                        </div>
                      </div>

                      {/* Right controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mastered toggle */}
                        <button
                          onClick={() => handleToggleMastered(mw)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            mw.isMastered
                              ? 'bg-[#5eb786]/20 text-[#5eb786] border border-[#5eb786]/40'
                              : 'bg-[#221c18] text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621]'
                          }`}
                          title="Bấm để đánh dấu đã thuộc / chưa thuộc"
                        >
                          {mw.isMastered ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Đã thuộc</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chưa thuộc</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(mw)}
                          className="p-1.5 rounded-lg text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#28211c]"
                          title="Chỉnh sửa lượng từ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(mw)}
                          className="p-1.5 rounded-lg text-[#8e837a] hover:text-[#df5343] hover:bg-[#28211c]"
                          title="Xoá lượng từ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scope Explanation */}
                    <div className="text-xs text-[#cfc5ba] bg-[#14110f] p-2.5 rounded-xl border border-[#261f1a] leading-relaxed">
                      <span className="text-[#e5a044] font-bold mr-1">Phạm vi dùng:</span>
                      {mw.explanation}
                    </div>

                    {/* Paired Nouns Chips */}
                    {nouns.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-[#8e837a] font-bold uppercase tracking-wider block">
                          Danh từ đi kèm tiêu biểu:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {nouns.map((noun, idx) => {
                            const nHanzi = getNounHanzi(noun);
                            const nPinyin = getNounPinyin(noun);
                            const nVn = getNounVietnamese(noun);
                            return (
                              <div
                                key={idx}
                                onClick={() => handleSpeak(nHanzi)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#221c18] hover:bg-[#2a231e] border border-[#2e2621] text-xs cursor-pointer group transition-all"
                              >
                                <span>{noun.emoji || '✨'}</span>
                                <span className="font-bold text-[#f5ede4] group-hover:text-[#df5343]">
                                  {nHanzi}
                                </span>
                                <span className="text-[#e5a044] font-mono text-[11px]">{nPinyin}</span>
                                <span className="text-[#8e837a] text-[11px]">({nVn})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Collocations & Tips Accordion */}
                    <div>
                      <button
                        onClick={() => toggleExpanded(mw.id)}
                        className="flex items-center gap-1 text-xs text-[#8e837a] hover:text-[#e5a044] font-medium cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Thu gọn ví dụ & mẹo nhớ</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Xem {cols.length} cụm từ mẫu & mẹo ghi nhớ</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#261f1a] space-y-2 text-xs">
                          {/* Collocations */}
                          {cols.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] text-[#8e837a] font-bold uppercase tracking-wider">
                                Cụm từ và ví dụ:
                              </span>
                              <div className="space-y-1">
                                {cols.map((c, cIdx) => {
                                  const phrase = getCollocationPhrase(c);
                                  const pinyin = getCollocationPinyin(c);
                                  const vn = getCollocationVietnamese(c);
                                  return (
                                    <div
                                      key={cIdx}
                                      onClick={() => handleSpeak(phrase)}
                                      className="flex items-center justify-between p-2 rounded-lg bg-[#14110f] hover:bg-[#1a1613] border border-[#261f1a] cursor-pointer group"
                                    >
                                      <div className="flex items-baseline gap-2 flex-wrap">
                                        <span className="font-black text-[#f5ede4] group-hover:text-[#df5343]">
                                          {phrase}
                                        </span>
                                        <span className="font-mono text-[#e5a044] text-[11px]">{pinyin}</span>
                                        <span className="text-[#cfc5ba] text-[11px]">({vn})</span>
                                      </div>
                                      <Volume2 className="w-3 h-3 text-[#8e837a] group-hover:text-[#df5343] shrink-0" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Memory Tip */}
                          {(mw.tips || mw.notesOrTips) && (
                            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#e5a044]/10 border border-[#e5a044]/30 text-[#e5a044]">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="text-xs leading-relaxed">{mw.tips || mw.notesOrTips}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== 4. VIEW MODE: QUIZ (TRẮC NGHIỆM LƯỢNG TỪ) ==================== */}
      {viewMode === 'quiz' && (
        <div className="space-y-3">
          {quizQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1a1613] border border-[#2e2621] space-y-2">
              <Zap className="w-8 h-8 text-[#e5a044] mx-auto" />
              <p className="text-sm text-[#cfc5ba]">Chưa có đủ câu hỏi kiểm tra cho lượng từ.</p>
              <button
                onClick={() => setViewMode('noun_search')}
                className="px-3 py-1.5 rounded-xl bg-[#df5343] text-white text-xs font-bold"
              >
                Quay lại tra cứu
              </button>
            </div>
          ) : currentQuiz ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1a1613] border border-[#2e2621] shadow-lg space-y-4">
              {/* Quiz Header with Score & Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8e837a]">
                    Câu hỏi {currentQuizIndex + 1}/{quizQuestions.length}
                  </span>
                  {quizStreak > 1 && (
                    <span className="flex items-center gap-0.5 text-xs text-[#df5343] font-bold">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {quizStreak} liên tiếp!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#e5a044] font-mono font-bold">Điểm: {quizScore}</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-xl bg-[#14110f] border border-[#2e2621] text-center space-y-2">
                <span className="font-serif text-3xl font-black text-[#df5343] block">{currentQuiz.sealChar}</span>
                <p className="text-sm sm:text-base font-bold text-[#f5ede4] leading-relaxed">
                  {currentQuiz.question}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentQuiz.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuiz.correctAnswer;

                  let btnStyle = 'bg-[#1f1a17] hover:bg-[#28211c] text-[#f5ede4] border-[#2e2621]';
                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-[#5eb786]/20 border-[#5eb786] text-[#5eb786] font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-[#df5343]/20 border-[#df5343] text-[#df5343] font-bold';
                    } else {
                      btnStyle = 'opacity-40 border-[#2e2621] text-[#8e837a]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizAnswer(option)}
                      disabled={isAnswerSubmitted}
                      className={`p-3 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                    >
                      <span className="font-medium">{option}</span>
                      {isAnswerSubmitted && isCorrect && <Check className="w-4 h-4 text-[#5eb786]" />}
                      {isAnswerSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-[#df5343]" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Next Button */}
              {isAnswerSubmitted && (
                <div className="p-3.5 rounded-xl bg-[#14110f] border border-[#2e2621] space-y-2.5 animate-fadeIn">
                  <div className="text-xs text-[#cfc5ba] leading-relaxed">
                    <span className="font-bold text-[#e5a044]">Giải thích: </span>
                    {currentQuiz.explanation}
                  </div>
                  <button
                    onClick={handleNextQuiz}
                    className="w-full py-2.5 rounded-xl bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Câu tiếp theo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ==================== 5. VIEW MODE: FLASHCARDS (THẺ LẬT DANH TỪ ➔ LƯỢNG TỪ) ==================== */}
      {viewMode === 'flashcards' && (
        <div className="space-y-3">
          {flashcardItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1a1613] border border-[#2e2621] space-y-2">
              <Layers className="w-8 h-8 text-[#8e837a] mx-auto" />
              <p className="text-sm text-[#cfc5ba]">Chưa có thẻ ghi nhớ lượng từ.</p>
            </div>
          ) : currentFlashcard ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8e837a] px-1">
                <span>Thẻ {flashcardIndex + 1}/{flashcardItems.length}</span>
                <span>Bấm vào thẻ để lật xem đáp án</span>
              </div>

              {/* Flashcard Container */}
              <div
                onClick={() => setIsFlipped(prev => !prev)}
                className="w-full min-h-[220px] sm:min-h-[260px] p-6 rounded-3xl bg-gradient-to-br from-[#1f1a17] via-[#1a1613] to-[#14110f] border-2 border-[#2e2621] hover:border-[#3d332c] shadow-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden select-none"
              >
                {!isFlipped ? (
                  // Front: Noun
                  <div className="space-y-3">
                    <span className="text-4xl">{currentFlashcard.noun.emoji || '✨'}</span>
                    <div className="space-y-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-[#f5ede4]">
                        {getNounHanzi(currentFlashcard.noun)}
                      </h2>
                      <p className="text-sm font-mono text-[#e5a044]">{getNounPinyin(currentFlashcard.noun)}</p>
                      <p className="text-xs sm:text-sm text-[#cfc5ba]">{getNounVietnamese(currentFlashcard.noun)}</p>
                    </div>
                    <div className="pt-2">
                      <span className="px-3 py-1 rounded-full bg-[#df5343]/15 text-[#df5343] text-xs font-bold border border-[#df5343]/30">
                        Lượng từ cho danh từ này là gì?
                      </span>
                    </div>
                  </div>
                ) : (
                  // Back: Measure Word & Collocation
                  <div className="space-y-3 animate-fadeIn">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#df5343] to-[#b33628] border border-[#ea6a5b]/50 flex items-center justify-center shadow-lg mx-auto">
                      <span className="font-serif text-3xl font-black text-white">
                        {getMwWord(currentFlashcard.measureWord)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-[#f5ede4]">
                          {getMwWord(currentFlashcard.measureWord)}
                        </span>
                        <span className="text-sm font-mono text-[#e5a044]">{currentFlashcard.measureWord.pinyin}</span>
                        <button
                          onClick={e => handleSpeak(getMwWord(currentFlashcard.measureWord), e)}
                          className="p-1 text-[#8e837a] hover:text-[#df5343]"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#cfc5ba] max-w-sm">{getMwVietnamese(currentFlashcard.measureWord)}</p>
                    </div>

                    {currentFlashcard.collocation && (
                      <div className="p-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4]">
                        <span className="font-bold">{getCollocationPhrase(currentFlashcard.collocation)}</span>
                        <span className="text-[#e5a044] font-mono text-[11px] ml-1.5">
                          {getCollocationPinyin(currentFlashcard.collocation)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons for Flashcard */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleNextFlashcard(false)}
                  className="py-2.5 rounded-xl bg-[#221c18] hover:bg-[#2c241f] text-[#df5343] border border-[#3d332c] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Chưa nhớ vững</span>
                </button>
                <button
                  onClick={() => handleNextFlashcard(true)}
                  className="py-2.5 rounded-xl bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã nhớ thuộc</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ==================== 6. ADD / EDIT MEASURE WORD MODAL WITH AI AUTO-FILL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[#1a1613] border border-[#2e2621] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-[#2e2621] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#df5343]/20 text-[#df5343] flex items-center justify-center font-serif font-black text-sm">
                  量
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#f5ede4]">
                  {editingMw ? 'Chỉnh sửa Lượng từ' : 'Thêm Lượng từ mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* AI Auto-Fill Helper Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#241c17] to-[#1c1714] border border-[#3d332c] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#e5a044]">
                  <Sparkles className="w-4 h-4 text-[#e5a044]" />
                  <span>AI Tự Điền Ma Thuật (Magic Auto-Fill)</span>
                </div>
                <p className="text-[11px] text-[#cfc5ba]">
                  Nhập bất kỳ danh từ hoặc lượng từ nào (ví dụ: "áo", "con cá", "cái bàn", "把", "张", "tiáo"), AI sẽ tự động điền trọn vẹn danh từ đi kèm, câu hỏi kiểm tra và mẹo nhớ!
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Nhập danh từ hoặc lượng từ..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] placeholder-[#8e837a] outline-none focus:border-[#e5a044]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAiAutoFill()}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e5a044] hover:bg-[#f0ad54] text-black text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang soạn...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Tự Điền ✨</span>
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#df5343]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveModal} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#8e837a] block mb-1">
                      Chữ Hán lượng từ <span className="text-[#df5343]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formWord}
                      onChange={e => setFormWord(e.target.value)}
                      placeholder="Ví dụ: 把, 张, 条, 件"
                      className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-sm text-[#f5ede4] focus:border-[#df5343] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8e837a] block mb-1">Pinyin có dấu</label>
                    <input
                      type="text"
                      value={formPinyin}
                      onChange={e => setFormPinyin(e.target.value)}
                      placeholder="bǎ, zhāng, tiáo"
                      className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-sm text-[#f5ede4] focus:border-[#df5343] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#8e837a] block mb-1">Nhóm phân loại</label>
                    <select
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value as MeasureWordCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] focus:border-[#df5343] outline-none"
                    >
                      <option value="objects">Đồ vật & Dụng cụ</option>
                      <option value="animals">Động vật & Côn trùng</option>
                      <option value="clothing">Trang phục & Phụ kiện</option>
                      <option value="vehicles">Xe cộ & Giao thông</option>
                      <option value="plants_food">Cây cối & Đồ ăn</option>
                      <option value="body_abstract">Trừu tượng & Sự việc</option>
                      <option value="general">Đa dụng chung</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8e837a] block mb-1">Dịch nghĩa tiếng Việt</label>
                  <input
                    type="text"
                    value={formVietnamese}
                    onChange={e => setFormVietnamese(e.target.value)}
                    placeholder="Chiếc, cái (đồ vật có cán/chuôi/tay cầm)"
                    className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] focus:border-[#df5343] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8e837a] block mb-1">Giải thích phạm vi sử dụng</label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={e => setFormExplanation(e.target.value)}
                    placeholder="Chuyên dùng cho đồ vật cầm nắm được bằng một tay có cán..."
                    className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] focus:border-[#df5343] outline-none"
                  />
                </div>

                {/* Paired Nouns List Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#8e837a]">
                      Danh từ đi kèm ({formNouns.length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormNouns(prev => [
                          ...prev,
                          { nounHanzi: '', nounPinyin: '', nounVietnamese: '', emoji: '✨', commonRank: prev.length + 1 }
                        ])
                      }
                      className="text-[11px] text-[#e5a044] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm danh từ</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {formNouns.map((noun, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={noun.emoji || '✨'}
                          onChange={e => {
                            const val = e.target.value;
                            setFormNouns(prev => prev.map((n, i) => (i === idx ? { ...n, emoji: val } : n)));
                          }}
                          placeholder="Emoji"
                          className="w-12 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-center text-[#f5ede4]"
                        />
                        <input
                          type="text"
                          value={getNounHanzi(noun)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormNouns(prev => prev.map((n, i) => (i === idx ? { ...n, nounHanzi: val, hanzi: val } : n)));
                          }}
                          placeholder="Chữ Hán (雨伞)"
                          className="w-24 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4]"
                        />
                        <input
                          type="text"
                          value={getNounPinyin(noun)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormNouns(prev => prev.map((n, i) => (i === idx ? { ...n, nounPinyin: val, pinyin: val } : n)));
                          }}
                          placeholder="Pinyin (yǔsǎn)"
                          className="w-24 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] font-mono"
                        />
                        <input
                          type="text"
                          value={getNounVietnamese(noun)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormNouns(prev => prev.map((n, i) => (i === idx ? { ...n, nounVietnamese: val, vietnamese: val } : n)));
                          }}
                          placeholder="Nghĩa (ô / dù)"
                          className="flex-1 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4]"
                        />
                        {formNouns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormNouns(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-[#8e837a] hover:text-[#df5343]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collocations Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#8e837a]">
                      Cụm từ phối hợp ({formCollocations.length})
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormCollocations(prev => [
                          ...prev,
                          { phraseHanzi: '', phrasePinyin: '', phraseVietnamese: '', context: '' }
                        ])
                      }
                      className="text-[11px] text-[#e5a044] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm cụm từ</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {formCollocations.map((col, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={getCollocationPhrase(col)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormCollocations(prev => prev.map((c, i) => (i === idx ? { ...c, phraseHanzi: val, phrase: val } : c)));
                          }}
                          placeholder="Cụm Hán (一把雨伞)"
                          className="w-32 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4]"
                        />
                        <input
                          type="text"
                          value={getCollocationPinyin(col)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormCollocations(prev => prev.map((c, i) => (i === idx ? { ...c, phrasePinyin: val, pinyin: val } : c)));
                          }}
                          placeholder="Pinyin (yì bǎ yǔsǎn)"
                          className="w-32 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] font-mono"
                        />
                        <input
                          type="text"
                          value={getCollocationVietnamese(col)}
                          onChange={e => {
                            const val = e.target.value;
                            setFormCollocations(prev => prev.map((c, i) => (i === idx ? { ...c, phraseVietnamese: val, vietnamese: val } : c)));
                          }}
                          placeholder="Dịch (một chiếc ô)"
                          className="flex-1 px-2 py-1.5 rounded-lg bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4]"
                        />
                        {formCollocations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormCollocations(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-[#8e837a] hover:text-[#df5343]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8e837a] block mb-1">Mẹo ghi nhớ (Mnemonic / Tip)</label>
                  <input
                    type="text"
                    value={formTips}
                    onChange={e => setFormTips(e.target.value)}
                    placeholder="Mẹo nhớ ngắn gọn..."
                    className="w-full px-3 py-2 rounded-xl bg-[#14110f] border border-[#2e2621] text-xs text-[#f5ede4] focus:border-[#df5343] outline-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-[#2e2621] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#221c18] hover:bg-[#2c241f] text-xs font-bold text-[#8e837a] cursor-pointer"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {editingMw ? 'Lưu thay đổi' : 'Thêm vào kho'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
