import { config } from 'dotenv';
config();

import '@/ai/flows/generate-ai-opponent-stats.ts';
import '@/ai/flows/get-character-strategy-hints.ts';
import '@/ai/flows/analyze-ai-opponent-stats.ts';