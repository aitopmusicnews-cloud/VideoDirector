import React, { useCallback, useState, useEffect } from 'react';
import type { FormState } from '../types';
import { VIDEO_STYLES, ART_STYLES } from '../constants';
import { UploadIcon } from './icons/UploadIcon';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}

const FileInput: React.FC<{
  id: string;
  label: string;
  file: File | null;
  accept: string;
  onChange: (file: File) => void;
}> = ({ id, label, file, accept, onChange }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && accept.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreviewUrl(null);
  }, [file, accept]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="block text-sm font-medium text-cyan-400 mb-2">
        {label}
      </label>
      <label
        htmlFor={id}
        className="flex flex-col flex-grow items-center justify-center w-full h-32 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-2 text-center cursor-pointer hover:border-cyan-500 hover:bg-gray-800 transition-colors text-gray-400 relative overflow-hidden"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={file?.name || 'Image preview'} className="absolute top-0 left-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
              <UploadIcon />
              <span className="mt-2 text-sm text-white break-all">{file?.name}</span>
            </div>
          </>
        ) : (
          <>
            <UploadIcon />
            <span className="mt-2 text-sm break-all">{file ? file.name : 'Click to upload'}</span>
          </>
        )}
      </label>
      <input type="file" id={id} accept={accept} className="hidden" onChange={onFileChange} />
    </div>
  );
};

