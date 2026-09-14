import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Word, QuizQuestion, QuizQuestionType } from '../types';
import { tts, useTtsSpeaking } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Zap,
  Volume2,
  Award,
  RefreshCw,
  Flame,
  Star,
  ArrowRight,
  BookOpen,
  Check
} from 'lucide-react';

interface QuizTypeOption {
  id: QuizQuestionType;
  label: string;
  subLabel: string;
  icon: string;
}

const QUIZ_TYPE_OPTIONS: QuizTypeOption[] = [
  {
    id: 'hanzi-to-vi',
    label: 'Chữ ➔ Nghĩa',
    subLabel: 'Nhìn chữ Hán chọn nghĩa tiếng Việt',
    icon: '🔤'
  },
  {
    id: 'vi-to-hanzi',
    label: 'Nghĩa ➔ Chữ',
    subLabel: 'Nhìn nghĩa tiếng Việt chọn chữ Hán',
    icon: '📝'
  },
  {
    id: 'audio-to-hanzi',
    label: 'Nghe ➔ Chữ',
    subLabel: 'Nghe phát âm chọn chữ Hán đúng',
    icon: '🔊'
  },
  {
    id: 'hanzi-to-pinyin',
    label: 'Chữ ➔ Pinyin',
    subLabel: 'Nhìn chữ Hán chọn phiên âm Pinyin',
    icon: '✨'
  }
];

