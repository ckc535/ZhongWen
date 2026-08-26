import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HSK1_ALL_LESSONS } from '../../server/hsk1StarterData.js';
import type { HskLessonPackage } from '../types/index';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Plus,
  Check,
  X,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface HskLessonImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HskLessonImporterModal: React.FC<HskLessonImporterModalProps> = ({
  isOpen,
  onClose
}) => {
  const { words, addBatchWords } = useApp();
  const [loadingLessonNum, setLoadingLessonNum] = useState<number | null>(null);

  if (!isOpen) return null;

  // Set of hanzis already in database
  const existingHanzis = new Set(words.map(w => w.hanzi));

  const handleImportLesson = async (lesson: HskLessonPackage) => {
    setLoadingLessonNum(lesson.lessonNumber);

    try {
      const wordsToImport = lesson.words.filter(w => !existingHanzis.has(w.hanzi));
      if (wordsToImport.length > 0) {
        await addBatchWords(
          wordsToImport.map(w => ({
            ...w,
            box: 1,
            source: 'hsk1'
          }))
        );
        soundEffects.playLevelUp();
        confetti({ particleCount: 60, spread: 60 });
      } else {
        soundEffects.playClick();
      }
    } finally {
      setLoadingLessonNum(null);
    }
  };

  const handleImportAllRemaining = async () => {
    const allRemaining = HSK1_ALL_LESSONS.flatMap(l => l.words).filter(w => !existingHanzis.has(w.hanzi));
    if (allRemaining.length > 0) {
      await addBatchWords(
        allRemaining.map(w => ({
          ...w,
          box: 1,
          source: 'hsk1'
        }))
      );
      soundEffects.playLevelUp();
      confetti({ particleCount: 100, spread: 70 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#df5343] flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f5ede4]">
                Nạp Từ Vựng Theo Bài Học HSK 1
              </h2>
              <p className="text-xs text-[#8e837a]">
                Chọn các bài tiếp theo (Bài 4, 5, 6, 7, 8...) để nạp vào kho từ dùng chung
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#27211d] text-[#8e837a] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action: Import all */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#161311] border border-[#2e2621]">
          <div>
            <span className="text-xs font-bold text-[#f5ede4] block">
              Trọn bộ Giáo trình Chuẩn New HSK 1
            </span>
            <span className="text-[11px] text-[#8e837a]">
              Tổng cộng 8 bài học với hơn 80 từ vựng cốt lõi
            </span>
          </div>

          <button
            onClick={handleImportAllRemaining}
            className="px-3.5 py-1.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Nạp toàn bộ các bài</span>
          </button>
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {HSK1_ALL_LESSONS.map((lesson) => {
            const totalInLesson = lesson.words.length;
            const existingCount = lesson.words.filter(w => existingHanzis.has(w.hanzi)).length;
            const isFullyImported = existingCount === totalInLesson;

            return (
              <div
                key={lesson.lessonNumber}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isFullyImported
                    ? 'bg-[#191512] border-[#2e2621] opacity-90'
                    : 'bg-[#221c18] border-[#382f29] hover:border-[#df5343]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#f5ede4]">
                      {lesson.title}
                    </span>
                    <span className="text-xs font-bold text-[#f05d48] font-chinese">
                      {lesson.hanziTitle}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161311] text-[#8e837a] border border-[#2e2621]">
                      {existingCount}/{totalInLesson} từ
                    </span>
                  </div>

                  <p className="text-[11px] text-[#8e837a] mt-0.5 truncate">
                    {lesson.description}
                  </p>

                  {/* Character preview tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {lesson.words.map((w) => {
                      const hasWord = existingHanzis.has(w.hanzi);
                      return (
                        <span
                          key={w.id}
                          className={`text-[11px] px-1.5 py-0.5 rounded-md font-chinese ${
                            hasWord
                              ? 'bg-[#1a261d] text-[#62ba89] border border-[#2d4734]'
                              : 'bg-[#2c221b] text-[#d8cebe] border border-[#3e3228]'
                          }`}
                          title={`${w.hanzi} [${w.pinyin}]: ${w.vietnamese}`}
                        >
                          {w.hanzi}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                  <button
                    onClick={() => handleImportLesson(lesson)}
                    disabled={isFullyImported || loadingLessonNum === lesson.lessonNumber}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      isFullyImported
                        ? 'bg-[#1e2a22] text-[#62ba89] border-[#2d4734] cursor-default'
                        : 'bg-[#df5343] hover:bg-[#eb5f50] text-white border-[#df5343] shadow-md active:scale-95'
                    }`}
                  >
                    {isFullyImported ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Đã có trong kho</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nạp Bài {lesson.lessonNumber} ({totalInLesson - existingCount} từ)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2e2621]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#8e837a] hover:text-[#d8cebe]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
