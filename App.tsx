
import React, { useState, useEffect } from 'react';
import { AppView } from './types';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import VideoView from './components/VideoView';
import VoiceView from './components/VoiceView';
import LiveView from './components/LiveView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: AppView.CHAT, icon: 'fa-message', label: 'AI Chat', color: 'text-indigo-400' },
    { id: AppView.IMAGES, icon: 'fa-image', label: 'Image Studio', color: 'text-pink-400' },
    { id: AppView.VIDEOS, icon: 'fa-video', label: 'Video Lab', color: 'text-purple-400' },
    { id: AppView.VOICE, icon: 'fa-microphone', label: 'Voice Forge', color: 'text-emerald-400' },
    { id: AppView.LIVE, icon: 'fa-bolt', label: 'Live Session', color: 'text-amber-400' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } glass transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold gradient-text tracking-wider">SASA STUDIO</h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                activeView === item.id 
                ? 'bg-slate-800 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg w-8 ${activeView === item.id ? item.color : 'group-hover:' + item.color}`}></i>
              {isSidebarOpen && <span className="font-medium ml-2">{item.label}</span>}
              {activeView === item.id && isSidebarOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className={`p-4 rounded-xl glass border-slate-700/50 ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <p className="text-xs text-slate-400 mb-2">Powered by</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <i className="fa-solid fa-sparkles text-[10px] text-white"></i>
              </div>
              <span className="text-sm font-semibold text-slate-200">Gemini 3.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 glass border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200">
            {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition-colors">
              <i className="fa-regular fa-bell"></i>
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500"></div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeView === AppView.CHAT && <ChatView />}
          {activeView === AppView.IMAGES && <ImageView />}
          {activeView === AppView.VIDEOS && <VideoView />}
          {activeView === AppView.VOICE && <VoiceView />}
          {activeView === AppView.LIVE && <LiveView />}
        </div>
      </main>
    </div>
  );
};

export default App;
