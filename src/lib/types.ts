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
  temperament: 'Calm' | 'Normal' | 'Fiery';
  comfortMin: number;
  comfortMax: number;
  trait: {
    name: string;
    description: string;
  };
}

export type Stat = 'speed' | 'stamina' | 'technique';

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

export interface ShowcaseRace {
    id: string;
    umaId: string;
    raceScore: number;
    placement: number;
    date: string;
}
