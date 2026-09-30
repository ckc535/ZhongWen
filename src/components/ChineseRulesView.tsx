import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ChineseRule, RuleCategory, RuleExample, RulePracticeQuestion } from '../types';
import { tts, useTtsSpeaking } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import { GeminiService } from '../services/geminiService';
import confetti from 'canvas-confetti';
import {
  BookmarkCheck,
  Search,
  Plus,
  Trash2,
  Edit3,
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  BookOpen,
  Lightbulb,
  Check,
  X,
  Filter,
  ArrowRight,
  Flame,
  Clock,
  HelpCircle,
  PenTool,
  CheckCheck,
  PlayCircle,
  Loader2,
  AlertCircle,
  Wand2
} from 'lucide-react';

interface CategoryTab {
  id: 'all' | RuleCategory;
  label: string;
  icon: string;
  seal: string;
  color: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: 'Tất cả quy tắc', icon: '🌟', seal: '全', color: '#df5343' },
  { id: 'pronunciation', label: 'Biến điệu & Phát âm', icon: '🗣️', seal: '声', color: '#e5a044' },
  { id: 'time_numbers', label: 'Giờ phút & Số đếm', icon: '⏰', seal: '时', color: '#5bb3e0' },
  { id: 'grammar', label: 'Ngữ pháp & Trật tự câu', icon: '📐', seal: '法', color: '#5eb786' },
  { id: 'vocabulary', label: 'Cặp từ & Lượng từ', icon: '📖', seal: '词', color: '#a78bfa' },
  { id: 'writing', label: 'Quy tắc nét viết', icon: '✍️', seal: '字', color: '#fb923c' }
];

