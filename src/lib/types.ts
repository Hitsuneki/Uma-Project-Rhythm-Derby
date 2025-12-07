export interface UmaCharacter {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  imageHint: string;
  baseStats: {
    speed: number;
    stamina: number;
    technique: number;
  };
  level: number;
  xp: number;
  xpToNextLevel: number;
  temperament: 'Calm' | 'Normal' | 'Fiery';
  comfortMin: number;
  comfortMax: number;
  trait: Trait;
}

export type Stat = 'speed' | 'stamina' | 'technique';

export interface Trait {
  name: string;
  description: string;
}

export interface TrainedUma {
  character: UmaCharacter;
  trainedStats: {
    speed: number;
    stamina: number;
    technique: number;
  };
}

export interface SprintResult {
  id: string;
  umaId: string;
  goodStride: number; // Percentage
  overstrain: number; // Percentage
  underpace: number; // Percentage
  score: number;
  statChanges: Partial<Record<Stat, number>>;
  date: string;
}

export type RaceDistance = 'short' | 'mid' | 'long';

export interface RaceResult {
    id: string;
    umaId: string;
    distance: RaceDistance;
    phase1_quality: number;
    phase2_quality: number;
    phase3_quality: number;
    overall_quality: number;
    raceScore: number;
    placement: number;
    date: string;
}
