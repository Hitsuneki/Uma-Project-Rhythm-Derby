"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo } from 'react';
import type { UmaCharacter, TrainedUma, RaceResult } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface AppContextType {
  selectedCharacter: UmaCharacter | null;
  setSelectedCharacter: (character: UmaCharacter | null) => void;
  trainedCharacter: TrainedUma | null;
  setTrainedCharacter: (character: TrainedUma | null) => void;
  raceHistory: RaceResult[];
  addRaceToHistory: (result: RaceResult) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<UmaCharacter | null>(null);
  const [trainedCharacter, setTrainedCharacter] = useState<TrainedUma | null>(null);
  const [raceHistory, setRaceHistory] = useLocalStorage<RaceResult[]>('raceHistory', []);


  const addRaceToHistory = (result: RaceResult) => {
    setRaceHistory(prev => [result, ...prev]);
  };
  
  const contextValue = useMemo(() => ({
    selectedCharacter,
    setSelectedCharacter,
    trainedCharacter,
    setTrainedCharacter,
    raceHistory,
    addRaceToHistory
  }), [selectedCharacter, trainedCharacter, raceHistory, setRaceHistory]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
