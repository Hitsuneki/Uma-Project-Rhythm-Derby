# **App Name**: Mini Uma Stable

## Core Features:

- Uma Character Selection: Allow players to create or select Uma-style characters from a roster of 4-8, each with unique stats and style preferences.
- Training Cycles: Implement short training cycles (10-15 turns) where players choose training options (Speed, Stamina, Power, Technique, Rest) to raise Uma stats, managing energy levels.
- Race Simulation: Simulate races based on Uma stats and distance type (Short, Mid, Long), using a deterministic formula to determine placement.
- Character and Race Data Storage: Enable saving of trained characters and race results to a MySQL database. Using a Node.js API, save characters, training sessions, training logs, races and race participants.
- AI Opponents: Generate base stats for each of the AI Uma opponents that are set to race against the user's Uma.
- Strategy Hints: Use a tool to analyze the player's character stats, advise which is the best distance and preferred style that best suits the player's stats, to provide subtle gameplay assistance.  Also analyze AI characters and give players hints on their stats to enable strategic planning.

## Style Guidelines:

- Primary color: Vibrant coral (#FF7F50) to capture the energetic spirit of the races.
- Background color: Light beige (#F5F5DC) to provide a clean, uncluttered backdrop.
- Accent color: Sky blue (#87CEEB) to highlight important actions and UI elements.
- Body font: 'Inter', sans-serif, for the display of numerical stats, paired with Belleza for headings
- Use simple, clean icons to represent the different training types and stats.
- Design a clear and intuitive layout that allows players to easily navigate between character selection, training, race, and history screens.
- Implement a horizontal 'race bar' animation to visually represent race progress and results.