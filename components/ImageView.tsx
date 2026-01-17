
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedMedia } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isPro, setIsPro] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    if (isPro) checkKey();
  }, [isPro]);

  const checkKey = async () => {
    try {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } catch (e) {
      console.error(e);
    }
  };

  const openKeyDialog = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } catch (e) {
      console.error(e);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const modelName = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const config: any = {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          ...(isPro ? { imageSize: '1K' } : {})
        }
      };

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        config: config
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newItem: GeneratedMedia = {
          id: Date.now().toString(),
          url: imageUrl,
          type: 'image',
          prompt: prompt,
          timestamp: new Date()
        };
        setHistory(prev => [newItem, ...prev]);
        setPrompt('');
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      if (error?.message?.includes('Requested entity was not found')) {
        setHasKey(false);
      } else {
        alert("Generation failed. Try a different prompt.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="glass rounded-3xl p-8 border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -z-10"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-pink-400"></i>
            Image Creation Studio
          </h3>
          <button 
            onClick={() => setIsPro(!isPro)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              isPro 
              ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg' 
              : 'bg-slate-800 text-slate-400'
            }`}
          >
            <i className="fa-solid fa-crown text-[10px]"></i>
            {isPro ? 'PRO MODE (3 PRO)' : 'STANDARD (FLASH)'}
          </button>
        </div>

        {isPro && !hasKey ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
            <i className="fa-solid fa-key text-3xl text-pink-500/50 mb-4"></i>
            <p className="text-slate-400 mb-6">Pro imaging requires a selected API key.</p>
            <button 
              onClick={openKeyDialog}
              className="px-8 py-3 bg-pink-600 hover:bg-pink-500 rounded-xl font-bold text-sm transition-all"
            >
              Select Key to Unlock
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision in detail..."
                className="w-full glass bg-slate-900/50 border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all resize-none h-32"
              />
            </div>

            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-400 mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  {['1:1', '4:3', '16:9', '9:16'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        aspectRatio === ratio 
                        ? 'bg-pink-600 text-white' 
                        : 'glass border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateImage}
                disabled={!prompt.trim() || isGenerating}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
              >
                {isGenerating ? (
                  <><i className="fa-solid fa-spinner animate-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-bolt"></i> Generate</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {history.map((item) => (
          <div key={item.id} className="group relative glass rounded-2xl overflow-hidden border-slate-700/50 hover:border-pink-500/50 transition-all shadow-xl">
            <img src={item.url} alt={item.prompt} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-xs text-slate-300 line-clamp-2 mb-2">{item.prompt}</p>
              <div className="flex gap-2">
                <a 
                  href={item.url} 
                  download={`sasa-${item.id}.png`}
                  className="flex-1 py-2 rounded-lg bg-pink-600/20 hover:bg-pink-600/40 text-center text-xs font-bold border border-pink-500/30 backdrop-blur-md transition-all"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageView;
