import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNovel } from '../context/NovelContext';
import { analyzeWritingWithSchema, generateSummary, extractAndLinkAssets } from '../services/geminiService';
import type { Chapter, Character, Location, NovelObject, Reference } from '../types';
import ErrorDisplay from '../components/ErrorDisplay';
import { PLOT_POINTS, getNewCharacterTemplate, getNewLocationTemplate, getNewObjectTemplate } from '../constants';

const NewChapterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        intent: string, 
        characters: number[], 
        locationId: number | string | null, 
        customLocation: string, 
        shouldSummarize: boolean,
        referenceIds: number[]
    ) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const { novelData } = useNovel();
    const [intent, setIntent] = useState('continue');
    const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
    const [location, setLocation] = useState<string>('continue');
    const [customLocation, setCustomLocation] = useState('');
    const [selectedReferenceIds, setSelectedReferenceIds] = useState<number[]>([]);
    const [shouldSummarize, setShouldSummarize] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        setIsLoading(true);
        setError('');
        try {
            await onConfirm(intent, selectedCharacters, location === 'manual' || location === 'continue' ? location : parseInt(location, 10), customLocation, shouldSummarize, selectedReferenceIds);
            // Reset state on successful confirmation before closing
            setIntent('continue');
            setSelectedCharacters([]);
            setLocation('continue');
            setCustomLocation('');
            setSelectedReferenceIds([]);
            setShouldSummarize(true);
            onClose();
        } catch (e: any) {
            setError(e.message || 'Gagal membuat bab. Silakan periksa koneksi Anda dan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl text-gray-800">
                <h2 className="text-2xl font-bold mb-6">Buat Bab {novelData.chapters.length + 1}</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-[#4B49AC] mb-3">1. Apa tujuan dari bab ini?</h3>
                        <select value={intent} onChange={e => setIntent(e.target.value)} className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3">
                            <option value="continue">Lanjutkan Cerita</option>
                            <option value="flashback">Perkenalkan Kilas Balik</option>
                            <option value="conflict">Mulai Konflik Baru</option>
                            <option value="new_char">Perkenalkan Karakter Baru</option>
                        </select>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#4B49AC] mb-3">2. Pilih karakter (opsional)</h3>
                        <p className="text-sm text-gray-500 mb-3 -mt-2">Berikan petunjuk kepada AI tentang siapa yang harus difokuskan.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto">
                            {novelData.characters.map(char => (
                                <div key={char.id}>
                                    <input type="checkbox" id={`modal-char-${char.id}`} value={char.id} className="hidden peer" onChange={e => {
                                        const id = parseInt(e.target.value);
                                        setSelectedCharacters(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
                                    }}/>
                                    <label htmlFor={`modal-char-${char.id}`} className="block border border-gray-300 bg-white p-3 rounded-lg cursor-pointer peer-checked:bg-[#4B49AC] peer-checked:border-[#4B49AC] peer-checked:text-white transition">{char.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#4B49AC] mb-3">3. Pilih lokasi bab</h3>
                        <select value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-50 border border-gray-300 rounded-lg p-3">
                            <option value="continue">[ Lanjutkan dari Bab Sebelumnya ]</option>
                            <option value="manual">[ Tulis Lokasi Baru... ]</option>
                            {novelData.locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                        {location === 'manual' && (
                            <textarea value={customLocation} onChange={e => setCustomLocation(e.target.value)} className="mt-2 w-full bg-slate-50 border border-gray-300 rounded-lg p-2" placeholder="Deskripsikan lokasi baru..."></textarea>
                        )}
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-[#4B49AC] mb-3">4. Gunakan Referensi (Opsional)</h3>
                        <p className="text-sm text-gray-500 mb-3 -mt-2">Pilih referensi dari database Anda untuk memberikan konteks tambahan kepada AI.</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto p-1">
                            {novelData.references.length > 0 ? novelData.references.map(ref => (
                                <div key={ref.id}>
                                    <input type="checkbox" id={`modal-ref-${ref.id}`} value={ref.id} className="hidden peer" onChange={e => {
                                        const id = parseInt(e.target.value);
                                        setSelectedReferenceIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
                                    }}/>
                                    <label htmlFor={`modal-ref-${ref.id}`} className="block border border-gray-300 bg-white p-3 rounded-lg cursor-pointer peer-checked:bg-[#4B49AC] peer-checked:border-[#4B49AC] peer-checked:text-white transition h-full">
                                        <span className="font-semibold block truncate">{ref.title}</span>
                                        <span className="text-xs block truncate opacity-70">{ref.content}</span>
                                    </label>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 col-span-full text-center">Tidak ada referensi di database. Anda dapat menambahkannya di halaman Database.</p>
                            )}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-[#4B49AC] mb-3">5. Opsi Tambahan</h3>
                        <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-lg">
                            <input
                                type="checkbox"
                                id="summarize-checkbox"
                                checked={shouldSummarize}
                                onChange={(e) => setShouldSummarize(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-400 bg-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="summarize-checkbox" className="text-gray-700 cursor-pointer">
                                Buat ringkasan bab secara otomatis setelah selesai.
                            </label>
                        </div>
                    </div>
                </div>
                <div className="mt-8">
                    <ErrorDisplay message={error} onRetry={handleConfirm} onDismiss={() => setError('')} />
                    <div className="flex justify-end gap-4 items-center">
                        {isLoading && <div className="loader !w-6 !h-6 !border-2 mr-auto"></div>}
                        <button onClick={onClose} className="py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100">Batal</button>
                        <button onClick={handleConfirm} disabled={isLoading} className="py-2 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:bg-gray-500 min-w-[150px]">
                            {isLoading ? 'Menulis...' : 'Tulis Bab Baru'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const WritingAnalysisModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    textToAnalyze: string;
    editorRef: React.RefObject<HTMLTextAreaElement>;
}> = ({ isOpen, onClose, textToAnalyze, editorRef }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<{ suggestions: { quote: string, issue: string, suggestion: string }[] } | null>(null);
    const [error, setError] = useState('');
    const { dispatch } = useNovel();
    const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);

    const analyze = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setResults(null);
        try {
            const analysis = await analyzeWritingWithSchema(textToAnalyze);
            setResults(analysis);
        } catch (e: any) {
            setError(e.message || 'Gagal mendapatkan analisis dari AI. Silakan periksa koneksi Anda dan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    }, [textToAnalyze]);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedSuggestions([]);
            analyze();
        }
    }, [isOpen, analyze]);

    const handleToggleSuggestion = (index: number) => {
        setSelectedSuggestions(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleApplySelected = () => {
        if (!results || selectedSuggestions.length === 0) return;

        let newText = textToAnalyze;
        const suggestionsToApply = selectedSuggestions
            .map(index => results.suggestions[index])
            .filter(Boolean);

        suggestionsToApply.forEach(suggestion => {
            newText = newText.replace(suggestion.quote, suggestion.suggestion);
        });

        dispatch({ type: 'SET_CHAPTER_CONTENT', payload: newText });
        onClose();
    };
    
    const handleViewOriginal = (quote: string) => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const text = editor.value;
            const startIndex = text.indexOf(quote);

            if (startIndex !== -1) {
                const endIndex = startIndex + quote.length;
                editor.focus();
                editor.setSelectionRange(startIndex, endIndex);
            } else {
                alert("Tidak dapat menemukan teks asli di editor. Mungkin sudah diubah.");
            }
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white text-gray-800 rounded-lg p-8 w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Hasil Analisis Tulisan AI</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl">&times;</button>
                </div>
                <div className="overflow-y-auto pr-4 flex-1">
                    {isLoading && <div className="loader mx-auto"></div>}
                    <ErrorDisplay message={error} onRetry={analyze} onDismiss={() => { setError(''); onClose(); }} />
                    {!isLoading && !error && results && (
                        <div className="space-y-4">
                            {results.suggestions.length === 0 ? (
                                <p className="text-center text-gray-500">Tidak ditemukan saran spesifik. Tulisan Anda sudah bagus!</p>
                            ) : (
                                results.suggestions.map((item, index) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                id={`suggestion-${index}`}
                                                checked={selectedSuggestions.includes(index)}
                                                onChange={() => handleToggleSuggestion(index)}
                                                className="mt-1 h-5 w-5 rounded border-gray-400 bg-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor={`suggestion-${index}`} className="flex-1 cursor-pointer block">
                                                    <blockquote className="border-l-4 border-indigo-500 pl-4 mb-3 italic text-gray-600">"{item.quote}"</blockquote>
                                                    <p className="mb-1"><strong className="text-red-600">Masalah:</strong> {item.issue}</p>
                                                    <p><strong className="text-green-600">Saran:</strong> {item.suggestion}</p>
                                                </label>
                                                <button
                                                    onClick={() => handleViewOriginal(item.quote)}
                                                    className="mt-3 text-sm bg-gray-200 hover:bg-gray-300 text-indigo-700 font-semibold py-1 px-3 rounded-md transition-colors flex items-center gap-2"
                                                    aria-label={`Lihat kutipan asli untuk: ${item.quote}`}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                    <span>Lihat Asli</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                {results && results.suggestions.length > 0 && (
                     <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end items-center gap-4">
                        <span className="text-sm text-gray-500 mr-auto">
                            {selectedSuggestions.length} saran dipilih
                        </span>
                        <button onClick={onClose} className="py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100">
                            Batal
                        </button>
                        <button 
                            onClick={handleApplySelected}
                            disabled={selectedSuggestions.length === 0}
                            className="py-2 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Terapkan Perubahan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const LinkedAssetsDisplay: React.FC = () => {
    const { novelData } = useNovel();
    const { characters, locations, objects, chapters, currentChapterIndex } = novelData;
    const currentChapter = chapters[currentChapterIndex];

    if (!currentChapter) return null;

    const linkedChars = characters.filter(c => currentChapter.charactersInChapter.includes(c.id));
    const linkedLocs = locations.filter(l => currentChapter.locationsInChapter.includes(l.id));
    const linkedObjs = objects.filter(o => currentChapter.objectsInChapter.includes(o.id));
    
    const AssetList: React.FC<{title: string; items: {name:string}[]; icon: string;}> = ({title, items, icon}) => {
        if (items.length === 0) return null;
        return (
            <div>
                <h4 className="font-semibold text-[#4B49AC] mb-2"><i className={`${icon} mr-2`}></i>{title}</h4>
                <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                        <span key={item.name} className="bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">{item.name}</span>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg p-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Aset yang Ditautkan ke Bab Ini</h3>
            {linkedChars.length === 0 && linkedLocs.length === 0 && linkedObjs.length === 0 ? (
                <p className="text-gray-500 text-sm">Tidak ada aset yang ditautkan. AI akan menautkan aset saat bab baru dibuat.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AssetList title="Karakter" items={linkedChars} icon="fas fa-users" />
                    <AssetList title="Lokasi" items={linkedLocs} icon="fas fa-map-marker-alt" />
                    <AssetList title="Objek" items={linkedObjs} icon="fas fa-gem" />
                </div>
            )}
        </div>
    );
};

const ChapterCompletionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    chapterTitle: string;
}> = ({ isOpen, onClose, onConfirm, chapterTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white text-gray-800 rounded-lg p-8 w-full max-w-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-green-600">Bab Selesai!</h2>
                <p className="text-gray-600 mb-8">Kerja bagus telah menyelesaikan <span className="font-bold">{chapterTitle}</span>. Siap untuk menulis bab berikutnya?</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="py-2 px-6 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300">
                        Belum, Terima Kasih
                    </button>
                    <button onClick={onConfirm} className="py-2 px-6 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold">
                        Ya, Tulis Bab Berikutnya
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteChapterConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    chapterTitle: string | undefined;
}> = ({ isOpen, onClose, onConfirm, chapterTitle }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white text-gray-800 rounded-lg p-8 w-full max-w-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-red-600">Konfirmasi Hapus Bab</h2>
                <p className="text-gray-600 mb-8">
                    Apakah Anda yakin ingin menghapus <span className="font-bold">{chapterTitle || 'bab ini'}</span>?
                    <br />
                    Tindakan ini tidak dapat diurungkan.
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={onClose} className="py-2 px-6 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="py-2 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

const Manuscript: React.FC = () => {
  const { novelData, dispatch } = useNovel();
  const [isNewChapterModalOpen, setIsNewChapterModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completedChapter, setCompletedChapter] = useState<Chapter | null>(null);
  const [summarizingIndex, setSummarizingIndex] = useState<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [chapterToDelete, setChapterToDelete] = useState<number | null>(null);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);
  
  const { characters, locations, objects, chapters, currentChapterIndex, choices, plotStructure } = novelData;
  const currentChapter = chapters[currentChapterIndex];

  const wordCount = useMemo(() => {
    return currentChapter?.content.trim().split(/\s+/).filter(Boolean).length || 0;
  }, [currentChapter]);

  const handleToggleStatus = (index: number) => {
    const chapter = chapters[index];
    if (chapter.status === 'draft') {
        setCompletedChapter(chapter);
        setIsCompletionModalOpen(true);
    }
    dispatch({ type: 'TOGGLE_CHAPTER_STATUS', payload: index });
  };

  const handleConfirmCompletion = () => {
    setIsCompletionModalOpen(false);
    setIsNewChapterModalOpen(true);
  };
  
  const handleDeleteRequest = (index: number) => {
    if (chapters.length > 1) {
        setChapterToDelete(index);
    }
  };

  const handleConfirmDelete = () => {
    if (chapterToDelete !== null) {
        dispatch({ type: 'DELETE_CHAPTER', payload: chapterToDelete });
        setChapterToDelete(null);
    }
  };

  const handleSummarizeChapter = async (index: number) => {
    if (summarizingIndex !== null || !chapters[index] || chapters[index].content.trim().length < 50) return;
    setSummarizingIndex(index);
    try {
        const summary = await generateSummary(chapters[index].content);
        dispatch({ type: 'UPDATE_CHAPTER_SUMMARY', payload: { chapterIndex: index, summary } });
    } catch (error) {
        console.error("Gagal membuat ringkasan:", error);
        alert(`Gagal membuat ringkasan bab: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`);
    } finally {
        setSummarizingIndex(null);
    }
  };

  const handleSuggestTitle = async (index: number) => {
    if (isSuggestingTitle || !chapters[index] || chapters[index].content.trim().length < 50) return;
    setIsSuggestingTitle(true);
    try {
        const { generateChapterTitle } = await import('../services/geminiService');
        const title = await generateChapterTitle(
            chapters[index].content,
            choices.genre || 'Fiksi Umum',
            choices.writingStyle
        );
        dispatch({ type: 'UPDATE_CHAPTER_TITLE', payload: { chapterIndex: index, title } });
    } catch (error) {
        console.error("Gagal menyarankan judul:", error);
        alert(`Gagal menyarankan judul bab: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`);
    } finally {
        setIsSuggestingTitle(false);
    }
  };
    
  const handleCreateNewChapter = async (
      intent: string, 
      selectedCharIds: number[], 
      locationId: number | string | null, 
      customLocation: string, 
      shouldSummarize: boolean,
      referenceIds: number[]
  ) => {
    const { generateChapterContent, generateChapterTitle } = await import('../services/geminiService');
    
    const lastChapter = chapters[chapters.length - 1];
    const context = lastChapter.content.trim().split(/\s+/).slice(-500).join(' ');
    
    const selectedReferences = novelData.references.filter(ref => referenceIds.includes(ref.id));
    const referenceContent = selectedReferences
        .map(ref => `Judul Referensi: ${ref.title}\nKonten: ${ref.content}`)
        .join('\n\n---\n\n');

    const selectedCharsData = characters.filter(c => selectedCharIds.includes(c.id));
    
    const characterListPrompt = selectedCharsData.length > 0
        ? `- **Fokus Karakter**: Fokus utama pada ${selectedCharsData.map(c => `${c.name} (${c.role || 'Belum Ditentukan'})`).join(', ')}.`
        : '';

    let locationPrompt = '';
    
    if (locationId === 'continue') {
        locationPrompt = '- **Lokasi Bab**: Lanjutkan di lokasi yang sama dengan akhir bab sebelumnya.';
    } else if (typeof locationId === 'number') {
        const loc = locations.find(l => l.id === locationId);
        if (loc) {
            locationPrompt = `- **Lokasi Bab**: ${loc.name} - ${loc.description}`;
        }
    } else if (locationId === 'manual' && customLocation.trim()) {
        locationPrompt = `- **Lokasi Bab**: Lokasi baru yang dideskripsikan sebagai: "${customLocation}"`;
    }
    
    const intentMap: { [key: string]: string } = { 'continue': 'Lanjutkan cerita secara logis.', 'flashback': 'Perkenalkan kilas balik yang relevan untuk pengembangan karakter atau plot.', 'conflict': 'Ciptakan atau tingkatkan konflik yang signifikan.', 'new_char': 'Perkenalkan satu atau lebih karakter penting baru.' };
    const newChapterNum = chapters.length + 1;

    const previousChapters = chapters.slice(0, chapters.length);
    const summaries = previousChapters
        .map((chap, i) => (chap.summary ? `- Bab ${i + 1}: ${chap.summary}` : null))
        .filter(Boolean)
        .join('\n');

    const summariesPrompt = summaries.length > 0 ? `- **Ringkasan Cerita Sejauh Ini**:\n${summaries}\n` : '';
    
    const referencePrompt = referenceContent
        ? `- **Dasar Kebenaran Faktual (Informasi Referensi Kritis)**:
Informasi berikut adalah fakta yang harus Anda anggap sebagai kebenaran mutlak. JANGAN mengubah, memanipulasi, atau mengkontradiksi detail apa pun dari referensi ini. Gunakan ini sebagai dasar yang ketat untuk semua detail yang relevan dalam cerita Anda, terutama yang berkaitan dengan sejarah, data, nama, tempat, waktu kejadian, dan sumber tertulis. Cerita Anda harus konsisten dengan fakta-fakta ini.
"""
${referenceContent}
"""
`
        : '';

    const prompt = `Anda adalah seorang novelis ahli yang meniru ${choices.writingStyle}, melanjutkan sebuah cerita. Tulis BAB ${newChapterNum}:
- **Gaya Penulisan**: Pertahankan ${choices.writingStyle}.
- **Fondasi Cerita (PANDUAN UTAMA)**:
    - **Premis**: ${choices.premise}
    - **Sinopsis Tiga Babak**: ${choices.synopsis}
- **Cetak Biru Plot**: Total ${plotStructure.totalChapters} bab. Anda sedang menulis Bab ${newChapterNum}. Posisikan bab ini dengan benar dalam struktur narasi.
${summariesPrompt}${referencePrompt}- **Konteks dari Bab Sebelumnya**: Cerita berakhir dengan: "${context}"
- **Tujuan Utama Bab Ini**: ${intentMap[intent]}
${locationPrompt}
${characterListPrompt}
- **Tugas Anda**: Lanjutkan cerita sesuai dengan tujuan utama. Kembangkan plot dan karakter sesuai dengan cetak biru. Akhiri dengan pengait yang kuat. Jika Anda memperkenalkan karakter, lokasi, atau objek baru yang penting, buatlah mereka mudah diingat.
- **Panjang**: Minimal 2000 kata.
- **Format**: Jangan gunakan markdown (seperti *, #, atau _). Secara khusus, hindari penggunaan asteris (*) untuk penekanan dan jangan memulai paragraf atau dialog dengan "— " (em dash diikuti spasi). Gunakan format novel standar. Jangan sertakan judul bab dalam output.`;

    try {
        const generatedText = await generateChapterContent(prompt);
        
        let chapterTitle = `Bab ${newChapterNum}`;
        try {
            chapterTitle = await generateChapterTitle(generatedText, choices.genre || 'Fiksi Umum', choices.writingStyle);
        } catch (titleError) {
            console.warn("Gagal membuat judul bab, menggunakan judul bawaan.", titleError);
        }

        const summaryText = shouldSummarize ? await generateSummary(generatedText) : '';
        
        const assetData = await extractAndLinkAssets(generatedText, characters, locations, objects);
        
        let updatedCharacters = [...characters];
        let updatedLocations = [...locations];
        let updatedObjects = [...objects];

        const newCharacterIds = assetData.newCharacters.map((charData, i) => {
            const newChar: Character = {
                ...getNewCharacterTemplate(),
                id: Date.now() + i,
                ...charData,
            };
            dispatch({ type: 'ADD_CHARACTER', payload: newChar });
            updatedCharacters.push(newChar);
            return newChar.id;
        });

        const newLocationIds = assetData.newLocations.map((loc, i) => {
            const newLoc: Location = { ...getNewLocationTemplate(), id: Date.now() + i, name: loc.name, description: loc.description };
            dispatch({ type: 'ADD_LOCATION', payload: newLoc });
            updatedLocations.push(newLoc);
            return newLoc.id;
        });

        const newObjectIds = assetData.newObjects.map((obj, i) => {
            const newObj: NovelObject = { ...getNewObjectTemplate(), id: Date.now() + i, name: obj.name, description: obj.description };
            dispatch({ type: 'ADD_OBJECT', payload: newObj });
            updatedObjects.push(newObj);
            return newObj.id;
        });

        const finalCharacterIds = [
            ...updatedCharacters.filter(c => assetData.mentionedExistingCharacterNames.includes(c.name)).map(c => c.id),
            ...newCharacterIds
        ];
        const finalLocationIds = [
            ...updatedLocations.filter(l => assetData.mentionedExistingLocationNames.includes(l.name)).map(l => l.id),
            ...newLocationIds
        ];
        const finalObjectIds = [
            ...updatedObjects.filter(o => assetData.mentionedExistingObjectNames.includes(o.name)).map(o => o.id),
            ...newObjectIds
        ];

        const newChapter: Chapter = {
            title: chapterTitle,
            content: generatedText,
            charactersInChapter: [...new Set(finalCharacterIds)],
            locationsInChapter: [...new Set(finalLocationIds)],
            objectsInChapter: [...new Set(finalObjectIds)],
            status: 'draft',
            plotPoint: 'Belum Diatur',
            summary: summaryText,
        };
        dispatch({ type: 'ADD_CHAPTER', payload: newChapter });
        dispatch({ type: 'SET_CURRENT_CHAPTER_INDEX', payload: chapters.length });
    } catch (error) {
        console.error("Gagal membuat bab baru:", error);
        throw error; // Lemparkan kembali untuk ditangkap oleh modal
    }
  };


  return (
    <section>
      <div className="flex gap-8">
        <div className="w-1/3 lg:w-1/4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Indeks Bab</h2>
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
            {chapters.map((chap, index) => (
              <div
                key={index}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, select')) {
                    return;
                  }
                  dispatch({ type: 'SET_CURRENT_CHAPTER_INDEX', payload: index });
                }}
                className={`border-2 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden p-4 flex flex-col gap-3 ${index === currentChapterIndex ? 'border-[#4B49AC] bg-indigo-50 shadow-lg shadow-indigo-500/10' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-lg">{chap.title}</h4>
                    {chap.summary && (
                      <p className={`text-sm italic mt-2 ${index === currentChapterIndex ? 'text-indigo-800' : 'text-gray-600'}`}>
                        {chap.summary}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRequest(index)}
                    className="text-lg transition-colors text-gray-500 hover:text-red-500 disabled:opacity-50"
                    title="Hapus Bab"
                    disabled={chapters.length <= 1}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <select
                    value={chap.plotPoint || 'Belum Diatur'}
                    onChange={(e) => {
                      dispatch({
                        type: 'UPDATE_CHAPTER_PLOT_POINT',
                        payload: { chapterIndex: index, plotPoint: e.target.value }
                      });
                    }}
                    title="Atur Titik Plot"
                    className={`text-xs p-1 rounded-md border appearance-none focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-50 focus:ring-indigo-500 ${index === currentChapterIndex ? 'bg-[#4B49AC] border-[#4B49AC] text-white font-semibold' : 'bg-gray-200 border-gray-300 text-gray-700'}`}
                  >
                    {PLOT_POINTS.map(point => (
                      <option key={point} value={point} className="bg-white text-gray-800 font-semibold">
                        {point}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleToggleStatus(index)}
                    className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${chap.status === 'final' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                  >
                    {chap.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setIsNewChapterModalOpen(true)} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"><i className="fas fa-plus mr-2"></i>Buat Bab Baru</button>
        </div>
        <div className="w-2/3 lg:w-3/4">
          <div className="bg-slate-200 p-3 rounded-t-lg flex justify-between items-center text-sm gap-4">
             <div className="flex-grow flex items-center gap-2">
                <input
                    type="text"
                    value={currentChapter?.title || ''}
                    onChange={(e) => dispatch({ type: 'UPDATE_CHAPTER_TITLE', payload: { chapterIndex: currentChapterIndex, title: e.target.value } })}
                    className="font-semibold text-xl bg-transparent focus:bg-white rounded-md px-2 py-1 w-full border border-transparent focus:border-gray-300 transition-colors"
                    placeholder="Judul Bab"
                />
                <button
                    onClick={() => handleSuggestTitle(currentChapterIndex)}
                    disabled={isSuggestingTitle || !currentChapter || currentChapter.content.trim().length < 50}
                    className="text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed p-2 rounded-full hover:bg-indigo-100 transition-colors"
                    title="Sarankan judul dengan AI"
                >
                    {isSuggestingTitle ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                </button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setIsAnalysisModalOpen(true)} className="bg-white hover:bg-slate-50 text-gray-800 font-bold py-1 px-3 rounded-lg text-sm flex items-center justify-center gap-2" title="Analyze Writing with AI">
                    <i className="fas fa-search-plus"></i>
                    <span>Analisis</span>
                </button>
                <button 
                  onClick={() => handleSummarizeChapter(currentChapterIndex)} 
                  disabled={summarizingIndex !== null || (currentChapter && currentChapter.content.trim().length < 50)} 
                  className="bg-white hover:bg-slate-50 text-gray-800 font-bold py-1 px-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  title={currentChapter?.summary ? "Buat ulang ringkasan" : "Buat ringkasan dengan AI"}
                >
                  {summarizingIndex === currentChapterIndex ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-stream"></i>}
                  <span>{currentChapter?.summary ? "Buat Ulang" : "Ringkas"}</span>
                </button>
                <span className="font-semibold text-indigo-600 ml-2">{wordCount} Kata</span>
            </div>
          </div>
           <div className="bg-white border-x border-b border-gray-200 p-2 flex items-center justify-center gap-2">
                <button onClick={() => setTextAlign('left')} title="Rata Kiri" className={`px-3 py-1 rounded ${textAlign === 'left' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-align-left"></i></button>
                <button onClick={() => setTextAlign('center')} title="Rata Tengah" className={`px-3 py-1 rounded ${textAlign === 'center' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-align-center"></i></button>
                <button onClick={() => setTextAlign('right')} title="Rata Kanan" className={`px-3 py-1 rounded ${textAlign === 'right' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-align-right"></i></button>
                <button onClick={() => setTextAlign('justify')} title="Rata Kanan-Kiri" className={`px-3 py-1 rounded ${textAlign === 'justify' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}><i className="fas fa-align-justify"></i></button>
            </div>
          {currentChapter?.summary && (
            <div className="bg-indigo-100 border-x border-b border-indigo-200 p-4">
                <p className="text-base italic text-indigo-800 leading-relaxed">{currentChapter.summary}</p>
            </div>
          )}
          <textarea
            ref={editorRef}
            value={currentChapter?.content || ''}
            onChange={(e) => dispatch({ type: 'SET_CHAPTER_CONTENT', payload: e.target.value })}
            disabled={currentChapter?.status === 'final'}
            className="w-full h-[55vh] bg-white border-x border-gray-200 p-6 text-lg"
            placeholder="Naskah akan muncul di sini..."
            style={{ textAlign: textAlign }}
          />
          <LinkedAssetsDisplay />
        </div>
      </div>
      <NewChapterModal 
        isOpen={isNewChapterModalOpen} 
        onClose={() => setIsNewChapterModalOpen(false)}
        onConfirm={handleCreateNewChapter}
      />
       {completedChapter && (
            <ChapterCompletionModal
                isOpen={isCompletionModalOpen}
                onClose={() => setIsCompletionModalOpen(false)}
                onConfirm={handleConfirmCompletion}
                chapterTitle={completedChapter.title}
            />
        )}
      {currentChapter && (
        <WritingAnalysisModal 
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            textToAnalyze={currentChapter.content}
            editorRef={editorRef}
        />
      )}
      <DeleteChapterConfirmationModal 
        isOpen={chapterToDelete !== null}
        onClose={() => setChapterToDelete(null)}
        onConfirm={handleConfirmDelete}
        chapterTitle={chapters[chapterToDelete as number]?.title}
      />
    </section>
  );
};

export default Manuscript;