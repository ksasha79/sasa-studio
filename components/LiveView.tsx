
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<{role: string, text: string}[]>([]);
  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = audioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
               setTranscription(prev => [...prev, {role: 'AI', text: message.serverContent!.outputTranscription!.text}]);
            }
            if (message.serverContent?.inputTranscription) {
               setTranscription(prev => [...prev, {role: 'You', text: message.serverContent!.inputTranscription!.text}]);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outAudioCtxRef.current) {
              const ctx = outAudioCtxRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are a lively voice assistant in Sasa Studio. Be conversational and warm.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Live connection failed:", error);
      alert("Microphone access or connection failed.");
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <div className="relative group">
        <div className={`absolute -inset-4 rounded-full bg-amber-500/20 blur-2xl transition-all duration-1000 ${isActive ? 'scale-150 animate-pulse' : 'scale-0'}`}></div>
        <div className={`w-48 h-48 rounded-full flex items-center justify-center glass border-2 transition-all duration-500 ${
          isActive ? 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]' : 'border-slate-800'
        }`}>
          {isActive ? (
             <div className="flex gap-1.5 h-16 items-center">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="w-2 bg-amber-500 rounded-full animate-wave" style={{
                   height: `${30 + Math.random() * 70}%`,
                   animationDelay: `${i * 0.1}s`,
                   animationDuration: '0.8s'
                 }}></div>
               ))}
             </div>
          ) : (
            <i className="fa-solid fa-microphone-slash text-5xl text-slate-600"></i>
          )}
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">{isActive ? 'I\'m Listening...' : 'Start Conversation'}</h2>
        <p className="text-slate-400 max-w-sm">
          Natural, real-time voice interaction with Gemini. Just speak, and I'll reply instantly.
        </p>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all transform active:scale-95 ${
          isActive 
          ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20' 
          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-900/20'
        }`}
      >
        <i className={`fa-solid ${isActive ? 'fa-stop' : 'fa-microphone'}`}></i>
        {isActive ? 'End Session' : 'Start Live Talk'}
      </button>

      {isActive && transcription.length > 0 && (
        <div className="w-full max-w-xl glass rounded-2xl p-4 h-32 overflow-y-auto space-y-2 border-slate-700/50">
          {transcription.slice(-5).map((t, i) => (
            <div key={i} className="text-sm">
              <span className={`font-bold mr-2 ${t.role === 'You' ? 'text-amber-400' : 'text-indigo-400'}`}>{t.role}:</span>
              <span className="text-slate-300">{t.text}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
        .animate-wave { animation: wave linear infinite; }
      `}</style>
    </div>
  );
};

export default LiveView;
