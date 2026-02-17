import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GardenScene from './components/GardenScene';
import FloatingTools from './components/Sidebar';
import JournalModal from './components/JournalModal';
import { BouquetSpec, GardenConfig, PlantInstance, InteractionMode, ViewMode, PlantingBrush, ToolType, SoilType, CalendarDay, SoilMap, Mood } from './types';
import { INITIAL_CATALOG, CALENDAR_ROWS, CALENDAR_COLS, MOOD_CONFIG } from './constants';
import * as THREE from 'three';

// --- Calendar Logic for Full Year ---
const getFullYearCalendar = (year: number): CalendarDay[][] => {
  const months: CalendarDay[][] = [];

  for (let m = 0; m < 12; m++) {
    const days: CalendarDay[] = [];
    const firstDay = new Date(year, m, 1);
    const startDayOfWeek = firstDay.getDay(); 
    const totalSlots = CALENDAR_ROWS * CALENDAR_COLS;
    
    // Grid start date (may be previous month)
    const gridStartDate = new Date(year, m, 1);
    gridStartDate.setDate(gridStartDate.getDate() - startDayOfWeek);

    for (let i = 0; i < totalSlots; i++) {
      const current = new Date(gridStartDate);
      current.setDate(current.getDate() + i);
      const isCurrentMonth = current.getMonth() === m;
      
      days.push({
        date: current,
        dayOfMonth: current.getDate(),
        monthIndex: m,
        dayIndex: i,
        isValidDay: isCurrentMonth // Only valid if it belongs to this month
      });
    }
    months.push(days);
  }
  return months;
};

// --- Random Soil Generator (Full Year) ---
const generateRandomSoils = (): SoilMap => {
  const map: SoilMap = {};
  for(let m=0; m<12; m++) {
    for(let i=0; i<CALENDAR_ROWS * CALENDAR_COLS; i++) {
        const r = Math.random();
        let type = SoilType.GRASS;
        if (r < 0.5) type = SoilType.GRASS;
        else if (r < 0.7) type = SoilType.DRY;
        else if (r < 0.85) type = SoilType.MUD;
        else if (r < 0.95) type = SoilType.STONE;
        else type = SoilType.SNOW;
        map[`${m}-${i}`] = type;
    }
  }
  return map;
};

