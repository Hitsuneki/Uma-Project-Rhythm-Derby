import type { UmaCharacter } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) return { imageUrl: '', imageHint: 'placeholder' };
    return { imageUrl: img.imageUrl, imageHint: img.imageHint, description: img.description };
}

export const presetCharacters: UmaCharacter[] = [
  {
    id: 'special-week',
    name: 'Special Week',
    ...getImage('special-week'),
    baseStats: { speed: 80, stamina: 75, power: 70, technique: 65 },
    style: 'Mid',
  },
  {
    id: 'silence-suzuka',
    name: 'Silence Suzuka',
    ...getImage('silence-suzuka'),
    baseStats: { speed: 100, stamina: 60, power: 60, technique: 70 },
    style: 'Front',
  },
  {
    id: 'tokai-teio',
    name: 'Tokai Teio',
    ...getImage('tokai-teio'),
    baseStats: { speed: 85, stamina: 70, power: 65, technique: 80 },
    style: 'Mid',
  },
  {
    id: 'vodka',
    name: 'Vodka',
    ...getImage('vodka'),
    baseStats: { speed: 75, stamina: 70, power: 85, technique: 60 },
    style: 'Back',
  },
  {
    id: 'gold-ship',
    name: 'Gold Ship',
    ...getImage('gold-ship'),
    baseStats: { speed: 65, stamina: 85, power: 80, technique: 60 },
    style: 'Back',
  },
  {
    id: 'daiwa-scarlet',
    name: 'Daiwa Scarlet',
    ...getImage('daiwa-scarlet'),
    baseStats: { speed: 80, stamina: 70, power: 75, technique: 75 },
    style: 'Front',
  },
  {
    id: 'rice-shower',
    name: 'Rice Shower',
    ...getImage('rice-shower'),
    baseStats: { speed: 70, stamina: 90, power: 65, technique: 75 },
    style: 'Back',
  },
  {
    id: 'haru-urara',
    name: 'Haru Urara',
    ...getImage('haru-urara'),
    baseStats: { speed: 60, stamina: 60, power: 60, technique: 60 },
    style: 'Front',
  },
];
