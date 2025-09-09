import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AIWriter from './pages/AIWriter';
import Manuscript from './pages/Manuscript';
import AssetBuilder from './pages/AssetBuilder';
import Database from './pages/Database';
import ManuscriptAnalysis from './pages/ManuscriptAnalysis';
import type { Page } from './types';
import { useNovel } from './context/NovelContext';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('ai-writer');
  const { resetCounter, apiKey, setApiKey } = useNovel();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Buka modal pengaturan saat pertama kali dimuat jika tidak ada API key
  useEffect(() => {
    const hasLoadedBefore = localStorage.getItem('novelCraftHasLoaded');
    if (!apiKey && !hasLoadedBefore) {
      setIsSettingsOpen(true);
      localStorage.setItem('novelCraftHasLoaded', 'true');
    }
  }, [apiKey]);


  const renderPage = () => {
    switch (currentPage) {
      case 'ai-writer':
        return <AIWriter key={`ai-writer-${resetCounter}`} />;
      case 'manuscript':
        return <Manuscript key={`manuscript-${resetCounter}`} />;
      case 'manuscript-analysis':
        return <ManuscriptAnalysis key={`manuscript-analysis-${resetCounter}`} />;
      case 'assets':
        return <AssetBuilder key={`assets-${resetCounter}`} />;
      case 'database':
        return <Database key={`database-${resetCounter}`} />;
      default:
        return <AIWriter key={`ai-writer-default-${resetCounter}`} />;
    }
  };

  return (
    <div className="flex">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        {renderPage()}
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentApiKey={apiKey}
        onSave={setApiKey}
      />
    </div>
  );
};

export default App;