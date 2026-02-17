import { BouquetSpec, Voxel, SoilType, Mood } from './types';

// --- VOXEL HELPERS ---
const addVoxel = (list: Voxel[], x: number, y: number, z: number, color: string) => {
  list.push({ x, y, z, color });
};
const addDisc = (list: Voxel[], cy: number, radius: number, color: string, thickness: number = 1) => {
  for (let y = cy; y < cy + thickness; y++) {
    for (let x = -radius; x <= radius; x++) {
      for (let z = -radius; z <= radius; z++) {
        if (x*x + z*z <= radius*radius + 0.5) {
          addVoxel(list, x, y, z, color);
        }
      }
    }
  }
};
const addSphere = (list: Voxel[], cx: number, cy: number, cz: number, radius: number, color: string) => {
  const r2 = radius * radius;
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const dy = y - cy;
        const dx = x - cx;
        const dz = z - cz;
        if (dx*dx + dy*dy + dz*dz <= r2 + 0.5) {
          addVoxel(list, x, y, z, color);
        }
      }
    }
  }
};
const addStem = (list: Voxel[], height: number, color: string, thickness: number = 0) => {
  for (let y = 0; y < height; y++) {
    addVoxel(list, 0, y, 0, color);
    if (thickness > 0) {
      addVoxel(list, 1, y, 0, color);
      addVoxel(list, -1, y, 0, color);
      addVoxel(list, 0, y, 1, color);
      addVoxel(list, 0, y, -1, color);
    }
  }
};
const generateSeed = (): Voxel[] => {
  const v: Voxel[] = [];
  addDisc(v, 0, 1, '#593c21', 1); 
  addVoxel(v, 0, 1, 0, '#86efac'); 
  return v;
};
const generateSprout = (stemColor: string): Voxel[] => {
  const v: Voxel[] = [];
  addStem(v, 5, stemColor);
  addVoxel(v, 1, 3, 0, stemColor);
  addVoxel(v, -1, 4, 0, stemColor);
  return v;
};

// --- STAGE GENERATORS ---
const generateRoseStages = (): Voxel[][] => {
  const seed = generateSeed();
  const sprout = generateSprout('#15803d');
  const bud: Voxel[] = [];
  addStem(bud, 14, '#15803d');
  addVoxel(bud, 1, 6, 0, '#15803d'); addVoxel(bud, -1, 9, 0, '#15803d'); 
  addSphere(bud, 0, 14, 0, 1.5, '#be123c'); 
  const bloom: Voxel[] = [];
  const stemColor = '#15803d';
  const thornColor = '#3f6212';
  const flowerColor = '#e11d48';
  const petalColor = '#be123c';
  for(let y=0; y<24; y++) {
    const driftX = Math.floor(Math.sin(y * 0.2) * 1.5);
    addVoxel(bloom, driftX, y, 0, stemColor);
    if (y === 6 || y === 12 || y === 18) addVoxel(bloom, driftX + (y%2===0?1:-1), y, 0, thornColor);
    if (y === 8 || y === 16) {
       addVoxel(bloom, driftX+1, y, 0, stemColor); addVoxel(bloom, driftX+2, y+1, 0, stemColor);
       addVoxel(bloom, driftX-1, y, 0, stemColor); addVoxel(bloom, driftX-2, y+1, 0, stemColor);
    }
    if (y === 23) {
      const cx = driftX;
      addDisc(bloom, y, 2, '#064e3b'); 
      addSphere(bloom, cx, y+2, 0, 2.5, flowerColor);
      addVoxel(bloom, cx+1, y+3, 1, petalColor); addVoxel(bloom, cx-1, y+3, -1, petalColor); addVoxel(bloom, cx+1, y+4, -1, petalColor);
    }
  }
  return [seed, sprout, bud, bloom];
};

