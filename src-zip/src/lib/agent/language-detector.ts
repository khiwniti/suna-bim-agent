export type DetectedLanguage = 'th' | 'en';

const THAI_UNICODE_REGEX = /[\u0E00-\u0E7F]/g;
const THAI_THRESHOLD = 0.3;

export function detectLanguage(text: string): DetectedLanguage {
  if (!text || typeof text !== 'string') {
    return 'en';
  }

  const thaiMatches = text.match(THAI_UNICODE_REGEX);
  const thaiCharCount = thaiMatches ? thaiMatches.length : 0;
  const nonWhitespace = text.replace(/\s/g, '');
  const totalChars = nonWhitespace.length;

  if (totalChars === 0) {
    return 'en';
  }

  const thaiRatio = thaiCharCount / totalChars;
  return thaiRatio >= THAI_THRESHOLD ? 'th' : 'en';
}

export function containsThai(text: string): boolean {
  return THAI_UNICODE_REGEX.test(text);
}
