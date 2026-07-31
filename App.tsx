import React, { useState, useCallback, useEffect } from 'react';
import type { FormState, Shot, TransitionFormState } from './types';
import Header from './components/Header';
import InputForm from './components/InputForm';
import TransitionForm from './components/TransitionForm';
import ShotList from './components/ShotList';
import Loader from './components/Loader';
import { WandIcon } from './components/icons/WandIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { CoffeeIcon } from './components/icons/CoffeeIcon';
import { KeyIcon } from './components/icons/KeyIcon';
import { AIServiceProvider } from './services/aiServiceProvider';

const aiService = new AIServiceProvider();

// Model configuration tweaked to match standard template expectations
aiService.addProvider({
  provider: 'local',
  // NVIDIA Llama Nemotron rerank model via OpenRouter
  model: 'nvidia/llama-nemotron-rerank-vl-1b-v2:free',
  systemPrompt: `You are a world-class music video director.
You create emotional, cinematic, and visually powerful music videos.
Always respond with a clear shot storyboard using markdown headers exactly like this: "### Shot [Number] ([Timestamp])"
For each shot include these fields explicitly:
- **Location:** description
- **Camera DNA:** lens or movement
- **Lighting & Palette:** colors
- **Lyric Sync:** matched line
- \`\`\`
Text-to-video generation prompt here
\`\`\``
});

/**
 * Robust markdown parser updated to read local sequence outputs safely
 */
function parseMarkdownToShots(markdown: string): Shot[] {
  const shotBlocks = markdown.split(/### Shot\s+/i).slice(1);
  
  if (shotBlocks.length === 0) {
    // Structural emergency parsing wrapper if the model output strays from strict system instructions
    return [{
      shotNumber: 1,
      timestamp: "00:00 - 00:05",
      location: "Local AI Fallback Location",
      cameraAngle: "Cinematic Static View",
      lighting: "Default AI Lighting Matrix",
      shotDescription: "Raw output captured: " + markdown.slice(0, 100) + "...",
      imagePrompt: markdown,
      videoPrompt: markdown
    }];
  }
  
  return shotBlocks.map((block, index) => {
    const lines = block.split('\n');
    const headerLine = lines[0].trim();
    
    const timestampMatch = headerLine.match(/\(([^)]+)\)/);
    const timestamp = timestampMatch ? timestampMatch[1] : `00:${index * 5} - 00:${(index + 1) * 5}`;
    
    const getValueForField = (key: string): string => {
      const targetLine = lines.find(line => line.trim().toLowerCase().includes(`**${key.toLowerCase()}**`));
      if (!targetLine) return 'N/A';
      return targetLine.split(/:\s*(.*)/s)[1]?.trim() || 'N/A';
    };

    let videoPrompt = '';
    const codeBlockStartIndex = lines.findIndex(line => line.trim().startsWith('```'));
    if (codeBlockStartIndex !== -1) {
      const codeLines = [];
      for (let i = codeBlockStartIndex + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('```')) break;
        codeLines.push(lines[i]);
      }
      videoPrompt = codeLines.join('\n').trim();
    }

    return {
      shotNumber: index + 1,
      timestamp,
      location: getValueForField('Location'),
      cameraAngle: getValueForField('Camera DNA'),
      lighting: getValueForField('Lighting & Palette'),
      shotDescription: getValueForField('Lyric Sync'),
      imagePrompt: videoPrompt || 'N/A',
      videoPrompt: videoPrompt || 'N/A'
    };
  });
}