const App: React.FC = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const fullYearCalendar = useMemo(() => getFullYearCalendar(currentYear), [currentYear]);
  
  // --- State ---
  const [catalog, setCatalog] = useState<BouquetSpec[]>(INITIAL_CATALOG);
  const [plants, setPlants] = useState<PlantInstance[]>([]);
  const [soilMap, setSoilMap] = useState<SoilMap>(() => generateRandomSoils());
  const [config, setConfig] = useState<GardenConfig>({
    globalScale: 1.0, windStrength: 0.5, swaySpeed: 1.0, autoRotate: false,
  });
  
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.JOURNAL);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.YEAR);
  const [focusedMonth, setFocusedMonth] = useState<number | null>(null);

  // Auto focus current month on load
  useEffect(() => {
    setFocusedMonth(today.getMonth());
    setViewMode(ViewMode.MONTH);
  }, []);
  
  // VFX State
  const [waterParticles, setWaterParticles] = useState<{ x: number, z: number, id: number }[]>([]);

  // Journal State
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [activeTile, setActiveTile] = useState<{ m: number, d: number } | null>(null);

  const [brush, setBrush] = useState<PlantingBrush>({
    tool: ToolType.FLOWER,
    bouquetKey: 'rose',
    soilType: SoilType.GRASS,
    count: 1 
  });

  // --- GROWTH LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPlants(currentPlants => {
        let changed = false;
        const nextPlants = currentPlants.map(plant => {
          if (plant.growthProgress >= 1.0) return plant; 
          const spec = catalog.find(c => c.key === plant.bouquetKey);
          if (!spec) return plant;
          const tickPercent = 1000 / spec.growthDuration;
          const newProgress = Math.min(1.0, plant.growthProgress + tickPercent);

          if (newProgress !== plant.growthProgress) {
             changed = true;
             return { ...plant, growthProgress: newProgress };
          }
          return plant;
        });
        return changed ? nextPlants : currentPlants;
      });
      setWaterParticles(prev => prev.length ? prev.filter(p => p.id > Date.now() - 2000) : prev);
    }, 1000);
    return () => clearInterval(interval);
  }, [catalog]);

  // --- Interaction Logic ---
  const handleTileInteract = (monthIndex: number, dayIndex: number, point: THREE.Vector3) => {
    
    // If in year view, clicking a tile zooms into that month
    if (viewMode === ViewMode.YEAR) {
      setFocusedMonth(monthIndex);
      setViewMode(ViewMode.MONTH);
      return;
    }

    // CASE A: Journal Mode (Default)
    if (mode === InteractionMode.JOURNAL) {
      setActiveTile({ m: monthIndex, d: dayIndex });
      setIsJournalOpen(true);
      return;
    }

    // CASE B: Creative Mode
    if (mode === InteractionMode.CREATIVE) {
      if (brush.tool === ToolType.SOIL) {
        setSoilMap(prev => ({ ...prev, [`${monthIndex}-${dayIndex}`]: brush.soilType }));
        return;
      }
      
      if (brush.tool === ToolType.WATER) {
        const plantsOnTile = plants.filter(p => p.monthIndex === monthIndex && p.dayIndex === dayIndex);
        if (plantsOnTile.length > 0) {
          setWaterParticles(prev => [...prev, { x: point.x, z: point.z, id: Date.now() }]);
          setPlants(prev => prev.map(p => {
            if (p.monthIndex === monthIndex && p.dayIndex === dayIndex && p.growthProgress < 1.0) {
              return { ...p, growthProgress: Math.min(1.0, p.growthProgress + 0.1) }; 
            }
            return p;
          }));
        }
        return;
      }

      plantFlower(monthIndex, dayIndex, point, brush.bouquetKey, brush.count);
    }
  };

  const plantFlower = (mIndex: number, dIndex: number, point: THREE.Vector3, bouquetKey: string, count: number) => {
    const selectedBouquet = catalog.find(b => b.key === bouquetKey);
    if (!selectedBouquet) return;

    const newCluster: PlantInstance[] = [];
    const spread = 0.35; 

    for (let i = 0; i < count; i++) {
      const offsetX = i === 0 ? 0 : (Math.random() - 0.5) * spread;
      const offsetZ = i === 0 ? 0 : (Math.random() - 0.5) * spread;

      newCluster.push({
        id: uuidv4(),
        monthIndex: mIndex,
        dayIndex: dIndex,
        x: point.x + offsetX,
        z: point.z + offsetZ,
        bouquetKey: selectedBouquet.key,
        stages: selectedBouquet.stages, 
        scale: selectedBouquet.heightScale * (0.8 + Math.random() * 0.4),
        rotationOffset: Math.random() * Math.PI * 2,
        plantedAt: Date.now(),
        growthProgress: 0.0, 
        isWatered: false,
      });
    }
    setPlants(prev => [...prev, ...newCluster]);
  };

  const handleJournalSave = (mood: Mood, note: string) => {
    if (!activeTile) return;
    const moodSettings = MOOD_CONFIG[mood];
    const { m, d } = activeTile;
    setSoilMap(prev => ({ ...prev, [`${m}-${d}`]: moodSettings.soilType }));

    // Find the world position of this tile to plant correctly
    // We can't easily get the Vector3 here without passing it from the click, 
    // but we can recalculate or just accept we need the hit point.
    // For simplicity, we won't plant the flower automatically in this refactor 
    // unless we pass the vector. Let's just update soil for now or improve logic later.
    // Ideally we pass point to setActiveTile.
    setIsJournalOpen(false);
    setActiveTile(null);
  };
  
  const handleZoomOut = () => {
    setViewMode(ViewMode.YEAR);
    setFocusedMonth(null);
  };

  const activeDateStr = activeTile 
    ? fullYearCalendar[activeTile.m][activeTile.d].date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric'}) 
    : '';

  return (
    <div className="w-full h-full relative font-sans text-gray-800 bg-[#f0fdf4]">
      {/* 2D Header */}
      <div className="absolute top-0 left-0 w-full pointer-events-none z-20 flex justify-between p-8 items-start">
        <div className="animate-fade-in-down">
          <h1 className="text-4xl font-extralight text-gray-900 tracking-wider font-serif">
            {viewMode === ViewMode.MONTH && focusedMonth !== null 
              ? new Date(currentYear, focusedMonth).toLocaleString('default', { month: 'long' }) 
              : "Year View"
            }
          </h1>
          <p className="text-xl text-gray-400 font-light mt-1 tracking-[0.2em]">{currentYear}</p>
        </div>
        
        {viewMode === ViewMode.MONTH && (
          <button 
            onClick={handleZoomOut}
            className="pointer-events-auto bg-white/50 backdrop-blur-md px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider text-gray-600 hover:bg-white transition-all shadow-sm"
          >
            Back to Year
          </button>
        )}
      </div>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 cursor-pointer">
        <GardenScene 
           plants={plants} 
           config={config} 
           mode={mode}
           viewMode={viewMode}
           focusedMonth={focusedMonth}
           onMonthSelect={(m) => { setFocusedMonth(m); setViewMode(ViewMode.MONTH); }}
           fullYearCalendar={fullYearCalendar}
           soilMap={soilMap}
           onTileInteract={handleTileInteract}
           waterParticles={waterParticles}
        />
      </div>

      {/* Tools Overlay - Only show in Month view */}
      {viewMode === ViewMode.MONTH && (
        <FloatingTools mode={mode} setMode={setMode} brush={brush} setBrush={setBrush} catalog={catalog} />
      )}

      {/* Journal Modal */}
      <JournalModal isOpen={isJournalOpen} onClose={() => setIsJournalOpen(false)} dateStr={activeDateStr || ''} onSave={handleJournalSave} />
    </div>
  );
};

export default App;