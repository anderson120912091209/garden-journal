import React, { useState } from 'react';
import { Mood } from '../types';
import { MOOD_CONFIG } from '../constants';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  onSave: (mood: Mood, note: string) => void;
}

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, dateStr, onSave }) => {
  const [note, setNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>(Mood.HAPPY);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
        <h2 className="text-3xl font-serif text-gray-800 mb-1">{dateStr}</h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-6">Daily Journal</p>
        
        <textarea
          className="w-full h-32 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-green-100 resize-none text-gray-600 mb-6 font-light"
          placeholder="How did your garden grow today?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="space-y-3 mb-8">
           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">How do you feel?</label>
           <div className="flex flex-wrap gap-2">
              {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedMood === mood 
                    ? 'bg-gray-800 text-white border-gray-800 scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {mood}
                </button>
              ))}
           </div>
           <p className="text-xs text-gray-400 italic mt-2">
             Planting: {MOOD_CONFIG[selectedMood].description}
           </p>
        </div>

        <button
          onClick={() => {
            onSave(selectedMood, note);
            setNote('');
          }}
          className="w-full py-4 bg-green-600 text-white font-bold tracking-widest uppercase rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
        >
          Plant Memory
        </button>
      </div>
    </div>
  );
};

export default JournalModal;