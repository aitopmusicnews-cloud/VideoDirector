type GeminiTextResponse = {
  text?: string;
  candidates?: Array<{ finishReason?: string }>;
};

function isRawJsonSyntaxError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /unterminated string in json|unexpected end of json input|json parse error/i.test(error.message);
}

export function parseGeminiJson<T>(text: string, finishReason?: string, context = 'Storyboard'): T {
  if (finishReason === 'MAX_TOKENS') {
    throw new Error(
      `${context} generation was cut off by Gemini before the JSON finished. Increase the average shot length or use a shorter target duration, then regenerate.`,
    );
  }

  const trimmed = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(`Gemini returned malformed ${context.toLowerCase()} JSON. Please regenerate the ${context.toLowerCase()}.`);
  }
}

export async function generateAndParseGeminiJson<T>(
  generate: () => Promise<GeminiTextResponse>,
  context = 'Storyboard',
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await generate();
      return parseGeminiJson<T>(response.text || '{}', response.candidates?.[0]?.finishReason, context);
    } catch (error) {
      const rawJsonSyntaxError = isRawJsonSyntaxError(error);
      const malformedModelJson = error instanceof Error && /Gemini returned malformed .* JSON/i.test(error.message);

      if (attempt === 0 && (rawJsonSyntaxError || malformedModelJson)) continue;
      if (rawJsonSyntaxError) {
        throw new Error(`${context} generation received an incomplete response from Gemini. Please regenerate.`);
      }
      throw error;
    }
  }

  throw new Error(`${context} generation failed.`);
}
