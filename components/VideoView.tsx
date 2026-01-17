
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GeneratedMedia } from '../types';

const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [videos, setVideos] = useState<GeneratedMedia[]>([]);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

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

  const generateVideo = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setStatusMsg('Initiating creation engine...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      setStatusMsg('AI is imagining your video... (this may take a minute)');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await fetchRes.blob();
        const videoUrl = URL.createObjectURL(blob);

        const newItem: GeneratedMedia = {
          id: Date.now().toString(),
          url: videoUrl,
          type: 'video',
          prompt: prompt,
          timestamp: new Date()
        };
        setVideos(prev => [newItem, ...prev]);
        setPrompt('');
      }
    } catch (error: any) {
      console.error("Video error:", error);
      if (error?.message?.includes('Requested entity was not found')) {
        setHasKey(false);
        alert("Please re-select your API key to continue.");
      } else {
        alert("Video generation failed. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setStatusMsg('');
    }
  };

  if (!hasKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
          <i className="fa-solid fa-key text-4xl text-purple-400"></i>
        </div>
        <h2 className="text-3xl font-bold mb-4">High-Quality Video Access</h2>
        <p className="text-slate-400 max-w-md mb-8">
          To use the Veo video generation engine, you must select a valid API key from a paid GCP project.
        </p>
        <button
          onClick={openKeyDialog}
          className="px-10 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold transition-all shadow-xl shadow-purple-500/20"
        >
          Select API Key
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Check <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">billing documentation</a> for details.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="glass rounded-3xl p-10 border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-[120px] -z-10"></div>
        
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">Veo Video Engine</h3>
          <p className="text-slate-400">Transform your text into cinematic 1080p video.</p>
        </div>

        <div className="space-y-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A drone shot of a lush tropical jungle with a hidden waterfall at sunset..."
            className="w-full glass bg-slate-900/50 border-slate-700 rounded-2xl p-6 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none h-40 text-lg"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500 italic">
              {isGenerating ? statusMsg : 'Ready for production'}
            </div>
            <button
              onClick={generateVideo}
              disabled={!prompt.trim() || isGenerating}
              className="px-12 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-800 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg"
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-clapperboard"></i>
                  Generate Video
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-slate-300">Generated Clips</h4>
        {videos.length === 0 ? (
          <div className="h-64 glass rounded-3xl border-dashed border-2 border-slate-700 flex flex-col items-center justify-center text-slate-500">
            <i className="fa-solid fa-film text-3xl mb-4 opacity-20"></i>
            <p>No videos generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {videos.map((video) => (
              <div key={video.id} className="glass rounded-3xl overflow-hidden group border-slate-700/50 shadow-xl">
                <video 
                  src={video.url} 
                  controls 
                  className="w-full aspect-video object-cover"
                />
                <div className="p-6">
                  <p className="text-sm text-slate-300 font-medium line-clamp-2">{video.prompt}</p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {video.timestamp.toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => window.open(video.url)}
                      className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1"
                    >
                      <i className="fa-solid fa-expand"></i> Full Screen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoView;
