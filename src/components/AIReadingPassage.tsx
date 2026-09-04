import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StoryPassage, DetectedNewWord } from '../types';
import { GeminiService, StoryLengthOption } from '../services/geminiService';
import { tts } from '../services/ttsService';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Plus,
  Check,
  RotateCcw,
  BookmarkPlus,
  Loader2,
  AlertCircle,
  MessageSquare,
  FileText,
  Sliders,
  Terminal,
  Cpu,
  Edit3
} from 'lucide-react';

interface AIReadingPassageProps {
  onOpenStrokeWriter?: (hanzi: string) => void;
}

const TOPICS = [
  'Chào hỏi và làm quen bạn mới',
  'Đi ăn nhà hàng và gọi món ngon',
  'Mua sắm và hỏi giá đồ vật',
  'Giới thiệu bản thân và bạn bè',
  'Đi du lịch và hỏi đường xá',
  'Cuộc sống học sinh sinh viên'
];

const CACHED_STORY_KEY = 'zhongwen_active_story';

// Helper to extract human-readable Chinese preview from raw streaming JSON
function extractReadableChinesePreview(raw: string): string {
  if (!raw) return '';

  // 1. Check for complete or partial chineseText field
  const chineseMatch = raw.match(/"chineseText"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
  if (chineseMatch && chineseMatch[1]) {
    return chineseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  // 2. Check for title
  const titleMatch = raw.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/);
  if (titleMatch && titleMatch[1]) {
    return `Tiêu đề: ${titleMatch[1].replace(/\\n/g, ' ')}\n...`;
  }

  // 3. Fallback: extract Chinese characters and punctuation
  const hanziMatches = raw.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+/g);
  if (hanziMatches && hanziMatches.length > 0) {
    return hanziMatches.join(' ');
  }

  return 'Đang khởi tạo các câu văn...';
}

