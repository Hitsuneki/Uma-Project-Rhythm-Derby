"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { UmaCharacter, TrainedUma, SprintResult } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { presetCharacters as initialCharacters } from '@/lib/characters';

interface AppContextType {
  selectedCharacter: UmaCharacter | null;
  setSelectedCharacter: (character: UmaCharacter | null) => void;
  trainedCharacter: TrainedUma | null;
  setTrainedCharacter: (character: TrainedUma | null) => void;
  sprintHistory: SprintResult[];
  addSprintToHistory: (result: SprintResult) => void;
  characters: UmaCharacter[];
  updateCharacter: (updatedCharacter: UmaCharacter) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] = useState<UmaCharacter | null>(null);
  const [trainedCharacter, setTrainedCharacter] = useState<TrainedUma | null>(null);
  const [sprintHistory, setSprintHistory] = useLocalStorage<SprintResult[]>('sprintHistory', []);
  const [characters, setCharacters] = useLocalStorage<UmaCharacter[]>('umaCharacters', initialCharacters);


  const addSprintToHistory = (result: SprintResult) => {
    setSprintHistory(prev => [result, ...prev.filter(s => s.umaId === result.umaId)]);
  };

  const updateCharacter = useCallback((updatedCharacter: UmaCharacter) => {
    setCharacters(prev => 
      prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
    );
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
    characters,
    updateCharacter
  }), [selectedCharacter, trainedCharacter, sprintHistory, setSprintHistory, characters, updateCharacter]);

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
