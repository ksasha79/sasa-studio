
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const config: any = {
        systemInstruction: "You are a creative assistant in Sasa Studio. If search is enabled, synthesize web results accurately.",
      };

      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: config,
      });

      // Extract sources from grounding chunks
      const sources: any[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
        sources: sources.length > 0 ? sources : undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto pr-4 mb-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <i className="fa-solid fa-robot text-4xl text-indigo-400"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Smart Chat Interface</h3>
              <p className="text-slate-400 max-w-md">
                Brainstorm, code, or explore the live web with integrated Google Search.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-xl ${
              msg.role === 'user' 
              ? 'bg-indigo-600 text-white' 
              : 'glass text-slate-200 border-slate-700/50'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <a 
                        key={i} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded transition-colors flex items-center gap-1 max-w-[200px] truncate"
                      >
                        <i className="fa-solid fa-link text-[10px] text-slate-500"></i>
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-[10px] opacity-40 mt-2 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl p-4 border-slate-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative pt-4">
        <div className="flex items-center gap-3 mb-3 px-2">
           <button 
             onClick={() => setUseSearch(!useSearch)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
               useSearch 
               ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
               : 'bg-slate-800/50 border-slate-700 text-slate-500'
             }`}
           >
             <i className={`fa-solid ${useSearch ? 'fa-globe' : 'fa-globe-slash'}`}></i>
             Web Search {useSearch ? 'ON' : 'OFF'}
           </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={useSearch ? "Search the web for..." : "Type your message..."}
          className="w-full glass bg-slate-900/50 border-slate-700 rounded-2xl p-4 pr-16 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none min-h-[60px] max-h-48"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 bottom-3 h-10 w-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 rounded-xl flex items-center justify-center transition-all shadow-lg"
        >
          <i className="fa-solid fa-paper-plane text-white"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatView;
