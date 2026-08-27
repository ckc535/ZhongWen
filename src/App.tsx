import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { FlashcardStudy } from './components/FlashcardStudy';
import { WordManagement } from './components/WordManagement';
import { AIReadingPassage } from './components/AIReadingPassage';
import { QuickQuiz } from './components/QuickQuiz';
import { StrokeOrderCanvas } from './components/StrokeOrderCanvas';
import { BulkAddModal } from './components/BulkAddModal';
import { SettingsModal } from './components/SettingsModal';
import { UserSelectionModal } from './components/UserSelectionModal';
import { HskLessonImporterModal } from './components/HskLessonImporterModal';

const MainLayout: React.FC = () => {
  const { activeTab, currentUser } = useApp();

  const [isBulkAddOpen, setIsBulkAddOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLessonImporterOpen, setIsLessonImporterOpen] = useState<boolean>(false);
  const [activeStrokeChar, setActiveStrokeChar] = useState<string | null>(null);
  const [isExplicitUserModalOpen, setIsExplicitUserModalOpen] = useState<boolean>(false);
  const isUserModalOpen = !currentUser || isExplicitUserModalOpen;

  const handleOpenStrokeWriter = (hanzi: string) => {
    setActiveStrokeChar(hanzi.trim());
  };

  return (
    <div className="min-h-screen bg-[#14110f] text-[#f5ede4] flex flex-col justify-between selection:bg-[#df5343] selection:text-white">
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header with Stats, User Profile & Floating Settings Trigger */}
        <Header
          onOpenUserModal={() => setIsExplicitUserModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsOpen(true)}
        />

        {/* Main View Router (Synced with URL Hash #/study, #/words, #/stories, #/quiz, #/writer) */}
        <main className="flex-1 pb-10">
          {activeTab === 'study' && (
            <FlashcardStudy onOpenStrokeWriter={handleOpenStrokeWriter} />
          )}

          {activeTab === 'words' && (
            <WordManagement
              onOpenStrokeWriter={handleOpenStrokeWriter}
              onOpenBulkAdd={() => setIsBulkAddOpen(true)}
              onOpenLessonImporter={() => setIsLessonImporterOpen(true)}
            />
          )}

          {activeTab === 'stories' && (
            <AIReadingPassage onOpenStrokeWriter={handleOpenStrokeWriter} />
          )}

          {activeTab === 'quiz' && (
            <QuickQuiz />
          )}

          {activeTab === 'writer' && (
            <StrokeOrderCanvas initialChar={activeStrokeChar || undefined} />
          )}
        </main>
      </div>

      {/* Floating Settings Modal (Does NOT reset current tab) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenUserSelection={() => {
          setIsSettingsOpen(false);
          setIsExplicitUserModalOpen(true);
        }}
      />

      {/* Floating HSK 1 Lesson Importer Modal (Lessons 4, 5, 6, 7, 8...) */}
      <HskLessonImporterModal
        isOpen={isLessonImporterOpen}
        onClose={() => setIsLessonImporterOpen(false)}
      />

      {/* Floating Mandatory User Selection / Switch / Rename Modal */}
      <UserSelectionModal
        isOpen={isUserModalOpen}
        onClose={() => {
          if (currentUser) {
            setIsExplicitUserModalOpen(false);
          }
        }}
        isInitialSelection={!currentUser}
      />

      {/* Floating Bulk Add Modal */}
      <BulkAddModal
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
      />

      {/* Floating Stroke Writer Modal */}
      {activeStrokeChar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl">
            <StrokeOrderCanvas
              initialChar={activeStrokeChar}
              onClose={() => setActiveStrokeChar(null)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#2e2621] py-4 text-center text-xs text-[#8e837a]">
        <p>
          ZhongWen Master © 2026 • Ứng dụng học chữ Hán thông minh với AI & SRS Leitner
        </p>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
