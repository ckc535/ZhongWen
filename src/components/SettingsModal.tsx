import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../services/soundEffects';
import { tts } from '../services/ttsService';
import { GeminiService } from '../services/geminiService';
import {
  Settings,
  X,
  Volume2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit3,
  Flame,
  Play,
  Sparkles,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const AVATARS = ['🐼', '🐉', '🐯', '🦊', '🐰', '🎋', '🏮', '🌸', '🍵', '🏯'];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserSelection?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenUserSelection
}) => {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    resetToHsk1Starter,
    words,
    currentUser,
    users,
    renameCurrentUser
  } = useApp();

  const [voiceRate, setVoiceRate] = useState<number>(settings.voiceRate || 0.75);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(settings.voiceURI || '');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEffects);

  // Gemini AI Settings State
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings.geminiApiKey || '');
  const [geminiModel, setGeminiModel] = useState<string>(settings.geminiModel || 'gemini-3.5-flash-lite');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [testAiStatus, setTestAiStatus] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);

  // Rename current user state
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameName, setRenameName] = useState<string>(currentUser?.name || '');
  const [renameAvatar, setRenameAvatar] = useState<string>(currentUser?.avatar || '🐼');

  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const load = () => {
      const v = tts.getAvailableChineseVoices();
      setAvailableVoices(v);
    };
    load();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  if (!isOpen) return null;

  const handleTestVoice = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedVoiceURI) {
      tts.setVoiceByURI(selectedVoiceURI);
    }
    tts.speak('你好！欢迎学习中文。', voiceRate);
  };

  const handleTestAi = async () => {
    setTestAiStatus({ testing: true });
    try {
      const ok = await GeminiService.testGeminiApiKey(geminiApiKey, geminiModel);
      if (ok) {
        setTestAiStatus({ testing: false, success: true, message: `Kết nối thành công tới mô hình "${geminiModel}"!` });
        soundEffects.playSuccess();
      } else {
        setTestAiStatus({ testing: false, success: false, message: 'Không thể kết nối. Vui lòng kiểm tra API Key hoặc hạn mức quota.' });
        soundEffects.playWrong();
      }
    } catch (err: any) {
      setTestAiStatus({ testing: false, success: false, message: err.message || 'Lỗi kiểm tra kết nối AI' });
      soundEffects.playWrong();
    }
  };

  const handleSave = () => {
    if (selectedVoiceURI) {
      tts.setVoiceByURI(selectedVoiceURI);
    }
    updateSettings({
      voiceRate,
      voiceURI: selectedVoiceURI,
      soundEffects: soundEnabled,
      geminiApiKey: geminiApiKey.trim(),
      geminiModel: geminiModel.trim()
    });
    soundEffects.playSuccess();
    onClose();
  };

  const handleSaveRename = async () => {
    if (!renameName.trim()) return;
    await renameCurrentUser(renameName.trim(), renameAvatar);
    setIsRenaming(false);
    soundEffects.playSuccess();
  };

  const handleExportJson = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZhongWen_Vocab_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEffects.playSuccess();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importData(content);
        if (success) {
          setImportStatus({ success: true, message: 'Đã nhập dữ liệu thành công!' });
          soundEffects.playLevelUp();
        } else {
          setImportStatus({ success: false, message: 'File không đúng định dạng JSON từ vựng.' });
          soundEffects.playWrong();
        }
      } catch {
        setImportStatus({ success: false, message: 'Lỗi khi đọc file JSON.' });
        soundEffects.playWrong();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl p-6 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2e2621]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#df5343]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5ede4]">
              Cài Đặt Hệ Thống
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#27211d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SECTION 0: USER PROFILE MANAGEMENT */}
        <div className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#e5a044]" />
              <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
                Hồ Sơ Người Dùng Hiện Tại
              </h3>
            </div>

            {onOpenUserSelection && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUserSelection();
                }}
                className="text-[11px] text-[#e5a044] hover:underline flex items-center gap-1 font-semibold"
              >
                <Users className="w-3 h-3" />
                <span>Chuyển sang User khác ({users.length})</span>
              </button>
            )}
          </div>

          {currentUser && (
            <div className="p-3 rounded-2xl bg-[#1f1a17] border border-[#2e2621] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#27211d] border border-[#382f29] flex items-center justify-center text-2xl">
                  {currentUser.avatar || '🐼'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[#f5ede4]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#df5343] text-white font-semibold">
                      Đang sử dụng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8e837a] flex items-center gap-1 mt-0.5">
                    <Flame className="w-3 h-3 text-[#df5343] fill-current" />
                    <span>Chuỗi {currentUser.streakDays || 1} ngày liên tục</span>
                    <span>• Kho từ vựng dùng chung</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setRenameName(currentUser.name);
                  setRenameAvatar(currentUser.avatar || '🐼');
                  setIsRenaming(!isRenaming);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#d8cebe] border border-[#382f29] flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#e5a044]" />
                <span>{isRenaming ? 'Đóng' : 'Đổi tên'}</span>
              </button>
            </div>
          )}

          {/* Rename form */}
          {isRenaming && (
            <div className="p-3.5 rounded-2xl bg-[#1f1a17] border border-[#3e3229] space-y-2.5">
              <div>
                <label className="block text-[10px] text-[#8e837a] mb-1">Chọn biểu tượng:</label>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setRenameAvatar(av)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-all shrink-0 ${
                        renameAvatar === av
                          ? 'bg-[#df5343] border-[#df5343]'
                          : 'bg-[#27211d] border-[#382f29]'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#8e837a] mb-1">Tên hiển thị mới:</label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  placeholder="Nhập tên mới..."
                  className="w-full h-8 bg-[#161311] border border-[#2e2621] focus:border-[#df5343] rounded-lg px-2.5 text-xs text-[#f5ede4] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="px-3 py-1 rounded-lg bg-[#27211d] text-[#8e837a] text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="px-3.5 py-1 rounded-lg bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold"
                >
                  Lưu tên mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: GOOGLE GEMINI AI CONFIGURATION */}
        <div className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#df5343]" />
              <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
                Cấu Hình Google Gemini AI
              </h3>
            </div>

            <button
              type="button"
              onClick={handleTestAi}
              disabled={testAiStatus?.testing}
              className="px-2.5 py-1 rounded-lg bg-[#27211d] hover:bg-[#382f29] text-[#e5a044] border border-[#3e3228] text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {testAiStatus?.testing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#e5a044]" />
                  <span>Đang test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-[#e5a044]" />
                  <span>⚡ Kiểm tra AI</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {/* API Key Input */}
            <div>
              <label className="block text-xs font-medium text-[#d8cebe] mb-1">
                Google Gemini API Key
              </label>
              <div className="relative flex items-center">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Để trống sẽ dùng API Key mặc định từ file .env"
                  className="w-full h-9 bg-[#1f1a17] border border-[#2e2621] focus:border-[#df5343] rounded-xl pl-3 pr-9 text-xs text-[#f5ede4] focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 text-[#8e837a] hover:text-[#f5ede4] cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#8e837a] mt-1">
                Có thể nhập nhiều key cách nhau bằng dấu phẩy (,) để hệ thống tự động xoay vòng khi hết quota.
              </p>
            </div>

            {/* AI Model Selector */}
            <div>
              <label className="block text-xs font-medium text-[#d8cebe] mb-1">
                Mô hình AI sử dụng
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full h-9 bg-[#1f1a17] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#f5ede4] focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Siêu tốc độ & Tiết kiệm token - Khuyên dùng)</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Cân bằng & Chuẩn xác)</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Mô hình thông minh cao cấp)</option>
              </select>
            </div>

            {/* Test Status Message */}
            {testAiStatus && !testAiStatus.testing && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                testAiStatus.success
                  ? 'bg-[#1e2a22] text-[#62ba89] border border-[#2d4734]'
                  : 'bg-[#2b1917] text-[#e05344] border border-[#4d2522]'
              }`}>
                {testAiStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{testAiStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: AUDIO & SPEECH SETTINGS */}
        <div className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#df5343]" />
              <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
                Cài Đặt Giọng Đọc & Âm Thanh
              </h3>
            </div>

            <button
              type="button"
              onClick={handleTestVoice}
              className="px-2.5 py-1 rounded-lg bg-[#27211d] hover:bg-[#382f29] text-[#5eb786] border border-[#3e3228] text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Bấm để nghe thử giọng đọc hiện tại"
            >
              <Play className="w-3 h-3 fill-[#5eb786]" />
              <span>🔊 Nghe thử giọng</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Voice Engine Picker */}
            <div>
              <label className="block text-xs font-medium text-[#d8cebe] mb-1">
                Giọng phát âm tiếng Trung:
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full h-9 bg-[#1f1a17] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#f5ede4] focus:outline-none cursor-pointer"
              >
                <option value="">Tự động chọn giọng chuẩn nhất (Natural / Online)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-[#d8cebe]">Tốc độ phát âm:</label>
                <span className="text-xs font-bold text-[#e5a044]">{voiceRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.05"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-[#df5343] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8e837a]">
                <span>0.5x (Rất chậm)</span>
                <span>0.75x (Chuẩn mẫu)</span>
                <span>1.0x (Tự nhiên)</span>
              </div>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1f1a17] border border-[#2e2621]">
              <div>
                <span className="block text-xs text-[#d8cebe] font-medium">Hiệu ứng âm thanh</span>
                <span className="block text-[10px] text-[#8e837a]">Tiếng click, lật thẻ, chúc mừng</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEnabled ? 'bg-[#df5343]' : 'bg-[#382f29]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    soundEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: DATA BACKUP & RESTORE */}
        <div className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3">
          <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
            Sao Lưu & Phục Hồi Dữ Liệu
          </h3>
          <p className="text-xs text-[#8e837a]">
            Hiện có <strong className="text-[#f5ede4]">{words.length}</strong> chữ Hán trong kho từ vựng dùng chung.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleExportJson}
              className="px-4 py-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#d8cebe] border border-[#382f29] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#5eb786]" />
              <span>Xuất dữ liệu (Backup JSON)</span>
            </button>

            <label className="px-4 py-2 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#d8cebe] border border-[#382f29] flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#e5a044]" />
              <span>Nhập dữ liệu (Import JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
              importStatus.success
                ? 'bg-[#1e2a22] text-[#62ba89] border border-[#2d4734]'
                : 'bg-[#2b1917] text-[#e05344] border border-[#4d2522]'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#2e2621]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#27211d] hover:bg-[#322a25] text-xs font-semibold text-[#8e837a] hover:text-[#d8cebe] transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};
