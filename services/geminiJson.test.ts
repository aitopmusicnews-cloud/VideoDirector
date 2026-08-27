import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGeminiJson } from './geminiJson.ts';

test('reports a cut-off Gemini response instead of a raw JSON parse error', () => {
  const truncated = '{"shots":[{"shotNumber":1,"videoPrompt":"camera moves';

  assert.throws(
    () => parseGeminiJson(truncated, 'MAX_TOKENS'),
    /cut off by Gemini/i,
  );
});

test('parses a complete JSON response', () => {
  const parsed = parseGeminiJson<{ shots: Array<{ shotNumber: number }> }>(
    '{"shots":[{"shotNumber":1}]}',
    'STOP',
  );

  assert.equal(parsed.shots[0].shotNumber, 1);
});
