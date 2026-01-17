
export enum AppView {
  CHAT = 'CHAT',
  IMAGES = 'IMAGES',
  VIDEOS = 'VIDEOS',
  VOICE = 'VOICE',
  LIVE = 'LIVE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}

export interface GeneratedMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  timestamp: Date;
}

export interface VoiceConfig {
  name: string;
  displayName: string;
}

export const VOICES: VoiceConfig[] = [
  { name: 'Kore', displayName: 'Kore (Friendly)' },
  { name: 'Puck', displayName: 'Puck (Cheerful)' },
  { name: 'Charon', displayName: 'Charon (Deep)' },
  { name: 'Fenrir', displayName: 'Fenrir (Strong)' },
  { name: 'Zephyr', displayName: 'Zephyr (Soft)' }
];
