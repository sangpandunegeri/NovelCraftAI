import React, { useState, useCallback, useMemo } from 'react';
import { improveManuscript, applyManuscriptFixes } from '../services/geminiService';
import ErrorDisplay from '../components/ErrorDisplay';
import { WRITING_STYLES } from '../constants';
import { useNovel } from '../context/NovelContext';
import type { Chapter } from '../types';


interface Change {
  original: string;
  suggestion: string;
  reasoning: string;
}

interface AnalysisResult {
  summaryOfChanges: string;
  detailedChanges: Change[];
}

const ManuscriptAnalysis: React.FC = () => {
    const { novelData, dispatch } = useNovel();
    const [manuscriptText, setManuscriptText] = useState('');
    const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);
    const [analysisCategories, setAnalysisCategories] = useState({
        core: true,
        style: false,
        structure: false,
    });
    
    const [writingStyle, setWritingStyle] = useState(WRITING_STYLES[0]?.name || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [revisedText, setRevisedText] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

    const sortedChanges = useMemo(() => {
        if (!result?.detailedChanges) {
            return [];
        }
        
        const getSuggestionPriority = (reasoning: string): number => {
            const lowercasedReasoning = reasoning.toLowerCase();
            // Prioritas Tinggi: Plot, tata bahasa, struktur inti
            if (['lubang plot', 'inkonsistensi', 'tata bahasa', 'struktur kalimat', 'kalimat tidak efektif', 'bertele-tele', 'tanda baca'].some(k => lowercasedReasoning.includes(k))) return 1;
            // Prioritas Sedang: Alur, tempo, struktur keseluruhan
            if (['alur', 'tempo', 'keterbacaan', 'struktur paragraf', 'alur cerita yang terbengkalai'].some(k => lowercasedReasoning.includes(k))) return 2;
            // Prioritas Rendah: Pilihan gaya
            if (['pilihan kata', 'pengulangan kata', 'dialog', 'deskripsi', 'gaya'].some(k => lowercasedReasoning.includes(k))) return 3;
            return 4; // Bawaan
        };

        return [...result.detailedChanges].sort((a, b) => {
            const priorityA = getSuggestionPriority(a.reasoning);
            const priorityB = getSuggestionPriority(b.reasoning);
            return priorityA - priorityB;
        });
    }, [result]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === 'text/plain') {
                setError('');
                setSelectedChapterIndex(null);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setManuscriptText(e.target?.result as string);
                };
                reader.readAsText(file);
            } else {
                setError('Format file tidak valid. Harap unggah file .txt atau salin dan tempel konten Anda.');
            }
        }
    };
    
    const handleLoadProjectSummary = () => {
        const summary = novelData.chapters.map((ch, i) =>
            `Bab ${i + 1}: ${ch.title}\nTitik Plot: ${ch.plotPoint || 'Belum Diatur'}\nRingkasan: ${ch.summary || 'Belum ada ringkasan.'}\n`
        ).join('\n---\n');
        setManuscriptText(summary);
        setSelectedChapterIndex(null);
        setAnalysisCategories(prev => ({ ...prev, structure: true }));
    };

    const handleLoadChapter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const indexStr = e.target.value;
        if (indexStr === '') {
            setSelectedChapterIndex(null);
            setManuscriptText('');
            return;
        }
        const index = parseInt(indexStr, 10);
        if (!isNaN(index) && novelData.chapters[index]) {
            setSelectedChapterIndex(index);
            setManuscriptText(novelData.chapters[index].content);
            setResult(null);
            setRevisedText('');
            setError('');
        }
    };


    const handleCategoryChange = (category: keyof typeof analysisCategories) => {
        setAnalysisCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const handleAnalyze = useCallback(async () => {
        if (!manuscriptText.trim() || !Object.values(analysisCategories).some(v => v)) {
            setError('Silakan masukkan teks naskah dan pilih setidaknya satu kategori analisis.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        setRevisedText('');
        try {
            const selectedOptions: string[] = [];
            if (analysisCategories.core) {
                selectedOptions.push('paragraphs', 'punctuation', 'effectiveSentences', 'grammar');
            }
            if (analysisCategories.style) {
                selectedOptions.push('descriptions', 'dialogue', 'characterExpression', 'writingStyle');
            }
            if (analysisCategories.structure) {
                selectedOptions.push('paragraphStructure', 'descriptiveParagraphs', 'paragraphTypes', 'paragraphPatterns', 'plotPacing');
            }
            
            const analysisResult = await improveManuscript(manuscriptText, selectedOptions, writingStyle);
            setResult(analysisResult);
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat menganalisis naskah.');
        } finally {
            setIsLoading(false);
        }
    }, [manuscriptText, analysisCategories, writingStyle]);

    const handleApplyFixes = useCallback(async () => {
        if (!result) return;
        setIsRevising(true);
        setError('');
        try {
            const newText = await applyManuscriptFixes(manuscriptText, result.detailedChanges);
            setRevisedText(newText);
        } catch (err: any) {
            setError(err.message || 'Gagal menerapkan perbaikan.');
        } finally {
            setIsRevising(false);
        }
    }, [result, manuscriptText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(revisedText).then(() => {
            setCopySuccess('Teks berhasil disalin!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const handleSaveAsChapter = () => {
        const newChapter: Chapter = {
            title: `Bab ${novelData.chapters.length + 1} (Revisi)`,
            content: revisedText,
            charactersInChapter: [],
            locationsInChapter: [],
            objectsInChapter: [],
            status: 'draft',
            plotPoint: 'Belum Diatur',
            summary: '',
        };
        dispatch({ type: 'ADD_CHAPTER', payload: newChapter });
        alert(`Bab "${newChapter.title}" telah disimpan! Anda dapat melihatnya di halaman Naskah.`);
    };

     const handleUpdateChapter = () => {
        if (selectedChapterIndex === null) return;
        dispatch({
            type: 'UPDATE_CHAPTER_CONTENT',
            payload: { chapterIndex: selectedChapterIndex, content: revisedText }
        });
        const chapterTitle = novelData.chapters[selectedChapterIndex].title;
        setUpdateSuccess(`Bab "${chapterTitle}" berhasil diperbarui!`);
        setTimeout(() => setUpdateSuccess(''), 3000);
    };

    const CheckboxCategory: React.FC<{ id: keyof typeof analysisCategories; label: string; description: string }> = ({ id, label, description }) => (
        <div>
            <label htmlFor={`category-${id}`} className="flex items-start gap-3 cursor-pointer">
                <input
                    id={`category-${id}`}
                    type="checkbox"
                    checked={analysisCategories[id]}
                    onChange={() => handleCategoryChange(id)}
                    className="h-5 w-5 rounded border-gray-400 bg-slate-200 text-indigo-600 focus:ring-indigo-500 mt-1 flex-shrink-0"
                />
                <div>
                    <span className="font-semibold text-lg">{label}</span>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </label>
        </div>
    );

    return (
        <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Perbaikan Naskah</h2>
            <p className="text-gray-600 mb-8">Tempel naskah Anda atau unggah file .txt untuk mendapatkan saran perbaikan dari AI.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">1. Masukkan Teks Naskah Anda</h3>
                        <div className="flex items-center gap-4 mb-3 flex-wrap">
                             <label htmlFor="file-upload" className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                                <i className="fas fa-file-upload"></i> Unggah .txt
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept=".txt,text/plain" onChange={handleFileChange} />
                            <button onClick={handleLoadProjectSummary} className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                                <i className="fas fa-book-open"></i> Muat Ringkasan Proyek
                            </button>
                            <select
                                onChange={handleLoadChapter}
                                value={selectedChapterIndex ?? ''}
                                className="cursor-pointer bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm"
                            >
                                <option value="">Muat Bab dari Proyek...</option>
                                {novelData.chapters.map((chapter, index) => (
                                    <option key={index} value={index}>
                                        {chapter.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <textarea
                            value={manuscriptText}
                            onChange={(e) => setManuscriptText(e.target.value)}
                            rows={15}
                            className="w-full bg-white border border-gray-300 rounded-lg p-4"
                            placeholder="Tempel naskah Anda di sini atau muat ringkasan proyek..."
                        />
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">2. Pilih Area Perbaikan</h3>
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-gray-200">
                             <CheckboxCategory
                                id="core"
                                label="Koreksi Inti & Tata Bahasa"
                                description="Analisis mendalam terhadap tata bahasa, tanda baca, dan kalimat efektif. Mengidentifikasi kalimat yang terlalu panjang atau canggung dan menawarkan perbaikan untuk kejelasan dan alur."
                            />
                             <CheckboxCategory
                                id="style"
                                label="Penyempurnaan Gaya & Prosa"
                                description="Fokus pada pengayaan deskripsi, ekspresi karakter, konsistensi gaya, dan membuat dialog terasa lebih alami, sesuai dengan karakter, dan fungsional untuk memajukan plot."
                            />
                            {analysisCategories.style && (
                                <div className="pl-12">
                                    <label htmlFor="writing-style-select" className="block text-sm font-medium text-gray-700 mb-1">
                                        Pilih Gaya Penulisan untuk Konsistensi:
                                    </label>
                                    <select
                                        id="writing-style-select"
                                        value={writingStyle}
                                        onChange={(e) => setWritingStyle(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg p-2 max-w-sm"
                                    >
                                        {WRITING_STYLES.map(style => (
                                            <option key={style.name} value={style.name}>{style.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <CheckboxCategory
                                id="structure"
                                label="Analisis Struktur & Alur"
                                description="Menganalisis struktur paragraf, alur naratif, dan potensi masalah plot seperti lubang plot, alur cerita yang terbengkalai, dan masalah tempo (paling baik dengan ringkasan)."
                            />
                        </div>
                    </div>

                    <ErrorDisplay message={error} onRetry={handleAnalyze} onDismiss={() => setError('')} />
                    
                    <button onClick={handleAnalyze} disabled={isLoading || !manuscriptText.trim()} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg">
                        {isLoading ? 'Menganalisis...' : <> <i className="fas fa-file-signature"></i> Analisis Naskah </>}
                    </button>
                    {isLoading && <div className="loader mx-auto mt-4"></div>}
                </div>

                {/* Right Column: Output */}
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">3. Hasil Analisis AI</h3>
                    <div className="bg-white rounded-lg p-6 min-h-[60vh] border border-gray-200 shadow-inner">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="loader"></div>
                                <p className="mt-4 text-gray-500">AI sedang menganalisis naskah Anda...</p>
                            </div>
                        ) : revisedText ? (
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-bold text-green-600">Naskah yang Diperbaiki</h4>
                                    <button onClick={() => setRevisedText('')} className="text-sm text-gray-500 hover:text-gray-900">&larr; Kembali ke Saran</button>
                                </div>
                                <textarea
                                    readOnly
                                    value={revisedText}
                                    className="w-full flex-1 bg-slate-50 border border-gray-200 rounded-lg p-4"
                                />
                                <div className="space-y-2">
                                    {updateSuccess && (
                                        <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-center font-semibold" role="alert">
                                            {updateSuccess}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <button onClick={handleSaveAsChapter} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex-1">
                                            <i className="fas fa-save mr-2"></i> Simpan sebagai Bab Baru
                                        </button>
                                        {selectedChapterIndex !== null && (
                                            <button
                                                onClick={handleUpdateChapter}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex-1"
                                                title={`Perbarui konten dari ${novelData.chapters[selectedChapterIndex]?.title}`}
                                            >
                                                <i className="fas fa-sync-alt mr-2"></i> Perbarui Bab Asli
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={handleCopy} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                                        <i className="fas fa-copy mr-2"></i> {copySuccess || 'Salin Teks ke Papan Klip'}
                                    </button>
                                </div>
                            </div>
                        ) : isRevising ? (
                             <div className="flex flex-col items-center justify-center h-full">
                                <div className="loader"></div>
                                <p className="mt-4 text-gray-500">AI sedang menerapkan perbaikan...</p>
                            </div>
                        ) : result ? (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-lg font-bold text-green-600 mb-2">Ringkasan Perubahan</h4>
                                    <p className="text-gray-600 whitespace-pre-wrap">{result.summaryOfChanges}</p>
                                </div>
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-lg font-bold text-green-600 mb-4">Saran Rinci</h4>
                                    <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                                        {result.detailedChanges.length === 0 ? (
                                            <p className="text-gray-500">AI tidak menemukan saran spesifik. Naskah Anda sudah bagus!</p>
                                        ) : (
                                            sortedChanges.map((change, index) => (
                                                <div key={index} className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                                                    <blockquote className="border-l-4 border-red-500 pl-4 mb-3 italic text-gray-600">"{change.original}"</blockquote>
                                                    <p className="mb-2"><strong className="text-amber-700">Alasan:</strong> {change.reasoning}</p>
                                                    <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r-lg">
                                                        <p className="font-semibold text-green-800">Saran:</p>
                                                        <p className="text-gray-700">"{change.suggestion}"</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                {result.detailedChanges.length > 0 && (
                                     <div className="border-t border-gray-200 pt-4 mt-4">
                                        <button onClick={handleApplyFixes} disabled={isRevising} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                           <i className="fas fa-wand-magic-sparkles"></i> Lakukan Perbaikan
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                                <i className="fas fa-magic-sparkles text-4xl mb-4"></i>
                                <p>Hasil analisis Anda akan muncul di sini.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
export default ManuscriptAnalysis;