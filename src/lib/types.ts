export interface UmaCharacter {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  imageHint: string;
  baseStats: {
    speed: number;
    stamina: number;
    power: number;
    technique: number;
  };
  style: 'Front' | 'Mid' | 'Back';
}

export type Stat = 'speed' | 'stamina' | 'power' | 'technique';

export interface TrainedUma {
  character: UmaCharacter;
  trainedStats: {
    speed: number;
    stamina: number;
    power: number;
    technique: number;
  };
}

export interface RaceParticipant extends TrainedUma {
  score: number;
  placement: number;
}

export interface AiOpponent {
  id: string;
  name: string;
  stats: {
    speed: number;
    stamina: number;
    power: number;
    technique: number;
  };
  style: 'Front' | 'Mid' | 'Back';
}

export interface RaceResult {
  id: string;
  distance: 'Short' | 'Mid' | 'Long';
  participants: (RaceParticipant | (AiOpponent & { score: number, placement: number, character: { name: string, imageUrl: string } }))[];
  playerPlacement: number;
  date: string;
}
