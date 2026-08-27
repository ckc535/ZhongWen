import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Word, QuizQuestion } from '../types';
import { tts } from '../services/ttsService';
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
  BookOpen
} from 'lucide-react';

export const QuickQuiz: React.FC = () => {
  const { words, dueWordsCount, starredWordsCount, hsk1WordsCount, customWordsCount, toggleStar, recordReview, settings } = useApp();

  // Quiz Config
  const [filterMode, setFilterMode] = useState<'due' | 'starred' | 'all'>('due');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'hsk1' | 'custom'>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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

  // Generate Questions Pool
  const generateQuestions = (): QuizQuestion[] => {
    let pool: Word[] = [...words];

    if (scopeFilter === 'hsk1') {
      pool = pool.filter(w => w.source === 'hsk1' || w.lesson?.includes('HSK 1'));
    } else if (scopeFilter === 'custom') {
      pool = pool.filter(w => w.source === 'custom' || w.source === 'ai' || (!w.lesson?.includes('HSK 1') && w.source !== 'hsk1'));
    }

    if (filterMode === 'due') {
      const now = Date.now();
      pool = pool.filter(w => {
        if (!w.lastReviewed) return true;
        const boxDays = [0, 1, 2, 4, 7, 14][w.box] || 1;
        return now - w.lastReviewed >= boxDays * 24 * 60 * 60 * 1000;
      });
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

    return shuffledWords.map((targetWord, idx) => {
      const types: Array<'hanzi-to-vi' | 'vi-to-hanzi' | 'audio-to-hanzi' | 'hanzi-to-pinyin'> = [
        'hanzi-to-vi',
        'vi-to-hanzi',
        'audio-to-hanzi',
        'hanzi-to-pinyin'
      ];
      const qType = types[Math.floor(Math.random() * types.length)];

      let question = '';
      let correctAnswer = '';
      let audioText: string | undefined = undefined;

      const distractorsPool = allWords.filter(w => w.id !== targetWord.id).sort(() => Math.random() - 0.5);

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

      const wrongOpts = distractorsPool.slice(0, 3).map(w => {
        if (qType === 'hanzi-to-vi') return w.vietnamese;
        if (qType === 'vi-to-hanzi' || qType === 'audio-to-hanzi') return w.hanzi;
        return w.pinyin;
      });

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

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (isPlaying && currentQ?.audioText && !isFinished) {
      tts.speak(currentQ.audioText, settings.voiceRate, settings.voicePitch);
    }
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
                onClick={() => currentQ.audioText && tts.speak(currentQ.audioText, settings.voiceRate, settings.voicePitch)}
                className="w-20 h-20 mx-auto rounded-3xl bg-[#27211d] hover:bg-[#322a25] border border-[#382f29] flex items-center justify-center text-[#df5343] transition-transform active:scale-95"
              >
                <Volume2 className="w-8 h-8" />
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
                    onClick={() => currentQ.audioText && tts.speak(currentQ.audioText, settings.voiceRate, settings.voicePitch)}
                    className="p-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#df5343] border border-[#382f29]"
                    title="Nghe lại"
                  >
                    <Volume2 className="w-4 h-4" />
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

        {/* Filter Pills (Chưa thuộc / Khó / Tất cả) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#8e837a]">
            Trạng thái chữ:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilterMode('due')}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                filterMode === 'due'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              Chưa thuộc
            </button>

            <button
              onClick={() => setFilterMode('starred')}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 ${
                filterMode === 'starred'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Khó ({starredWordsCount})</span>
            </button>

            <button
              onClick={() => setFilterMode('all')}
              className={`py-2.5 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                filterMode === 'all'
                  ? 'bg-[#df5343] text-white border-[#df5343]'
                  : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
              }`}
            >
              Tất cả
            </button>
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
