export interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

export interface BouquetSpec {
  key: string;
  name: string;
  previewImage: string;
  stages: Voxel[][]; // Array of voxel arrays (Seed -> Sprout -> Bud -> Bloom)
  growthDuration: number; // Milliseconds to reach full maturity
  weight: number; 
  heightScale: number;
  enabled: boolean;
}

export interface PlantInstance {
  id: string;
  monthIndex: number; // 0-11
  dayIndex: number; // 0-41 (grid index within month)
  x: number; // World X
  z: number; // World Z
  bouquetKey: string;
  stages: Voxel[][]; 
  scale: number;
  rotationOffset: number;
  plantedAt: number;
  growthProgress: number; 
  isWatered: boolean; 
}

export interface GardenConfig {
  globalScale: number;
  windStrength: number;
  swaySpeed: number;
  autoRotate: boolean;
}

export enum InteractionMode {
  JOURNAL = 'JOURNAL', 
  CREATIVE = 'CREATIVE', 
}

export enum ViewMode {
  YEAR = 'YEAR',
  MONTH = 'MONTH',
}

export enum ToolType {
  FLOWER = 'FLOWER',
  SOIL = 'SOIL',
  WATER = 'WATER',
}

export enum SoilType {
  GRASS = 'GRASS',     
  DRY = 'DRY',         
  MUD = 'MUD',         
  SNOW = 'SNOW',       
  STONE = 'STONE',     
}

export enum Mood {
  HAPPY = 'HAPPY',
  CALM = 'CALM',
  SAD = 'SAD',
  ENERGETIC = 'ENERGETIC',
  LOVED = 'LOVED',
}

export interface PlantingBrush {
  tool: ToolType;
  bouquetKey: string;
  soilType: SoilType;
  count: number;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  monthIndex: number; // 0-11
  dayIndex: number; // 0-41 index in the grid
  isValidDay: boolean; // Is this a real day or just padding?
}

// Map key: "monthIndex-dayIndex" -> SoilType
export type SoilMap = Record<string, SoilType>;