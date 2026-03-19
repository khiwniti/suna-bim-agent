export { THAI_PERSONA_PROMPT, getThaiPersonaPrompt } from './thai';
export { ENGLISH_PERSONA_PROMPT, getEnglishPersonaPrompt } from './english';

import { THAI_PERSONA_PROMPT } from './thai';
import { ENGLISH_PERSONA_PROMPT } from './english';
import type { DetectedLanguage } from '../language-detector';

export function getPersonaPrompt(language: DetectedLanguage): string {
  return language === 'th' ? THAI_PERSONA_PROMPT : ENGLISH_PERSONA_PROMPT;
}