const generateSunflowerStages = (): Voxel[][] => {
  const seed = generateSeed();
  const sprout = generateSprout('#166534');
  const bud: Voxel[] = [];
  addStem(bud, 18, '#166534', 1); 
  addVoxel(bud, 2, 8, 0, '#166534'); addVoxel(bud, -2, 12, 0, '#166534');
  addDisc(bud, 18, 2, '#451a03'); 
  const bloom: Voxel[] = [];
  const stemColor = '#166534';
  const yellow = '#facc15';
  const brown = '#451a03';
  for(let y=0; y<32; y++) {
    addVoxel(bloom, 0, y, 0, stemColor);
    if (y < 10) { addVoxel(bloom, 1, y, 0, stemColor); addVoxel(bloom, 0, y, 1, stemColor); }
    if (y === 10 || y === 20) {
       const dir = y===10 ? 1 : -1;
       for(let L=1; L<=4; L++) {
         addVoxel(bloom, L*dir, y+Math.floor(L/2), 0, stemColor);
         addVoxel(bloom, L*dir, y+Math.floor(L/2), 1, stemColor);
       }
    }
  }
  const topY = 32;
  addDisc(bloom, topY, 6, yellow);
  addDisc(bloom, topY+1, 3, brown);
  return [seed, sprout, bud, bloom];
};

const generateTulipStages = (): Voxel[][] => {
  const seed = generateSeed();
  const sprout = generateSprout('#86efac');
  const bud: Voxel[] = [];
  addStem(bud, 12, '#86efac');
  for(let y=0; y<8; y++) { addVoxel(bud, 1, y, 0, '#4ade80'); addVoxel(bud, -1, y, 0, '#4ade80'); }
  addSphere(bud, 0, 13, 0, 1.5, '#db2777'); 
  const bloom: Voxel[] = [];
  const stemColor = '#86efac';
  const leafColor = '#4ade80';
  const petalColor = '#db2777';
  const tipColor = '#fbcfe8';
  addStem(bloom, 18, stemColor);
  for(let y=0; y<12; y++) {
     addVoxel(bloom, 1, y, 0, leafColor); addVoxel(bloom, -1, y, 0, leafColor);
     if(y > 4) { addVoxel(bloom, 2, y+1, 0, leafColor); addVoxel(bloom, -2, y+1, 0, leafColor); }
  }
  const cy = 19;
  for(let y=0; y<6; y++) {
    const r = y < 3 ? 3 : 2; 
    const hollow = y > 2;
    for(let x=-r; x<=r; x++) {
      for(let z=-r; z<=r; z++) {
        if (hollow && Math.abs(x)<2 && Math.abs(z)<2) continue;
        if (Math.abs(x)+Math.abs(z) > r+1) continue;
        const col = y === 5 ? tipColor : petalColor;
        addVoxel(bloom, x, cy+y, z, col);
      }
    }
  }
  return [seed, sprout, bud, bloom];
};

const generateDaisyStages = (): Voxel[][] => {
  const seed = generateSeed();
  const sprout = generateSprout('#22c55e');
  const bud: Voxel[] = [];
  addStem(bud, 10, '#22c55e');
  addVoxel(bud, 1, 4, 0, '#22c55e');
  addVoxel(bud, 0, 10, 0, '#fbbf24'); 
  const bloom: Voxel[] = [];
  const stemColor = '#22c55e';
  const white = '#ffffff';
  const gold = '#fbbf24';
  addStem(bloom, 14, stemColor);
  addVoxel(bloom, 1, 4, 0, stemColor); addVoxel(bloom, 2, 5, 0, stemColor);
  addVoxel(bloom, -1, 7, 0, stemColor); addVoxel(bloom, -2, 8, 0, stemColor);
  const cy = 14;
  addVoxel(bloom, 0, cy, 0, gold); addVoxel(bloom, 1, cy, 0, gold);
  addVoxel(bloom, -1, cy, 0, gold); addVoxel(bloom, 0, cy, 1, gold); addVoxel(bloom, 0, cy, -1, gold);
  const petalLen = 3;
  for(let i=1; i<=petalLen; i++) {
    addVoxel(bloom, i+1, cy, 0, white); addVoxel(bloom, -(i+1), cy, 0, white);
    addVoxel(bloom, 0, cy, i+1, white); addVoxel(bloom, 0, cy, -(i+1), white);
    if (i < 3) {
      addVoxel(bloom, i, cy, i, white); addVoxel(bloom, -i, cy, i, white);
      addVoxel(bloom, i, cy, -i, white); addVoxel(bloom, -i, cy, -i, white);
    }
  }
  return [seed, sprout, bud, bloom];
};

