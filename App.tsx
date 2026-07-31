import { useCallback, useMemo, useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import Loader from './components/Loader';
import ShotList from './components/ShotList';
import TransitionForm from './components/TransitionForm';
import { generateStoryboard, generateTransition, shotsToMarkdown } from './services/geminiService';
import { extractVideoFrame } from './services/videoFrames';
import type { FormState, Shot, TransitionFormState, TransitionResult } from './types';

const initialMain: FormState = {
  songFile: null,
  lyricsFile: null,
  actorImageFile: null,
  actorName: '',
  directorialStyle: '',
  videoStyle: '',
  artStyle: '',
  songLength: '',
  promptFormat: 'flux-ai',
  temperature: 0.8,
  shotLength: 5,
  format: 'vertical',
  scriptType: 'full',
};

const initialTransition: TransitionFormState = {
  shotListFile: null,
  scene1VideoFile: null,
  scene2VideoFile: null,
  fromShot: '',
  toShot: '',
  directorialStyle: '',
  videoStyle: '',
  artStyle: '',
  temperature: 0.8,
  transitionLength: 2,
  format: 'vertical',
  promptFormat: 'google-veo',
};

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default function App() {
  const [tab, setTab] = useState<'storyboard' | 'transition'>('storyboard');
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('gemini_api_key') || '');
  const [formState, setFormState] = useState<FormState>(initialMain);
  const [transitionFormState, setTransitionFormState] = useState<TransitionFormState>(initialTransition);
  const [shots, setShots] = useState<Shot[]>([]);
  const [transition, setTransition] = useState<TransitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [error, setError] = useState('');
  const [transitionError, setTransitionError] = useState('');

  const baseName = useMemo(() => formState.songFile?.name.replace(/\.[^.]+$/, '') || 'mv-director', [formState.songFile]);

  const updateApiKey = (value: string) => {
    setApiKey(value);
    if (value) sessionStorage.setItem('gemini_api_key', value);
    else sessionStorage.removeItem('gemini_api_key');
  };

  const handleGenerate = useCallback(async () => {
    setError('');
    if (!apiKey.trim()) return setError('Enter your Gemini API key.');
    if (!formState.lyricsFile || !formState.directorialStyle || !formState.videoStyle || !formState.artStyle || !formState.songLength) {
      return setError('Add lyrics, song length, and the three style fields before generating.');
    }
    setLoading(true);
    try {
      setShots(await generateStoryboard(apiKey, formState));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Storyboard generation failed.');
    } finally {
      setLoading(false);
    }
  }, [apiKey, formState]);

  const handleTransition = useCallback(async () => {
    setTransitionError('');
    setTransition(null);
    if (!apiKey.trim()) return setTransitionError('Enter your Gemini API key.');
    if (!transitionFormState.shotListFile || !transitionFormState.scene1VideoFile || !transitionFormState.scene2VideoFile) {
      return setTransitionError('Upload a shot list and both scene videos.');
    }
    setTransitionLoading(true);
    try {
      const [lastFrame, firstFrame] = await Promise.all([
        extractVideoFrame(transitionFormState.scene1VideoFile, 'end'),
        extractVideoFrame(transitionFormState.scene2VideoFile, 'start'),
      ]);
      setTransition(await generateTransition(apiKey, transitionFormState, lastFrame, firstFrame));
    } catch (err) {
      setTransitionError(err instanceof Error ? err.message : 'Transition generation failed.');
    } finally {
      setTransitionLoading(false);
    }
  }, [apiKey, transitionFormState]);

  const saveMarkdown = () => download(shotsToMarkdown(shots), `${baseName}-shot-list.md`, 'text/markdown');
  const saveJson = () => download(JSON.stringify(shots, null, 2), `${baseName}-shot-list.json`, 'application/json');
  const saveCsv = () => {
    const header = ['Shot Number','Timestamp','Location','Camera','Lighting','Description','Lyric Sync','Image Prompt','Video Prompt'];
    const rows = shots.map((s) => [s.shotNumber,s.timestamp,s.location,s.cameraAngle,s.lighting,s.shotDescription,s.lyricSync,s.imagePrompt,s.videoPrompt]);
    download([header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n'), `${baseName}-shot-list.csv`, 'text/csv');
  };

  return (
    <div className="page-shell">
      <div className="app-card">
        <Header />

        <section className="key-panel">
          <label>Gemini API key</label>
          <input type="password" value={apiKey} onChange={(e) => updateApiKey(e.target.value)} placeholder="AIza..." autoComplete="off" />
          <small>Stored only for this browser session. For a public production deployment, move Gemini calls behind a server endpoint.</small>
        </section>

        <nav className="tabs">
          <button className={tab === 'storyboard' ? 'active' : ''} onClick={() => setTab('storyboard')}>Full Music Video Director</button>
          <button className={tab === 'transition' ? 'active' : ''} onClick={() => setTab('transition')}>Scene Transition Builder</button>
        </nav>

        <main className="workspace">
          <section className="panel controls">
            {tab === 'storyboard' ? <>
              <InputForm formState={formState} setFormState={setFormState} />
              <button className="primary" disabled={loading} onClick={handleGenerate}>{loading ? 'Directing…' : 'Generate Shot List with Gemini'}</button>
            </> : <>
              <TransitionForm formState={transitionFormState} setFormState={setTransitionFormState} />
              <button className="primary purple" disabled={transitionLoading} onClick={handleTransition}>{transitionLoading ? 'Building transition…' : 'Generate Transition with Gemini'}</button>
            </>}
          </section>

          <section className="panel output">
            {tab === 'storyboard' ? <>
              <div className="output-heading"><h2>Production Storyboard</h2>{shots.length > 0 && <div className="actions"><button onClick={saveMarkdown}>Markdown</button><button onClick={saveJson}>JSON</button><button onClick={saveCsv}>CSV</button></div>}</div>
              {loading && <Loader label="Gemini is analyzing the creative brief…" />}
              {error && <div className="error">{error}</div>}
              {!loading && !error && shots.length === 0 && <div className="empty">Configure your project, upload lyrics, and generate a structured shot list.</div>}
              {shots.length > 0 && <ShotList shots={shots} />}
            </> : <>
              <h2>Transition Concept</h2>
              {transitionLoading && <Loader label="Extracting boundary frames and asking Gemini for a visual bridge…" />}
              {transitionError && <div className="error">{transitionError}</div>}
              {!transitionLoading && !transitionError && !transition && <div className="empty">Gemini will compare the outgoing last frame and incoming first frame to design the transition.</div>}
              {transition && <article className="transition-result"><h3>{transition.title}</h3><p><b>Duration:</b> {transition.durationSeconds}s</p><p><b>Concept:</b> {transition.transitionDescription}</p><p><b>Camera:</b> {transition.cameraMovement}</p><p><b>Effect:</b> {transition.visualEffect}</p><p><b>Continuity:</b> {transition.continuityNotes}</p><h4>Video prompt</h4><pre>{transition.videoPrompt}</pre></article>}
            </>}
          </section>
        </main>
      </div>
    </div>
  );
}
