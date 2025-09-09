import React, { createContext, useReducer, useContext, useEffect, useState } from 'react';
import type { NovelData, Action, Character, Location, NovelObject, Chapter, Reference } from '../types';
import { getInitialNovelData } from '../constants';
import { initializeGemini } from '../services/geminiService';

const LOCAL_STORAGE_KEY = 'novelWriterAIData_react_v1';
const API_KEY_STORAGE_KEY = 'geminiApiKey_react_v1';

const novelReducer = (state: NovelData, action: Action): NovelData => {
  switch (action.type) {
    case 'SET_NOVEL_DATA': {
      const data = action.payload;
      const chapters = (data.chapters || []).map((chapter: any): Chapter => ({
        ...chapter,
        status: chapter.status === 'final' ? 'final' : 'draft',
        plotPoint: chapter.plotPoint || 'Belum Diatur',
        summary: chapter.summary || '',
        locationsInChapter: chapter.locationsInChapter || (chapter.locationInChapter ? [chapter.locationInChapter] : []),
        objectsInChapter: chapter.objectsInChapter || [],
      }));
      const characters = (data.characters || []).map((character: any): Character => ({
        ...character,
        role: character.role || 'Belum Ditentukan',
      }));
      
      let references = data.references || [];
      // Backward compatibility for old projects with referencePageContent
      if ((!references || references.length === 0) && data.referencePageContent) {
          references = [{
              id: Date.now(),
              title: 'Referensi yang Diimpor',
              content: data.referencePageContent
          }];
      }
      
      const newState: NovelData = {
        ...getInitialNovelData(),
        ...data,
        characters,
        chapters,
        references,
      };
      
      // Clean up old property if it exists
      delete (newState as any).referencePageContent;
      // Clean up old chapter property if it exists
      newState.chapters.forEach(c => delete (c as any).referenceText);

      return newState;
    }
    case 'RESET_NOVEL_DATA':
        // By calling the factory function, we ensure a completely new object is returned,
        // preventing any old state from persisting due to reference issues.
        return getInitialNovelData();
    case 'RESET_WIZARD_STATE': {
        const initialData = getInitialNovelData();
        return {
            ...state,
            choices: initialData.choices,
            plotStructure: initialData.plotStructure
        };
    }
    case 'UPDATE_CHOICE':
      return { ...state, choices: { ...state.choices, [action.payload.key]: action.payload.value } };
    case 'UPDATE_PLOT_STRUCTURE':
      return { ...state, plotStructure: { ...state.plotStructure, [action.payload.key]: action.payload.value } };
    case 'SET_CHAPTER_CONTENT':
      const updatedChapters = [...state.chapters];
      updatedChapters[state.currentChapterIndex].content = action.payload;
      return { ...state, chapters: updatedChapters };
    case 'SET_CURRENT_CHAPTER_INDEX':
      return { ...state, currentChapterIndex: action.payload };
    case 'TOGGLE_CHAPTER_STATUS':
      const toggledChapters = state.chapters.map((chap, index): Chapter => 
        index === action.payload ? { ...chap, status: chap.status === 'draft' ? 'final' : 'draft' } : chap
      );
      return { ...state, chapters: toggledChapters };
    case 'DELETE_CHAPTER':
       if (state.chapters.length <= 1) return state;
       const reducedChapters = state.chapters.filter((_, index) => index !== action.payload);
       const newIndex = Math.min(state.currentChapterIndex, reducedChapters.length - 1);
      return { ...state, chapters: reducedChapters, currentChapterIndex: newIndex >= 0 ? newIndex : 0 };
    case 'ADD_CHAPTER':
        return { ...state, chapters: [...state.chapters, action.payload] };
    case 'UPDATE_FIRST_CHAPTER':
        const firstChapterUpdated = [...state.chapters];
        firstChapterUpdated[0] = action.payload;
        return { ...state, chapters: firstChapterUpdated };
    case 'UPDATE_CHAPTER_PLOT_POINT': {
        const updatedChaptersPlot = [...state.chapters];
        updatedChaptersPlot[action.payload.chapterIndex].plotPoint = action.payload.plotPoint;
        return { ...state, chapters: updatedChaptersPlot };
    }
    case 'UPDATE_CHAPTER_SUMMARY': {
        const updatedChaptersSummary = [...state.chapters];
        updatedChaptersSummary[action.payload.chapterIndex].summary = action.payload.summary;
        return { ...state, chapters: updatedChaptersSummary };
    }
    case 'UPDATE_CHAPTER_CONTENT': {
        const updatedChaptersContent = [...state.chapters];
        if (updatedChaptersContent[action.payload.chapterIndex]) {
            updatedChaptersContent[action.payload.chapterIndex].content = action.payload.content;
        }
        return { ...state, chapters: updatedChaptersContent };
    }
     case 'UPDATE_CHAPTER_TITLE': {
        const updatedChaptersTitle = [...state.chapters];
        if (updatedChaptersTitle[action.payload.chapterIndex]) {
            updatedChaptersTitle[action.payload.chapterIndex].title = action.payload.title;
        }
        return { ...state, chapters: updatedChaptersTitle };
    }
    case 'ADD_CHARACTER':
      return { ...state, characters: [...state.characters, action.payload] };
    case 'UPDATE_CHARACTER':
      const updatedCharacters = [...state.characters];
      updatedCharacters[action.payload.index] = action.payload.character;
      return { ...state, characters: updatedCharacters };
    case 'DELETE_CHARACTER':
      // FIX: Corrected a syntax error where the arrow `=>` for the filter function was missing.
      return { ...state, characters: state.characters.filter((_, i) => i !== action.payload) };
    case 'ADD_LOCATION':
        return { ...state, locations: [...state.locations, action.payload] };
    case 'UPDATE_LOCATION':
      const updatedLocations = [...state.locations];
      updatedLocations[action.payload.index] = action.payload.location;
      return { ...state, locations: updatedLocations };
    case 'DELETE_LOCATION':
        return { ...state, locations: state.locations.filter((_, i) => i !== action.payload) };
    case 'ADD_OBJECT':
        return { ...state, objects: [...state.objects, action.payload] };
    case 'UPDATE_OBJECT':
      const updatedObjects = [...state.objects];
      updatedObjects[action.payload.index] = action.payload.object;
      return { ...state, objects: updatedObjects };
    case 'DELETE_OBJECT':
        return { ...state, objects: state.objects.filter((_, i) => i !== action.payload) };
    case 'ADD_REFERENCE':
        return { ...state, references: [...state.references, action.payload] };
    case 'UPDATE_REFERENCE':
      const updatedReferences = [...state.references];
      updatedReferences[action.payload.index] = action.payload.reference;
      return { ...state, references: updatedReferences };
    case 'DELETE_REFERENCE':
        return { ...state, references: state.references.filter((_, i) => i !== action.payload) };
    default:
      return state;
  }
};

