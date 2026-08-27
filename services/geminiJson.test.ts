import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAndParseGeminiJson, parseGeminiJson } from './geminiJson.ts';

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

test('retries once when the SDK throws an unterminated JSON SyntaxError', async () => {
  let attempts = 0;
  const parsed = await generateAndParseGeminiJson<{ ok: boolean }>(async () => {
    attempts += 1;
    if (attempts === 1) throw new SyntaxError('Unterminated string in JSON at position 19185');
    return { text: '{"ok":true}', candidates: [{ finishReason: 'STOP' }] };
  }, 'Storyboard');

  assert.equal(attempts, 2);
  assert.equal(parsed.ok, true);
});

test('never leaks a raw JSON parser error after retry is exhausted', async () => {
  let attempts = 0;
  await assert.rejects(
    () => generateAndParseGeminiJson(async () => {
      attempts += 1;
      throw new SyntaxError('Unterminated string in JSON at position 19185');
    }, 'Storyboard'),
    /incomplete response from Gemini/i,
  );

  assert.equal(attempts, 2);
});

test('uses the requested context for malformed transition JSON', () => {
  assert.throws(
    () => parseGeminiJson('{"title":"cut', 'STOP', 'Transition'),
    /malformed transition JSON/i,
  );
});
