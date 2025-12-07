'use server';

/**
 * @fileOverview Analyzes AI opponent stats and provides hints to the player.
 *
 * - analyzeAiOpponentStats - A function that analyzes AI opponent stats.
 * - AnalyzeAiOpponentStatsInput - The input type for the analyzeAiOpponentStats function.
 * - AnalyzeAiOpponentStatsOutput - The return type for the analyzeAiOpponentStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAiOpponentStatsInputSchema = z.object({
  speed: z.number().describe('The speed of the AI opponent.'),
  stamina: z.number().describe('The stamina of the AI opponent.'),
  power: z.number().describe('The power of the AI opponent.'),
  technique: z.number().describe('The technique of the AI opponent.'),
});
export type AnalyzeAiOpponentStatsInput = z.infer<
  typeof AnalyzeAiOpponentStatsInputSchema
>;

const AnalyzeAiOpponentStatsOutputSchema = z.object({
  hint: z.string().describe('A hint for the player to use against the AI opponent.'),
});
export type AnalyzeAiOpponentStatsOutput = z.infer<
  typeof AnalyzeAiOpponentStatsOutputSchema
>;

export async function analyzeAiOpponentStats(
  input: AnalyzeAiOpponentStatsInput
): Promise<AnalyzeAiOpponentStatsOutput> {
  return analyzeAiOpponentStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAiOpponentStatsPrompt',
  input: {schema: AnalyzeAiOpponentStatsInputSchema},
  output: {schema: AnalyzeAiOpponentStatsOutputSchema},
  prompt: `You are an expert race analyst providing hints to players.

  Analyze the AI opponent's stats and provide a single, concise hint that the player can use to gain an advantage during the race.

  AI Opponent Stats:
  - Speed: {{{speed}}}
  - Stamina: {{{stamina}}}
  - Power: {{{power}}}
  - Technique: {{{technique}}}

  Hint:`,
});

const analyzeAiOpponentStatsFlow = ai.defineFlow(
  {
    name: 'analyzeAiOpponentStatsFlow',
    inputSchema: AnalyzeAiOpponentStatsInputSchema,
    outputSchema: AnalyzeAiOpponentStatsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
