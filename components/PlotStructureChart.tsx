
import React from 'react';

interface PlotStructureChartProps {
  totalChapters: number;
  conflictChapter: number;
  climaxChapter: number;
}

const PlotStructureChart: React.FC<PlotStructureChartProps> = ({
  totalChapters,
  conflictChapter,
  climaxChapter,
}) => {
  if (totalChapters <= 0 || conflictChapter <= 1 || conflictChapter >= climaxChapter || climaxChapter >= totalChapters) {
    return (
        <div className="mt-6 text-center text-sm text-amber-800 bg-amber-100 border border-amber-300 rounded-lg p-3">
            Harap pastikan nilai bab valid untuk melihat visualisasi plot (mis., Konflik harus sebelum Klimaks, dan keduanya harus berada dalam jumlah total bab).
        </div>
    );
  }

  const act1Chapters = conflictChapter - 1;
  const act2Chapters = climaxChapter - conflictChapter;
  const act3Chapters = totalChapters - climaxChapter + 1;

  const act1Width = (act1Chapters / totalChapters) * 100;
  const act2Width = (act2Chapters / totalChapters) * 100;
  const act3Width = (act3Chapters / totalChapters) * 100;
  
  const conflictMarkerPosition = ((conflictChapter - 1) / totalChapters) * 100;
  const climaxMarkerPosition = ((climaxChapter - 1) / totalChapters) * 100;

  return (
    <div className="mt-8 space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-8 flex overflow-hidden border border-gray-300">
            <div
                style={{ width: `${act1Width}%`, backgroundColor: '#7DA0FA' }}
                className="flex items-center justify-center text-xs font-bold text-white transition-all duration-500 ease-in-out"
                title={`Babak 1: Pengenalan (Bab 1-${act1Chapters})`}
            >
                Pengenalan
            </div>
            <div
                style={{ width: `${act2Width}%`, backgroundColor: '#4B49AC' }}
                className="flex items-center justify-center text-xs font-bold text-white transition-all duration-500 ease-in-out"
                title={`Babak 2: Konfrontasi (Bab ${conflictChapter}-${climaxChapter-1})`}
            >
                Konfrontasi
            </div>
            <div
                style={{ width: `${act3Width}%`, backgroundColor: '#98BDFF' }}
                className="flex items-center justify-center text-xs font-bold text-gray-800 transition-all duration-500 ease-in-out"
                title={`Babak 3: Penyelesaian (Bab ${climaxChapter}-${totalChapters})`}
            >
                Penyelesaian
            </div>
        </div>
        <div className="relative w-full h-4 text-xs text-gray-600">
             <div style={{ left: `${conflictMarkerPosition}%`}} className="absolute -top-2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-in-out">
                <span className="w-px h-3 bg-indigo-500"></span>
                <span className="mt-1 whitespace-nowrap">Konflik (Bab {conflictChapter})</span>
             </div>
             <div style={{ left: `${climaxMarkerPosition}%`}} className="absolute -top-2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-in-out">
                <span className="w-px h-3 bg-indigo-500"></span>
                <span className="mt-1 whitespace-nowrap">Klimaks (Bab {climaxChapter})</span>
             </div>
        </div>
    </div>
  );
};

export default PlotStructureChart;