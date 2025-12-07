'use server';

/**
 * @fileOverview Provides strategy hints for Uma characters based on their stats.
 *
 * - getCharacterStrategyHints - A function that returns strategy hints for a given character.
 * - CharacterStats - The input type for the getCharacterStrategyHints function.
 * - StrategyHints - The return type for the getCharacterStrategyHints function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CharacterStatsSchema = z.object({
  speed: z.number().describe('The speed stat of the character.'),
  stamina: z.number().describe('The stamina stat of the character.'),
  power: z.number().describe('The power stat of the character.'),
  technique: z.number().describe('The technique stat of the character.'),
});
export type CharacterStats = z.infer<typeof CharacterStatsSchema>;

const StrategyHintsSchema = z.object({
  bestDistance: z.string().describe('The recommended distance type (Short, Mid, Long).'),
  preferredStyle: z.string().describe('The recommended racing style (Front, Mid, Back).'),
  aiOpponentAnalysis: z.string().describe('Analysis of AI opponents stats and how to counter them.'),
});
export type StrategyHints = z.infer<typeof StrategyHintsSchema>;

export async function getCharacterStrategyHints(
  characterStats: CharacterStats
): Promise<StrategyHints> {
  return getCharacterStrategyHintsFlow(characterStats);
}

const prompt = ai.definePrompt({
  name: 'characterStrategyHintsPrompt',
  input: {schema: CharacterStatsSchema},
  output: {schema: StrategyHintsSchema},
  prompt: `You are an expert racing strategist, providing hints to players based on their character's stats.

  Analyze the following character stats to determine the best distance and preferred racing style.

  Stats:
  - Speed: {{{speed}}}
  - Stamina: {{{stamina}}}
  - Power: {{{power}}}
  - Technique: {{{technique}}}

  Provide the best distance (Short, Mid, Long) and preferred style (Front, Mid, Back) that suits these stats.
  Also include a brief analysis of AI opponent stats and how to counter them.
  `,
});

const getCharacterStrategyHintsFlow = ai.defineFlow(
  {
    name: 'getCharacterStrategyHintsFlow',
    inputSchema: CharacterStatsSchema,
    outputSchema: StrategyHintsSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
