import React, { useState } from 'react';
import { BouquetSpec, InteractionMode, PlantingBrush, ToolType, SoilType } from '../types';
import { SOIL_COLORS, SOIL_NAMES } from '../constants';

interface FloatingToolsProps {
  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;
  brush: PlantingBrush;
  setBrush: React.Dispatch<React.SetStateAction<PlantingBrush>>;
  catalog: BouquetSpec[];
}

const FloatingTools: React.FC<FloatingToolsProps> = ({
  mode, setMode, brush, setBrush, catalog
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Creative Mode Toggle
  const toggleMode = () => {
    if (mode === InteractionMode.CREATIVE) {
      setMode(InteractionMode.JOURNAL);
      setIsOpen(false);
    } else {
      setMode(InteractionMode.CREATIVE);
      setIsOpen(true);
    }
  };

  return (
    <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      
      {/* Expanded Menu (Only if Creative Mode is active & menu open) */}
      {isOpen && mode === InteractionMode.CREATIVE && (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 w-64 animate-fade-in-up origin-bottom-right">
          
          <div className="mb-4 flex gap-2 border-b border-gray-200 pb-2">
            <button 
              onClick={() => setBrush({...brush, tool: ToolType.FLOWER})}
              className={`flex-1 text-xs font-bold py-1 uppercase rounded ${brush.tool === ToolType.FLOWER ? 'bg-green-100 text-green-800' : 'text-gray-400'}`}
            >
              Plant
            </button>
            <button 
              onClick={() => setBrush({...brush, tool: ToolType.WATER})}
              className={`flex-1 text-xs font-bold py-1 uppercase rounded ${brush.tool === ToolType.WATER ? 'bg-blue-100 text-blue-800' : 'text-gray-400'}`}
            >
              Water
            </button>
            <button 
              onClick={() => setBrush({...brush, tool: ToolType.SOIL})}
              className={`flex-1 text-xs font-bold py-1 uppercase rounded ${brush.tool === ToolType.SOIL ? 'bg-amber-100 text-amber-800' : 'text-gray-400'}`}
            >
              Soil
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {brush.tool === ToolType.FLOWER && (
               catalog.map((item) => (
                 <button
                   key={item.key}
                   onClick={() => setBrush({...brush, bouquetKey: item.key})}
                   className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${brush.bouquetKey === item.key ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}
                 >
                    <img src={item.previewImage} className="w-8 h-8 object-contain" style={{ imageRendering: 'pixelated' }} />
                    <span className="text-xs font-medium text-gray-700">{item.name}</span>
                 </button>
               ))
            )}
            
            {brush.tool === ToolType.WATER && (
               <div className="p-4 text-center text-sm text-gray-500">
                  <div className="text-4xl mb-2">💧</div>
                  <p>Click plants to water them!</p>
                  <p className="text-xs mt-2 text-blue-500">Accelerates growth by 10%</p>
               </div>
            )}

            {brush.tool === ToolType.SOIL && (
              (Object.keys(SOIL_COLORS) as SoilType[]).map((sKey) => (
                <button
                  key={sKey}
                  onClick={() => setBrush({...brush, soilType: sKey})}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${brush.soilType === sKey ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                   <div className="w-6 h-6 rounded" style={{ backgroundColor: SOIL_COLORS[sKey] }} />
                   <span className="text-xs font-medium text-gray-700">{SOIL_NAMES[sKey]}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <div className="flex items-center gap-4">
        {mode === InteractionMode.CREATIVE && (
           <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur">
             CREATIVE MODE
           </span>
        )}
        <button 
          onClick={toggleMode}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${mode === InteractionMode.CREATIVE ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
        >
          {mode === InteractionMode.CREATIVE ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default FloatingTools;