import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import AIWriter from './pages/AIWriter';
import Manuscript from './pages/Manuscript';
import AssetBuilder from './pages/AssetBuilder';
import Database from './pages/Database';
import ManuscriptAnalysis from './pages/ManuscriptAnalysis';
import type { Page } from './types';
import { useNovel } from './context/NovelContext';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('manuscript-analysis');
  const { resetCounter } = useNovel();

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
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
