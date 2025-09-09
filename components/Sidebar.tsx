
import React, { useRef } from 'react';
import type { Page } from '../types';
import { useNovel } from '../context/NovelContext';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const SidebarLink: React.FC<{
  target: Page;
  icon: string;
  label: string;
  currentPage: Page;
  onClick: (page: Page) => void;
}> = ({ target, icon, label, currentPage, onClick }) => {
  const isActive = currentPage === target;
  const activeClasses = 'bg-white/20 text-white';
  const inactiveClasses = 'text-indigo-200 hover:bg-white/10 hover:text-white';
  
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick(target);
      }}
      className={`flex items-center p-3 rounded-lg transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      <i className={`${icon} w-6 text-center transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}></i>
      <span className="ml-4">{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const { novelData, saveProjectToFile, loadProjectFromFile, resetProject, resetApplication } = useNovel();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            loadProjectFromFile(file);
        }
    };

    const handleNewProject = () => {
        if (window.confirm('Apakah Anda yakin ingin memulai proyek baru? Semua data proyek saat ini akan dihapus secara permanen.')) {
            resetProject();
            setCurrentPage('ai-writer');
        }
    };

    const handleResetApplication = () => {
        if (window.confirm('PERINGATAN: Tindakan ini akan menghapus SEMUA data proyek dari browser Anda secara permanen. Ini tidak dapat diurungkan. Apakah Anda benar-benar yakin ingin melanjutkan?')) {
            resetApplication();
        }
    };

    const handleDownloadChapter = () => {
        const chapter = novelData.chapters[novelData.currentChapterIndex];
        if (!chapter) {
            alert("Tidak ada bab yang dipilih untuk diunduh.");
            return;
        }

        const fileContent = `${chapter.title}\n\n${chapter.content}`;
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = chapter.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeTitle || `bab_${novelData.currentChapterIndex + 1}`}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

  return (
    <aside className="w-64 bg-[#4B49AC] p-6 flex flex-col fixed h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novel<span className="text-[#98BDFF]">Craft AI</span></h1>
      </div>
      <nav className="flex flex-col space-y-2">
        <SidebarLink target="ai-writer" icon="fas fa-book-open" label="Perancangan Novel" currentPage={currentPage} onClick={setCurrentPage} />
        <SidebarLink target="manuscript" icon="fas fa-feather-alt" label="Naskah" currentPage={currentPage} onClick={setCurrentPage} />
        <SidebarLink target="manuscript-analysis" icon="fas fa-file-signature" label="Perbaikan Naskah" currentPage={currentPage} onClick={setCurrentPage} />
        <SidebarLink target="assets" icon="fas fa-cubes" label="Pembuat Aset" currentPage={currentPage} onClick={setCurrentPage} />
        <SidebarLink target="database" icon="fas fa-database" label="Database" currentPage={currentPage} onClick={setCurrentPage} />
      </nav>
      <div className="mt-auto">
        <div className="grid grid-cols-2 gap-2">
            <button onClick={handleNewProject} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <i className="fas fa-file-alt"></i>Baru
            </button>
            <button onClick={saveProjectToFile} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <i className="fas fa-save"></i>Simpan
            </button>
            <button onClick={handleLoadClick} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <i className="fas fa-folder-open"></i>Muat
            </button>
             <button onClick={handleDownloadChapter} className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors" title="Unduh Bab Saat Ini">
                <i className="fas fa-file-download"></i>Bab
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
        </div>
        
        <div className="border-t border-white/20 pt-4 mt-4">
             <button onClick={handleResetApplication} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors" title="Hapus semua data dan mulai dari awal">
                <i className="fas fa-power-off"></i>Reset Aplikasi
            </button>
        </div>

        <div className="text-center text-xs text-indigo-200 mt-4">
          <a href="https://www.instagram.com/sang_pandunegeri/" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-200 hover:text-white transition-colors block mb-2">Sang Pandu Negeri</a>
          <p>Didukung oleh Gemini AI</p>
          <p>&copy; 2024</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