const App: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    songFile: null,
    lyricsFile: null,
    actorImageFile: null,
    actorName: '',
    directorialStyle: '',
    videoStyle: '',
    artStyle: '',
    songLength: '',
    promptFormat: 'flux-ai',
    temperature: 0.85,
    shotLength: 5,   
    format: 'vertical',
    scriptType: 'full',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shotList, setShotList] = useState<Shot[] | null>(null);
  const [rawMarkdownOutput, setRawMarkdownOutput] = useState<string>('');

  const [transitionFormState, setTransitionFormState] = useState<TransitionFormState>({
    shotListFile: null,
    scene1VideoFile: null,
    scene2VideoFile: null,
    fromShot: '',
    toShot: '',
    directorialStyle: '',
    videoStyle: '',
    artStyle: '',
    temperature: 0.9,
    transitionLength: 2,
    format: 'vertical',
  });
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'transition'>('main');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini_api_key') || '');

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleFormSubmit = useCallback(async () => {
    // 1. RE-ROUTED REQUIRED KEY GUARDRAILS FOR OFFLINE COMPLIANCE
    if (!formState.lyricsFile || !formState.directorialStyle || !formState.videoStyle || !formState.artStyle || !formState.songLength || !formState.shotLength) {
      setError('Please complete all required script fields and supply your lyrics text file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShotList(null);

    try {
      const lyricsText = await formState.lyricsFile.text();

      let selectedVideoFormat: 'Horizontal 16:9' | 'Vertical 9:16' | 'Square 1:1' | 'Cinematic Ultrawide 21:9' | 'Classic Academy 4:3' = 'Horizontal 16:9';
      if (formState.format === 'vertical') selectedVideoFormat = 'Vertical 9:16';
      else if (formState.format === 'square') selectedVideoFormat = 'Square 1:1';
      else if (formState.format === 'ultrawide') selectedVideoFormat = 'Cinematic Ultrawide 21:9';
      else if (formState.format === 'classic') selectedVideoFormat = 'Classic Academy 4:3';

      const runtimePrompt = `Song Length: ${formState.songLength}
Music Video Style: ${formState.videoStyle}
Artistic Style: ${formState.artStyle}
Directorial Style: ${formState.directorialStyle}
Target Frame Format: ${selectedVideoFormat}
Preferred Shot Length Window: ${formState.shotLength} seconds
Video Render Prompt Engine: ${formState.promptFormat}

Lyrics Sound Text:
${lyricsText}

Generate a complete, sequence-mapped music video storyboard following your specified structural formatting strictly.`;

      const generationResult = await aiService.generateContent('local', [runtimePrompt]);
      const markdownResult = generationResult.text;
      
      setRawMarkdownOutput(markdownResult);

      const processedShots = parseMarkdownToShots(markdownResult);
      setShotList(processedShots);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? `Generation Pipeline Error: ${e.message}` : 'An unknown processing error occurred.');
      // Alert removed - error is displayed in UI
    } finally {
      setIsLoading(false);
    }
    }, [formState]);

  const handleTransitionSubmit = useCallback(async () => {
    setTransitionError('Transition engine processing is undergoing structural system framework updates.');
  }, []);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const handleSaveShotList = () => {
    if (!rawMarkdownOutput) return;
    const settingsHeader = `# MV Director AI - Generation Production Matrix Settings\n\n`;
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'when_the_smoke_clears';
    downloadFile(settingsHeader + rawMarkdownOutput, `${baseFileName}-shot-list.md`, 'text/markdown');
  };

  const handleSaveJSON = () => {
    if (!shotList) return;
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'when_the_smoke_clears';
    const jsonContent = JSON.stringify(shotList, null, 2);
    downloadFile(jsonContent, `${baseFileName}-shot-list.json`, 'application/json');
  };

  const handleSaveCSV = () => {
    if (!shotList) return;
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'when_the_smoke_clears';
    
    const escapeCSV = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = ['Shot Number', 'Timestamp', 'Location', 'Camera DNA', 'Lighting & Palette', 'Lyric Sync', 'Prompt'];
    const rows = shotList.map(shot => [
      shot.shotNumber,
      shot.timestamp,
      shot.location,
      shot.cameraAngle,
      shot.lighting,
      shot.shotDescription,
      shot.imagePrompt || shot.videoPrompt || ''
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    downloadFile(csvContent, `${baseFileName}-shot-list.csv`, 'text/csv');
  };

  const handleSavePrompts = () => {
    if (!shotList) return;
    const settingsHeader = `=====================================\nMV Director AI - Exported Video Prompt Tokens List\n=====================================\n\n`;
    const content = shotList.map(shot => `[Shot ${shot.shotNumber}]\n${shot.imagePrompt}`).join('\n\n');
    const baseFileName = formState.songFile?.name.replace(/\.[^/.]+$/, "") || 'when_the_smoke_clears';
    downloadFile(settingsHeader + content, `${baseFileName}-video-prompts.txt`, 'text/plain');
  };

  const tabClass = (tabName: 'main' | 'transition') => 
    `px-4 py-3 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
      activeTab === tabName 
      ? 'bg-black/20 border-b-2 border-cyan-400 text-cyan-400' 
      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }`;

  return (
    <div className="min-h-screen text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto bg-black/40 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
        <Header />

        <div className="my-6 opacity-40 hover:opacity-100 transition-opacity">
          <label htmlFor="apiKey" className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <KeyIcon />
            Cloud API Overlay (Optional Local Run Active)
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Running locally via http://127.0.0.1:8005 ( required)"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none text-white"
            aria-label="API Key Status Window"
          />
        </div>

        <div className="flex border-b border-gray-700">
          <button onClick={() => setActiveTab('main')} className={tabClass('main')}>
            Full Music Video Director
          </button>
          <button onClick={() => setActiveTab('transition')} className={tabClass('transition')}>
            Scene Transition Builder
          </button>
        </div>

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {activeTab === 'main' && (
              <>
                <InputForm formState={formState} setFormState={setFormState} />
                <button
                    onClick={handleFormSubmit}
                    disabled={isLoading}
                    className="mt-8 w-full flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-105"
                >
                    <WandIcon />
                    {isLoading ? 'Directing Visual Sequences...' : 'Compile Video Shooting Script'}
                </button>
              </>
            )}
             {activeTab === 'transition' && (
               <>
                <TransitionForm formState={transitionFormState} setFormState={setTransitionFormState} />
                <button 
                  onClick={handleTransitionSubmit} 
                  disabled={isTransitionLoading} 
                  className="mt-8 w-full flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-lg shadow-lg shadow-purple-500/20 transition-all duration-300 transform hover:scale-105">
                  <WandIcon />
                  {isTransitionLoading ? 'Bridging Elements...' : 'Generate Transition'}
                </button>
              </>
            )}
          </div>
          
          <div className="bg-black/20 p-6 rounded-lg border border-gray-700 min-h-[500px] flex flex-col">
             {activeTab === 'main' && (
               <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-cyan-400">Production Storyboard Blueprint</h2>
                  {shotList && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={handleSaveShotList} className="flex items-center gap-2 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md">
                        <DownloadIcon />
                        <span>Script (.md)</span>
                      </button>
                      <button onClick={handleSaveJSON} className="flex items-center gap-2 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md">
                        <DownloadIcon />
                        <span>JSON</span>
                      </button>
                      <button onClick={handleSaveCSV} className="flex items-center gap-2 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md">
                        <DownloadIcon />
                        <span>CSV</span>
                      </button>
                      <button onClick={handleSavePrompts} className="flex items-center gap-2 text-xs sm:text-sm bg-gray-700/50 hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-md">
                        <DownloadIcon />
                        <span>Prompts (.txt)</span>
                      </button>
                    </div>
                  )}
                </div>
                {isLoading && <Loader loadingText="Synchronizing Lyric Frequencies & Local Engine Grids..." />}
                {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">{error}</div>}
                {shotList && <ShotList shots={shotList} />}
                {!isLoading && !error && !shotList && (
                  <div className="flex-grow flex items-center justify-center text-gray-500 text-center">
                    Configure parameters and upload your lyrics asset file to synthesize your video script...
                  </div>
                )}
              </>
            )}
            {activeTab === 'transition' && (
              <div className="flex-grow flex items-center justify-center text-gray-500 text-center">
                Transition module asset tracking adjustments will render here once script upgrades process...
              </div>
            )}
          </div>
        </main>

        <footer className="text-center mt-8 pt-6 border-t border-white/10">
          <a
            href="https://ogbeatzplaylistmanager.onrender.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium"
          >
            <CoffeeIcon />
            <span>OGBeatz</span>
          </a>
        </footer>
      </div>
    </div>
  );
};

export default App;