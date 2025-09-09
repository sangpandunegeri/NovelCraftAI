import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSave: (apiKey: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentApiKey, onSave }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKey(currentApiKey);
    }
  }, [currentApiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-gray-800 m-4">
        <h2 id="settings-title" className="text-2xl font-bold mb-4">Pengaturan</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-1">
              Gemini API Key
            </label>
            <input
              id="api-key-input"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-slate-50 border border-gray-300 rounded-lg p-2"
              placeholder="Masukkan API Key Anda di sini"
              aria-describedby="api-key-description"
            />
            <p id="api-key-description" className="text-xs text-gray-500 mt-2">
              Anda bisa mendapatkan API key dari Google AI Studio. Kunci Anda tidak pernah dikirim ke server kami dan hanya disimpan di penyimpanan lokal browser Anda.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 rounded-lg text-gray-600 hover:bg-gray-100">Batal</button>
          <button onClick={handleSave} className="py-2 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;