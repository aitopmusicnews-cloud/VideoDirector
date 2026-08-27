import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { FormState, Shot, TransitionFormState, TransitionResult } from '../types';
import { FORMAT_LABELS } from '../constants';
import { generateAndParseGeminiJson } from './geminiJson';

const DEFAULT_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
const MAX_INLINE_FILE_BYTES = 14 * 1024 * 1024;
const STORYBOARD_MAX_OUTPUT_TOKENS = 65536;

function getClient(apiKey: string) {
  const key = apiKey.trim();
  if (!key) throw new Error('Enter a Gemini API key before generating.');
  return new GoogleGenAI({ apiKey: key });
}

async function fileToInlinePart(file: File) {
  if (file.size > MAX_INLINE_FILE_BYTES) {
    throw new Error(`${file.name} is larger than 14 MB. Use a smaller file for browser-based Gemini input.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return {
    inlineData: {
      mimeType: file.type || 'application/octet-stream',
      data: btoa(binary),
    },
  };
}

function dataUrlToInlinePart(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Could not prepare extracted video frame for Gemini.');
  return { inlineData: { mimeType: match[1], data: match[2] } };
}

function normalizeShot(raw: Partial<Shot>, index: number): Shot {
  return {
    shotNumber: Number(raw.shotNumber) || index + 1,
    timestamp: String(raw.timestamp || ''),
    location: String(raw.location || 'Unspecified'),
    cameraAngle: String(raw.cameraAngle || 'Unspecified'),
    lighting: String(raw.lighting || 'Unspecified'),
    shotDescription: String(raw.shotDescription || 'Unspecified'),
    lyricSync: String(raw.lyricSync || ''),
    imagePrompt: String(raw.imagePrompt || ''),
    videoPrompt: String(raw.videoPrompt || raw.imagePrompt || ''),
  };
}

function scriptTarget(form: FormState) {
  if (form.scriptType === 'promo-30') return '30 seconds';
  if (form.scriptType === 'promo-60') return '60 seconds';
  return form.songLength;
}

export async function generateStoryboard(apiKey: string, form: FormState): Promise<Shot[]> {
  if (!form.lyricsFile) throw new Error('Upload a lyrics file.');
  const lyrics = await form.lyricsFile.text();
  const client = getClient(apiKey);

  const attachmentBytes = (form.actorImageFile?.size || 0) + (form.songFile?.size || 0);
  if (attachmentBytes > MAX_INLINE_FILE_BYTES) {
    throw new Error('The song plus artist image must total 14 MB or less for this browser-based build.');
  }

  const prompt = `You are a world-class music-video director and previsualization artist.
Create a complete shot list as JSON only.

PROJECT
- Target duration: ${scriptTarget(form)}
- Original song duration: ${form.songLength}
- Script mode: ${form.scriptType}
- Artist/actor: ${form.actorName || 'unnamed artist'}
- Directorial style: ${form.directorialStyle}
- Music-video style: ${form.videoStyle}
- Artistic style: ${form.artStyle}
- Frame format: ${FORMAT_LABELS[form.format]}
- Average shot length: ${form.shotLength} seconds
- Prompt target: ${form.promptFormat}

REQUIREMENTS
- Cover the entire requested duration without gaps.
- Number shots sequentially from 1.
- Use timestamps formatted MM:SS-MM:SS.
- Keep visual continuity across consecutive shots.
- Tie shots to specific lyrics whenever possible.
- imagePrompt should be optimized for ${form.promptFormat}.
- videoPrompt should describe movement, subject action, camera motion, lighting, environment, and continuity.
- If an artist reference image is attached, keep the subject visually consistent with it.
- If song audio is attached, use its energy, pacing, dynamics, and section changes when designing edits.

LYRICS
${lyrics}

Return a JSON object with exactly this shape:
{"shots":[{"shotNumber":1,"timestamp":"00:00-00:05","location":"...","cameraAngle":"...","lighting":"...","shotDescription":"...","lyricSync":"...","imagePrompt":"...","videoPrompt":"..."}]}`;

  const parts: any[] = [{ text: prompt }];
  if (form.actorImageFile) parts.push(await fileToInlinePart(form.actorImageFile));
  if (form.songFile) parts.push(await fileToInlinePart(form.songFile));

  const parsed = await generateAndParseGeminiJson<{ shots?: Partial<Shot>[] }>(
    () => client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        maxOutputTokens: STORYBOARD_MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    }),
    'Storyboard',
  );

  if (!Array.isArray(parsed.shots) || parsed.shots.length === 0) {
    throw new Error('Gemini returned no shots. Try a shorter target duration or regenerate.');
  }
  return parsed.shots.map(normalizeShot);
}

export async function generateTransition(
  apiKey: string,
  form: TransitionFormState,
  scene1LastFrame: string,
  scene2FirstFrame: string,
): Promise<TransitionResult> {
  if (!form.shotListFile) throw new Error('Upload the shot list used for this project.');
  const shotList = await form.shotListFile.text();
  const client = getClient(apiKey);

  const prompt = `You are designing one cinematic transition between two existing music-video shots.
Use the attached first image as the LAST frame of the outgoing scene and the attached second image as the FIRST frame of the incoming scene.

PROJECT
- From shot: ${form.fromShot || 'unspecified'}
- To shot: ${form.toShot || 'unspecified'}
- Transition duration: ${form.transitionLength} seconds
- Directorial style: ${form.directorialStyle}
- Music-video style: ${form.videoStyle}
- Artistic style: ${form.artStyle}
- Frame format: ${FORMAT_LABELS[form.format]}
- Prompt target: ${form.promptFormat}

SHOT LIST CONTEXT
${shotList.slice(0, 50000)}

Create one transition that visually bridges color, composition, subject position, lighting, or motion between the two frames. Do not invent a cut that ignores the supplied frames.
Return JSON only in this exact shape:
{"title":"...","durationSeconds":2,"transitionDescription":"...","cameraMovement":"...","visualEffect":"...","continuityNotes":"...","videoPrompt":"..."}`;

  const parsed = await generateAndParseGeminiJson<Partial<TransitionResult>>(
    () => client.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          dataUrlToInlinePart(scene1LastFrame),
          dataUrlToInlinePart(scene2FirstFrame),
        ] as any[],
      }],
      config: {
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
    'Transition',
  );

  if (!parsed.transitionDescription || !parsed.videoPrompt) {
    throw new Error('Gemini returned an incomplete transition. Please try again.');
  }
  return {
    title: parsed.title || `Shot ${form.fromShot} → ${form.toShot}`,
    durationSeconds: Number(parsed.durationSeconds) || form.transitionLength,
    transitionDescription: parsed.transitionDescription,
    cameraMovement: parsed.cameraMovement || 'Not specified',
    visualEffect: parsed.visualEffect || 'Not specified',
    continuityNotes: parsed.continuityNotes || 'Maintain continuity between supplied frames.',
    videoPrompt: parsed.videoPrompt,
  };
}

export function shotsToMarkdown(shots: Shot[]) {
  return shots.map((shot) => `### Shot ${shot.shotNumber} (${shot.timestamp})\n\n- **Location:** ${shot.location}\n- **Camera DNA:** ${shot.cameraAngle}\n- **Lighting & Palette:** ${shot.lighting}\n- **Shot Description:** ${shot.shotDescription}\n- **Lyric Sync:** ${shot.lyricSync}\n- **Image Prompt:** ${shot.imagePrompt}\n\n\`\`\`\n${shot.videoPrompt}\n\`\`\``).join('\n\n');
}
