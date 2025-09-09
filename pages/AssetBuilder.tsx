
import React, { useState } from 'react';
import { useNovel } from '../context/NovelContext';
import { getNewCharacterTemplate, getNewLocationTemplate, getNewObjectTemplate, CHARACTER_ROLES } from '../constants';
import { analyzeAssetWithSchema } from '../services/geminiService';
import { Type } from '@google/genai';
import type { Character, Location, NovelObject } from '../types';
import ErrorDisplay from '../components/ErrorDisplay';

const AssetBuilder: React.FC = () => {
    const { dispatch } = useNovel();
    const [inputTab, setInputTab] = useState<'text' | 'image'>('text');
    const [assetType, setAssetType] = useState<'character' | 'location' | 'object'>('character');
    
    // Text input state
    const [textInput, setTextInput] = useState('');
    
    // Image input state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);

    // Form state
    const [charForm, setCharForm] = useState(getNewCharacterTemplate());
    const [locForm, setLocForm] = useState(getNewLocationTemplate());
    const [objForm, setObjForm] = useState(getNewObjectTemplate());

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setBase64Image(result.split(',')[1]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setStatusMessage('');
        setError('');

        let prompt: string;
        let schema: any;

        const sourceText = inputTab === 'text' ? `dari teks ini: "${textInput}"` : 'dari gambar ini';
        const translatedAssetType = assetType === 'character' ? 'karakter' : assetType === 'location' ? 'lokasi' : 'objek';

        if (assetType === 'character') {
            prompt = `Analisis karakter ini ${sourceText} untuk seorang novelis. Ekstrak informasi rinci tentang penampilan fisiknya dan sarankan satu nama yang cocok beserta peran naratifnya (misalnya, Protagonis, Antagonis). Balas dalam format JSON.`;
            schema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: {type: Type.STRING }, gender: { type: Type.STRING }, age: { type: Type.STRING }, faceDescription: { type: Type.STRING }, hairDescription: { type: Type.STRING }, clothingDescription: { type: Type.STRING }, accessoryDescription: { type: Type.STRING }, bodyShape: { type: Type.STRING } } };
        } else {
            prompt = `Analisis ${translatedAssetType} ini ${sourceText} untuk seorang novelis. Deskripsikan secara rinci dan sarankan satu nama yang cocok. Balas dalam format JSON.`;
            schema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } };
        }

        try {
            const data = await analyzeAssetWithSchema<any>(prompt, inputTab === 'image' ? base64Image : null, schema);
            if (assetType === 'character') {
                setCharForm(prev => ({ ...prev, ...data }));
            } else if (assetType === 'location') {
                setLocForm(prev => ({ ...prev, ...data }));
            } else {
                setObjForm(prev => ({ ...prev, ...data }));
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Gagal menganalisis aset. Silakan periksa koneksi Anda dan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAsset = () => {
        let newAsset: Character | Location | NovelObject | null = null;
        let statusAssetType = '';
        if (assetType === 'character') {
            if (!charForm.name) { setStatusMessage('Nama karakter wajib diisi.'); return; }
            newAsset = { ...charForm, id: Date.now() };
            dispatch({ type: 'ADD_CHARACTER', payload: newAsset as Character });
            setCharForm(getNewCharacterTemplate());
            statusAssetType = 'Karakter';
        } else if (assetType === 'location') {
            if (!locForm.name) { setStatusMessage('Nama lokasi wajib diisi.'); return; }
            newAsset = { ...locForm, id: Date.now() };
            dispatch({ type: 'ADD_LOCATION', payload: newAsset as Location });
            setLocForm(getNewLocationTemplate());
            statusAssetType = 'Lokasi';
        } else {
            if (!objForm.name) { setStatusMessage('Nama objek wajib diisi.'); return; }
            newAsset = { ...objForm, id: Date.now() };
            dispatch({ type: 'ADD_OBJECT', payload: newAsset as NovelObject });
            setObjForm(getNewObjectTemplate());
            statusAssetType = 'Objek';
        }
        setStatusMessage(`${statusAssetType} berhasil ditambahkan!`);
        setTimeout(() => setStatusMessage(''), 3000);
    };

    return (
        <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pembuat Aset</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button onClick={() => setInputTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${inputTab === 'text' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Analisis dengan Teks</button>
                            <button onClick={() => setInputTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${inputTab === 'image' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Analisis dengan Gambar</button>
                        </nav>
                    </div>

                    {inputTab === 'text' ? (
                        <div>
                            <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">Tempel Deskripsi Aset</h3>
                            <textarea value={textInput} onChange={e => setTextInput(e.target.value)} rows={8} className="w-full bg-white border border-gray-300 rounded-lg p-3" placeholder="Tempel deskripsi karakter, lokasi, atau objek di sini..."></textarea>
                            <ErrorDisplay message={error} onRetry={handleAnalyze} onDismiss={() => setError('')} />
                            <button onClick={handleAnalyze} disabled={isLoading || textInput.length < 20} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center">
                                {isLoading ? <div className="loader !w-6 !h-6 !border-2"></div> : <><i className="fas fa-search mr-2"></i>Analisis Teks</>}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">Unggah Gambar</h3>
                            <input type="file" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" accept="image/*" />
                            <div className="bg-slate-200 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                                {imagePreview ? <img src={imagePreview} alt="Asset Preview" className="max-h-64 rounded"/> : <p className="text-gray-500">Pratinjau gambar akan muncul di sini</p>}
                            </div>
                            <ErrorDisplay message={error} onRetry={handleAnalyze} onDismiss={() => setError('')} />
                            <button onClick={handleAnalyze} disabled={isLoading || !imageFile} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 flex items-center justify-center">
                                {isLoading ? <div className="loader !w-6 !h-6 !border-2"></div> : <><i className="fas fa-search-plus mr-2"></i>Analisis Gambar</>}
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-[#4B49AC] mb-3">Kreator Aset</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Pilih Tipe Aset:</label>
                        <select value={assetType} onChange={e => setAssetType(e.target.value as any)} className="w-full bg-white border border-gray-300 rounded-lg p-3">
                            <option value="character">Karakter</option>
                            <option value="location">Lokasi</option>
                            <option value="object">Objek</option>
                        </select>
                    </div>

                    {assetType === 'character' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="char-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Karakter</label>
                                    <input id="char-name" type="text" value={charForm.name} onChange={e => setCharForm(f => ({...f, name: e.target.value}))} placeholder="Nama Karakter" className="w-full bg-white p-2 rounded border border-gray-300" />
                                </div>
                                <div>
                                    <label htmlFor="char-role" className="block text-sm font-medium text-gray-700 mb-1">Peran</label>
                                    <select id="char-role" value={charForm.role} onChange={e => setCharForm(f => ({...f, role: e.target.value}))} className="w-full bg-white p-2 rounded border border-gray-300">
                                        {CHARACTER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <label htmlFor="char-age" className="block text-sm font-medium text-gray-700 mb-1">Usia</label>
                                    <input id="char-age" type="text" value={charForm.age} onChange={e => setCharForm(f => ({...f, age: e.target.value}))} placeholder="Usia" className="w-full bg-white p-2 rounded border border-gray-300"/>
                                </div>
                                <div>
                                    <label htmlFor="char-gender" className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                                    <input id="char-gender" type="text" value={charForm.gender} onChange={e => setCharForm(f => ({...f, gender: e.target.value}))} placeholder="Jenis Kelamin" className="w-full bg-white p-2 rounded border border-gray-300"/>
                                </div>
                                <div>
                                    <label htmlFor="char-body" className="block text-sm font-medium text-gray-700 mb-1">Bentuk Tubuh</label>
                                    <input id="char-body" type="text" value={charForm.bodyShape} onChange={e => setCharForm(f => ({...f, bodyShape: e.target.value}))} placeholder="Bentuk Tubuh" className="w-full bg-white p-2 rounded border border-gray-300"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="char-face" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Wajah</label>
                                <textarea id="char-face" value={charForm.faceDescription} onChange={e => setCharForm(f => ({...f, faceDescription: e.target.value}))} rows={2} placeholder="Deskripsi Wajah..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                            <div>
                                <label htmlFor="char-hair" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Rambut</label>
                                <textarea id="char-hair" value={charForm.hairDescription} onChange={e => setCharForm(f => ({...f, hairDescription: e.target.value}))} rows={2} placeholder="Deskripsi Rambut..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                            <div>
                                <label htmlFor="char-clothing" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pakaian</label>
                                <textarea id="char-clothing" value={charForm.clothingDescription} onChange={e => setCharForm(f => ({...f, clothingDescription: e.target.value}))} rows={2} placeholder="Deskripsi Pakaian..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                            <div>
                                <label htmlFor="char-acc" className="block text-sm font-medium text-gray-700 mb-1">Aksesori/Lainnya</label>
                                <textarea id="char-acc" value={charForm.accessoryDescription} onChange={e => setCharForm(f => ({...f, accessoryDescription: e.target.value}))} rows={2} placeholder="Aksesori/Lainnya..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                        </div>
                    )}
                    {assetType === 'location' && (
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="loc-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi</label>
                                <input id="loc-name" type="text" value={locForm.name} onChange={e => setLocForm(f => ({...f, name: e.target.value}))} placeholder="Nama Lokasi" className="w-full bg-white p-2 rounded border border-gray-300" />
                            </div>
                            <div>
                                <label htmlFor="loc-desc" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea id="loc-desc" value={locForm.description} onChange={e => setLocForm(f => ({...f, description: e.target.value}))} rows={4} placeholder="Suasana & Detail Kunci..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                        </div>
                    )}
                    {assetType === 'object' && (
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="obj-name" className="block text-sm font-medium text-gray-700 mb-1">Nama Objek</label>
                                <input id="obj-name" type="text" value={objForm.name} onChange={e => setObjForm(f => ({...f, name: e.target.value}))} placeholder="Nama Objek" className="w-full bg-white p-2 rounded border border-gray-300" />
                            </div>
                            <div>
                                <label htmlFor="obj-desc" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea id="obj-desc" value={objForm.description} onChange={e => setObjForm(f => ({...f, description: e.target.value}))} rows={4} placeholder="Bentuk, Bahan & Fungsi..." className="w-full bg-white p-2 rounded border border-gray-300"></textarea>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={handleAddAsset} className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"><i className="fas fa-plus mr-2"></i>Tambah ke Database</button>
                    <p className="text-center text-amber-600 text-sm h-5">{statusMessage}</p>
                </div>
            </div>
        </section>
    );
};

export default AssetBuilder;