export const QuickQuiz: React.FC = () => {
  const { words, unmasteredWordsCount, masteredWordsCount, starredWordsCount, hsk1WordsCount, customWordsCount, toggleStar, recordReview, settings } = useApp();

  // Quiz Config
  const [filterMode, setFilterMode] = useState<'unmastered' | 'mastered' | 'starred' | 'all'>('unmastered');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'hsk1' | 'custom'>('all');
  const [selectedTypes, setSelectedTypes] = useState<QuizQuestionType[]>(() => {
    try {
      const saved = localStorage.getItem('zhongwen_quiz_selected_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((t: any) =>
            ['hanzi-to-vi', 'vi-to-hanzi', 'audio-to-hanzi', 'hanzi-to-pinyin'].includes(t)
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch {
      // ignore
    }
    return ['hanzi-to-vi', 'vi-to-hanzi', 'audio-to-hanzi', 'hanzi-to-pinyin'];
  });
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync selected question types to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zhongwen_quiz_selected_types', JSON.stringify(selectedTypes));
    } catch {
      // ignore
    }
  }, [selectedTypes]);

  // Dynamic scoped word list
  const scopedWords = useMemo(() => {
    if (scopeFilter === 'hsk1') {
      return words.filter(w => w.source === 'hsk1' || w.lesson?.includes('HSK 1'));
    }
    if (scopeFilter === 'custom') {
      return words.filter(w => w.source === 'custom' || w.source === 'ai' || (!w.lesson?.includes('HSK 1') && w.source !== 'hsk1'));
    }
    return words;
  }, [words, scopeFilter]);

  const scopedUnmasteredCount = useMemo(() => scopedWords.filter(w => !w.isMastered).length, [scopedWords]);
  const scopedMasteredCount = useMemo(() => scopedWords.filter(w => w.isMastered).length, [scopedWords]);
  const scopedStarredCount = useMemo(() => scopedWords.filter(w => w.isStarred).length, [scopedWords]);

  const handleToggleType = (typeId: QuizQuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        if (prev.length <= 1) {
          return prev; // Giữ tối thiểu 1 loại bài kiểm tra
        }
        return prev.filter(t => t !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
    soundEffects.playClick();
  };

  const handleSelectAllTypes = () => {
    setSelectedTypes(['hanzi-to-vi', 'vi-to-hanzi', 'audio-to-hanzi', 'hanzi-to-pinyin']);
    soundEffects.playClick();
  };

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [wrongQuestions, setWrongQuestions] = useState<QuizQuestion[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Generate Questions Pool
  const generateQuestions = (): QuizQuestion[] => {
    let pool: Word[] = [...words];

    if (scopeFilter === 'hsk1') {
      pool = pool.filter(w => w.source === 'hsk1' || w.lesson?.includes('HSK 1'));
    } else if (scopeFilter === 'custom') {
      pool = pool.filter(w => w.source === 'custom' || w.source === 'ai' || (!w.lesson?.includes('HSK 1') && w.source !== 'hsk1'));
    }

    if (filterMode === 'unmastered') {
      pool = pool.filter(w => !w.isMastered);
    } else if (filterMode === 'mastered') {
      pool = pool.filter(w => w.isMastered);
    } else if (filterMode === 'starred') {
      pool = pool.filter(w => w.isStarred);
    }

    if (pool.length === 0) {
      pool = [...words];
    }

    const poolCopy = [...pool];
    for (let i = poolCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
    }
    const shuffledWords = poolCopy.slice(0, questionCount);
    const allWords = [...words];

    const activeTypes = selectedTypes.length > 0
      ? selectedTypes
      : (['hanzi-to-vi', 'vi-to-hanzi', 'audio-to-hanzi', 'hanzi-to-pinyin'] as QuizQuestionType[]);

    // Tạo danh sách câu hỏi phân bổ cân bằng và ngẫu nhiên theo các dạng bài đã chọn
    const typeSequence: QuizQuestionType[] = [];
    while (typeSequence.length < shuffledWords.length) {
      const batch = [...activeTypes];
      for (let i = batch.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [batch[i], batch[j]] = [batch[j], batch[i]];
      }
      typeSequence.push(...batch);
    }

    return shuffledWords.map((targetWord, idx) => {
      const qType = typeSequence[idx] || activeTypes[0];

      let question = '';
      let correctAnswer = '';
      let audioText: string | undefined = undefined;

      if (qType === 'hanzi-to-vi') {
        question = targetWord.hanzi;
        correctAnswer = targetWord.vietnamese;
        audioText = targetWord.hanzi;
      } else if (qType === 'vi-to-hanzi') {
        question = targetWord.vietnamese;
        correctAnswer = targetWord.hanzi;
      } else if (qType === 'audio-to-hanzi') {
        question = 'Nghe âm thanh và chọn chữ Hán đúng';
        correctAnswer = targetWord.hanzi;
        audioText = targetWord.hanzi;
      } else {
        question = targetWord.hanzi;
        correctAnswer = targetWord.pinyin;
        audioText = targetWord.hanzi;
      }

      // Đảm bảo 4 đáp án luôn khác biệt hoàn toàn (không bị trùng đáp án gây bối rối)
      const seenAnswers = new Set<string>([correctAnswer.trim()]);
      const wrongOpts: string[] = [];

      // Lấy ngẫu nhiên các từ làm đáp án nhiễu
      const candidateDistractors = allWords.filter(w => w.id !== targetWord.id);
      for (let i = candidateDistractors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidateDistractors[i], candidateDistractors[j]] = [candidateDistractors[j], candidateDistractors[i]];
      }

      for (const w of candidateDistractors) {
        let optVal = '';
        if (qType === 'hanzi-to-vi') optVal = w.vietnamese?.trim();
        else if (qType === 'vi-to-hanzi' || qType === 'audio-to-hanzi') optVal = w.hanzi?.trim();
        else optVal = w.pinyin?.trim();

        if (optVal && !seenAnswers.has(optVal)) {
          seenAnswers.add(optVal);
          wrongOpts.push(optVal);
          if (wrongOpts.length >= 3) break;
        }
      }

      const options = [correctAnswer, ...wrongOpts];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        id: `q-${idx}-${Date.now()}`,
        word: targetWord,
        type: qType,
        question,
        audioText,
        correctAnswer,
        options,
        explanation: `${targetWord.hanzi} [${targetWord.pinyin}] : ${targetWord.vietnamese}`
      };
    });
  };

  const startQuiz = () => {
    const qList = generateQuestions();
    if (qList.length === 0) return;

    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setWrongQuestions([]);
    setIsFinished(false);
    setIsPlaying(true);
    soundEffects.playClick();
  };

  const { isSpeaking } = useTtsSpeaking();

  const handlePlayAudio = (text?: string, force: boolean = false) => {
    if (!text) return;
    if ((isPlayingAudio || isSpeaking) && !force) return;
    setIsPlayingAudio(true);
    tts.speak(text, settings.voiceRate, settings.voicePitch, () => {
      setIsPlayingAudio(false);
    }, force);
  };

  const currentQ = questions[currentIndex];

  useEffect(() => {
    // Dừng âm thanh đang phát khi chuyển câu hỏi
    tts.stop();
    setIsPlayingAudio(false);

    // Chỉ tự động phát âm đối với dạng bài nghe 'audio-to-hanzi'.
    // Với các bài nhìn chữ (hanzi-to-vi, hanzi-to-pinyin): KHÔNG tự động đọc, người dùng bấm vào biểu tượng loa mới phát âm.
    if (isPlaying && currentQ && !isFinished) {
      if (currentQ.type === 'audio-to-hanzi' && currentQ.audioText) {
        handlePlayAudio(currentQ.audioText, true);
      }
    }

    return () => {
      tts.stop();
    };
  }, [currentIndex, isPlaying, isFinished]);

  const handleSelectOption = (option: string) => {
    if (isAnswerChecked || !currentQ) return;
    setSelectedOption(option);
    setIsAnswerChecked(true);

    const isCorrect = option === currentQ.correctAnswer;
    recordReview(currentQ.word.id, isCorrect);

    if (isCorrect) {
      soundEffects.playSuccess();
      setScore(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
    } else {
      soundEffects.playWrong();
      setStreak(0);
      setWrongQuestions(prev => [...prev, currentQ]);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      soundEffects.playClick();
    } else {
      setIsFinished(true);
      soundEffects.playLevelUp();
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleStarWrongWords = () => {
    wrongQuestions.forEach(q => {
      if (!q.word.isStarred) {
        toggleStar(q.word.id);
      }
    });
    soundEffects.playSuccess();
  };

  // ================= RENDER: FINISHED STATE =================
  if (isPlaying && isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="w-full max-w-xl mx-auto px-4 py-8">
        <div className="p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#33261a] border border-[#553c24] flex items-center justify-center text-[#e5a044]">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#f5ede4] mb-1">Hoàn thành bài kiểm tra!</h2>
            <p className="text-xs text-[#8e837a]">
              Bạn đã hoàn thành {questions.length} câu hỏi trắc nghiệm.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#161311] border border-[#2e2621]">
              <span className="block text-xl font-black text-[#5eb786]">{score}/{questions.length}</span>
              <span className="text-[11px] text-[#8e837a]">Điểm số</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#161311] border border-[#2e2621]">
              <span className="block text-xl font-black text-[#df5343]">{percentage}%</span>
              <span className="text-[11px] text-[#8e837a]">Chính xác</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#161311] border border-[#2e2621]">
              <span className="block text-xl font-black text-[#e5a044] flex items-center justify-center gap-1">
                {maxStreak} <Flame className="w-3.5 h-3.5 fill-[#e5a044]" />
              </span>
              <span className="text-[11px] text-[#8e837a]">Combo</span>
            </div>
          </div>

          {wrongQuestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#2b1917] border border-[#4d2522] text-left space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#df5343]">
                  Từ cần ôn lại ({wrongQuestions.length}):
                </span>
                <button
                  onClick={handleStarWrongWords}
                  className="text-[11px] text-[#e5a044] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Star className="w-3 h-3 fill-[#e5a044]" />
                  <span>Gắn sao tất cả</span>
                </button>
              </div>

              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {wrongQuestions.map((wq, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-[#d8cebe] py-1 border-b border-[#3a2220]">
                    <span className="font-chinese text-base text-white">{wq.word.hanzi}</span>
                    <span className="text-[#f05d48] font-bold">{wq.word.pinyin}</span>
                    <span className="text-[#8e837a] truncate max-w-[150px]">{wq.word.vietnamese}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
            <button
              onClick={startQuiz}
              className="px-6 py-2.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Làm bài khác</span>
            </button>
            <button
              onClick={() => setIsPlaying(false)}
              className="px-6 py-2.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] font-bold text-xs border border-[#382f29]"
            >
              Quay về
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: ACTIVE QUIZ PLAYING =================
  if (isPlaying && currentQ) {
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="w-full max-w-xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setIsPlaying(false)}
            className="text-xs text-[#8e837a] hover:text-white px-3 py-1.5 rounded-xl bg-[#1f1a17] border border-[#2e2621]"
          >
            ✕ Thoát
          </button>

          <div className="flex-1">
            <div className="w-full h-1.5 rounded-full bg-[#27211d] overflow-hidden">
              <div
                className="h-full bg-[#df5343] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {streak > 1 && (
              <span className="text-xs font-bold text-[#e5a044] flex items-center gap-1">
                🔥 x{streak}
              </span>
            )}
            <span className="text-xs font-mono font-bold text-[#8e837a]">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl text-center space-y-3">
          <div className="text-[11px] text-[#8e837a] font-semibold uppercase tracking-wider">
            {currentQ.type === 'hanzi-to-vi' && 'Chọn nghĩa tiếng Việt của chữ:'}
            {currentQ.type === 'vi-to-hanzi' && 'Chọn chữ Hán tương ứng:'}
            {currentQ.type === 'audio-to-hanzi' && 'Nghe âm thanh & chọn chữ Hán đúng:'}
            {currentQ.type === 'hanzi-to-pinyin' && 'Chọn Pinyin chuẩn của chữ:'}
          </div>

          <div className="py-2">
            {currentQ.type === 'audio-to-hanzi' ? (
              <button
                disabled={isPlayingAudio || isSpeaking}
                onClick={() => handlePlayAudio(currentQ.audioText)}
                className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center transition-all ${
                  (isPlayingAudio || isSpeaking)
                    ? 'bg-[#33261a] border-[#553c24] text-[#e5a044] scale-105 shadow-lg shadow-[#e5a044]/20 cursor-not-allowed'
                    : 'bg-[#27211d] hover:bg-[#322a25] border-[#382f29] text-[#df5343] active:scale-95 cursor-pointer'
                }`}
                title={(isPlayingAudio || isSpeaking) ? 'Đang phát âm...' : 'Bấm để nghe âm thanh'}
              >
                <Volume2 className={`w-8 h-8 ${(isPlayingAudio || isSpeaking) ? 'animate-pulse' : ''}`} />
              </button>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className={`font-bold text-[#f5ede4] ${
                  currentQ.type === 'vi-to-hanzi' ? 'text-2xl' : 'font-chinese text-6xl sm:text-7xl font-normal'
                }`}>
                  {currentQ.question}
                </span>
                {currentQ.audioText && (
                  <button
                    disabled={isPlayingAudio || isSpeaking}
                    onClick={() => handlePlayAudio(currentQ.audioText)}
                    className={`p-2 rounded-xl border transition-all ${
                      (isPlayingAudio || isSpeaking)
                        ? 'bg-[#33261a] border-[#553c24] text-[#e5a044] scale-110 shadow-md shadow-[#e5a044]/20 cursor-not-allowed'
                        : 'bg-[#27211d] hover:bg-[#322a25] text-[#df5343] border-[#382f29] active:scale-95 cursor-pointer'
                    }`}
                    title={(isPlayingAudio || isSpeaking) ? 'Đang phát âm...' : 'Nghe phát âm chuẩn'}
                  >
                    <Volume2 className={`w-4 h-4 ${(isPlayingAudio || isSpeaking) ? 'animate-pulse' : ''}`} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentQ.options.map((option, i) => {
            let btnStyle = 'bg-[#1f1a17] hover:bg-[#27211d] border-[#2e2621] text-[#d8cebe]';
            if (isAnswerChecked) {
              if (option === currentQ.correctAnswer) {
                btnStyle = 'bg-[#1e2a22] border-[#2d4734] text-[#62ba89] font-bold';
              } else if (option === selectedOption) {
                btnStyle = 'bg-[#2b1917] border-[#4d2522] text-[#df5343] font-bold';
              } else {
                btnStyle = 'opacity-30 bg-[#161311] border-[#221d1a] text-[#554b42]';
              }
            }

            const isHanziOption = currentQ.type === 'vi-to-hanzi' || currentQ.type === 'audio-to-hanzi';

            return (
              <button
                key={i}
                onClick={() => handleSelectOption(option)}
                disabled={isAnswerChecked}
                className={`p-4 rounded-2xl border text-center transition-all active:scale-98 flex items-center justify-center min-h-[58px] ${btnStyle}`}
              >
                <span className={`${isHanziOption ? 'font-chinese text-2xl' : 'text-xs sm:text-sm font-semibold'}`}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Feedback & Next Button */}
        {isAnswerChecked && (
          <div className="p-3.5 rounded-2xl bg-[#191512] border border-[#2e2621] flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-[#8e837a] block text-[10px]">Đáp án:</span>
              <span className="text-[#f5ede4] font-semibold">{currentQ.explanation}</span>
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md flex items-center gap-1.5 shrink-0"
            >
              <span>{currentIndex + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER: QUIZ SETUP VIEW (Exact Match to Image 1 Card 2) =================
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-1 space-y-4">
      <div className="p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#e5a044] mb-0.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            KIỂM TRA NHANH TRẮC NGHIỆM
          </h2>
          <p className="text-xs text-[#8e837a]">
            Trắc nghiệm — chọn nghĩa đúng, chữ và đáp án xáo trộn ngẫu nhiên.
          </p>
        </div>

        {/* Scope Filter */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8e837a]">
            Nguồn từ kiểm tra:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setScopeFilter('all')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                scopeFilter === 'all'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              Tất cả ({words.length})
            </button>

            <button
              onClick={() => setScopeFilter('hsk1')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                scopeFilter === 'hsk1'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              Gốc HSK 1 ({hsk1WordsCount})
            </button>

            <button
              onClick={() => setScopeFilter('custom')}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                scopeFilter === 'custom'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              Từ tự thêm ({customWordsCount})
            </button>
          </div>
        </div>

        {/* Filter Pills (Chưa thuộc / Đã thuộc / Khó / Tất cả) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8e837a]">
            Trạng thái chữ:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => { setFilterMode('unmastered'); soundEffects.playClick(); }}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterMode === 'unmastered'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe]'
              }`}
            >
              Chưa thuộc ({scopedUnmasteredCount})
            </button>

            <button
              onClick={() => { setFilterMode('mastered'); soundEffects.playClick(); }}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterMode === 'mastered'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe]'
              }`}
            >
              Đã thuộc ({scopedMasteredCount})
            </button>

            <button
              onClick={() => { setFilterMode('starred'); soundEffects.playClick(); }}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                filterMode === 'starred'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Khó ({scopedStarredCount})</span>
            </button>

            <button
              onClick={() => { setFilterMode('all'); soundEffects.playClick(); }}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe]'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Quiz Question Types Multi-Select Option */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#8e837a]">
              Dạng bài kiểm tra:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8e837a]">
                Đã chọn <span className="text-[#e5a044] font-semibold">{selectedTypes.length}/4</span>
              </span>
              {selectedTypes.length < QUIZ_TYPE_OPTIONS.length ? (
                <button
                  type="button"
                  onClick={handleSelectAllTypes}
                  className="text-[11px] text-[#e5a044] hover:underline font-semibold cursor-pointer"
                >
                  Chọn tất cả
                </button>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUIZ_TYPE_OPTIONS.map(opt => {
              const isSelected = selectedTypes.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleType(opt.id)}
                  title={opt.subLabel}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#df5343] text-white border-[#df5343] shadow-sm'
                      : 'bg-[#27211d] text-[#8e837a] border-[#382f29] hover:text-[#d8cebe] hover:bg-[#322a25]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-white/25 text-white' : 'border border-[#55473e]'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8e837a]">
            Số lượng câu hỏi:
          </label>
          <div className="flex items-center gap-2">
            {[5, 10, 20].map(cnt => (
              <button
                key={cnt}
                onClick={() => setQuestionCount(cnt)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  questionCount === cnt
                    ? 'bg-[#df5343] text-white border-[#df5343]'
                    : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
                }`}
              >
                {cnt} câu
              </button>
            ))}
          </div>
        </div>

        {/* Start Quiz Action Button */}
        <div className="pt-2">
          <button
            onClick={startQuiz}
            className="w-full py-3.5 rounded-2xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>💖 Kiểm tra {questionCount} từ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
