export const VIDEO_STYLES = [
  'Narrative',
  'Performance',
  'Hybrid Narrative + Performance',
  'Conceptual',
  'Cinematic',
  'Documentary',
  'Dance / Choreography',
  'One-Take Illusion',
  'Surreal / Dreamlike',
  'Fashion Film',
];

export const ART_STYLES = [
  'Cinematic Photorealism',
  'Neo-Noir',
  'Cyberpunk',
  'Afrofuturism',
  'Retro Futurism',
  'Gothic',
  'Dark Fantasy',
  'Dreamcore',
  'Vaporwave',
  'Film Noir',
  'Analog 35mm Film',
  'High-Fashion Editorial',
  'Painterly Oil',
  'Graphic Novel',
  'Minimalist',
];

export const PROMPT_FORMATS = [
  ['flux-ai', 'FLUX AI'],
  ['midjourney', 'Midjourney'],
  ['stable-diffusion', 'Stable Diffusion'],
  ['google-veo', 'Google Veo'],
  ['runway', 'Runway'],
  ['kling-ai', 'Kling AI'],
  ['luma', 'Luma Dream Machine'],
  ['sora', 'Sora'],
] as const;

export const FORMAT_LABELS = {
  horizontal: 'Horizontal 16:9',
  vertical: 'Vertical 9:16',
  square: 'Square 1:1',
  ultrawide: 'Cinematic Ultrawide 21:9',
  classic: 'Classic Academy 4:3',
} as const;
