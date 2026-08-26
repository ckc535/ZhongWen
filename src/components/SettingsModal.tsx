import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { soundEffects } from '../services/soundEffects';
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
  Flame
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

  const [voiceRate, setVoiceRate] = useState<number>(settings.voiceRate);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEffects);

  // Rename current user state
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameName, setRenameName] = useState<string>(currentUser?.name || '');
  const [renameAvatar, setRenameAvatar] = useState<string>(currentUser?.avatar || '🐼');

  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({
      voiceRate,
      soundEffects: soundEnabled
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
    e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả từ tự thêm và khôi phục về danh sách New HSK 1 mặc định?')) {
      resetToHsk1Starter();
      soundEffects.playClick();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2e2621] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#df5343]" />
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

        {/* SECTION 0: USER PROFILE MANAGEMENT (ĐỔI TÊN / CHUYỂN USER) */}
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
                <span>{isRenaming ? 'Đóng' : 'Đổi tên của tôi'}</span>
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

        {/* SECTION 1: AUDIO & SPEECH SETTINGS */}
        <div className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3">
          <div className="flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-[#df5343]" />
            <h3 className="text-xs font-bold text-[#f5ede4] uppercase tracking-wider">
              Cài Đặt Giọng Đọc & Âm Thanh
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1">Tốc độ phát âm: {voiceRate}x</label>
              <input
                type="range"
                min="0.6"
                max="1.2"
                step="0.05"
                value={voiceRate}
                onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                className="w-full accent-[#df5343] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8e837a]">
                <span>Chậm (0.6x)</span>
                <span>Chuẩn (1.0x)</span>
                <span>Nhanh (1.2x)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1f1a17] border border-[#2e2621]">
              <span className="text-xs text-[#d8cebe] font-medium">Hiệu ứng âm thanh khi bấm</span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
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

        {/* SECTION 2: DATA BACKUP & RESTORE */}
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
            className="px-6 py-2.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};