export const ChineseRulesView: React.FC = () => {
  const {
    rules,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleMastered,
    recordRuleTest,
    resetRulesToDefault,
    settings
  } = useApp();

  const isSpeaking = useTtsSpeaking();

  // Active view tab: 'browse' (Thư viện) | 'quiz' (Trắc nghiệm) | 'flashcards' (Lật thẻ)
  const [viewMode, setViewMode] = useState<'browse' | 'quiz' | 'flashcards'>('browse');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | RuleCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');

  // Expanded rule detail cards (Set of IDs)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(() => new Set());

  // Modal State for Add / Edit Rule
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<ChineseRule | null>(null);

  // AI Auto-Fill State for Modal
  const [aiTopicInput, setAiTopicInput] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<RuleCategory>('pronunciation');
  const [formFormula, setFormFormula] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formExceptions, setFormExceptions] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formExamples, setFormExamples] = useState<RuleExample[]>([
    { chinese: '', pinyin: '', vietnamese: '', note: '' }
  ]);
  const [formPracticeQuestions, setFormPracticeQuestions] = useState<RulePracticeQuestion[]>([]);

  // Quiz / Practice State
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ ruleId: string; ruleTitle: string; question: RulePracticeQuestion }>
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // Flashcards Practice State
  const [flashcardIndex, setFlashcardIndex] = useState<number>(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState<boolean>(false);

  // Toggle card expansion
  const toggleExpandCard = (id: string) => {
    soundEffects.playClick();
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / collapse all
  const handleToggleExpandAll = () => {
    soundEffects.playClick();
    if (expandedCardIds.size > 0) {
      setExpandedCardIds(new Set());
    } else {
      setExpandedCardIds(new Set(rules.map(r => r.id)));
    }
  };

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) {
        return false;
      }
      if (statusFilter === 'mastered' && !r.isMastered) return false;
      if (statusFilter === 'unmastered' && r.isMastered) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = r.title.toLowerCase().includes(query);
        const inFormula = r.formula?.toLowerCase().includes(query);
        const inSummary = r.summary.toLowerCase().includes(query);
        const inDetail = r.detail.toLowerCase().includes(query);
        const inTags = r.tags.some(t => t.toLowerCase().includes(query));
        const inExamples = r.examples.some(
          ex =>
            ex.chinese.toLowerCase().includes(query) ||
            ex.pinyin.toLowerCase().includes(query) ||
            ex.vietnamese.toLowerCase().includes(query)
        );
        return inTitle || inFormula || inSummary || inDetail || inTags || inExamples;
      }

      return true;
    });
  }, [rules, selectedCategory, statusFilter, searchQuery]);

  // Statistics
  const masteredCount = useMemo(() => rules.filter(r => r.isMastered).length, [rules]);
  const unmasteredCount = rules.length - masteredCount;
  const masterPercentage = rules.length > 0 ? Math.round((masteredCount / rules.length) * 100) : 0;

  // Speak Chinese Example
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playClick();
    tts.speak(text, 0.75, 1.0);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    soundEffects.playClick();
    setEditingRule(null);
    setFormTitle('');
    setFormCategory('pronunciation');
    setFormFormula('');
    setFormSummary('');
    setFormDetail('');
    setFormExceptions('');
    setFormTags('');
    setFormExamples([{ chinese: '', pinyin: '', vietnamese: '', note: '' }]);
    setFormPracticeQuestions([]);
    setAiTopicInput('');
    setAiSuccessMessage(null);
    setAiErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: ChineseRule, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    setEditingRule(rule);
    setFormTitle(rule.title);
    setFormCategory(rule.category);
    setFormFormula(rule.formula || '');
    setFormSummary(rule.summary);
    setFormDetail(rule.detail);
    setFormExceptions(rule.exceptions || '');
    setFormTags(rule.tags.join(', '));
    setFormExamples(
      rule.examples.length > 0
        ? rule.examples.map(ex => ({ ...ex }))
        : [{ chinese: '', pinyin: '', vietnamese: '', note: '' }]
    );
    setFormPracticeQuestions(rule.practiceQuestions || []);
    setAiTopicInput(rule.title);
    setAiSuccessMessage(null);
    setAiErrorMessage(null);
    setIsModalOpen(true);
  };

  // AI Auto-Fill Rule generator
  const handleAiAutoFill = async (overridePrompt?: string) => {
    const promptToUse = (overridePrompt || aiTopicInput || formTitle).trim();
    if (!promptToUse) {
      setAiErrorMessage('Vui lòng nhập tên quy tắc, chủ đề hoặc chọn một gợi ý mẫu bên dưới.');
      return;
    }

    soundEffects.playClick();
    setIsAiGenerating(true);
    setAiErrorMessage(null);
    setAiSuccessMessage(null);

    try {
      const generated = await GeminiService.autoGenerateChineseRule(
        promptToUse,
        settings.geminiApiKey,
        settings.geminiModel
      );

      if (generated.title) setFormTitle(generated.title);
      if (generated.category) setFormCategory(generated.category as RuleCategory);
      if (generated.formula !== undefined) setFormFormula(generated.formula);
      if (generated.summary) setFormSummary(generated.summary);
      if (generated.detail) setFormDetail(generated.detail);
      if (generated.exceptions !== undefined) setFormExceptions(generated.exceptions);
      if (generated.tags && generated.tags.length > 0) {
        setFormTags(generated.tags.join(', '));
      }
      if (generated.examples && generated.examples.length > 0) {
        setFormExamples(generated.examples);
      }
      if (generated.practiceQuestions && generated.practiceQuestions.length > 0) {
        setFormPracticeQuestions(generated.practiceQuestions);
      }

      setAiTopicInput(promptToUse);
      setAiSuccessMessage(`✨ AI đã điền đầy đủ quy tắc "${generated.title || promptToUse}"!`);
      soundEffects.playSuccess();
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.6 }
      });
    } catch (err: unknown) {
      console.error('AI Auto-Fill error:', err);
      const msg = err instanceof Error ? err.message : 'Không thể kết nối AI. Vui lòng thử lại.';
      setAiErrorMessage(msg);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save Modal (Add or Edit)
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập tên quy tắc');
      return;
    }

    soundEffects.playSuccess();

    const cleanedExamples = formExamples
      .filter(ex => ex.chinese.trim() || ex.vietnamese.trim())
      .map(ex => ({
        chinese: ex.chinese.trim(),
        pinyin: ex.pinyin.trim(),
        vietnamese: ex.vietnamese.trim(),
        note: ex.note?.trim()
      }));

    const cleanedTags = formTags
      .split(/[,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean);

    if (editingRule) {
      await updateRule(editingRule.id, {
        title: formTitle.trim(),
        category: formCategory,
        formula: formFormula.trim(),
        summary: formSummary.trim(),
        detail: formDetail.trim(),
        exceptions: formExceptions.trim(),
        tags: cleanedTags,
        examples: cleanedExamples,
        practiceQuestions: formPracticeQuestions
      });
    } else {
      await addRule({
        title: formTitle.trim(),
        category: formCategory,
        formula: formFormula.trim(),
        summary: formSummary.trim(),
        detail: formDetail.trim(),
        exceptions: formExceptions.trim(),
        tags: cleanedTags,
        examples: cleanedExamples,
        practiceQuestions: formPracticeQuestions
      });
    }

    setIsModalOpen(false);
  };

  // Delete Rule
  const handleDeleteRule = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    if (confirm(`Bạn có chắc chắn muốn xoá quy tắc "${title}" không?`)) {
      await deleteRule(id);
    }
  };

  // Reset to default starter rules
  const handleResetStarter = async () => {
    soundEffects.playClick();
    if (confirm('Khôi phục danh sách các quy tắc ngữ pháp & biến âm chuẩn mặc định?')) {
      await resetRulesToDefault();
    }
  };

  // ==================== QUIZ PRACTICE ENGINE ====================
  const startQuiz = (scopeRules: ChineseRule[] = filteredRules) => {
    soundEffects.playClick();
    const candidateQuestions: Array<{
      ruleId: string;
      ruleTitle: string;
      question: RulePracticeQuestion;
    }> = [];

    scopeRules.forEach(r => {
      if (r.practiceQuestions && r.practiceQuestions.length > 0) {
        r.practiceQuestions.forEach(q => {
          candidateQuestions.push({
            ruleId: r.id,
            ruleTitle: r.title,
            question: q
          });
        });
      } else if (r.examples.length > 0) {
        const ex = r.examples[0];
        candidateQuestions.push({
          ruleId: r.id,
          ruleTitle: r.title,
          question: {
            id: `gen-${r.id}-1`,
            question: `Theo quy tắc "${r.title}", ví dụ "${ex.chinese}" có phát âm / nghĩa đúng là gì?`,
            options: [
              `${ex.pinyin} (${ex.vietnamese})`,
              `Không có phát âm đặc biệt`,
              `Đọc giữ nguyên không biến âm`,
              `Phát âm đảo ngược`
            ],
            correctAnswer: `${ex.pinyin} (${ex.vietnamese})`,
            explanation: `Quy tắc: ${r.summary}`
          }
        });
      }
    });

    if (candidateQuestions.length === 0) {
      alert('Không có câu hỏi kiểm tra nào phù hợp với bộ lọc hiện tại.');
      return;
    }

    const shuffled = [...candidateQuestions].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffled.slice(0, 15));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizCompleted(false);
    setViewMode('quiz');
  };

  const handleSelectQuizOption = (option: string) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(option);
  };

  const handleSubmitQuizAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return;
    const current = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === current.question.correctAnswer;

    setIsAnswerSubmitted(true);

    if (isCorrect) {
      soundEffects.playSuccess();
      setQuizScore(prev => prev + 1);
    } else {
      soundEffects.playWrong();
    }

    recordRuleTest(current.ruleId, isCorrect);
  };

  const handleNextQuizQuestion = () => {
    soundEffects.playClick();
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizCompleted(true);
      soundEffects.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // ==================== FLASHCARD PRACTICE ENGINE ====================
  const startFlashcards = (scopeRules: ChineseRule[] = filteredRules) => {
    soundEffects.playClick();
    if (scopeRules.length === 0) {
      alert('Không có quy tắc nào để ôn thẻ nhớ.');
      return;
    }
    setFlashcardIndex(0);
    setIsFlashcardFlipped(false);
    setViewMode('flashcards');
  };

  const handleNextFlashcard = (isRemembered: boolean) => {
    const currentRule = filteredRules[flashcardIndex];
    if (isRemembered) {
      soundEffects.playSuccess();
      if (!currentRule.isMastered) {
        toggleRuleMastered(currentRule.id);
      }
    } else {
      soundEffects.playClick();
    }

    setIsFlashcardFlipped(false);
    if (flashcardIndex + 1 < filteredRules.length) {
      setFlashcardIndex(prev => prev + 1);
    } else {
      soundEffects.playLevelUp();
      alert('🎉 Chúc mừng! Bạn đã hoàn thành lượt ôn thẻ nhớ các quy tắc.');
      setViewMode('browse');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER: ELEGANT CHINESE ACADEMY HUB BANNER                        */}
      {/* ========================================================================= */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#1c1815] via-[#181412] to-[#14110f] border border-[#2e2621] p-3.5 sm:p-5 mb-4 shadow-lg overflow-hidden">
        {/* Decorative Seal & Watermark Background */}
        <div className="absolute -right-4 -bottom-6 select-none pointer-events-none opacity-5 text-white text-9xl font-chinese font-black">
          规
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Title Area with Red Calligraphy Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#df5343] to-[#b83829] flex items-center justify-center shadow-md border border-[#f06e60]/30 shrink-0">
              <span className="font-chinese text-white text-xl sm:text-2xl font-bold">律</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-[#f5ede4] tracking-tight">
                  Quy Tắc Tiếng Trung
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#df5343]/15 text-[#df5343] text-[10px] font-bold border border-[#df5343]/30">
                  {rules.length} bí quyết
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#8e837a] mt-0.5">
                Biến điệu thanh 3, đọc giờ phút, 不/一, 二 vs 两, trật tự câu S+T+D+V & ngữ pháp
              </p>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#df5343] hover:bg-[#ea6a5b] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>

            <button
              onClick={() => startQuiz()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-[#e5a044] border border-[#3d332c] text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-[#e5a044]" />
              <span>Làm bài kiểm tra</span>
            </button>
          </div>
        </div>

        {/* Stats & Mastery Progress Ribbon */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-[#2a221d]">
          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#8e837a] block">Tổng số quy tắc</span>
            <span className="text-sm sm:text-base font-black text-[#f5ede4] font-mono">
              {rules.length}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#5eb786] block">Đã ghi nhớ vững</span>
            <span className="text-sm sm:text-base font-black text-[#5eb786] font-mono">
              {masteredCount}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded-xl bg-[#14110f]/80 border border-[#261f1a]">
            <span className="text-[10px] text-[#df5343] block">Cần ôn luyện</span>
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

        {/* View Mode Switcher Pills (Thư viện / Trắc nghiệm / Flashcard) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#261f1a]">
          <button
            onClick={() => setViewMode('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'browse'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Thư viện ({rules.length})</span>
          </button>

          <button
            onClick={() => startQuiz()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'quiz'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Trắc nghiệm kiểm tra</span>
          </button>

          <button
            onClick={() => startFlashcards()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              viewMode === 'flashcards'
                ? 'bg-[#df5343] text-white shadow-sm'
                : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ôn thẻ nhớ</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VIEW MODE 1: BROWSE RULES (THƯ VIỆN & XEM TOÀN BỘ)                       */}
      {/* ========================================================================= */}
      {viewMode === 'browse' && (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-[#1a1613] border border-[#2e2621] rounded-2xl p-2.5 sm:p-3.5 mb-3.5 shadow-sm space-y-2.5">
            {/* Search + Status Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8e837a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên quy tắc, công thức, chữ Hán, Pinyin, nghĩa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-[#f5ede4] placeholder-[#6b625b] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8e837a] hover:text-[#f5ede4] p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pill Button Group */}
              <div className="flex items-center gap-1 bg-[#14110f] p-1 rounded-xl border border-[#2e2621] text-xs shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'all'
                      ? 'bg-[#2a221d] text-[#f5ede4] font-bold shadow-xs'
                      : 'text-[#8e837a] hover:text-[#f5ede4]'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter('unmastered')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'unmastered'
                      ? 'bg-[#df5343]/20 text-[#df5343] font-bold shadow-xs'
                      : 'text-[#8e837a] hover:text-[#f5ede4]'
                  }`}
                >
                  Cần ôn ({unmasteredCount})
                </button>
                <button
                  onClick={() => setStatusFilter('mastered')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-lg transition-all cursor-pointer text-center ${
                    statusFilter === 'mastered'
                      ? 'bg-[#5eb786]/20 text-[#5eb786] font-bold shadow-xs'
                      : 'text-[#8e837a] hover:text-[#f5ede4]'
                  }`}
                >
                  Đã thuộc ({masteredCount})
                </button>
              </div>
            </div>

            {/* Category Filter Chips (Flex Wrap - No Overflow) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {CATEGORY_TABS.map(tab => {
                const isSelected = selectedCategory === tab.id;
                const count =
                  tab.id === 'all' ? rules.length : rules.filter(r => r.category === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedCategory(tab.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap font-medium transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#2a221d] border border-[#df5343] text-white shadow-sm font-bold'
                        : 'bg-[#14110f] border border-[#2e2621] text-[#8e837a] hover:text-[#f5ede4] hover:border-[#3d332c]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-[#df5343] text-white' : 'bg-[#1f1a17] text-[#6b625b]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subheader: Counters & Expand All */}
          <div className="flex items-center justify-between text-xs text-[#8e837a] mb-2.5 px-1">
            <span>
              Tìm thấy <strong className="text-[#f5ede4] font-mono">{filteredRules.length}</strong> quy tắc
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleExpandAll}
                className="hover:text-[#f5ede4] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              >
                {expandedCardIds.size > 0 ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Thu gọn chi tiết</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Mở rộng chi tiết</span>
                  </>
                )}
              </button>
              <button
                onClick={handleResetStarter}
                className="hover:text-[#e5a044] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                title="Khôi phục lại toàn bộ quy tắc mẫu nếu cần"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Khôi phục mẫu</span>
              </button>
            </div>
          </div>

          {/* Rules Cards List */}
          {filteredRules.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1613] border border-[#2e2621] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-full bg-[#2a221d] flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <h3 className="text-base font-bold text-[#f5ede4] mb-1">Không tìm thấy quy tắc nào</h3>
              <p className="text-xs text-[#8e837a] max-w-sm mx-auto mb-4">
                Không có quy tắc nào khớp với bộ lọc tìm kiếm. Hãy thử đổi từ khoá hoặc thêm quy tắc mới.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStatusFilter('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-xs font-semibold text-[#f5ede4] border border-[#3d332c] cursor-pointer"
              >
                Xoá bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-3.5">
              {filteredRules.map(rule => {
                const isExpanded = expandedCardIds.has(rule.id);
                const categoryConfig =
                  CATEGORY_TABS.find(c => c.id === rule.category) || CATEGORY_TABS[0];

                return (
                  <div
                    key={rule.id}
                    className={`bg-gradient-to-b from-[#1c1815] to-[#181412] border transition-all duration-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md ${
                      rule.isMastered
                        ? 'border-[#2d4734]/70 hover:border-[#3e6648]'
                        : 'border-[#2e2621] hover:border-[#42362e]'
                    }`}
                  >
                    {/* Card Main Body */}
                    <div className="p-3.5 sm:p-4.5">
                      {/* Top Header: Badge, Category, Title & Mastered Pill */}
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {/* Chinese Seal Stamp */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-chinese font-bold text-sm shrink-0 border mt-0.5"
                            style={{
                              backgroundColor: `${categoryConfig.color}15`,
                              borderColor: `${categoryConfig.color}40`,
                              color: categoryConfig.color
                            }}
                          >
                            {categoryConfig.seal}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider"
                                style={{ color: categoryConfig.color }}
                              >
                                {categoryConfig.label}
                              </span>
                              {rule.isBuiltIn && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#2a221d] text-[#e5a044] border border-[#3d332c]">
                                  Chuẩn
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-[#f5ede4] leading-snug">
                              {rule.title}
                            </h3>
                          </div>
                        </div>

                        {/* Right: Mastered Switch Pill + Edit Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              soundEffects.playClick();
                              toggleRuleMastered(rule.id);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                              rule.isMastered
                                ? 'bg-[#5eb786]/20 border-[#5eb786]/40 text-[#5eb786] hover:bg-[#5eb786]/30'
                                : 'bg-[#14110f] border-[#2e2621] text-[#8e837a] hover:border-[#df5343] hover:text-[#df5343]'
                            }`}
                            title="Bấm để chuyển trạng thái Đã thuộc / Cần ôn"
                          >
                            {rule.isMastered ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#5eb786]" />
                                <span>Đã thuộc</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 rounded-full border border-current" />
                                <span>Chưa thuộc</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={e => handleOpenEditModal(rule, e)}
                            className="p-1 rounded-lg text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#251e1a] transition-colors cursor-pointer"
                            title="Chỉnh sửa quy tắc"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {!rule.isBuiltIn && (
                            <button
                              onClick={e => handleDeleteRule(rule.id, rule.title, e)}
                              className="p-1 rounded-lg text-[#8e837a] hover:text-[#df5343] hover:bg-[#251e1a] transition-colors cursor-pointer"
                              title="Xoá quy tắc"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Formula Banner: The golden centerpiece */}
                      {rule.formula && (
                        <div className="mb-2.5 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#241d18] via-[#1d1713] to-[#171310] border border-[#e5a044]/30 shadow-inner flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="p-1 rounded-md bg-[#e5a044]/15 text-[#e5a044] shrink-0">
                              <Zap className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono text-[#f5ede4] truncate">
                              {rule.formula}
                            </span>
                          </div>

                          <button
                            onClick={() => startQuiz([rule])}
                            className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2a221d] hover:bg-[#342b25] text-[#e5a044] text-[10px] font-bold border border-[#3d332c] cursor-pointer"
                            title="Kiểm tra riêng quy tắc này"
                          >
                            <span>Luyện tập</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Rule Summary */}
                      <p className="text-xs text-[#a89d91] leading-relaxed mb-3">
                        {rule.summary}
                      </p>

                      {/* Live Examples Preview (Prominent and clear right on the card!) */}
                      {rule.examples && rule.examples.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          {rule.examples.slice(0, 4).map((ex, idx) => (
                            <div
                              key={idx}
                              className="p-2 sm:p-2.5 rounded-xl bg-[#14110f]/90 border border-[#2e2621] hover:border-[#3d332c] flex items-center justify-between gap-2 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-base sm:text-lg font-bold font-chinese text-[#f5ede4]">
                                    {ex.chinese}
                                  </span>
                                  <span className="text-xs font-bold font-mono text-[#f05d48]">
                                    {ex.pinyin}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8e837a] truncate">
                                  {ex.vietnamese}
                                  {ex.note ? ` • ${ex.note}` : ''}
                                </p>
                              </div>

                              <button
                                onClick={e => handleSpeak(ex.chinese, e)}
                                className="p-1.5 rounded-lg bg-[#1f1a17] hover:bg-[#df5343] hover:text-white text-[#8e837a] transition-all shrink-0 cursor-pointer"
                                title="Nghe phát âm chuẩn"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expand / Collapse Button Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#231b17] mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-[#8e837a]">
                          {rule.reviewCount ? (
                            <span>Đã ôn: <strong className="text-[#f5ede4] font-mono">{rule.reviewCount}</strong> lần</span>
                          ) : (
                            <span>Chưa làm bài kiểm tra</span>
                          )}
                          {rule.exceptions && (
                            <span className="text-[#e5a044] font-medium">• Có lưu ý ngoại lệ</span>
                          )}
                        </div>

                        <button
                          onClick={() => toggleExpandCard(rule.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#8e837a] hover:text-[#f5ede4] transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Thu gọn' : 'Xem giải thích chi tiết'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Deep Details */}
                    {isExpanded && (
                      <div className="px-3.5 sm:px-4.5 pb-4 pt-2 border-t border-[#251f1a] bg-[#14100e] space-y-3">
                        {/* Mechanics & Detailed Explanation */}
                        {rule.detail && (
                          <div className="p-3 rounded-xl bg-[#1a1512] border border-[#2e2621]">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e5a044] mb-1.5 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#e5a044]" />
                              Cơ chế ngữ pháp & Giải thích chi tiết:
                            </h4>
                            <div className="text-xs sm:text-sm text-[#d8cebe] leading-relaxed whitespace-pre-line">
                              {rule.detail}
                            </div>
                          </div>
                        )}

                        {/* All Examples Table if more than 4 */}
                        {rule.examples && rule.examples.length > 4 && (
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#a89d91] mb-1.5">
                              Tất cả các ví dụ mở rộng ({rule.examples.length}):
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {rule.examples.slice(4).map((ex, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-xl bg-[#14110f] border border-[#2e2621] flex items-center justify-between gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-chinese font-bold text-sm text-[#f5ede4]">
                                        {ex.chinese}
                                      </span>
                                      <span className="text-xs font-mono font-bold text-[#f05d48]">
                                        {ex.pinyin}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#8e837a] truncate">
                                      {ex.vietnamese}
                                    </p>
                                  </div>
                                  <button
                                    onClick={e => handleSpeak(ex.chinese, e)}
                                    className="p-1 rounded-lg bg-[#1f1a17] hover:bg-[#df5343] hover:text-white text-[#8e837a] transition-colors"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exceptions & Pitfalls */}
                        {rule.exceptions && (
                          <div className="p-3 rounded-xl bg-[#df5343]/10 border border-[#df5343]/30 text-xs text-[#f5ede4] flex items-start gap-2">
                            <span className="text-base shrink-0">⚠️</span>
                            <div>
                              <strong className="text-[#df5343] font-bold block mb-0.5">
                                Lưu ý quan trọng & Ngoại lệ:
                              </strong>
                              <span className="text-[#d8cebe] leading-relaxed">
                                {rule.exceptions}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bottom Tags */}
                        {rule.tags && rule.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {rule.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md bg-[#1f1a17] text-[#8e837a] text-[10px] font-mono border border-[#2e2621]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE 2: QUIZ PRACTICE MODE (KIỂM TRA HỌC NHỚ)                     */}
      {/* ========================================================================= */}
      {viewMode === 'quiz' && (
        <div className="bg-[#1a1613] border border-[#2e2621] rounded-2xl p-4 sm:p-6 shadow-xl">
          {!quizCompleted && quizQuestions.length > 0 && (
            <div>
              {/* Quiz Header Bar */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#2e2621]">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#e5a044]/15 text-[#e5a044]">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#f5ede4]">
                      Kiểm Tra Ghi Nhớ Quy Tắc
                    </h3>
                    <p className="text-[11px] text-[#8e837a]">
                      Câu {currentQuestionIndex + 1} / {quizQuestions.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-[#8e837a]">Điểm: </span>
                    <span className="text-sm font-bold font-mono text-[#5eb786]">
                      {quizScore} / {currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)}
                    </span>
                  </div>
                  <button
                    onClick={() => setViewMode('browse')}
                    className="p-1.5 rounded-lg text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#2a221d] transition-colors cursor-pointer"
                    title="Đóng bài kiểm tra"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#14110f] rounded-full overflow-hidden mb-5 border border-[#2e2621]">
                <div
                  className="h-full bg-gradient-to-r from-[#e5a044] to-[#df5343] transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`
                  }}
                />
              </div>

              {/* Rule Context Badge */}
              <div className="mb-2">
                <span className="px-2 py-0.5 rounded-md bg-[#2a221d] text-[#e5a044] text-[11px] font-bold border border-[#3d332c]">
                  Quy tắc: {quizQuestions[currentQuestionIndex].ruleTitle}
                </span>
              </div>

              {/* Question Text */}
              <h4 className="text-base sm:text-lg font-bold text-[#f5ede4] leading-relaxed mb-4">
                {quizQuestions[currentQuestionIndex].question.question}
              </h4>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5 mb-5">
                {quizQuestions[currentQuestionIndex].question.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = selectedAnswer === opt;
                  const isCorrect =
                    opt === quizQuestions[currentQuestionIndex].question.correctAnswer;

                  let optionStyle =
                    'bg-[#14110f] border-[#2e2621] text-[#f5ede4] hover:border-[#3d332c] hover:bg-[#1f1a17]';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-[#5eb786]/20 border-[#5eb786] text-white font-bold';
                    } else if (isSelected) {
                      optionStyle = 'bg-[#df5343]/20 border-[#df5343] text-white';
                    } else {
                      optionStyle = 'bg-[#14110f] border-[#2e2621] text-[#6b625b] opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-[#df5343]/15 border-[#df5343] text-white font-bold';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelectQuizOption(opt)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#2a221d] text-[#8e837a] flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isAnswerSubmitted && isCorrect && (
                        <Check className="w-4 h-4 text-[#5eb786] shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <X className="w-4 h-4 text-[#df5343] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box when submitted */}
              {isAnswerSubmitted && (
                <div className="p-3.5 rounded-xl bg-[#14110f] border border-[#2e2621] mb-5 text-xs sm:text-sm text-[#d8cebe] leading-relaxed">
                  <div className="flex items-center gap-1.5 text-[#5eb786] font-bold mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Giải thích & Quy chuẩn:</span>
                  </div>
                  {quizQuestions[currentQuestionIndex].question.explanation}
                </div>
              )}

              {/* Bottom Buttons: Submit or Next */}
              <div className="flex items-center justify-end gap-2">
                {!isAnswerSubmitted ? (
                  <button
                    disabled={!selectedAnswer}
                    onClick={handleSubmitQuizAnswer}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      selectedAnswer
                        ? 'bg-[#df5343] hover:bg-[#eb5f50] text-white shadow-md active:scale-95'
                        : 'bg-[#2a221d] text-[#6b625b] cursor-not-allowed'
                    }`}
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuizQuestion}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5eb786] hover:bg-[#4ea877] text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex + 1 < quizQuestions.length
                        ? 'Câu tiếp theo'
                        : 'Xem kết quả'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quiz Completion Screen */}
          {quizCompleted && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#df5343]/20 text-[#df5343] flex items-center justify-center mx-auto mb-3 text-3xl">
                🏆
              </div>
              <h3 className="text-xl font-black text-[#f5ede4] mb-1">Hoàn thành bài kiểm tra!</h3>
              <p className="text-xs text-[#8e837a] mb-4">
                Bạn đã trả lời đúng{' '}
                <strong className="text-[#5eb786] text-sm">
                  {quizScore} / {quizQuestions.length}
                </strong>{' '}
                câu hỏi về các quy tắc tiếng Trung.
              </p>

              <div className="inline-block p-4 rounded-2xl bg-[#14110f] border border-[#2e2621] mb-6 text-center">
                <span className="text-2xl sm:text-3xl font-black text-[#e5a044]">
                  {Math.round((quizScore / quizQuestions.length) * 100)}%
                </span>
                <p className="text-xs text-[#8e837a] mt-1">
                  {quizScore === quizQuestions.length
                    ? 'Xuất sắc! Bạn đã làm chủ hoàn toàn các quy tắc này.'
                    : quizScore >= quizQuestions.length * 0.7
                    ? 'Rất tốt! Bạn đã nắm vững phần lớn quy tắc.'
                    : 'Hãy tiếp tục ôn tập để củng cố các quy tắc này nhé!'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => startQuiz()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại bài kiểm tra</span>
                </button>
                <button
                  onClick={() => setViewMode('browse')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-[#f5ede4] border border-[#3d332c] text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Quay lại thư viện quy tắc</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VIEW MODE 3: FLASHCARDS (ÔN THẺ NHỚ CÔNG THỨC 3D)                       */}
      {/* ========================================================================= */}
      {viewMode === 'flashcards' && filteredRules.length > 0 && (
        <div className="bg-[#1a1613] border border-[#2e2621] rounded-2xl p-4 sm:p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#2e2621]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#5bb3e0]/15 text-[#5bb3e0]">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#f5ede4]">
                  Lật Thẻ Ôn Quy Tắc
                </h3>
                <p className="text-[11px] text-[#8e837a]">
                  Thẻ {flashcardIndex + 1} / {filteredRules.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setViewMode('browse')}
              className="p-1.5 rounded-lg text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#2a221d] transition-colors cursor-pointer"
              title="Đóng ôn thẻ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Flashcard Card Body */}
          {(() => {
            const rule = filteredRules[flashcardIndex];
            const categoryConfig =
              CATEGORY_TABS.find(c => c.id === rule.category) || CATEGORY_TABS[0];

            return (
              <div
                onClick={() => {
                  soundEffects.playFlip();
                  setIsFlashcardFlipped(!isFlashcardFlipped);
                }}
                className="min-h-[260px] sm:min-h-[300px] bg-[#14110f] border border-[#382f28] hover:border-[#4d4036] rounded-2xl p-5 sm:p-7 flex flex-col justify-between cursor-pointer select-none transition-all shadow-inner relative"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${categoryConfig.color}15`,
                      borderColor: `${categoryConfig.color}40`,
                      color: categoryConfig.color
                    }}
                  >
                    {categoryConfig.icon} {categoryConfig.label}
                  </span>
                  <span className="text-[11px] text-[#8e837a] flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Chạm để {isFlashcardFlipped ? 'xem mặt trước' : 'lật xem công thức'}
                  </span>
                </div>

                {/* Card Front vs Back Content */}
                <div className="py-6 text-center my-auto">
                  {!isFlashcardFlipped ? (
                    <div>
                      <h3 className="text-lg sm:text-2xl font-black text-[#f5ede4] mb-3">
                        {rule.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#8e837a] max-w-md mx-auto mb-4 leading-relaxed">
                        Bạn có nhớ công thức ghi nhớ và các ví dụ của quy tắc này không?
                      </p>
                      {rule.examples.length > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1f1a17] border border-[#2e2621]">
                          <span className="text-xs text-[#8e837a]">Ví dụ:</span>
                          <span className="font-chinese text-base font-bold text-[#f5ede4]">
                            {rule.examples[0].chinese}
                          </span>
                          <span className="text-xs text-[#6b625b]">(???)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {rule.formula && (
                        <div className="inline-block px-4 py-2 rounded-xl bg-[#2a221d] border border-[#e5a044]/40 text-[#e5a044] font-mono font-bold text-sm sm:text-base mb-3 shadow-md">
                          ⚡ {rule.formula}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-[#d8cebe] max-w-lg mx-auto mb-4 leading-relaxed whitespace-pre-line">
                        {rule.summary}
                      </p>
                      {rule.examples.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {rule.examples.slice(0, 3).map((ex, i) => (
                            <div
                              key={i}
                              className="px-2.5 py-1 rounded-lg bg-[#1f1a17] border border-[#2e2621] text-xs flex items-center gap-1.5"
                            >
                              <span className="font-chinese font-bold text-[#f5ede4]">
                                {ex.chinese}
                              </span>
                              <span className="font-mono text-[#f05d48]">{ex.pinyin}</span>
                              <span className="text-[#8e837a]">• {ex.vietnamese}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating Bar */}
                <div
                  className="flex items-center justify-between gap-2 pt-3 border-t border-[#231b17]"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleNextFlashcard(false)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#2a221d] hover:bg-[#342b25] text-xs font-semibold text-[#df5343] border border-[#3d332c] cursor-pointer"
                  >
                    Chưa nhớ vững (Ôn lại)
                  </button>
                  <button
                    onClick={() => handleNextFlashcard(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#5eb786]/20 hover:bg-[#5eb786]/30 text-xs font-bold text-[#5eb786] border border-[#5eb786]/40 cursor-pointer"
                  >
                    Đã nhớ vững (Thuộc)
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ADD / EDIT CHINESE RULE (AI AUTO-FILL POWERED)                  */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#1c1815] border border-[#352a22] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#2e2621] flex items-center justify-between shrink-0 bg-[#211b17]">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-gradient-to-br from-[#df5343] to-[#e5a044] text-white shadow-md">
                  <BookmarkCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#f5ede4] flex items-center gap-2">
                    <span>{editingRule ? 'Chỉnh Sửa Quy Tắc' : 'Thêm Quy Tắc Mới'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#df5343]/20 text-[#f05d48] border border-[#df5343]/30 font-medium">
                      AI Điền Tự Động
                    </span>
                  </h3>
                  <p className="text-xs text-[#a89c91]">
                    {editingRule
                      ? 'Cập nhật nội dung hoặc dùng AI để tối ưu lại ví dụ và giải thích.'
                      : 'Nhập chủ đề để AI tự động soạn thảo đầy đủ từ công thức, ví dụ đến phiên âm.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#28221e] transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveRule} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {/* AI Magic Fill Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#2a1a17] via-[#211816] to-[#1a1520] border border-[#df5343]/35 shadow-lg relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-gradient-to-br from-[#df5343] to-[#e5a044] text-white shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-[#f5ede4]">
                      Trợ Lý AI Tự Động Soạn Quy Tắc (Auto-Fill)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#a89c91]">
                    Tiết kiệm thời gian gõ Pinyin & dịch nghĩa
                  </span>
                </div>

                <p className="text-xs text-[#a89c91] mb-3 leading-relaxed">
                  Nhập tên quy tắc hoặc chủ đề ngữ pháp (VD: <span className="text-[#e5a044]">"Câu chữ 把"</span>, <span className="text-[#e5a044]">"Biến âm 不"</span>, <span className="text-[#e5a044]">"Phân biệt 刚 & 刚才"</span>, <span className="text-[#e5a044]">"Cách đọc giờ phút"</span>...). AI sẽ tự động phân tích và điền toàn bộ mẫu câu, Pinyin, công thức và câu hỏi kiểm tra!
                </p>

                {/* Input & Action Button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Nhập tên quy tắc hoặc chủ đề cần AI soạn (hoặc gõ ở ô Tên quy tắc)..."
                      value={aiTopicInput}
                      onChange={e => setAiTopicInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAiAutoFill();
                        }
                      }}
                      className="w-full bg-[#14110f]/90 border border-[#3d322b] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] placeholder-[#73685f] outline-none transition-all"
                    />
                    {aiTopicInput && (
                      <button
                        type="button"
                        onClick={() => setAiTopicInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73685f] hover:text-[#f5ede4] text-xs p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAiAutoFill()}
                    disabled={isAiGenerating}
                    className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-white shadow-md transition-all cursor-pointer shrink-0 ${
                      isAiGenerating
                        ? 'bg-[#df5343]/60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#df5343] to-[#e5a044] hover:brightness-110 active:scale-95'
                    }`}
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Đang Soạn...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>✨ AI Điền Tự Động</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#73685f] mr-1">Chủ đề gợi ý:</span>
                  {[
                    { label: '🗣️ Biến điệu chữ 不', query: 'Biến điệu của chữ 不' },
                    { label: '📐 Cấu trúc câu chữ 把', query: 'Cấu trúc câu chữ 把' },
                    { label: '📖 Phân biệt 刚 và 刚才', query: 'Phân biệt cặp từ 刚 và 刚才' },
                    { label: '⏰ Cách đọc Giờ & Phút', query: 'Quy tắc đọc Giờ và Phút trong tiếng Trung' },
                    { label: '⚖️ Câu so sánh chữ 比', query: 'Cấu trúc câu so sánh hơn với chữ 比' },
                    { label: '🗣️ Biến điệu chữ 一', query: 'Quy tắc biến điệu của chữ 一' }
                  ].map((pill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAiGenerating}
                      onClick={() => {
                        setAiTopicInput(pill.query);
                        handleAiAutoFill(pill.query);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#191512] hover:bg-[#2e241e] border border-[#352a22] hover:border-[#df5343]/50 text-[11px] text-[#d8cebe] hover:text-[#f5ede4] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>

                {/* Success Banner */}
                {aiSuccessMessage && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="flex-1 font-medium">{aiSuccessMessage}</span>
                    <button
                      type="button"
                      onClick={() => setAiSuccessMessage(null)}
                      className="text-emerald-400/70 hover:text-emerald-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {aiErrorMessage && (
                  <div className="mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span className="flex-1 font-medium">{aiErrorMessage}</span>
                    <button
                      type="button"
                      onClick={() => setAiErrorMessage(null)}
                      className="text-red-400/70 hover:text-red-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                    Tên quy tắc <span className="text-[#df5343]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cấu trúc câu chữ 把 (Bǎ), Biến điệu hai thanh 3 liên tiếp..."
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                    Phân loại danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as RuleCategory)}
                    className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all cursor-pointer"
                  >
                    <option value="pronunciation">🗣️ Phát âm & Biến điệu</option>
                    <option value="time_numbers">⏰ Giờ phút & Số đếm</option>
                    <option value="grammar">📐 Ngữ pháp câu</option>
                    <option value="vocabulary">📖 Cặp từ & Lượng từ</option>
                    <option value="writing">✍️ Quy tắc nét viết</option>
                    <option value="other">💡 Khác</option>
                  </select>
                </div>
              </div>

              {/* Formula Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#d8cebe]">
                    Công thức / Sơ đồ ghi nhớ nhanh
                  </label>
                  <span className="text-[11px] text-[#a89c91]">
                    Hiển thị nổi bật đầu thẻ học
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="VD: Thanh 3 + Thanh 3 ➔ Thanh 2 + Thanh 3 hoặc Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác"
                  value={formFormula}
                  onChange={e => setFormFormula(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#e5a044] focus:ring-1 focus:ring-[#e5a044]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-[#e5a044] outline-none transition-all"
                />
              </div>

              {/* Summary Input */}
              <div>
                <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                  Tóm tắt cốt lõi <span className="text-[#df5343]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Tóm tắt ngắn gọn 1-2 câu để nhớ nhanh khi xem..."
                  value={formSummary}
                  onChange={e => setFormSummary(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all"
                />
              </div>

              {/* Detail Explanation */}
              <div>
                <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                  Giải thích chi tiết & Cơ chế
                </label>
                <textarea
                  rows={3}
                  placeholder="Giải thích đầy đủ các trường hợp, cách biến âm, cấu trúc..."
                  value={formDetail}
                  onChange={e => setFormDetail(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Examples Builder (Full-width clean cards) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#d8cebe]">
                      Ví dụ minh hoạ ({formExamples.length})
                    </label>
                    <span className="text-[11px] text-[#8e837a]">
                      (Kèm Pinyin và dịch nghĩa chuẩn)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormExamples(prev => [
                        ...prev,
                        { chinese: '', pinyin: '', vietnamese: '', note: '' }
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#df5343]/15 hover:bg-[#df5343]/25 text-xs text-[#df5343] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm ví dụ</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formExamples.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="p-3.5 rounded-xl bg-[#14110f] border border-[#2e2621] hover:border-[#3d322b] transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#221c18]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#251e1a] text-[#a89c91] border border-[#352a22]">
                            Ví dụ #{exIdx + 1}
                          </span>
                          {ex.chinese && (
                            <button
                              type="button"
                              onClick={() => handleSpeak(ex.chinese)}
                              className="text-[11px] text-[#e5a044] hover:text-[#f5ede4] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Nghe thử phát âm ví dụ này"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Nghe phát âm</span>
                            </button>
                          )}
                        </div>

                        {formExamples.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormExamples(prev => prev.filter((_, i) => i !== exIdx))
                            }
                            className="text-[#8e837a] hover:text-[#df5343] p-1 rounded-md hover:bg-[#251e1a] transition-colors cursor-pointer"
                            title="Xoá ví dụ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Row 1: Hanzi & Pinyin with ample room */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-[#a89c91] mb-1 font-medium">
                            Chữ Hán <span className="text-[#df5343]">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="VD: 你好 / 请把门关上"
                            value={ex.chinese}
                            onChange={e => {
                              const updated = [...formExamples];
                              updated[exIdx].chinese = e.target.value;
                              setFormExamples(updated);
                            }}
                            className="w-full bg-[#1c1815] border border-[#2e2621] focus:border-[#df5343] rounded-lg px-3 py-1.5 text-sm text-[#f5ede4] outline-none font-chinese transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#a89c91] mb-1 font-medium">
                            Phiên âm Pinyin
                          </label>
                          <input
                            type="text"
                            placeholder="VD: ní hǎo / Qǐng bǎ mén guān shàng"
                            value={ex.pinyin}
                            onChange={e => {
                              const updated = [...formExamples];
                              updated[exIdx].pinyin = e.target.value;
                              setFormExamples(updated);
                            }}
                            className="w-full bg-[#1c1815] border border-[#2e2621] focus:border-[#df5343] rounded-lg px-3 py-1.5 text-xs text-[#f05d48] outline-none font-mono transition-all"
                          />
                        </div>
                      </div>

                      {/* Row 2: Vietnamese Meaning & Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] text-[#a89c91] mb-1 font-medium">
                            Nghĩa tiếng Việt
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Xin chào / Làm ơn đóng cửa lại"
                            value={ex.vietnamese}
                            onChange={e => {
                              const updated = [...formExamples];
                              updated[exIdx].vietnamese = e.target.value;
                              setFormExamples(updated);
                            }}
                            className="w-full bg-[#1c1815] border border-[#2e2621] focus:border-[#df5343] rounded-lg px-3 py-1.5 text-xs text-[#f5ede4] outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#a89c91] mb-1 font-medium">
                            Ghi chú áp dụng quy tắc
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Biến âm 3+3 thành 2+3..."
                            value={ex.note || ''}
                            onChange={e => {
                              const updated = [...formExamples];
                              updated[exIdx].note = e.target.value;
                              setFormExamples(updated);
                            }}
                            className="w-full bg-[#1c1815] border border-[#2e2621] focus:border-[#df5343] rounded-lg px-3 py-1.5 text-xs text-[#8e837a] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exceptions Input */}
              <div>
                <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                  Ngoại lệ hoặc Lưu ý cần tránh
                </label>
                <input
                  type="text"
                  placeholder="VD: Không áp dụng khi viết phiên âm sách báo, hoặc phủ định phải đứng trước 把..."
                  value={formExceptions}
                  onChange={e => setFormExceptions(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-bold text-[#d8cebe] mb-1.5">
                  Từ khoá / Tags (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="VD: thanh 3, biến điệu, phát âm, câu chữ 把..."
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="w-full bg-[#14110f] border border-[#2e2621] focus:border-[#df5343] focus:ring-1 focus:ring-[#df5343]/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#f5ede4] outline-none transition-all"
                />
              </div>

              {/* Practice Questions Preview */}
              {formPracticeQuestions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#171412] border border-[#2e2621] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#d8cebe] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#5bb3e0]" />
                      Câu hỏi kiểm tra kèm theo ({formPracticeQuestions.length})
                    </span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ Đã tích hợp vào chế độ Luyện Thi
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {formPracticeQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="text-xs bg-[#110e0c] p-2.5 rounded-lg border border-[#241c18]">
                        <p className="font-semibold text-[#f5ede4] mb-1">
                          Q{idx + 1}: {q.question}
                        </p>
                        <p className="text-[11px] text-emerald-300">
                          ✓ Đáp án: {q.correctAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticky Footer Actions */}
              <div className="pt-4 border-t border-[#2e2621] flex items-center justify-between gap-3 sticky bottom-0 bg-[#1c1815] -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#14110f] hover:bg-[#251e1a] text-xs font-semibold text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] transition-all cursor-pointer"
                >
                  Huỷ
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAiAutoFill()}
                    disabled={isAiGenerating}
                    className="px-3.5 py-2.5 rounded-xl bg-[#28201a] hover:bg-[#352a22] text-[#e5a044] border border-[#423226] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Yêu cầu AI điền lại toàn bộ thông tin"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">AI Soạn Lại</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#df5343] to-[#eb5f50] hover:brightness-110 text-xs sm:text-sm font-bold text-white shadow-lg cursor-pointer active:scale-95 transition-all"
                  >
                    {editingRule ? 'Lưu thay đổi' : 'Tạo quy tắc mới'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChineseRulesView;
