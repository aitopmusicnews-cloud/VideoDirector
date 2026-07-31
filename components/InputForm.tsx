import type React from 'react';
import { ART_STYLES, PROMPT_FORMATS, VIDEO_STYLES } from '../constants';
import type { FormState } from '../types';

function FileField({ label, file, accept, onChange }: { label: string; file: File | null; accept: string; onChange: (file: File | null) => void }) {
  return (
    <label className="file-field">
      <span>{label}</span>
      <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <small>{file?.name || 'Choose file'}</small>
    </label>
  );
}

export default function InputForm({ formState, setFormState }: { formState: FormState; setFormState: React.Dispatch<React.SetStateAction<FormState>> }) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setFormState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="form-stack">
      <div className="grid three">
        <FileField label="Song (optional)" file={formState.songFile} accept="audio/*" onChange={(f) => set('songFile', f)} />
        <FileField label="Lyrics (.txt/.lrc)" file={formState.lyricsFile} accept=".txt,.lrc,text/plain" onChange={(f) => set('lyricsFile', f)} />
        <FileField label="Artist reference image" file={formState.actorImageFile} accept="image/*" onChange={(f) => set('actorImageFile', f)} />
      </div>

      <label>Artist / actor name<input value={formState.actorName} onChange={(e) => set('actorName', e.target.value)} placeholder="Optional" /></label>
      <label>Directorial style<input value={formState.directorialStyle} onChange={(e) => set('directorialStyle', e.target.value)} placeholder="e.g. kinetic handheld, symmetrical compositions" /></label>

      <div className="grid two">
        <label>Music-video style<select value={formState.videoStyle} onChange={(e) => set('videoStyle', e.target.value)}><option value="">Select</option>{VIDEO_STYLES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Artistic style<select value={formState.artStyle} onChange={(e) => set('artStyle', e.target.value)}><option value="">Select</option>{ART_STYLES.map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>

      <div className="grid two">
        <label>Song length<input value={formState.songLength} onChange={(e) => set('songLength', e.target.value)} placeholder="03:45" /></label>
        <label>Target video length<select value={formState.scriptType} onChange={(e) => set('scriptType', e.target.value as FormState['scriptType'])}><option value="full">Full music video</option><option value="promo-30">30-second promo</option><option value="promo-60">60-second promo</option></select></label>
      </div>

      <div className="grid three">
        <label>Prompt target<select value={formState.promptFormat} onChange={(e) => set('promptFormat', e.target.value)}>{PROMPT_FORMATS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Frame format<select value={formState.format} onChange={(e) => set('format', e.target.value as FormState['format'])}><option value="horizontal">16:9</option><option value="vertical">9:16</option><option value="square">1:1</option><option value="ultrawide">21:9</option><option value="classic">4:3</option></select></label>
        <label>Average shot length<select value={formState.shotLength} onChange={(e) => set('shotLength', Number(e.target.value))}>{Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}s</option>)}</select></label>
      </div>

      <label>Creative temperature: {formState.temperature.toFixed(1)}<input type="range" min="0" max="2" step="0.1" value={formState.temperature} onChange={(e) => set('temperature', Number(e.target.value))} /></label>
    </div>
  );
}
