
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { VOICES } from '../types';
import { decode, decodeAudioData } from '../services/audioUtils';

const VoiceView: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].name);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{id: string, text: string, url: string}[]>([]);

  const synthesize = async () => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with the appropriate emotion: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // Prepare AudioContext
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, audioCtx, 24000, 1);
        
        // Convert to blob for player
        const wavData = audioBufferToWav(audioBuffer);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        setHistory(prev => [{ id: Date.now().toString(), text, url }, ...prev]);
        setText('');
      }
    } catch (error) {
      console.error("TTS error:", error);
      alert("Voice synthesis failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to convert AudioBuffer to WAV format for persistence
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const result = new ArrayBuffer(length);
    const view = new DataView(result);
    const channels = [];
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16);         // length = 16
    setUint16(1);          // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16);         // 16-bit
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // chunk length

    for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return result;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass rounded-3xl p-8 border-slate-700/50 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-950">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <i className="fa-solid fa-volume-high text-emerald-400"></i>
          Voice Synthesis Engine
        </h3>

        <div className="space-y-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type the text you want to convert into speech..."
            className="w-full glass bg-slate-900/50 border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all h-32"
          />

          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-400 mb-2">Select Voice Personality</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {VOICES.map(voice => (
                  <button
                    key={voice.name}
                    onClick={() => setSelectedVoice(voice.name)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedVoice === voice.name 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                      : 'glass border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {voice.displayName.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={synthesize}
              disabled={!text.trim() || isProcessing}
              className="px-10 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
            >
              {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-waveform"></i>}
              Forge Audio
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-slate-300">Synthesis History</h4>
        <div className="space-y-4">
          {history.map(item => (
            <div key={item.id} className="glass p-5 rounded-2xl border-slate-700/50 flex flex-col md:flex-row md:items-center gap-4 hover:border-emerald-500/30 transition-all">
              <div className="flex-1">
                <p className="text-sm text-slate-200 line-clamp-1">{item.text}</p>
                <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date(parseInt(item.id)).toLocaleTimeString()}</p>
              </div>
              <audio src={item.url} controls className="h-10 w-full md:w-64 accent-emerald-500" />
            </div>
          ))}
          {history.length === 0 && (
            <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-3xl">
              Start typing to synthesize your first audio clip.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceView;
