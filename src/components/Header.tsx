import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GeminiService, AiConnectionState } from '../services/geminiService';
import { BookOpen, Sparkles, Layers, Zap, PenTool, Settings, Flame, CheckCircle2, XCircle, Cpu } from 'lucide-react';

interface HeaderProps {
  onOpenUserModal?: () => void;
  onOpenSettingsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenUserModal, onOpenSettingsModal }) => {
  const {
    unmasteredWordsCount,
    totalWordsCount,
    masteredWordsCount,
    currentUser,
    effectiveStreak,
    isStudiedToday,
    activeTab,
    setActiveTab,
    settings
  } = useApp();

  const [aiState, setAiState] = useState<AiConnectionState>(() => {
    try {
      return GeminiService.getConnectionState();
    } catch {
      return 'idle';
    }
  });

  useEffect(() => {
    try {
      return GeminiService.onConnectionStateChange((state) => {
        setAiState(state);
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6 pb-2">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Red Seal Box */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#df5343] flex items-center justify-center shadow-md border border-[#ea6a5b] shrink-0">
            <span className="font-calligraphy text-white text-xl sm:text-2xl font-bold">字</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#f5ede4] tracking-tight leading-tight">
              Học Chữ Hán
            </h1>
            <p className="text-[11px] sm:text-xs text-[#8e837a] hidden sm:block">
              Nhận mặt chữ tiếng Trung — mỗi ngày một ít
            </p>
          </div>
        </div>

        {/* User Profile Badge & Quick Settings & AI Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Always-On AI Status Indicator (Display Only) */}
          <div
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#1f1a17] border border-[#2e2621] text-[11px] font-medium select-none cursor-default"
            title={
              aiState === 'connected'
                ? '🟢 Cổng kết nối AI đã sẵn sàng (Always-On)'
                : aiState === 'connecting'
                ? '🟡 Đang kết nối cổng AI...'
                : aiState === 'error'
                ? '🔴 Lỗi API Key / Model'
                : '⚪ Chưa cấu hình API Key'
            }
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                aiState === 'connected'
                  ? 'bg-[#5eb786] shadow-[0_0_8px_#5eb786]'
                  : aiState === 'connecting'
                  ? 'bg-[#e5a044] animate-ping'
                  : aiState === 'error'
                  ? 'bg-[#df5343] shadow-[0_0_8px_#df5343]'
                  : 'bg-[#6b625b]'
              }`}
            />
            <span className="text-[10px] font-bold text-[#d8cebe] hidden md:inline">
              {aiState === 'connected' ? 'AI Sẵn Sàng' : aiState === 'connecting' ? 'Đang nối...' : 'AI'}
            </span>
          </div>

          {/* Active User Button */}
          {onOpenUserModal && (
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#1f1a17] hover:bg-[#28221e] border border-[#2e2621] hover:border-[#3d332c] text-xs font-semibold text-[#f5ede4] transition-all shadow-sm group cursor-pointer"
              title="Bấm để đổi người dùng hoặc đổi tên"
            >
              <span className="text-sm sm:text-base group-hover:scale-110 transition-transform">
                {currentUser?.avatar || '🐼'}
              </span>
              <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
                {currentUser?.name || 'Chọn User'}
              </span>
              <span className="text-[10px] text-[#e5a044] font-mono font-bold flex items-center gap-0.5" title={isStudiedToday ? 'Đã học hôm nay' : 'Chưa học hôm nay'}>
                <Flame className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isStudiedToday ? 'fill-[#df5343] text-[#df5343]' : 'text-[#8e837a]'}`} />
                {effectiveStreak}d
              </span>
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 sm:p-2 rounded-xl bg-[#1f1a17] hover:bg-[#28221e] text-[#8e837a] hover:text-[#f5ede4] border border-[#2e2621] transition-colors cursor-pointer"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Stats Compact Ribbon (Ultra-compact on Mobile, Rich on Desktop) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 mb-3 sm:mb-4">
        {/* 1. Chưa thuộc */}
        <div
          onClick={() => setActiveTab('words')}
          className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1f1a17] hover:bg-[#27211d] border border-[#2e2621] hover:border-[#3d332c] transition-all cursor-pointer text-center sm:text-left group"
        >
          <div className="flex items-center justify-center sm:justify-between">
            <span className="text-base sm:text-2xl md:text-3xl font-black text-[#df5343]">
              {unmasteredWordsCount}
            </span>
            <XCircle className="w-3.5 h-3.5 text-[#df5343] hidden sm:block" />
          </div>
          <p className="text-[10px] sm:text-xs text-[#8e837a] font-medium mt-0.5 truncate">
            Chưa thuộc
          </p>
        </div>

        {/* 2. Tổng số chữ */}
        <div
          onClick={() => setActiveTab('words')}
          className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1f1a17] hover:bg-[#27211d] border border-[#2e2621] hover:border-[#3d332c] transition-all cursor-pointer text-center sm:text-left group"
        >
          <div className="flex items-center justify-center sm:justify-between">
            <span className="text-base sm:text-2xl md:text-3xl font-black text-[#f5ede4]">
              {totalWordsCount}
            </span>
            <BookOpen className="w-3.5 h-3.5 text-[#8e837a] hidden sm:block" />
          </div>
          <p className="text-[10px] sm:text-xs text-[#8e837a] font-medium mt-0.5 truncate">
            Tổng từ
          </p>
        </div>

        {/* 3. Đã thuộc */}
        <div
          onClick={() => setActiveTab('words')}
          className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1f1a17] hover:bg-[#27211d] border border-[#2e2621] hover:border-[#3d332c] transition-all cursor-pointer text-center sm:text-left group"
        >
          <div className="flex items-center justify-center sm:justify-between">
            <span className="text-base sm:text-2xl md:text-3xl font-black text-[#5eb786]">
              {masteredWordsCount}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5eb786] hidden sm:block" />
          </div>
          <p className="text-[10px] sm:text-xs text-[#8e837a] font-medium mt-0.5 truncate">
            Đã thuộc
          </p>
        </div>

        {/* 4. Ngày liên tục */}
        <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#1f1a17] border border-[#2e2621] text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-between">
            <span className="text-base sm:text-2xl md:text-3xl font-black text-[#e5a044]">
              {effectiveStreak} 🔥
            </span>
            <Flame className={`w-3.5 h-3.5 hidden sm:block ${isStudiedToday ? 'text-[#df5343] fill-current' : 'text-[#6b625b]'}`} />
          </div>
          <p className="text-[10px] sm:text-xs text-[#8e837a] font-medium mt-0.5 truncate" title={isStudiedToday ? 'Đã hoàn thành mục tiêu học hôm nay' : 'Chưa học hôm nay'}>
            {isStudiedToday ? 'Đã học hôm nay' : 'Chuỗi ngày'}
          </p>
        </div>
      </div>

      {/* 5-Column Full-Width Tab Bar (100% Fits All Screen Sizes with ZERO Clipping) */}
      <nav className="w-full grid grid-cols-5 gap-1 p-1 sm:p-1.5 rounded-2xl bg-[#1a1613] border border-[#2e2621] mb-3 shadow-sm">
        {/* Tab 1: Ôn Flashcard */}
        <button
          onClick={() => setActiveTab('study')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'study'
              ? 'bg-[#df5343] text-white shadow-md font-bold'
              : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#241e1a]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs whitespace-nowrap">
            <span className="inline sm:hidden">Ôn tập</span>
            <span className="hidden sm:inline">Ôn Flashcard</span>
          </span>
        </button>

        {/* Tab 2: Quản Lý Chữ */}
        <button
          onClick={() => setActiveTab('words')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'words'
              ? 'bg-[#df5343] text-white shadow-md font-bold'
              : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#241e1a]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[10px] sm:text-xs whitespace-nowrap">
            <span className="inline sm:hidden">Kho từ</span>
            <span className="hidden sm:inline">Quản Lý ({totalWordsCount})</span>
          </span>
        </button>

        {/* Tab 3: Đoạn Văn AI */}
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-[#df5343] text-white shadow-md font-bold'
              : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#241e1a]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#5eb786] shrink-0" />
          <span className="text-[10px] sm:text-xs whitespace-nowrap">
            <span className="inline sm:hidden">Bài đọc</span>
            <span className="hidden sm:inline">Đoạn Văn AI</span>
          </span>
        </button>

        {/* Tab 4: Kiểm Tra Nhanh */}
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'quiz'
              ? 'bg-[#df5343] text-white shadow-md font-bold'
              : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#241e1a]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-[#e5a044] shrink-0" />
          <span className="text-[10px] sm:text-xs whitespace-nowrap">
            <span className="inline sm:hidden">Đố vui</span>
            <span className="hidden sm:inline">Kiểm Tra Nhanh</span>
          </span>
        </button>

        {/* Tab 5: Tập Viết Nét */}
        <button
          onClick={() => setActiveTab('writer')}
          className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'writer'
              ? 'bg-[#df5343] text-white shadow-md font-bold'
              : 'text-[#8e837a] hover:text-[#f5ede4] hover:bg-[#241e1a]'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-[#5bb3e0] shrink-0" />
          <span className="text-[10px] sm:text-xs whitespace-nowrap">
            <span className="inline sm:hidden">Viết nét</span>
            <span className="hidden sm:inline">Tập Viết Nét</span>
          </span>
        </button>
      </nav>
    </header>
  );
};

