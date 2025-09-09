import React, { useState, useMemo } from 'react';
import { useNovel } from '../context/NovelContext';
import { getNewCharacterTemplate, getNewLocationTemplate, getNewObjectTemplate, getNewReferenceTemplate, CHARACTER_ROLES } from '../constants';
import type { Character, Location, NovelObject, Reference } from '../types';


const CharacterCard: React.FC<{ character: Character, index: number, onUpdate: (c: Character) => void, onDelete: () => void }> = ({ character, index, onUpdate, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        onDelete();
    };

    return (
        <details className="character-card bg-white rounded-lg border border-gray-200 shadow-sm">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
                <input type="text" value={character.name} onChange={e => onUpdate({ ...character, name: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-100 rounded px-2 -ml-2 w-full" placeholder="Nama Karakter" />
                <div className="flex items-center">
                    <span className="text-gray-400 p-2 text-lg" title="Klik untuk mengedit">
                        <i className="fas fa-pencil-alt"></i>
                    </span>
                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 p-2 text-lg" title="Hapus">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <label className="font-semibold text-[#4B49AC]">Peran</label>
                        <select value={character.role} onChange={e => onUpdate({ ...character, role: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2">
                           {CHARACTER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <div><label className="font-semibold text-[#4B49AC]">Usia</label><input type="text" value={character.age} onChange={e => onUpdate({ ...character, age: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                    <div><label className="font-semibold text-[#4B49AC]">Jenis Kelamin</label><input type="text" value={character.gender} onChange={e => onUpdate({ ...character, gender: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                    <div><label className="font-semibold text-[#4B49AC]">Asal</label><input type="text" value={character.country} onChange={e => onUpdate({ ...character, country: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                    <div><label className="font-semibold text-[#4B49AC]">Bentuk Tubuh</label><input type="text" value={character.bodyShape} onChange={e => onUpdate({ ...character, bodyShape: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                    <div><label className="font-semibold text-[#4B49AC]">Tinggi</label><input type="text" value={character.height} onChange={e => onUpdate({ ...character, height: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                    <div><label className="font-semibold text-[#4B49AC]">Berat</label><input type="text" value={character.weight} onChange={e => onUpdate({ ...character, weight: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2" /></div>
                </div>
                <div className="space-y-3 text-sm">
                    <div><label className="font-semibold text-[#4B49AC]">Wajah</label><textarea rows={2} value={character.faceDescription} onChange={e => onUpdate({ ...character, faceDescription: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2"></textarea></div>
                    <div><label className="font-semibold text-[#4B49AC]">Rambut</label><textarea rows={2} value={character.hairDescription} onChange={e => onUpdate({ ...character, hairDescription: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2"></textarea></div>
                    <div><label className="font-semibold text-[#4B49AC]">Pakaian</label><textarea rows={2} value={character.clothingDescription} onChange={e => onUpdate({ ...character, clothingDescription: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2"></textarea></div>
                    <div><label className="font-semibold text-[#4B49AC]">Aksesori/Lainnya</label><textarea rows={2} value={character.accessoryDescription} onChange={e => onUpdate({ ...character, accessoryDescription: e.target.value })} className="character-input w-full bg-slate-50 border border-gray-300 rounded mt-1 p-2"></textarea></div>
                </div>
            </div>
        </details>
    );
};

const LocationCard: React.FC<{ location: Location, index: number, onUpdate: (l: Location) => void, onDelete: () => void }> = ({ location, onUpdate, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        onDelete();
    };

    return (
        <details className="character-card bg-white rounded-lg border border-gray-200 shadow-sm">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
                <input type="text" value={location.name} onChange={e => onUpdate({ ...location, name: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-100 rounded px-2 -ml-2 w-full" placeholder="Nama Lokasi" />
                <div className="flex items-center">
                    <span className="text-gray-400 p-2 text-lg" title="Klik untuk mengedit">
                        <i className="fas fa-pencil-alt"></i>
                    </span>
                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 p-2 text-lg" title="Hapus">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200">
                <textarea rows={4} value={location.description} onChange={e => onUpdate({ ...location, description: e.target.value })} className="w-full bg-slate-50 border border-gray-300 rounded p-2" placeholder="Deskripsi lokasi..."></textarea>
            </div>
        </details>
    );
};

const ObjectCard: React.FC<{ object: NovelObject, index: number, onUpdate: (o: NovelObject) => void, onDelete: () => void }> = ({ object, onUpdate, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        onDelete();
    };

    return (
        <details className="character-card bg-white rounded-lg border border-gray-200 shadow-sm">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
                <input type="text" value={object.name} onChange={e => onUpdate({ ...object, name: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-100 rounded px-2 -ml-2 w-full" placeholder="Nama Objek" />
                <div className="flex items-center">
                    <span className="text-gray-400 p-2 text-lg" title="Klik untuk mengedit">
                        <i className="fas fa-pencil-alt"></i>
                    </span>
                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 p-2 text-lg" title="Hapus">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200">
                <textarea rows={4} value={object.description} onChange={e => onUpdate({ ...object, description: e.target.value })} className="w-full bg-slate-50 border border-gray-300 rounded p-2" placeholder="Deskripsi objek..."></textarea>
            </div>
        </details>
    );
};

const ReferenceCard: React.FC<{ reference: Reference, index: number, onUpdate: (r: Reference) => void, onDelete: () => void }> = ({ reference, onUpdate, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        onDelete();
    };

    return (
        <details className="character-card bg-white rounded-lg border border-gray-200 shadow-sm">
            <summary className="flex justify-between items-center p-4 cursor-pointer">
                <input type="text" value={reference.title} onChange={e => onUpdate({ ...reference, title: e.target.value })} className="text-2xl font-bold bg-transparent focus:bg-slate-100 rounded px-2 -ml-2 w-full" placeholder="Judul Referensi" />
                <div className="flex items-center">
                    <span className="text-gray-400 p-2 text-lg" title="Klik untuk mengedit">
                        <i className="fas fa-pencil-alt"></i>
                    </span>
                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-500 p-2 text-lg" title="Hapus">
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-200">
                <textarea rows={8} value={reference.content} onChange={e => onUpdate({ ...reference, content: e.target.value })} className="w-full bg-slate-50 border border-gray-300 rounded p-2" placeholder="Konten referensi..."></textarea>
            </div>
        </details>
    );
};


const Database: React.FC = () => {
    const { novelData, dispatch } = useNovel();
    const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'objects' | 'reference'>('characters');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCharacters = useMemo(() =>
        novelData.characters.filter(char =>
            char.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [novelData.characters, searchTerm]);

    const filteredLocations = useMemo(() =>
        novelData.locations.filter(loc =>
            loc.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [novelData.locations, searchTerm]);

    const filteredObjects = useMemo(() =>
        novelData.objects.filter(obj =>
            obj.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [novelData.objects, searchTerm]);
        
    const filteredReferences = useMemo(() =>
        novelData.references.filter(ref =>
            ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ref.content.toLowerCase().includes(searchTerm.toLowerCase())
        ), [novelData.references, searchTerm]);

    const AddButton = () => {
        switch (activeTab) {
            case 'characters':
                return <button onClick={() => dispatch({ type: 'ADD_CHARACTER', payload: getNewCharacterTemplate() })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0"><i className="fas fa-plus mr-2"></i>Tambah Karakter</button>;
            case 'locations':
                return <button onClick={() => dispatch({ type: 'ADD_LOCATION', payload: getNewLocationTemplate() })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0"><i className="fas fa-plus mr-2"></i>Tambah Lokasi</button>;
            case 'objects':
                return <button onClick={() => dispatch({ type: 'ADD_OBJECT', payload: getNewObjectTemplate() })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0"><i className="fas fa-plus mr-2"></i>Tambah Objek</button>;
            case 'reference':
                return <button onClick={() => dispatch({ type: 'ADD_REFERENCE', payload: getNewReferenceTemplate() })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex-shrink-0"><i className="fas fa-plus mr-2"></i>Tambah Referensi</button>;
            default:
                return null;
        }
    };

    const placeholderTextMap = {
        characters: 'Cari Karakter...',
        locations: 'Cari Lokasi...',
        objects: 'Cari Objek...',
        reference: 'Cari Referensi...'
    };


    const renderTabContent = () => {
        switch (activeTab) {
            case 'characters':
                return (
                    <div className="space-y-6">
                        {filteredCharacters.map((char) => {
                            const originalIndex = novelData.characters.findIndex(c => c.id === char.id);
                            return (
                                <CharacterCard 
                                    key={char.id} 
                                    character={char} 
                                    index={originalIndex}
                                    onUpdate={(c) => dispatch({type: 'UPDATE_CHARACTER', payload: { index: originalIndex, character: c }})}
                                    onDelete={() => dispatch({type: 'DELETE_CHARACTER', payload: originalIndex})}
                                />
                            );
                        })}
                    </div>
                );
            case 'locations':
                 return (
                    <div className="space-y-6">
                        {filteredLocations.map((loc) => {
                            const originalIndex = novelData.locations.findIndex(l => l.id === loc.id);
                            return (
                                <LocationCard 
                                    key={loc.id} 
                                    location={loc}
                                    index={originalIndex}
                                    onUpdate={(l) => dispatch({type: 'UPDATE_LOCATION', payload: { index: originalIndex, location: l }})}
                                    onDelete={() => dispatch({type: 'DELETE_LOCATION', payload: originalIndex})}
                                />
                            );
                        })}
                    </div>
                );
            case 'objects':
                 return (
                    <div className="space-y-6">
                        {filteredObjects.map((obj) => {
                             const originalIndex = novelData.objects.findIndex(o => o.id === obj.id);
                            return (
                                <ObjectCard
                                    key={obj.id} 
                                    object={obj} 
                                    index={originalIndex}
                                    onUpdate={(o) => dispatch({type: 'UPDATE_OBJECT', payload: { index: originalIndex, object: o }})}
                                    onDelete={() => dispatch({type: 'DELETE_OBJECT', payload: originalIndex})}
                                />
                            );
                        })}
                    </div>
                );
             case 'reference':
                return (
                    <div className="space-y-6">
                        {filteredReferences.map((ref) => {
                            const originalIndex = novelData.references.findIndex(r => r.id === ref.id);
                            return (
                                <ReferenceCard
                                    key={ref.id}
                                    reference={ref}
                                    index={originalIndex}
                                    onUpdate={(r) => dispatch({ type: 'UPDATE_REFERENCE', payload: { index: originalIndex, reference: r } })}
                                    onDelete={() => dispatch({ type: 'DELETE_REFERENCE', payload: originalIndex })}
                                />
                            );
                        })}
                    </div>
                );
        }
    }

    return (
        <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Database</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('characters')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'characters' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Karakter</button>
                    <button onClick={() => setActiveTab('locations')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'locations' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Lokasi</button>
                    <button onClick={() => setActiveTab('objects')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'objects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Objek</button>
                    <button onClick={() => setActiveTab('reference')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'reference' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>Referensi</button>
                </nav>
            </div>
            
            <div className="flex justify-between items-center my-6 gap-4">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <i className="fas fa-search text-gray-400"></i>
                    </span>
                    <input
                        type="text"
                        placeholder={placeholderTextMap[activeTab]}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <AddButton />
            </div>

            {renderTabContent()}
        </section>
    );
};

export default Database;