"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { UmaCharacter, TrainedUma, SprintResult, RaceResult } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { presetCharacters as initialCharacters } from '@/lib/characters';

interface AppContextType {
  selectedCharacter: UmaCharacter | null;
  setSelectedCharacter: (character: UmaCharacter | null) => void;
  trainedCharacter: TrainedUma | null;
  setTrainedCharacter: (character: TrainedUma | null) => void;
  sprintHistory: SprintResult[];
  addSprintToHistory: (result: SprintResult) => void;
  raceHistory: RaceResult[];
  addRaceToHistory: (result: RaceResult) => void;
  characters: UmaCharacter[];
  updateCharacter: (updatedCharacter: UmaCharacter) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<UmaCharacter | null>(null);
  const [trainedCharacter, setTrainedCharacter] = useState<TrainedUma | null>(null);
  const [sprintHistory, setSprintHistory] = useLocalStorage<SprintResult[]>('sprintHistory', []);
  const [raceHistory, setRaceHistory] = useLocalStorage<RaceResult[]>('raceHistory', []);
  const [characters, setCharacters] = useLocalStorage<UmaCharacter[]>('umaCharacters', initialCharacters);


  const addSprintToHistory = (result: SprintResult) => {
    setSprintHistory(prev => [result, ...prev]);
  };
  
  const addRaceToHistory = (result: RaceResult) => {
    setRaceHistory(prev => [result, ...prev]);
  }

  const updateCharacter = useCallback((updatedCharacter: UmaCharacter) => {
    setCharacters(prev => {
        const exists = prev.some(c => c.id === updatedCharacter.id);
        if (exists) {
            return prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c);
        }
        return [...prev, updatedCharacter];
    });

    if (selectedCharacter?.id === updatedCharacter.id) {
        setSelectedCharacter(updatedCharacter);
    }
  }, [setCharacters, selectedCharacter]);
  
  const contextValue = useMemo(() => ({
    selectedCharacter,
    setSelectedCharacter,
    trainedCharacter,
    setTrainedCharacter,
    sprintHistory,
    addSprintToHistory,
    raceHistory,
    addRaceToHistory,
    characters,
    updateCharacter
  }), [selectedCharacter, trainedCharacter, sprintHistory, raceHistory, characters, updateCharacter, addRaceToHistory]);

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