const InputForm: React.FC<InputFormProps> = ({ formState, setFormState }) => {
  const handleFileChange = useCallback(
    (field: keyof FormState) => (file: File) => {
      setFormState((prev) => ({ ...prev, [field]: file }));
    },
    [setFormState]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let processedValue: string | number = value;

      if (type === 'range' || name === 'shotLength') {
        processedValue = parseFloat(value);
      }

      setFormState((prev) => ({ 
        ...prev, 
        [name]: processedValue
      }));
    },
    [setFormState]
  );
  
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileInput id="songFile" label="Upload Song" file={formState.songFile} accept="audio/*" onChange={handleFileChange('songFile')} />
            <FileInput id="lyricsFile" label="Upload Lyrics (.txt, .lrc)" file={formState.lyricsFile} accept=".txt,.lrc" onChange={handleFileChange('lyricsFile')} />
            <FileInput id="actorImageFile" label="Upload Actor/Singer Image" file={formState.actorImageFile} accept="image/*" onChange={handleFileChange('actorImageFile')} />
        </div>
        
        <div>
            <label htmlFor="actorName" className="block text-sm font-medium text-cyan-400 mb-2">
            Actor/Singer's Name (Optional)
            </label>
            <input
            type="text"
            id="actorName"
            name="actorName"
            value={formState.actorName}
            onChange={handleInputChange}
            placeholder="e.g., Florence Welch"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
            />
        </div>

        <div>
            <label htmlFor="directorialStyle" className="block text-sm font-medium text-cyan-400 mb-2">
            Directorial Style
            </label>
            <input
            type="text"
            id="directorialStyle"
            name="directorialStyle"
            value={formState.directorialStyle}
            onChange={handleInputChange}
            placeholder="e.g., Wes Anderson, Quentin Tarantino"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="videoStyle" className="block text-sm font-medium text-cyan-400 mb-2">
                Music Video Style
                </label>
                <select
                id="videoStyle"
                name="videoStyle"
                value={formState.videoStyle}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                <option value="" disabled>Select a style</option>
                {VIDEO_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="artStyle" className="block text-sm font-medium text-cyan-400 mb-2">
                Artistic Style
                </label>
                <select
                id="artStyle"
                name="artStyle"
                value={formState.artStyle}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                <option value="" disabled>Select an artistic style</option>
                {ART_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                ))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="songLength" className="block text-sm font-medium text-cyan-400 mb-2">
                Song Length
                </label>
                <input
                type="text"
                id="songLength"
                name="songLength"
                value={formState.songLength}
                onChange={handleInputChange}
                placeholder="e.g., 03:45"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors"
                />
            </div>
            <div>
                <label htmlFor="scriptType" className="block text-sm font-medium text-cyan-400 mb-2">
                Target Video Length Mode
                </label>
                <select
                id="scriptType"
                name="scriptType"
                value={formState.scriptType}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                    <option value="full">Full Music Video Script</option>
                    <option value="promo-30">30-Second Promo Teaser</option>
                    <option value="promo-60">60-Second (1 Min) Promo Trailer</option>
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
    <label htmlFor="promptFormat" className="block text-sm font-medium text-cyan-400 mb-2">
    Prompt Target Architecture Pipeline
    </label>
    <select
    id="promptFormat"
    name="promptFormat"
    value={formState.promptFormat}
    onChange={handleInputChange}
    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none text-white"
    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
    >
        <optgroup label="AI Image Generators" className="bg-gray-900 text-gray-400 font-semibold">
          <option value="midjourney">Midjourney v6 Blueprint</option>
          <option value="stable-diffusion">Stable Diffusion 1.5 Tokens</option>
          <option value="flux-ai">FLUX AI Natural Verse</option>
          <option value="leonardo-ai">Leonardo.Ai Phoenix Preset</option>
          <option value="ideogram">Ideogram v2 Design</option>
          <option value="dall-e-3">DALL-E 3 Detail Prose</option>
        </optgroup>
        <optgroup label="Free AI Image/Video Generators" className="bg-gray-900 text-green-400 font-semibold">
          <option value="capcut">CapCut Freeform Video Prompt</option>
          <option value="bing-image-creator">Bing Image Creator (DALL-E 3)</option>
          <option value="clipdrop">Clipdrop Reimagine XL</option>
        </optgroup>
        <optgroup label="Google AI Ecosystem (Premium)" className="bg-gray-900 text-yellow-400 font-bold">
          <option value="google-veo">Google Veo 3.1 (Cinematic Script)</option>
          <option value="gemini-omni">Gemini Omni Multi-Modal Map</option>
        </optgroup>
        <optgroup label="AI Cinematic Video Generators" className="bg-gray-900 text-cyan-400 font-semibold">
          <option value="runway">Runway Gen-3 Temporal Motion</option>
          <option value="luma">Luma Dream Machine Physics</option>
          <option value="sora">OpenAI Sora Block Structure</option>
          <option value="kling-ai">Kling AI Action Choreography</option>
          <option value="minimax">MiniMax (Hailuo) Hyper-Realism</option>
          <option value="pika-labs">Pika 2.0 Physics & FX</option>
          <option value="hunyuan-video">Tencent Hunyuan Video</option>
          <option value="cogvideo">CogVideoX Semantic Motion</option>
        </optgroup>
    </select>
     </div>
          <div>
              <label htmlFor="format" className="block text-sm font-medium text-cyan-400 mb-2">
              Video Frame Format
              </label>
              <select
              id="format"
              name="format"
              value={formState.format}
              onChange={handleInputChange}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                  <option value="horizontal">Horizontal 16:9</option>
                  <option value="vertical">Vertical 9:16</option>
                  <option value="square">Square 1:1</option>
                  <option value="ultrawide">Cinematic Ultrawide 21:9</option>
                  <option value="classic">Classic Academy 4:3</option>
              </select>
          </div>
        </div>
        <div>
              <label htmlFor="shotLength" className="block text-sm font-medium text-cyan-400 mb-2">
              Shot Length (seconds)
              </label>
              <select
                id="shotLength"
                name="shotLength"
                value={formState.shotLength}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
          </div>

        <div>
            <label htmlFor="temperature" className="block text-sm font-medium text-cyan-400 mb-2">
                Creative Temperature ({formState.temperature.toFixed(1)})
            </label>
            <input
                type="range"
                id="temperature"
                name="temperature"
                min="0.0"
                max="2.0"
                step="0.1"
                value={formState.temperature}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-500 [&::-moz-range-thumb]:bg-cyan-500"
            />
            <p className="text-xs text-gray-400 mt-1">Lower values are more predictable, while higher values generate more creative and diverse results.</p>
        </div>

    </div>
  );
};

export default InputForm;