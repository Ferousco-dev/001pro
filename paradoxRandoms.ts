// Local utility service for alias generation and content moderation
const ADJECTIVES = ['Silent', 'Swift', 'Great', 'Ife', 'Tech', 'Code', 'Cyber', 'Night', 'Logic', 'Binary'];
const NOUNS = ['Ghost', 'Scholar', 'Warrior', 'Ninja', 'Genius', 'Oracle', 'Node', 'Matrix', 'Bit', 'Scribe'];

/**
 * Generates a unique campus identity alias using a deterministic local randomizer.
 */
export const generateCampusAlias = async (): Promise<string> => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
};

/**
 * Basic content moderation filter to prevent leakage of sensitive system keywords.
 */
export const moderateContent = async (text: string): Promise<{ isSafe: boolean; reason?: string }> => {
  const forbidden = ['password', 'admin_pin', 'hack'];
  const lowercaseText = text.toLowerCase();
  for (const word of forbidden) {
    if (lowercaseText.includes(word)) {
      return { isSafe: false, reason: 'Security keyword detected.' };
    }
  }
  return { isSafe: true };
};