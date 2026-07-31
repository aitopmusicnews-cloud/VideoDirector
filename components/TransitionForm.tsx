import type React from 'react';
import { ART_STYLES, PROMPT_FORMATS, VIDEO_STYLES } from '../constants';
import type { TransitionFormState } from '../types';

function FileField({ label, file, accept, onChange }: { label: string; file: File | null; accept: string; onChange: (file: File | null) => void }) {
  return <label className="file-field"><span>{label}</span><input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} /><small>{file?.name || 'Choose file'}</small></label>;
}

export default function TransitionForm({ formState, setFormState }: { formState: TransitionFormState; setFormState: React.Dispatch<React.SetStateAction<TransitionFormState>> }) {
  const set = <K extends keyof TransitionFormState>(key: K, value: TransitionFormState[K]) => setFormState((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="form-stack">
      <FileField label="Shot list (.md/.txt)" file={formState.shotListFile} accept=".md,.txt,text/plain" onChange={(f) => set('shotListFile', f)} />
      <div className="grid two">
        <FileField label="Scene 1 video (outgoing)" file={formState.scene1VideoFile} accept="video/*" onChange={(f) => set('scene1VideoFile', f)} />
        <FileField label="Scene 2 video (incoming)" file={formState.scene2VideoFile} accept="video/*" onChange={(f) => set('scene2VideoFile', f)} />
      </div>
      <div className="grid two">
        <label>From shot #<input value={formState.fromShot} onChange={(e) => set('fromShot', e.target.value)} /></label>
        <label>To shot #<input value={formState.toShot} onChange={(e) => set('toShot', e.target.value)} /></label>
      </div>
      <label>Directorial style<input value={formState.directorialStyle} onChange={(e) => set('directorialStyle', e.target.value)} /></label>
      <div className="grid two">
        <label>Music-video style<select value={formState.videoStyle} onChange={(e) => set('videoStyle', e.target.value)}><option value="">Select</option>{VIDEO_STYLES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Artistic style<select value={formState.artStyle} onChange={(e) => set('artStyle', e.target.value)}><option value="">Select</option>{ART_STYLES.map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="grid three">
        <label>Prompt target<select value={formState.promptFormat} onChange={(e) => set('promptFormat', e.target.value)}>{PROMPT_FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Frame format<select value={formState.format} onChange={(e) => set('format', e.target.value as TransitionFormState['format'])}><option value="horizontal">16:9</option><option value="vertical">9:16</option><option value="square">1:1</option><option value="ultrawide">21:9</option><option value="classic">4:3</option></select></label>
        <label>Transition length<select value={formState.transitionLength} onChange={(e) => set('transitionLength', Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}s</option>)}</select></label>
      </div>
      <label>Creative temperature: {formState.temperature.toFixed(1)}<input type="range" min="0" max="2" step="0.1" value={formState.temperature} onChange={(e) => set('temperature', Number(e.target.value))} /></label>
    </div>
  );
}
