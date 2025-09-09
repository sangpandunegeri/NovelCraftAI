

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNovel } from '../context/NovelContext';
import { GENRES, WRITING_STYLES, ENDING_TYPES, getNewCharacterTemplate, WRITING_PROMPTS } from '../constants';
import { generateChapterContent, generateSynopsis, generateStoryStarters } from '../services/geminiService';
import type { Chapter, Character } from '../types';
import PlotStructureChart from '../components/PlotStructureChart';
import ErrorDisplay from '../components/ErrorDisplay';

const ChoiceButton: React.FC<{ value: string; label: string; selectedValue: string | null; onClick: (value: string) => void; }> = ({ value, label, selectedValue, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`choice-btn border py-2 px-4 rounded-lg transition-all duration-200 text-left ${selectedValue === value ? 'bg-[#4B49AC] border-[#4B49AC] text-white scale-105' : 'border-gray-300 bg-white hover:bg-indigo-500 hover:text-white'}`}
  >
    {label}
  </button>
);

const AIWriter: React.FC = () => {
    const { novelData, dispatch, isAiWriterUnlocked, setIsAiWriterUnlocked } = useNovel();
    const { choices, plotStructure, characters, chapters } = novelData;
    const [isLoading, setIsLoading] = useState(false);
    const [isSynopsisLoading, setIsSynopsisLoading] = useState(false);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
    const [quickAddName, setQuickAddName] = useState('');
    const [currentPrompt, setCurrentPrompt] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<{ openings: string[], incidents: string[] } | null>(null);

    const isFirstChapterWritten = useMemo(() => chapters.length > 0 && chapters[0].content.trim() !== '', [chapters]);

    const selectedStyle = useMemo(() => WRITING_STYLES.find(style => style.name === choices.writingStyle), [choices.writingStyle]);

    const selectNewPrompt = useCallback(() => {
        const promptsForGenre = WRITING_PROMPTS[choices.genre || 'Default'] || WRITING_PROMPTS['Default'];
        const randomIndex = Math.floor(Math.random() * promptsForGenre.length);
        setCurrentPrompt(promptsForGenre[randomIndex]);
    }, [choices.genre]);

    useEffect(() => {
        if (choices.genre) {
            selectNewPrompt();
        } else {
            setCurrentPrompt('');
        }
    }, [choices.genre, selectNewPrompt]);

    useEffect(() => {
        if (choices.synopsis.trim() === '' || !choices.genre) {
            setAiSuggestions(null);
        }
    }, [choices.synopsis, choices.genre]);

    const isLocked = isFirstChapterWritten && !isAiWriterUnlocked;

    const handleUnlock = () => {
        if (window.confirm("Membuka kunci asisten akan mereset semua pilihan perancangan novel dan memungkinkan Anda untuk memulai dari awal untuk menimpa Bab 1. Apakah Anda yakin ingin melanjutkan?")) {
            dispatch({ type: 'RESET_WIZARD_STATE' });
            setSelectedCharacters([]);
            setAiSuggestions(null);
            setIsAiWriterUnlocked(true);
        }
    };

    const handleUpdateChoice = (key: keyof typeof choices, value: any) => {
        dispatch({ type: 'UPDATE_CHOICE', payload: { key, value } });
    };

    const handleUpdatePlot = (key: keyof typeof plotStructure, value: any) => {
        dispatch({ type: 'UPDATE_PLOT_STRUCTURE', payload: { key, value } });
    };

    const handleCharacterToggle = (id: number) => {
        setSelectedCharacters(prev =>
            prev.includes(id) ? prev.filter(charId => charId !== id) : [...prev, id]
        );
    };

    const handleQuickAddCharacter = () => {
        if (quickAddName.trim()) {
            const newChar = { ...getNewCharacterTemplate(), name: quickAddName.trim() };
            dispatch({ type: 'ADD_CHARACTER', payload: newChar });
            setSelectedCharacters(prev => [...prev, newChar.id]);
            setQuickAddName('');
        }
    };

    const isWizardReady = useMemo(() => {
        return choices.genre && choices.premise.trim() && choices.synopsis.trim() && choices.opening && choices.incident && plotStructure.ending && selectedCharacters.length > 0;
    }, [choices, plotStructure, selectedCharacters]);
    
    const generateButtonText = useMemo(() => {
        if (isLocked) return "Asisten Terkunci";
        if (!choices.genre) return "Pilih Genre";
        if (!choices.premise.trim() || !choices.synopsis.trim()) return "Isi Fondasi Cerita (Langkah 3)";
        if (selectedCharacters.length === 0) return "Pilih Karakter (Langkah 7)";
        if (!isWizardReady) return "Lengkapi Semua Langkah";
        return isFirstChapterWritten ? "Tulis Ulang Bab 1 dengan AI" : "Tulis Bab 1 dengan AI";
    }, [isWizardReady, choices, selectedCharacters, isLocked, isFirstChapterWritten]);

    const handleGenerateSynopsis = async () => {
        if (!choices.premise.trim() || !choices.genre) {
            setError('Silakan isi premis dan pilih genre terlebih dahulu untuk mendapatkan saran sinopsis.');
            return;
        }

        setIsSynopsisLoading(true);
        setError('');

        try {
            const generatedSynopsis = await generateSynopsis(choices.premise, choices.genre);
            handleUpdateChoice('synopsis', generatedSynopsis);
        } catch (err: any) {
            setError(err.message || 'Gagal membuat sinopsis. Silakan coba lagi.');
        } finally {
            setIsSynopsisLoading(false);
        }
    };

    const handleGenerateStarters = async () => {
        if (!choices.synopsis.trim() || !choices.genre) {
            setError('Silakan isi sinopsis dan pilih genre terlebih dahulu.');
            return;
        }
        setIsSuggestionLoading(true);
        setError('');
        try {
            const suggestions = await generateStoryStarters(choices.synopsis, choices.genre);
            setAiSuggestions(suggestions);
            // Secara otomatis memilih saran pertama untuk mempermudah pengguna
            if (suggestions.openings.length > 0) {
                handleUpdateChoice('opening', suggestions.openings[0]);
            }
            if (suggestions.incidents.length > 0) {
                handleUpdateChoice('incident', suggestions.incidents[0]);
            }
        } catch (err: any) {
            setError(err.message || 'Gagal membuat saran. Silakan coba lagi.');
        } finally {
            setIsSuggestionLoading(false);
        }
    };


    const generateFirstChapter = useCallback(async () => {
        if (!isWizardReady || isLoading || isLocked) return;

        setIsLoading(true);
        setError('');

        const selectedCharsData = characters.filter(c => selectedCharacters.includes(c.id));
        const protagonist = selectedCharsData[0] || characters[0];
        const characterListPrompt = selectedCharsData.map(c => `- **${c.name}** (${c.role || 'Belum Ditentukan'}, ${c.gender}, ${c.age} tahun): ${c.faceDescription} Mengenakan ${c.clothingDescription}.`).join('\n');
        
        const prompt = `Anda adalah seorang novelis ahli yang ditugaskan untuk menulis bab pertama yang menarik.

**INSTRUKSI UTAMA:**
Tujuan utama Anda adalah menulis Bab 1 dari sebuah novel baru, dengan mematuhi spesifikasi yang diberikan secara ketat. Anda harus mensintesis semua elemen berikut menjadi narasi yang mulus dan menarik.

---

**1. GENRE & GAYA PENULISAN:**
- **Genre**: ${choices.genre}. Tulisan Anda harus membangkitkan suasana, nada, dan konvensi dari genre ini.
- **Tiru Gaya Penulisan**: ${choices.writingStyle}. Ini berarti:
    - **Sudut Pandang**: Gunakan sudut pandang orang ketiga terbatas, berfokus pada pikiran dan perasaan protagonis, ${protagonist.name}.
    - **Prosa**: Gunakan deskripsi yang kaya dan menggugah yang melibatkan indra. Variasikan struktur kalimat untuk menciptakan ritme narasi yang menarik.
    - **Teknik**: Jalin firasat halus dan detail pembangunan dunia secara alami melalui aksi dan dialog, hindari pemaparan yang berlebihan.

**2. PLOT & TEMPO (Cetak Biru Arsitek):**
- **Struktur Keseluruhan**: Ini adalah Bab 1 dari novel ${plotStructure.totalChapters} bab. Konflik utama dimulai di Bab ${plotStructure.conflictChapter}, dan klimaks terjadi di Bab ${plotStructure.climaxChapter}.
- **Tempo untuk Bab 1**: Bab ini adalah PENGENLAN. Tempo harus disengaja.
    - **Bangun "Dunia Normal"**: Perkenalkan kehidupan sehari-hari dan latar protagonis sebelum insiden pemicu.
    - **Bangun Fondasi**: Letakkan dasar untuk konflik utama. Perkenalkan tema atau pertanyaan kunci tanpa menyatakannya secara eksplisit.
    - **Perkenalkan Pertaruhan**: Beri petunjuk tentang apa yang bisa hilang atau didapat oleh protagonis.

**3. PENGEMBANGAN KARAKTER (Protagonis & Pemeran):**
- **Protagonis**: ${protagonist.name}.
    - **Perkenalan**: Perkenalkan mereka melalui tindakan, bukan hanya deskripsi. Tunjukkan kepada kami siapa mereka melalui apa yang mereka lakukan dan katakan.
    - **Ungkap Motivasi & Kelemahan**: Melalui pikiran dan tindakan batin mereka, ungkap tujuan langsung mereka dan beri petunjuk tentang keinginan yang lebih dalam atau kelemahan karakter yang signifikan.
- **Karakter Pendukung di Bab Ini**:
${characterListPrompt}
    - **Bangun Hubungan**: Tentukan dengan jelas hubungan mereka dengan protagonis (${protagonist.name}) dan peran awal mereka dalam cerita. Beri setiap karakter suara yang berbeda. Gunakan peran mereka (misalnya, Protagonis, Antagonis) untuk membentuk interaksi awal mereka.

**4. PERISTIWA NARATIF BAB 1:**
- **Adegan Pembuka**: Bab harus dimulai dengan: "${choices.opening}". Ini harus membangun adegan dan suasana awal.
- **Insiden Pemicu**: Bab harus menyertakan peristiwa berikut yang mengganggu dunia protagonis: "${choices.incident}". Ini adalah katalis yang akan mendorong cerita maju.

**5. CETAK BIRU CERITA INTI (Panduan yang Tidak Berubah):**
- **Premis**: ${choices.premise}
- **Sinopsis Tiga Babak**: ${choices.synopsis}

**6. PERSYARATAN OUTPUT:**
- **Judul**: Mulailah dengan judul bab yang menarik dan relevan.
- **Panjang**: Minimal 2000 kata.
- **Format**: Jangan gunakan format markdown apa pun (seperti #, *, atau _). Secara khusus, hindari penggunaan asteris (*) untuk penekanan dan jangan memulai paragraf atau dialog dengan "— " (em dash diikuti spasi). Hasilkan satu blok teks biasa untuk konten bab, mengikuti format novel standar.

---

Mulai tulis Bab 1 sekarang.`;

        try {
            const generatedText = await generateChapterContent(prompt);
            const newChapter: Chapter = {
                title: 'Bab 1',
                content: generatedText,
                charactersInChapter: selectedCharacters,
                locationsInChapter: [],
                objectsInChapter: [],
                status: 'draft',
                plotPoint: 'Pengenalan',
                summary: '',
            };
            dispatch({ type: 'UPDATE_FIRST_CHAPTER', payload: newChapter });
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan yang tidak diketahui. Silakan periksa koneksi Anda dan coba lagi.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [isWizardReady, isLoading, isLocked, choices, plotStructure, characters, selectedCharacters, dispatch]);
    
    const renderStep = (title: string, content: React.ReactNode) => (
        <div>
            <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">{title}</h3>
            {content}
        </div>
    );
    
    return (
        <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900">Perancangan Novel</h2>
            <p className="text-gray-600 mb-8">Rancang fondasi dan arsitektur plot novel Anda. Gunakan ini hanya untuk memulai Bab 1.</p>
            
            {isFirstChapterWritten && (
                <div className={`p-4 rounded-lg mb-8 border ${isLocked ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-blue-100 border-blue-300 text-blue-800'}`}>
                    {isLocked ? (
                        <>
                            <p className="font-bold">Asisten Terkunci</p>
                            <p>Asisten AI telah membuat Bab 1. Untuk menulis bab berikutnya, silakan pergi ke bagian 'Naskah'. Untuk membuka kunci dan berpotensi menimpa Bab 1, klik di bawah.</p>
                            <button 
                                onClick={handleUnlock}
                                className="mt-3 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                            >
                                <i className="fas fa-lock-open"></i>
                                Buka Kunci
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="font-bold">Asisten Tidak Terkunci</p>
                            <p>Anda sekarang dapat mengubah pengaturan fondasi dan menulis ulang Bab 1. Perubahan apa pun akan menimpa konten yang ada.</p>
                        </>
                    )}
                </div>
            )}
            
            <div className={`space-y-8 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                {renderStep("Langkah 1: Genre", (
                    <select value={choices.genre || ''} onChange={e => handleUpdateChoice('genre', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-3">
                        <option value="">-- Pilih --</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                ))}
                
                {choices.genre && (
                    <>
                        {renderStep("Langkah 2: Gaya Penulisan", (
                            <>
                                <select value={choices.writingStyle} onChange={e => handleUpdateChoice('writingStyle', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-3">
                                    {WRITING_STYLES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                                {selectedStyle && (
                                    <div className="mt-3 bg-indigo-50 border border-indigo-200 text-indigo-800 p-3 rounded-lg text-sm">
                                        <p><strong className="font-semibold">Kelebihan:</strong> {selectedStyle.description}</p>
                                    </div>
                                )}
                            </>
                        ))}
                        <div className="space-y-6 pt-4 border-t border-gray-200"><h3 className="text-2xl font-bold text-gray-900">Langkah 3: Fondasi Cerita</h3>
                            <div><label htmlFor="premise-input" className="block text-lg font-medium text-gray-700 mb-2">Premis</label><textarea id="premise-input" value={choices.premise} onChange={e => handleUpdateChoice('premise', e.target.value)} rows={2} className="w-full bg-white border border-gray-300 rounded-lg p-3" placeholder="Ringkasan satu kalimat dari inti cerita..."></textarea></div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="synopsis-input" className="block text-lg font-medium text-gray-700">Sinopsis Tiga Babak</label>
                                    <button
                                        onClick={handleGenerateSynopsis}
                                        disabled={!choices.premise.trim() || !choices.genre || isSynopsisLoading || isLoading || isLocked}
                                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        title={!choices.premise.trim() || !choices.genre ? 'Isi premis dan genre terlebih dahulu' : 'Dapatkan saran sinopsis dari AI'}
                                    >
                                        {isSynopsisLoading ? (
                                            <i className="fas fa-spinner fa-spin"></i>
                                        ) : (
                                            <i className="fas fa-wand-magic-sparkles"></i>
                                        )}
                                        <span>{choices.synopsis.trim() ? 'Dapatkan Alternatif' : 'Sarankan'}</span>
                                    </button>
                                </div>
                                <textarea id="synopsis-input" value={choices.synopsis} onChange={e => handleUpdateChoice('synopsis', e.target.value)} rows={6} className="w-full bg-white border border-gray-300 rounded-lg p-3" placeholder="Babak 1 (Pengenalan)...&#10;Babak 2 (Konfrontasi)...&#10;Babak 3 (Penyelesaian)..."></textarea>
                            </div>
                        </div>

                        <div className="text-center my-6">
                            <button 
                                onClick={handleGenerateStarters} 
                                disabled={isSuggestionLoading || !choices.synopsis.trim() || !choices.genre}
                                className="bg-[#4B49AC] hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-md flex items-center justify-center gap-3 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                title={!choices.synopsis.trim() || !choices.genre ? 'Isi sinopsis dan genre terlebih dahulu' : 'Analisis sinopsis untuk mendapatkan saran'}
                            >
                                {isSuggestionLoading 
                                    ? <i className="fas fa-spinner fa-spin"></i> 
                                    : <i className="fas fa-wand-magic-sparkles"></i>
                                }
                                <span>{aiSuggestions ? 'Dapatkan Alternatif Saran' : 'Sarankan Adegan & Insiden'}</span>
                            </button>
                        </div>
                        
                        {renderStep("Langkah 4: Adegan Pembuka", (
                            <>
                                {isSuggestionLoading ? (
                                    <div className="flex justify-center items-center p-4">
                                        <div className="loader"></div>
                                    </div>
                                ) : aiSuggestions && aiSuggestions.openings.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {aiSuggestions.openings.map(o => <ChoiceButton key={o} value={o} label={o} selectedValue={choices.opening} onClick={(v) => handleUpdateChoice('opening', v)} />)}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 bg-slate-100 p-4 rounded-lg text-center">
                                        <p>Isi Sinopsis dan Genre, lalu klik tombol <span className="font-semibold">"Sarankan Adegan & Insiden"</span> di atas untuk melihat rekomendasi yang dianalisis oleh AI.</p>
                                    </div>
                                )}
                            </>
                        ))}
                        
                        {renderStep("Langkah 5: Insiden Pemicu", (
                             <>
                                {!isSuggestionLoading && (
                                    aiSuggestions && aiSuggestions.incidents.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {aiSuggestions.incidents.map(i => <ChoiceButton key={i} value={i} label={i} selectedValue={choices.incident} onClick={(v) => handleUpdateChoice('incident', v)} />)}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-500 bg-slate-100 p-4 rounded-lg text-center">
                                            <p>Saran insiden pemicu akan muncul di sini.</p>
                                        </div>
                                    )
                                )}
                            </>
                        ))}
                        
                        <div className="space-y-8 pt-8 border-t border-gray-200">
                             <h3 className="text-2xl font-bold text-gray-900">Langkah 6: Arsitektur Plot</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div><label htmlFor="total-chapters" className="block text-lg font-medium text-gray-700 mb-2">Total Bab</label><input type="number" id="total-chapters" value={plotStructure.totalChapters} onChange={e => handleUpdatePlot('totalChapters', parseInt(e.target.value))} min="3" max="50" className="w-full bg-white border border-gray-300 rounded-lg p-3" /></div>
                                <div><label htmlFor="conflict-chapter" className="block text-lg font-medium text-gray-700 mb-2">Mulai Konflik</label><input type="number" id="conflict-chapter" value={plotStructure.conflictChapter} onChange={e => handleUpdatePlot('conflictChapter', parseInt(e.target.value))} min="2" max={plotStructure.totalChapters-1} className="w-full bg-white border border-gray-300 rounded-lg p-3" /></div>
                                <div><label htmlFor="climax-chapter" className="block text-lg font-medium text-gray-700 mb-2">Klimaks</label><input type="number" id="climax-chapter" value={plotStructure.climaxChapter} onChange={e => handleUpdatePlot('climaxChapter', parseInt(e.target.value))} min={plotStructure.conflictChapter + 1} max={plotStructure.totalChapters-1} className="w-full bg-white border border-gray-300 rounded-lg p-3" /></div>
                             </div>
                             <PlotStructureChart
                                totalChapters={plotStructure.totalChapters}
                                conflictChapter={plotStructure.conflictChapter}
                                climaxChapter={plotStructure.climaxChapter}
                             />
                             <div><h4 className="text-lg font-medium text-gray-700 mb-3">Tipe Akhir Cerita</h4><div className="flex flex-wrap gap-3">
                                 {ENDING_TYPES.map(e => <ChoiceButton key={e} value={e} label={e} selectedValue={plotStructure.ending} onClick={(v) => handleUpdatePlot('ending', v)} />)}
                             </div></div>
                        </div>

                         <div className="space-y-4 pt-8 border-t border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-900">Langkah 7: Karakter Bab 1</h3>
                            <div className="flex gap-2 mb-4">
                                <input type="text" value={quickAddName} onChange={e => setQuickAddName(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg p-2" placeholder="Nama karakter baru..."/>
                                <button onClick={handleQuickAddCharacter} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"><i className="fas fa-plus"></i></button>
                            </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 {characters.map((char) => (
                                     <div key={char.id}>
                                         <input type="checkbox" id={`char-check-${char.id}`} checked={selectedCharacters.includes(char.id)} onChange={() => handleCharacterToggle(char.id)} className="hidden peer"/>
                                         <label htmlFor={`char-check-${char.id}`} className="block border border-gray-300 bg-white p-3 rounded-lg cursor-pointer peer-checked:bg-[#4B49AC] peer-checked:border-[#4B49AC] peer-checked:text-white transition">{char.name}</label>

                                     </div>
                                 ))}
                             </div>
                        </div>
                    </>
                )}
            </div>

            <div className="pt-6 border-t border-gray-200 mt-8">
                {choices.genre && currentPrompt && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-[#4B49AC] mb-4 text-center">Pemicu Inspirasi</h3>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center shadow-sm">
                            <p className="text-lg italic text-gray-600">"{currentPrompt}"</p>
                            <button 
                                onClick={selectNewPrompt} 
                                className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors mx-auto"
                            >
                                <i className="fas fa-lightbulb"></i>
                                Dapatkan Pemicu Baru
                            </button>
                        </div>
                    </div>
                )}
                <ErrorDisplay message={error} onRetry={generateFirstChapter} onDismiss={() => setError('')} />
                <button onClick={generateFirstChapter} disabled={!isWizardReady || isLoading || isLocked} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition w-full flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'AI sedang menulis...' : <><i className="fas fa-wand-magic-sparkles mr-3"></i><span>{generateButtonText}</span></>}
                </button>
                {isLoading && <div className="loader mx-auto mt-4"></div>}
            </div>
        </section>
    );
};

export default AIWriter;