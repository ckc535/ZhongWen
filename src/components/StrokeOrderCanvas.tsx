import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { tts } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import HanziWriter from 'hanzi-writer';
import {
  PenTool,
  Play,
  RotateCcw,
  Volume2,
  Sparkles,
  X
} from 'lucide-react';

interface StrokeOrderCanvasProps {
  initialChar?: string;
  onClose?: () => void;
}

export const StrokeOrderCanvas: React.FC<StrokeOrderCanvasProps> = ({ initialChar = '你', onClose }) => {
  const { words, settings } = useApp();

  const [currentChar, setCurrentChar] = useState<string>(initialChar || '你');
  const [customInput, setCustomInput] = useState<string>('');
  const [practiceMessage, setPracticeMessage] = useState<string>('Bấm "Xem nét mẫu" để xem hoạt ảnh hoặc "Tập viết" để tự vẽ');

  const writerContainerRef = useRef<HTMLDivElement>(null);
  const writerInstanceRef = useRef<HanziWriter | null>(null);

  const matchedWord = words.find(w => w.hanzi.includes(currentChar)) || words[0];

  useEffect(() => {
    if (!writerContainerRef.current) return;
    writerContainerRef.current.innerHTML = '';

    const charToRender = currentChar.trim().charAt(0) || '你';

    try {
      writerInstanceRef.current = HanziWriter.create(writerContainerRef.current, charToRender, {
        width: 220,
        height: 220,
        padding: 15,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 200,
        strokeColor: '#df5343', // Warm coral stroke
        outlineColor: '#3a322c', // Outline
        drawingColor: '#5eb786', // Green user drawing
        showCharacter: true,
        showHintAfterMisses: 2,
        highlightColor: '#5eb786',
        strokeFadeDuration: 400
      });

      writerInstanceRef.current.animateCharacter();
    } catch (e) {
      console.warn('HanziWriter error:', e);
    }
  }, [currentChar]);

  const handleAnimate = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setPracticeMessage('Đang hiển thị thứ tự nét viết chuẩn...');
    writerInstanceRef.current.showCharacter();
    writerInstanceRef.current.animateCharacter({
      onComplete: () => {
        setPracticeMessage('Đã hoàn thành nét vẽ!');
      }
    });
  };

  const handleStartPractice = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setPracticeMessage('Hãy dùng chuột hoặc ngón tay để vẽ theo từng nét!');
    writerInstanceRef.current.hideCharacter();
    writerInstanceRef.current.quiz({
      onMistake: (strokeData) => {
        soundEffects.playWrong();
        setPracticeMessage(`Sai nét thứ ${strokeData.strokeNum + 1}! Hãy thử lại.`);
      },
      onCorrectStroke: (strokeData) => {
        soundEffects.playClick();
        setPracticeMessage(`Chính xác nét thứ ${strokeData.strokeNum + 1}! Tiếp tục nào.`);
      },
      onComplete: () => {
        soundEffects.playSuccess();
        setPracticeMessage('🎉 Xuất sắc! Bạn đã viết đúng toàn bộ chữ này.');
      }
    });
  };

  const handleReset = () => {
    if (!writerInstanceRef.current) return;
    soundEffects.playClick();
    setPracticeMessage('Đã xóa bảng vẽ.');
    writerInstanceRef.current.showCharacter();
  };

  const handlePlayAudio = () => {
    soundEffects.playClick();
    tts.speak(currentChar, settings.voiceRate, settings.voicePitch);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-1 space-y-4">
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#28211c] border border-[#3e3229] flex items-center justify-center text-[#5bb3e0]">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#5bb3e0]">
                TẬP VIẾT & THỨ TỰ NÉT CHỮ HÁN
              </h2>
              <p className="text-xs text-[#8e837a]">
                Bút thuận chuẩn Điền Tự Cách và chấm điểm viết tay
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-[#27211d] text-[#8e837a] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center Tian Zi Ge Box */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative p-2 rounded-2xl bg-[#161311] border border-[#3a2f28] shadow-lg tian-zi-ge flex items-center justify-center">
            <div ref={writerContainerRef} className="cursor-crosshair select-none" />

            <button
              onClick={handlePlayAudio}
              className="absolute bottom-2 right-2 p-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#df5343] border border-[#382f29] shadow-sm transition-all"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-[#f5ede4]">
              {practiceMessage}
            </p>
            {matchedWord && (
              <p className="text-xs text-[#8e837a] mt-0.5">
                Pinyin: <span className="text-[#f05d48] font-bold">{matchedWord.pinyin}</span> • Nghĩa: <span className="text-[#d8cebe]">{matchedWord.vietnamese}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={handleAnimate}
            className="py-2.5 px-2 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Xem nét mẫu</span>
          </button>

          <button
            onClick={handleStartPractice}
            className="py-2.5 px-2 rounded-xl bg-[#5eb786] hover:bg-[#4ea877] text-[#0f2619] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Tập viết tay</span>
          </button>

          <button
            onClick={handleReset}
            className="py-2.5 px-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] font-bold text-xs border border-[#382f29] transition-all flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>
        </div>

        {/* Character Mnemonic */}
        {matchedWord?.mnemonic && (
          <div className="p-3 rounded-2xl bg-[#161311] border border-[#2e2621] text-xs space-y-0.5">
            <span className="text-[#e5a044] font-bold block flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Chiết tự & Mẹo ghi nhớ:
            </span>
            {matchedWord.radicals && (
              <p className="text-[#d8cebe]"><strong>Bộ thủ:</strong> {matchedWord.radicals}</p>
            )}
            <p className="text-[#8e837a]">{matchedWord.mnemonic}</p>
          </div>
        )}
      </div>
    </div>
  );
};
