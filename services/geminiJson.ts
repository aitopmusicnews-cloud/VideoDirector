export function parseGeminiJson<T>(text: string, finishReason?: string): T {
  if (finishReason === 'MAX_TOKENS') {
    throw new Error(
      'Storyboard generation was cut off by Gemini before the JSON finished. Increase the average shot length or use a shorter target duration, then regenerate.',
    );
  }

  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error('Gemini returned malformed storyboard JSON. Please regenerate the storyboard.');
  }
}
