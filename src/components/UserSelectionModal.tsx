import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { soundEffects } from '../services/soundEffects';
import {
  Users,
  UserPlus,
  Edit3,
  Check,
  X,
  Flame,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AVATARS = ['🐼', '🐉', '🐯', '🦊', '🐰', '🎋', '🏮', '🌸', '🍵', '🏯'];

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isInitialSelection?: boolean; // When entering app for the first time
}

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
  isOpen,
  onClose,
  isInitialSelection = false
}) => {
  const {
    users,
    currentUser,
    setCurrentUser,
    createNewUser,
    renameCurrentUser,
    deleteUserProfile
  } = useApp();

  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);

  const createAvatarScrollRef = React.useRef<HTMLDivElement>(null);
  const renameAvatarScrollRef = React.useRef<HTMLDivElement>(null);

  // Rename state
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>(currentUser?.name || '');
  const [renameAvatar, setRenameAvatar] = useState<string>(currentUser?.avatar || '🐼');

  if (!isOpen) return null;

  // Handle Switch User
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    soundEffects.playSuccess();
    onClose?.();
  };

  // Handle Create New User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    const user = await createNewUser(newUserName.trim(), selectedAvatar);
    if (user) {
      setCurrentUser(user);
      setNewUserName('');
      setIsCreatingNew(false);
      soundEffects.playSuccess();
      onClose?.();
    }
  };

  // Handle Rename Submit
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameValue.trim()) return;

    await renameCurrentUser(renameValue.trim(), renameAvatar);
    setIsRenaming(false);
    soundEffects.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#1f1a17] border border-[#2e2621] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#df5343] flex items-center justify-center text-white shadow-sm">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f5ede4]">
                {isInitialSelection ? 'Chào mừng bạn!' : 'Hồ Sơ & Người Dùng'}
              </h2>
              <p className="text-xs text-[#8e837a]">
                {isInitialSelection
                  ? 'Chọn tài khoản của bạn hoặc nhập tên để bắt đầu học'
                  : 'Chuyển đổi hồ sơ hoặc đổi tên người dùng'}
              </p>
            </div>
          </div>

          {!isInitialSelection && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-[#27211d] text-[#8e837a] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 1. RENAMING VIEW */}
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="p-4 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-3">
            <h3 className="text-xs font-bold text-[#e5a044] uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              Đổi tên hồ sơ của bạn
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] text-[#8e837a]">Chọn biểu tượng:</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => renameAvatarScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
                    className="p-0.5 rounded-lg bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] border border-[#382f29] transition-colors cursor-pointer"
                    title="Cuộn sang trái"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => renameAvatarScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
                    className="p-0.5 rounded-lg bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] border border-[#382f29] transition-colors cursor-pointer"
                    title="Cuộn sang phải"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div
                ref={renameAvatarScrollRef}
                onWheel={(e) => { if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY * 0.8; }}
                className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 custom-scrollbar-x"
              >
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setRenameAvatar(av)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all shrink-0 ${
                      renameAvatar === av
                        ? 'bg-[#df5343] border-[#df5343] scale-110'
                        : 'bg-[#27211d] border-[#382f29] hover:bg-[#322a25]'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#8e837a] mb-1">Tên hiển thị mới:</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Nhập tên mới..."
                className="w-full h-10 bg-[#1f1a17] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#f5ede4] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#27211d] text-[#8e837a] text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#df5343] hover:bg-[#eb5f50] text-white text-xs font-bold shadow-md"
              >
                Lưu tên mới
              </button>
            </div>
          </form>
        ) : null}

        {/* 2. USER LIST */}
        {!isRenaming && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8e837a] uppercase tracking-wider">
                Danh sách người học ({users.length}):
              </span>
              {currentUser && !isRenaming && (
                <button
                  onClick={() => {
                    setRenameValue(currentUser.name);
                    setRenameAvatar(currentUser.avatar || '🐼');
                    setIsRenaming(true);
                  }}
                  className="text-[11px] text-[#e5a044] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Đổi tên của tôi</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {users.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#2b1f1a] border-[#df5343] shadow-sm'
                        : 'bg-[#161311] hover:bg-[#221c18] border-[#2e2621]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#27211d] border border-[#382f29] flex items-center justify-center text-xl shadow-inner">
                        {u.avatar || '🐼'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#f5ede4]">
                            {u.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#df5343] text-white font-semibold">
                              Đang học
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8e837a] flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-0.5 text-[#e5a044]">
                            <Flame className="w-3 h-3 fill-current" />
                            {u.streakDays || 1} ngày
                          </span>
                          <span>•</span>
                          <span>Dữ liệu học riêng</span>
                        </p>
                      </div>
                    </div>

                    <button
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#df5343] text-white'
                          : 'bg-[#27211d] hover:bg-[#322a25] text-[#d8cebe]'
                      }`}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. CREATE NEW USER FORM / TOGGLE */}
        {!isRenaming && (
          <div>
            {isCreatingNew ? (
              <form onSubmit={handleCreateSubmit} className="p-3.5 rounded-2xl bg-[#161311] border border-[#2e2621] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5eb786] flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    Tạo hồ sơ người học mới
                  </span>
                  {users.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-[11px] text-[#8e837a] hover:text-white"
                    >
                      Đóng
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-[#8e837a]">Chọn linh vật đại diện:</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => createAvatarScrollRef.current?.scrollBy({ left: -120, behavior: 'smooth' })}
                        className="p-0.5 rounded-lg bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] border border-[#382f29] transition-colors cursor-pointer"
                        title="Cuộn sang trái"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => createAvatarScrollRef.current?.scrollBy({ left: 120, behavior: 'smooth' })}
                        className="p-0.5 rounded-lg bg-[#27211d] hover:bg-[#322a25] text-[#8e837a] hover:text-[#d8cebe] border border-[#382f29] transition-colors cursor-pointer"
                        title="Cuộn sang phải"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div
                    ref={createAvatarScrollRef}
                    onWheel={(e) => { if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY * 0.8; }}
                    className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-0.5 custom-scrollbar-x"
                  >
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-8 h-8 rounded-xl text-base flex items-center justify-center border transition-all shrink-0 ${
                          selectedAvatar === av
                            ? 'bg-[#df5343] border-[#df5343] scale-110'
                            : 'bg-[#27211d] border-[#382f29]'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-[#8e837a] mb-1">Nhập tên của bạn:</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ví dụ: Minh, Nam, Lan..."
                    className="w-full h-9 bg-[#1f1a17] border border-[#2e2621] focus:border-[#df5343] rounded-xl px-3 text-xs text-[#f5ede4] placeholder-[#554b42] focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!newUserName.trim()}
                    className="w-full py-2 rounded-xl bg-[#5eb786] hover:bg-[#4ea877] text-[#0f2619] font-extrabold text-xs shadow-md disabled:opacity-50 transition-all"
                  >
                    + Tạo hồ sơ và bắt đầu học
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="w-full py-2.5 rounded-2xl bg-[#27211d] hover:bg-[#322a25] border border-[#382f29] text-xs font-bold text-[#d8cebe] flex items-center justify-center gap-1.5 transition-all"
              >
                <UserPlus className="w-4 h-4 text-[#5eb786]" />
                <span>+ Thêm người dùng mới vào hệ thống</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