interface NovelContextType {
  novelData: NovelData;
  dispatch: React.Dispatch<Action>;
  saveProjectToFile: () => void;
  loadProjectFromFile: (file: File) => void;
  resetProject: () => void;
  resetApplication: () => void;
  resetCounter: number;
  isAiWriterUnlocked: boolean;
  setIsAiWriterUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const NovelContext = createContext<NovelContextType | undefined>(undefined);

export const NovelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [novelData, dispatch] = useReducer(novelReducer, getInitialNovelData());
  const [resetCounter, setResetCounter] = useState(0);
  const [isAiWriterUnlocked, setIsAiWriterUnlocked] = useState(false);
  const [apiKey, setApiKeyState] = useState('');


  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (savedData) {
        dispatch({ type: 'SET_NOVEL_DATA', payload: JSON.parse(savedData) });
      }
       if (savedKey) {
          setApiKeyState(savedKey);
          initializeGemini(savedKey);
      }
    } catch (e) {
      console.error("Gagal memuat data dari penyimpanan lokal", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(novelData));
    } catch (e) {
      console.error("Gagal menyimpan data ke penyimpanan lokal", e);
    }
  }, [novelData]);
  
  const setApiKey = (key: string) => {
    const trimmedKey = key.trim();
    setApiKeyState(trimmedKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    initializeGemini(trimmedKey);
  };


  const saveProjectToFile = () => {
    const jsonString = JSON.stringify(novelData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'novelcraft_project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadProjectFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const loadedData = JSON.parse(event.target.result as string);
          if (loadedData.chapters && loadedData.characters) {
            dispatch({ type: 'SET_NOVEL_DATA', payload: loadedData });
            setResetCounter(c => c + 1);
            setIsAiWriterUnlocked(false); // Ensure writer is locked on new project load
            console.log('Proyek berhasil dimuat!');
          } else {
            throw new Error('Format file proyek tidak valid.');
          }
        }
      } catch (err) {
        console.error('Gagal memuat proyek:', err);
        alert('Gagal memuat proyek: File tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const resetProject = () => {
    dispatch({ type: 'RESET_NOVEL_DATA' });
    setResetCounter(c => c + 1);
    setIsAiWriterUnlocked(false); // Explicitly reset the lock state
  };

  const resetApplication = () => {
    try {
      if (window.confirm('PERINGATAN: Tindakan ini akan menghapus SEMUA data proyek DAN API KEY Anda dari browser ini secara permanen. Ini tidak dapat diurungkan. Lanjutkan?')) {
        dispatch({ type: 'RESET_NOVEL_DATA' });
        setIsAiWriterUnlocked(false);
        setApiKeyState('');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem('novelCraftHasLoaded');
        window.location.reload();
      }
    } catch (e) {
      console.error("Gagal mereset aplikasi:", e);
      alert("Terjadi kesalahan saat mencoba mereset aplikasi. Silakan coba bersihkan data situs secara manual melalui pengaturan browser Anda.");
    }
  };

  return (
    <NovelContext.Provider value={{ novelData, dispatch, saveProjectToFile, loadProjectFromFile, resetProject, resetApplication, resetCounter, isAiWriterUnlocked, setIsAiWriterUnlocked, apiKey, setApiKey }}>
      {children}
    </NovelContext.Provider>
  );
};

export const useNovel = (): NovelContextType => {
  const context = useContext(NovelContext);
  if (!context) {
    throw new Error('useNovel must be used within a NovelProvider');
  }
  return context;
};