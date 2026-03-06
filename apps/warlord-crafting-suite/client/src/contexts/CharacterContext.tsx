import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Character } from '@shared/schema';
import { isPuterAvailable, type GrudgeCharacter } from '@/lib/puter';

interface CharacterContextType {
  character: Character | null;
  setCharacter: (character: Character | null) => void;
  refreshCharacter: () => Promise<void>;
  isPuterMode: boolean;
  setFromPuterCharacter: (puterChar: GrudgeCharacter) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

function puterToCharacter(puterChar: GrudgeCharacter): Character {
  return {
    id: puterChar.id,
    userId: puterChar.puterUuid,
    name: puterChar.name,
    classId: puterChar.classId || null,
    raceId: null,
    profession: puterChar.profession || null,
    level: puterChar.level,
    experience: puterChar.experience,
    gold: puterChar.gold,
    skillPoints: puterChar.skillPoints,
    attributePoints: 0,
    attributes: { Strength: 0, Vitality: 0, Endurance: 0, Intellect: 0, Wisdom: 0, Dexterity: 0, Agility: 0, Tactics: 0 },
    equipment: { head: null, chest: null, legs: null, feet: null, hands: null, shoulders: null, mainHand: null, offHand: null, accessory1: null, accessory2: null },
    currentHealth: null,
    currentMana: null,
    currentStamina: null,
    avatarUrl: null,
    createdAt: new Date(),
  };
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, setCharacterState] = useState<Character | null>(null);
  const [isPuterMode, setIsPuterMode] = useState(false);

  useEffect(() => {
    const puterAvailable = isPuterAvailable();
    setIsPuterMode(puterAvailable);
    
    if (!puterAvailable) {
      const savedCharacterId = localStorage.getItem('activeCharacterId');
      if (savedCharacterId) {
        fetch(`/api/characters/${savedCharacterId}`)
          .then((res) => res.json())
          .then((data) => setCharacterState(data))
          .catch((err) => console.error('Failed to load character:', err));
      }
    } else {
      const savedPuterChar = localStorage.getItem('activePuterCharacter');
      if (savedPuterChar) {
        try {
          const puterChar = JSON.parse(savedPuterChar) as GrudgeCharacter;
          setCharacterState(puterToCharacter(puterChar));
        } catch (err) {
          console.error('Failed to parse Puter character:', err);
        }
      }
    }
  }, []);

  const setCharacter = (char: Character | null) => {
    setCharacterState(char);
    if (char) {
      localStorage.setItem('activeCharacterId', char.id);
    } else {
      localStorage.removeItem('activeCharacterId');
      localStorage.removeItem('activePuterCharacter');
    }
  };

  const setFromPuterCharacter = (puterChar: GrudgeCharacter) => {
    const char = puterToCharacter(puterChar);
    setCharacterState(char);
    localStorage.setItem('activePuterCharacter', JSON.stringify(puterChar));
    localStorage.setItem('activeCharacterId', puterChar.id);
  };

  const refreshCharacter = async () => {
    if (character && !isPuterMode) {
      const res = await fetch(`/api/characters/${character.id}`);
      const data = await res.json();
      setCharacterState(data);
    }
  };

  return (
    <CharacterContext.Provider value={{ character, setCharacter, refreshCharacter, isPuterMode, setFromPuterCharacter }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within CharacterProvider');
  }
  return context;
}