export const AIReadingPassage: React.FC<AIReadingPassageProps> = ({ onOpenStrokeWriter }) => {
  const { words, addWord, addBatchWords, settings } = useApp();

  // Mode: AI sinh tự động vs Tự nhập đoạn văn
  const [entryMode, setEntryMode] = useState<'ai-generate' | 'custom-input'>('ai-generate');
  const [customPassageText, setCustomPassageText] = useState<string>('');

  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [format, setFormat] = useState<'dialogue' | 'article'>('dialogue');
  const [level, setLevel] = useState<string>('Sơ cấp HSK 1-2');

  // Length Configuration (Ngắn / Vừa / Dài / Tự chỉnh)
  const [lengthMode, setLengthMode] = useState<'short' | 'medium' | 'long' | 'custom'>('medium');
  const [customWordCount, setCustomWordCount] = useState<number>(60);

  // Streaming generation states
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamProgressText, setStreamProgressText] = useState<string>('');
  const [streamStage, setStreamStage] = useState<string>('Đang khởi tạo...');
  const [error, setError] = useState<string | null>(null);

  // Story Passage - Stored in state + cached
  const [story, setStory] = useState<StoryPassage | null>(() => {
    try {
      const saved = localStorage.getItem(CACHED_STORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Save story to cache whenever it changes
  useEffect(() => {
    if (story) {
      localStorage.setItem(CACHED_STORY_KEY, JSON.stringify(story));
    }
  }, [story]);

  // Pre-warm Google Gemini API connection in the background
  useEffect(() => {
    if (settings.geminiApiKey) {
      GeminiService.prewarmConnection(settings.geminiApiKey, settings.geminiModel);
    }
  }, [settings.geminiApiKey, settings.geminiModel]);

  // View Controls (Default Pinyin is FALSE as requested)
  const [showPinyin, setShowPinyin] = useState<boolean>(false);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Added new words tracking
  const [addedNewWordHanzis, setAddedNewWordHanzis] = useState<Set<string>>(new Set());

  const handleGenerateStory = async () => {
    const activeApiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const activeModel = settings.geminiModel || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';

    setIsStreaming(true);
    setStreamProgressText('');
    setStreamStage('⚡ Đang gửi yêu cầu qua cổng AI đã mở sẵn...');
    setError(null);
    tts.stop();
    setIsPlayingAudio(false);
    setAddedNewWordHanzis(new Set());

    try {
      const activeTopic = customTopic.trim() || selectedTopic;
      const lengthConfig: StoryLengthOption = {
        type: lengthMode,
        customWords: lengthMode === 'custom' ? customWordCount : undefined
      };

      const result = await GeminiService.generateContextStoryStream(
        words,
        activeTopic,
        level,
        format,
        lengthConfig,
        activeApiKey,
        activeModel,
        (accumulatedText) => {
          setStreamProgressText(accumulatedText);
          if (accumulatedText.length > 30) {
            setStreamStage(`✍️ AI đang suy nghĩ & sinh bài đọc theo chủ đề "${activeTopic}"...`);
          }
        }
      );

      setStory(result);
      soundEffects.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo đoạn văn';
      setError(msg);
      soundEffects.playWrong();
    } finally {
      setIsStreaming(false);
      setStreamProgressText('');
    }
  };

  const handleAnalyzeCustomPassage = async () => {
    if (!customPassageText.trim()) {
      setError('Vui lòng nhập hoặc dán đoạn văn tiếng Trung để AI phân tích.');
      return;
    }

    const activeApiKey = settings.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const activeModel = settings.geminiModel || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';

    setIsStreaming(true);
    setStreamProgressText('');
    setStreamStage('⚡ AI đang phân tích cấu trúc ngữ pháp, Pinyin, từ vựng và chiết tự...');
    setError(null);
    tts.stop();
    setIsPlayingAudio(false);
    setAddedNewWordHanzis(new Set());

    try {
      const result = await GeminiService.analyzeCustomPassageStream(
        customPassageText.trim(),
        words,
        activeApiKey,
        activeModel,
        (accumulatedText) => {
          setStreamProgressText(accumulatedText);
          if (accumulatedText.length > 30) {
            setStreamStage('✍️ AI đang giải nghĩa chi tiết từng câu và trích xuất từ mới...');
          }
        }
      );

      setStory(result);
      soundEffects.playSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi phân tích đoạn văn';
      setError(msg);
      soundEffects.playWrong();
    } finally {
      setIsStreaming(false);
      setStreamProgressText('');
    }
  };

  // Play audio for entire passage
  const handlePlayPassageAudio = () => {
    if (!story) return;
    if (isPlayingAudio) {
      tts.stop();
      setIsPlayingAudio(false);
      return;
    }

    soundEffects.playClick();
    setIsPlayingAudio(true);
    tts.speak(story.chineseText, settings.voiceRate * 0.9, settings.voicePitch, () => {
      setIsPlayingAudio(false);
    });
  };

  const handlePlaySentenceAudio = (e: React.MouseEvent, chineseSentence: string) => {
    e.stopPropagation();
    soundEffects.playClick();
    tts.speak(chineseSentence, settings.voiceRate, settings.voicePitch);
  };

  const handlePlayWordAudio = (e: React.MouseEvent, hanzi: string) => {
    e.stopPropagation();
    soundEffects.playClick();
    tts.speak(hanzi, settings.voiceRate, settings.voicePitch);
  };

  // Add individual new word to vocabulary list (Prevent duplicates)
  const handleAddNewWord = (e: React.MouseEvent, newWord: DetectedNewWord) => {
    e.stopPropagation();
    e.preventDefault();

    const isAlreadyInDb = words.some(w => w.hanzi === newWord.hanzi);

    if (!isAlreadyInDb) {
      addWord({
        hanzi: newWord.hanzi,
        pinyin: newWord.pinyin,
        vietnamese: newWord.vietnamese,
        hanViet: newWord.hanViet || '',
        radicals: newWord.radicals || '',
        mnemonic: newWord.mnemonic || '',
        exampleSentence: newWord.exampleSentence || '',
        examplePinyin: newWord.examplePinyin || '',
        exampleVietnamese: newWord.exampleVietnamese || '',
        box: 1,
        isStarred: false,
        source: 'ai',
        lesson: `Từ mới: ${story?.title || 'Đoạn văn AI'}`
      });
      soundEffects.playSuccess();
    } else {
      soundEffects.playClick();
    }

    // Mark this word as added in local state
    setAddedNewWordHanzis(prev => new Set(prev).add(newWord.hanzi));

    // Update story state without clearing it
    setStory(prevStory => {
      if (!prevStory) return null;
      return {
        ...prevStory,
        newWordsDetected: prevStory.newWordsDetected.map(nw =>
          nw.hanzi === newWord.hanzi ? { ...nw, isAlreadyAdded: true } : nw
        )
      };
    });
  };

  // Add all detected new words at once (Prevent duplicates)
  const handleAddAllNewWords = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!story || story.newWordsDetected.length === 0) return;

    const existingSet = new Set(words.map(w => w.hanzi));
    const unadded = story.newWordsDetected.filter(
      nw => !addedNewWordHanzis.has(nw.hanzi) && !nw.isAlreadyAdded && !existingSet.has(nw.hanzi)
    );

    if (unadded.length > 0) {
      addBatchWords(
        unadded.map(nw => ({
          hanzi: nw.hanzi,
          pinyin: nw.pinyin,
          vietnamese: nw.vietnamese,
          hanViet: nw.hanViet || '',
          radicals: nw.radicals || '',
          mnemonic: nw.mnemonic || '',
          exampleSentence: nw.exampleSentence || '',
          examplePinyin: nw.examplePinyin || '',
          exampleVietnamese: nw.exampleVietnamese || '',
          box: 1,
          isStarred: false,
          source: 'ai' as const,
          lesson: `Từ mới: ${story.title}`
        }))
      );
      soundEffects.playLevelUp();
      confetti({ particleCount: 50, spread: 60 });
    } else {
      soundEffects.playClick();
    }

    const allHanzis = new Set(addedNewWordHanzis);
    story.newWordsDetected.forEach(nw => allHanzis.add(nw.hanzi));
    setAddedNewWordHanzis(allHanzis);

    setStory(prevStory => {
      if (!prevStory) return null;
      return {
        ...prevStory,
        newWordsDetected: prevStory.newWordsDetected.map(nw => ({ ...nw, isAlreadyAdded: true }))
      };
    });
  };

  // Clear current story and return to setup
  const handleClearStory = () => {
    localStorage.removeItem(CACHED_STORY_KEY);
    setStory(null);
    soundEffects.playClick();
  };

  const previewChinese = extractReadableChinesePreview(streamProgressText);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-1 space-y-4">
      {/* ================= TOP SECTION: CẤU HÌNH & TẠO ĐOẠN VĂN AI ================= */}
      <div className="p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] space-y-4">
        {/* MODE SWITCHER: AI TẠO THEO CHỦ ĐỀ vs TỰ NHẬP ĐOẠN VĂN */}
        <div className="flex rounded-2xl bg-[#161311] p-1 border border-[#2e2621]">
          <button
            type="button"
            onClick={() => {
              setEntryMode('ai-generate');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              entryMode === 'ai-generate'
                ? 'bg-[#df5343] text-white shadow-md'
                : 'text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tạo Bài Đọc Theo Chủ Đề</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEntryMode('custom-input');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              entryMode === 'custom-input'
                ? 'bg-[#df5343] text-white shadow-md'
                : 'text-[#8e837a] hover:text-[#d8cebe]'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tự Nhập & Phân Tích Đoạn Văn</span>
          </button>
        </div>

        {/* ================= MODE 1: AI GENERATE ================= */}
        {entryMode === 'ai-generate' && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5eb786] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  TÙY CHỌN BÀI ĐỌC TỰ ĐỘNG
                </h3>
                <p className="text-xs text-[#8e837a]">
                  AI tự động lồng ghép các từ bạn đang học vào một câu chuyện thú vị
                </p>
              </div>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="bg-[#161311] border border-[#2e2621] text-[11px] text-[#d8cebe] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#df5343]"
              >
                <option value="Sơ cấp HSK 1-2">Sơ cấp HSK 1-2</option>
                <option value="Trung cấp HSK 3-4">Trung cấp HSK 3-4</option>
              </select>
            </div>

            {/* 1. THỂ LOẠI: ĐỐI THOẠI vs VĂN XUÔI / BÀI BÁO */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8e837a]">
                Chọn thể loại bài đọc:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('dialogue')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    format === 'dialogue'
                      ? 'bg-[#df5343] text-white border-[#df5343] shadow-md'
                      : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>💬 Đoạn đối thoại (Hội thoại)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('article')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    format === 'article'
                      ? 'bg-[#df5343] text-white border-[#df5343] shadow-md'
                      : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>📰 Đoạn văn xuôi / Bài báo</span>
                </button>
              </div>
            </div>

            {/* 2. ĐỘ DÀI ĐOẠN VĂN (CUSTOM SỐ TỪ) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#8e837a] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Độ dài đoạn văn:</span>
                </label>
                <span className="text-[11px] text-[#e5a044]">
                  {lengthMode === 'short' && 'Khoảng 30 – 45 chữ (3 – 4 câu)'}
                  {lengthMode === 'medium' && 'Mặc định: Khoảng 50 – 75 chữ (5 – 7 câu)'}
                  {lengthMode === 'long' && 'Khoảng 85 – 130 chữ (8 – 12 câu)'}
                  {lengthMode === 'custom' && `Tùy chỉnh: ~${customWordCount} chữ`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. Ngắn */}
                <button
                  type="button"
                  onClick={() => setLengthMode('short')}
                  className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                    lengthMode === 'short'
                      ? 'bg-[#33261a] text-[#e5a044] border-[#553c24] shadow-sm'
                      : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                  }`}
                >
                  <span className="block text-xs font-bold">⚡ Ngắn</span>
                  <span className="block text-[10px] opacity-80 mt-0.5">(~35 từ)</span>
                </button>

                {/* 2. Vừa */}
                <button
                  type="button"
                  onClick={() => setLengthMode('medium')}
                  className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                    lengthMode === 'medium'
                      ? 'bg-[#33261a] text-[#e5a044] border-[#553c24] shadow-sm'
                      : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                  }`}
                >
                  <span className="block text-xs font-bold">📖 Vừa</span>
                  <span className="block text-[10px] opacity-80 mt-0.5">(~60 từ)</span>
                </button>

                {/* 3. Dài */}
                <button
                  type="button"
                  onClick={() => setLengthMode('long')}
                  className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                    lengthMode === 'long'
                      ? 'bg-[#33261a] text-[#e5a044] border-[#553c24] shadow-sm'
                      : 'bg-[#161311] text-[#8e837a] border-[#2e2621] hover:text-[#d8cebe]'
                  }`}
                >
                  <span className="block text-xs font-bold">📜 Dài</span>
                  <span className="block text-[10px] opacity-80 mt-0.5">(~100 từ)</span>
                </button>

                {/* 4. Tùy chỉnh */}
                <div
                  className={`p-2.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center ${
                    lengthMode === 'custom'
                      ? 'bg-[#33261a] border-[#553c24] shadow-sm'
                      : 'bg-[#161311] border-[#2e2621]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLengthMode('custom')}
                    className={`text-xs font-bold block cursor-pointer ${
                      lengthMode === 'custom' ? 'text-[#e5a044]' : 'text-[#8e837a] hover:text-[#d8cebe]'
                    }`}
                  >
                    ✏️ Tự chỉnh
                  </button>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <input
                      type="number"
                      min={20}
                      max={300}
                      value={customWordCount}
                      onChange={(e) => {
                        setLengthMode('custom');
                        setCustomWordCount(Math.max(10, parseInt(e.target.value) || 50));
                      }}
                      className="w-12 bg-[#1f1a17] text-center border border-[#3e3228] rounded-lg text-xs font-bold text-[#f5ede4] py-0.5 focus:outline-none focus:border-[#df5343]"
                    />
                    <span className="text-[10px] text-[#8e837a]">từ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CHỦ ĐỀ GỢI Ý */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#8e837a]">
                Chọn chủ đề:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all whitespace-nowrap cursor-pointer ${
                      selectedTopic === topic && !customTopic
                        ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                        : 'bg-[#161311] text-[#8e837a] border-[#2e2621]'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ô NHẬP CHỦ ĐỀ TỰ DO & NÚT TẠO */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Hoặc tự nhập chủ đề (ví dụ: Chú mèo nhỏ tìm bạn, Đi mua trà sữa...)"
                className="flex-1 h-11 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-2xl px-3.5 text-xs text-[#d8cebe] placeholder-[#6b625b] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isStreaming}
                className="h-11 px-6 rounded-2xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isStreaming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang streaming...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Tạo đoạn văn mới</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 2: CUSTOM PASSAGE INPUT & ANALYZER ================= */}
        {entryMode === 'custom-input' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e5a044] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  TỰ NHẬP ĐOẠN VĂN TIẾNG TRUNG
                </h3>
                <p className="text-xs text-[#8e837a]">
                  Dán bất kỳ đoạn văn, tin tức, đoạn thoại nào để AI phân tích chi tiết từng từ & câu
                </p>
              </div>

              <span className="text-[11px] text-[#8e837a] font-mono bg-[#161311] px-2.5 py-1 rounded-xl border border-[#2e2621]">
                {customPassageText.trim().length} ký tự
              </span>
            </div>

            <textarea
              rows={6}
              value={customPassageText}
              onChange={(e) => setCustomPassageText(e.target.value)}
              placeholder="Dán hoặc gõ đoạn văn tiếng Trung vào đây (Ví dụ: 你好！我是大卫，我是美国人。今天天气很好，我和朋友一起去饭店吃饭。李月说：你想吃什么？...)"
              className="w-full bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-2xl p-4 font-chinese text-base text-[#f5ede4] placeholder:text-[#5a4e44] focus:outline-none resize-y transition-colors leading-relaxed"
            />

            <div className="p-3.5 rounded-2xl bg-[#161311] border border-[#2e2621] text-[11px] text-[#8e837a] space-y-1">
              <p className="font-semibold text-[#d8cebe] flex items-center gap-1.5">
                <span className="text-[#5eb786]">✨</span>
                <span>AI sẽ tự động xử lý và phân tích:</span>
              </p>
              <p>• Tách từng câu chuẩn xác, tự động gán Pinyin có dấu và dịch nghĩa toàn bài sang tiếng Việt.</p>
              <p>• Biến từng từ thành tương tác: Rê chuột để xem Pinyin + Nghĩa, bấm vào để nghe phát âm giọng chuẩn.</p>
              <p>• Tự động đối chiếu với kho từ bạn đã học, lọc ra tất cả các <strong>Từ Mới</strong> (kèm Âm Hán Việt, Bộ thủ 🧩 và Mẹo nhớ 💡) để bạn thêm vào kho học SRS chỉ với 1 cú click!</p>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeCustomPassage}
              disabled={isStreaming || !customPassageText.trim()}
              className="w-full h-11 px-6 rounded-2xl bg-[#df5343] hover:bg-[#eb5f50] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang phân tích đoạn văn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Phân Tích Đoạn Văn Với AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-[#e05344] bg-[#2b1917] p-2.5 rounded-xl border border-[#4d2522] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {/* ================= REAL-TIME STREAMING LIVE VISUALIZER CARD ================= */}
      {isStreaming && (
        <div className="p-6 rounded-3xl bg-[#191512] border border-[#df5343]/60 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#df5343] animate-ping" />
              <div>
                <span className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#df5343]" />
                  AI Đang Soạn Trực Tiếp Theo Thời Gian Thực...
                </span>
                <p className="text-[11px] text-[#e5a044] font-medium mt-0.5">
                  {streamStage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#5eb786] bg-[#1a261d] px-2.5 py-1 rounded-xl border border-[#2d4734]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5eb786] animate-pulse" />
              <span>Live Streaming</span>
            </div>
          </div>

          {/* Live Text Box (Showing readable Chinese sentences as they form) */}
          <div className="p-5 rounded-2xl bg-[#14110f] border border-[#2e2621] min-h-[100px] flex flex-col justify-center space-y-2">
            {streamProgressText ? (
              <div className="font-chinese text-xl sm:text-2xl text-[#f5ede4] leading-relaxed whitespace-pre-wrap">
                {previewChinese}
                <span className="inline-block w-2.5 h-5 bg-[#df5343] ml-1.5 animate-pulse align-middle" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs text-[#8e837a] py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#df5343]" />
                <span>Đang kết nối luồng AI và tải vốn từ...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= STORY READER CARD ================= */}
      {story && !isStreaming ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-5">
          {/* Header toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2e2621]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#27211d] text-[#e5a044] border border-[#382f29] font-semibold">
                  {story.format === 'dialogue' ? '💬 Đối thoại' : '📰 Văn xuôi'}
                </span>
                <h3 className="font-chinese text-2xl font-bold text-[#f5ede4] flex items-center gap-2">
                  {story.title}
                  <button
                    onClick={(e) => handlePlayWordAudio(e, story.title)}
                    className="p-1 text-[#8e837a] hover:text-[#df5343] transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </h3>
              </div>

              {showPinyin && (
                <p className="text-xs text-[#f05d48] font-bold mt-1">{story.titlePinyin}</p>
              )}
              {showVietnamese && (
                <p className="text-xs text-[#8e837a] mt-0.5">{story.titleVietnamese}</p>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center gap-2">
              {/* 🔊 Audio Reader Button */}
              <button
                onClick={handlePlayPassageAudio}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isPlayingAudio
                    ? 'bg-[#df5343] text-white border-[#df5343] animate-pulse'
                    : 'bg-[#27211d] hover:bg-[#322a25] text-[#d8cebe] border-[#382f29]'
                }`}
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#df5343]" />}
                <span>{isPlayingAudio ? 'Dừng' : 'Nghe đọc bài'}</span>
              </button>

              {/* 🏷️ Toggle All Pinyin */}
              <button
                onClick={() => setShowPinyin(!showPinyin)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showPinyin
                    ? 'bg-[#33261a] text-[#e5a044] border-[#553c24]'
                    : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
                }`}
                title="Bật/Tắt Pinyin toàn bộ bài (Mẹo: Có thể rê chuột vào từng chữ để xem riêng)"
              >
                {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showPinyin ? 'Ẩn Pinyin' : 'Hiện Pinyin'}</span>
              </button>

              {/* 🌐 Toggle Vietnamese */}
              <button
                onClick={() => setShowVietnamese(!showVietnamese)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  showVietnamese
                    ? 'bg-[#1e2a22] text-[#62ba89] border-[#2d4734]'
                    : 'bg-[#27211d] text-[#8e837a] border-[#382f29]'
                }`}
              >
                {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Tiếng Việt</span>
              </button>

              <button
                onClick={handleClearStory}
                className="p-1.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#df5343] border border-[#382f29]"
                title="Tạo bài mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hint for interactive hover */}
          <div className="text-[11px] text-[#8e837a] flex items-center gap-1 bg-[#161311] px-3 py-1.5 rounded-xl border border-[#27201c]">
            <span>💡 <strong>Mẹo:</strong> Rê chuột (Hover) vào từng chữ Hán để xem Pinyin và nghĩa riêng của chữ đó!</span>
          </div>

          {/* Passage Content with Interactive Token Hover */}
          <div className="space-y-3">
            {story.sentences.map((sent, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#161311] hover:bg-[#1a1614] border border-[#27201c] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    {/* Speaker Badge for Dialogue mode */}
                    {sent.speaker && (
                      <div className="mb-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#33261a] text-[#e5a044] border border-[#553c24] text-[11px] font-bold">
                          <span>👤</span>
                          <span>{sent.speaker}</span>
                        </span>
                      </div>
                    )}

                    {/* Chinese Sentence with Interactive Tokens */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 leading-loose">
                      {sent.tokens && sent.tokens.length > 0 ? (
                        sent.tokens.map((token, tIdx) => (
                          <span
                            key={tIdx}
                            className="relative group cursor-pointer inline-block"
                            onClick={(e) => handlePlayWordAudio(e, token.hanzi)}
                          >
                            <span className="font-chinese text-xl sm:text-2xl text-[#f5ede4] hover:text-[#df5343] transition-colors border-b border-dashed border-[#3e352d] group-hover:border-[#df5343] pb-0.5">
                              {token.hanzi}
                            </span>

                            {/* Floating Tooltip with Pinyin & Meaning on Hover */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30 pointer-events-none transition-all">
                              <span className="bg-[#2a221d] border border-[#44362d] text-white text-[11px] rounded-xl py-1 px-2.5 shadow-xl whitespace-nowrap text-center">
                                <span className="font-bold text-[#f05d48] block">{token.pinyin}</span>
                                {token.vietnamese && (
                                  <span className="text-[10px] text-[#d8cebe] block">{token.vietnamese}</span>
                                )}
                              </span>
                              <span className="w-2 h-2 bg-[#2a221d] border-r border-b border-[#44362d] rotate-45 -mt-1" />
                            </span>
                          </span>
                        ))
                      ) : (
                        <p className="font-chinese text-xl sm:text-2xl text-[#f5ede4]">
                          {sent.chinese}
                        </p>
                      )}
                    </div>

                    {/* Full Pinyin if enabled */}
                    {showPinyin && (
                      <p className="text-xs sm:text-sm font-bold text-[#f05d48] pt-1 tracking-wide">
                        {sent.pinyin}
                      </p>
                    )}

                    {/* Full Vietnamese translation if enabled */}
                    {showVietnamese && (
                      <p className="text-xs sm:text-sm text-[#5eb786] pt-1 font-medium border-t border-[#27201c]">
                        {sent.vietnamese}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => handlePlaySentenceAudio(e, sent.chinese)}
                    className="p-2 text-[#8e837a] hover:text-[#df5343] transition-colors shrink-0 rounded-xl hover:bg-[#27211d]"
                    title="Nghe câu này"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= DETECTED NEW WORDS SECTION ================= */}
          {story.newWordsDetected && story.newWordsDetected.length > 0 && (
            <div className="pt-3 border-t border-[#2e2621] space-y-2.5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#e5a044] uppercase tracking-wider flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Phát hiện {story.newWordsDetected.length} từ mới trong bài
                </span>

                <button
                  onClick={handleAddAllNewWords}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 bg-[#33261a] hover:bg-[#443322] text-[#e5a044] border-[#553c24]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm tất cả {story.newWordsDetected.length} từ mới</span>
                </button>
              </div>

              {/* Grid of New Words with Rich Radicals & Mnemonics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {story.newWordsDetected.map((nw, idx) => {
                  const isAdded = addedNewWordHanzis.has(nw.hanzi) || nw.isAlreadyAdded;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-2 hover:border-[#3d332c] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={(e) => handlePlayWordAudio(e, nw.hanzi)}
                              className="font-chinese text-2xl font-bold text-[#f5ede4] hover:text-[#df5343] cursor-pointer"
                            >
                              {nw.hanzi}
                            </span>
                            <span className="text-xs font-bold text-[#f05d48]">
                              {nw.pinyin}
                            </span>
                            {nw.hanViet && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#27211d] text-[#bfb5a7] border border-[#382f29]">
                                {nw.hanViet}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#d8cebe] font-medium pt-0.5">
                            {nw.vietnamese}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handlePlayWordAudio(e, nw.hanzi)}
                            className="p-1.5 text-[#8e837a] hover:text-[#df5343] rounded-lg hover:bg-[#27211d]"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleAddNewWord(e, nw)}
                            disabled={isAdded}
                            className={`px-2.5 py-1 rounded-xl border text-xs transition-all ${
                              isAdded
                                ? 'bg-[#1e2a22] text-[#62ba89] border-[#2d4734] cursor-default'
                                : 'bg-[#df5343]/20 hover:bg-[#df5343]/30 text-[#df5343] border-[#df5343]/40 active:scale-95'
                            }`}
                            title={isAdded ? 'Đã thêm vào kho từ' : 'Thêm vào kho từ'}
                          >
                            {isAdded ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#5eb786]">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Đã thêm</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#df5343]">
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Thêm</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Radicals & Mnemonic breakdown */}
                      {(nw.radicals || nw.mnemonic) && (
                        <div className="p-2 rounded-xl bg-[#1f1a17] border border-[#2a221d] text-[11px] space-y-1">
                          {nw.radicals && (
                            <p className="text-[#bfb5a7]">
                              <span className="text-[#e5a044] font-semibold">🧩 Bộ thủ:</span>{' '}
                              <span>{nw.radicals}</span>
                            </p>
                          )}
                          {nw.mnemonic && (
                            <p className="text-[#bfb5a7]">
                              <span className="text-[#5eb786] font-semibold">💡 Mẹo nhớ:</span>{' '}
                              <span>{nw.mnemonic}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State / Call-to-action */
        !isStreaming && (
          <div className="p-8 rounded-3xl bg-[#1f1a17] border border-[#2e2621] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#28211c] border border-[#3e3229] flex items-center justify-center text-[#5eb786]">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#f5ede4]">
              Chưa có đoạn văn nào được tạo
            </h3>
            <p className="text-xs text-[#8e837a] max-w-sm mx-auto">
              Hãy chọn thể loại (Đối thoại hoặc Văn xuôi), độ dài và chủ đề ở phía trên rồi bấm <strong>"Tạo đoạn văn mới"</strong> để AI sinh trực tiếp bài đọc theo thời gian thực!
            </p>
          </div>
        )
      )}
    </div>
  );
};
