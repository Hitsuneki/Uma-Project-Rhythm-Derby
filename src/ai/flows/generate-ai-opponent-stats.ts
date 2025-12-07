'use server';

/**
 * @fileOverview Generates base stats for AI opponents in the Mini Uma Stable game.
 *
 * - generateAiOpponentStats - A function that generates base stats for AI opponents.
 * - AiOpponentStatsInput - The input type for the generateAiOpponentStats function.
 * - AiOpponentStatsOutput - The return type for the generateAiOpponentStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiOpponentStatsInputSchema = z.object({
  umaCount: z.number().describe('The number of AI Uma opponents to generate.'),
  distanceType: z.enum(['Short', 'Mid', 'Long']).describe('The distance type of the race.'),
});
export type AiOpponentStatsInput = z.infer<typeof AiOpponentStatsInputSchema>;

const AiOpponentStatsOutputSchema = z.array(
  z.object({
    speed: z.number().describe('The speed stat of the AI Uma.'),
    stamina: z.number().describe('The stamina stat of the AI Uma.'),
    power: z.number().describe('The power stat of the AI Uma.'),
    technique: z.number().describe('The technique stat of the AI Uma.'),
    style: z.enum(['Front', 'Mid', 'Back']).describe('The preferred style of the AI Uma.'),
  })
);
export type AiOpponentStatsOutput = z.infer<typeof AiOpponentStatsOutputSchema>;

export async function generateAiOpponentStats(input: AiOpponentStatsInput): Promise<AiOpponentStatsOutput> {
  return generateAiOpponentStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiOpponentStatsPrompt',
  input: {schema: AiOpponentStatsInputSchema},
  output: {schema: AiOpponentStatsOutputSchema},
  prompt: `You are an AI opponent generator for the Mini Uma Stable game.

  Generate base stats for {{umaCount}} AI Uma opponents.

  The race distance is {{distanceType}}.

  The output should be a JSON array of Uma objects, each with speed, stamina, power, technique, and style.

  The stats should be reasonable for a Uma Musume character.

  The style should be Front, Mid, or Back.
`,
});

const generateAiOpponentStatsFlow = ai.defineFlow(
  {
    name: 'generateAiOpponentStatsFlow',
    inputSchema: AiOpponentStatsInputSchema,
    outputSchema: AiOpponentStatsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
