import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Word } from '../types';
import { GeminiService } from '../services/geminiService';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  X,
  Trash2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ isOpen, onClose }) => {
  const { addBatchWords, settings } = useApp();

  const [rawText, setRawText] = useState<string>('');
  const [parsedWords, setParsedWords] = useState<Array<Partial<Word>>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseWithAi = async () => {
    if (!rawText.trim()) {
      setError('Vui lòng dán danh sách từ hoặc văn bản cần thêm.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await GeminiService.batchParseWords(rawText);

      if (results.length === 0) {
        throw new Error('Không trích xuất được từ vựng nào.');
      }

      setParsedWords(results);
      soundEffects.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xử lý thêm từ hàng loạt';
      setError(msg);
      soundEffects.playWrong();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRow = (index: number) => {
    setParsedWords(prev => prev.filter((_, i) => i !== index));
    soundEffects.playClick();
  };

  const handleUpdateRow = (index: number, field: keyof Word, value: string) => {
    setParsedWords(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveAll = () => {
    if (parsedWords.length === 0) return;

    addBatchWords(parsedWords.map(w => ({ ...w, source: 'ai' as const })));
    soundEffects.playLevelUp();
    confetti({ particleCount: 70, spread: 60 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#df5343] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#f5ede4]">
                Thêm cùng lúc nhiều từ vựng với AI
              </h2>
              <p className="text-xs text-[#8e837a]">
                Dán danh sách thô, AI sẽ tự động điền Pinyin, Nghĩa, Hán Việt và Ví dụ
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

        {/* Input Text Area */}
        <div className="space-y-2 shrink-0">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={3}
            placeholder={`Dán danh sách từ vựng vào đây (chữ Hán, pinyin hoặc tiếng Việt)...\nVí dụ:\n苹果, 喝水, 很好, 朋友, 医生`}
            className="w-full bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-2xl p-3 text-xs text-[#d8cebe] placeholder-[#6b625b] focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleParseWithAi}
              disabled={isLoading || !rawText.trim()}
              className="px-4 py-2 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Phân tích & Tự điền tất cả</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-[#8e837a]">
              Hỗ trợ phân tích nhiều từ cùng lúc
            </span>
          </div>

          {error && (
            <p className="text-xs text-[#e05344] bg-[#2b1917] p-2 rounded-xl border border-[#4d2522] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Live Preview Table */}
        {parsedWords.length > 0 && (
          <div className="flex-1 min-h-[160px] overflow-y-auto space-y-2 pr-1 border-t border-[#2e2621] pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#5eb786]">
                Bảng xem trước ({parsedWords.length} từ):
              </span>
              <span className="text-[11px] text-[#8e837a]">
                (Có thể chỉnh sửa trực tiếp)
              </span>
            </div>

            <div className="space-y-1.5">
              {parsedWords.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-[#161311] border border-[#2e2621] grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={item.hanzi || ''}
                      onChange={(e) => handleUpdateRow(idx, 'hanzi', e.target.value)}
                      placeholder="Chữ Hán"
                      className="w-full bg-[#1f1a17] border border-[#2e2621] rounded-lg px-2 py-1 font-chinese text-base font-bold text-center text-white focus:outline-none focus:border-[#df5343]"
                    />
                  </div>

                  <div className="col-span-3">
                    <input
                      type="text"
                      value={item.pinyin || ''}
                      onChange={(e) => handleUpdateRow(idx, 'pinyin', e.target.value)}
                      placeholder="Pinyin"
                      className="w-full bg-[#1f1a17] border border-[#2e2621] rounded-lg px-2 py-1 text-xs text-[#f05d48] font-bold focus:outline-none focus:border-[#df5343]"
                    />
                  </div>

                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.vietnamese || ''}
                      onChange={(e) => handleUpdateRow(idx, 'vietnamese', e.target.value)}
                      placeholder="Nghĩa tiếng Việt"
                      className="w-full bg-[#1f1a17] border border-[#2e2621] rounded-lg px-2 py-1 text-xs text-[#d8cebe] focus:outline-none focus:border-[#df5343]"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleRemoveRow(idx)}
                      className="p-1 text-[#8e837a] hover:text-[#df5343] transition-colors"
                      title="Xóa dòng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2e2621] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] text-xs font-semibold"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleSaveAll}
            disabled={parsedWords.length === 0}
            className="px-5 py-2 rounded-xl bg-[#5eb786] hover:bg-[#4ea877] text-[#0f2619] text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Thêm tất cả {parsedWords.length} từ vào kho từ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
