export type FrameFormat = 'horizontal' | 'vertical' | 'square' | 'ultrawide' | 'classic';
export type ScriptType = 'full' | 'promo-30' | 'promo-60';

export interface FormState {
  songFile: File | null;
  lyricsFile: File | null;
  actorImageFile: File | null;
  actorName: string;
  directorialStyle: string;
  videoStyle: string;
  artStyle: string;
  songLength: string;
  promptFormat: string;
  temperature: number;
  shotLength: number;
  format: FrameFormat;
  scriptType: ScriptType;
}

export interface TransitionFormState {
  shotListFile: File | null;
  scene1VideoFile: File | null;
  scene2VideoFile: File | null;
  fromShot: string;
  toShot: string;
  directorialStyle: string;
  videoStyle: string;
  artStyle: string;
  temperature: number;
  transitionLength: number;
  format: FrameFormat;
  promptFormat: string;
}

export interface Shot {
  shotNumber: number;
  timestamp: string;
  location: string;
  cameraAngle: string;
  lighting: string;
  shotDescription: string;
  lyricSync: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface TransitionResult {
  title: string;
  durationSeconds: number;
  transitionDescription: string;
  cameraMovement: string;
  visualEffect: string;
  continuityNotes: string;
  videoPrompt: string;
}