const generateLavenderStages = (): Voxel[][] => {
  const seed = generateSeed();
  const sprout = generateSprout('#3f6212');
  const bud: Voxel[] = [];
  addStem(bud, 12, '#3f6212');
  for(let y=6; y<10; y++) { addVoxel(bud, y%2===0?1:-1, y, 0, '#8b5cf6'); }
  const bloom: Voxel[] = [];
  const stemColor = '#3f6212';
  const purple = '#8b5cf6';
  const lightPurple = '#a78bfa';
  addStem(bloom, 16, stemColor);
  
  const x_hash = (n: number) => {
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    n = ((n >> 16) ^ n) * 0x45d9f3b;
    return (n >> 16) ^ n;
  }

  for (let y=6; y<18; y++) {
    for(let i=0; i<4; i++) {
       if ((x_hash(y) + i) % 2 === 0) {
         const dx = (i===0?1:i===1?-1:0);
         const dz = (i===2?1:i===3?-1:0);
         addVoxel(bloom, dx, y, dz, y%2===0 ? purple : lightPurple);
       }
    }
  }
  addVoxel(bloom, 0, 18, 0, lightPurple); addVoxel(bloom, 0, 19, 0, lightPurple);
  return [seed, sprout, bud, bloom];
};

const roseStages = generateRoseStages();
const sunflowerStages = generateSunflowerStages();
const tulipStages = generateTulipStages();
const daisyStages = generateDaisyStages();
const lavenderStages = generateLavenderStages();

const pixelSvg = (color: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#e5e7eb"/><rect x="4" y="2" width="2" height="6" fill="#166534"/><rect x="3" y="1" width="4" height="4" fill="${color}"/></svg>`)}`;

export const INITIAL_CATALOG: BouquetSpec[] = [
  { key: 'rose', name: 'Pixel Rose', previewImage: pixelSvg('#e11d48'), stages: roseStages, growthDuration: 1000 * 60 * 60 * 12, weight: 0.5, heightScale: 1.0, enabled: true },
  { key: 'sunflower', name: 'Pixel Sun', previewImage: pixelSvg('#facc15'), stages: sunflowerStages, growthDuration: 1000 * 60 * 60 * 24, weight: 0.5, heightScale: 1.0, enabled: true },
  { key: 'tulip', name: 'Pixel Tulip', previewImage: pixelSvg('#db2777'), stages: tulipStages, growthDuration: 1000 * 60 * 30, weight: 0.5, heightScale: 1.0, enabled: true },
  { key: 'daisy', name: 'Pixel Daisy', previewImage: pixelSvg('#ffffff'), stages: daisyStages, growthDuration: 1000 * 60 * 10, weight: 0.5, heightScale: 1.0, enabled: true },
  { key: 'lavender', name: 'Pixel Lavender', previewImage: pixelSvg('#7c3aed'), stages: lavenderStages, growthDuration: 1000 * 60 * 45, weight: 0.5, heightScale: 1.0, enabled: true },
];

export const CALENDAR_COLS = 7;
export const CALENDAR_ROWS = 6; 
export const TILE_SIZE = 2.0;
export const TILE_GAP = 0.15; 
export const TILE_HEIGHT = 0.4;
export const MONTH_GAP = 3.0; // Space between month blocks

export const MOOD_CONFIG: Record<Mood, { flowerKey: string; soilType: SoilType; description: string }> = {
  [Mood.HAPPY]: { flowerKey: 'sunflower', soilType: SoilType.GRASS, description: 'Bright and sunny' },
  [Mood.CALM]: { flowerKey: 'daisy', soilType: SoilType.GRASS, description: 'Peaceful and clear' },
  [Mood.SAD]: { flowerKey: 'lavender', soilType: SoilType.MUD, description: 'Rainy and reflective' },
  [Mood.ENERGETIC]: { flowerKey: 'tulip', soilType: SoilType.DRY, description: 'Vibrant and active' },
  [Mood.LOVED]: { flowerKey: 'rose', soilType: SoilType.GRASS, description: 'Warm and cherished' },
};

export const SOIL_NAMES: Record<SoilType, string> = {
  [SoilType.GRASS]: 'Lush Grass',
  [SoilType.DRY]: 'Sand',
  [SoilType.MUD]: 'Dark Soil',
  [SoilType.SNOW]: 'Snow',
  [SoilType.STONE]: 'Pavement',
};

// Updated colors for a cleaner, matte look (Apple-style / Zen)
export const SOIL_COLORS: Record<SoilType, string> = {
  [SoilType.GRASS]: '#86efac', // Soft pastel green
  [SoilType.DRY]: '#fde68a',   // Soft sand
  [SoilType.MUD]: '#a16207',   // Matte brown
  [SoilType.SNOW]: '#ffffff',  // Pure white
  [SoilType.STONE]: '#9ca3af', // Cool gray
};