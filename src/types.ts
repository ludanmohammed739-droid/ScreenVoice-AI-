export interface DetectedBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface QuestionResult {
  id: string;
  timestamp: number;
  hasQuestion: boolean;
  questionText?: string;
  questionType?: 'multiple_choice' | 'math' | 'logic_puzzle' | 'code' | 'general_knowledge' | 'open_ended' | string;
  options?: string[];
  correctOption?: string;
  shortAnswer?: string;
  spokenAnswer?: string;
  explanation?: string;
  confidence?: number;
  screenSummary: string;
  detectedBox?: DetectedBox;
  audioUrl?: string | null;
  thumbnailUrl?: string;
}

export type CaptureSource = 'screen' | 'camera' | 'sandbox' | 'upload';

export interface AppSettings {
  autoScan: boolean;
  scanInterval: number; // in seconds: 2.5, 4, 6
  autoSpeak: boolean;
  voiceName: string; // 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon'
  speechRate: number; // 0.8 to 1.3
  preferGeminiTts: boolean;
  language: 'ar' | 'en';
  soundAlert: boolean;
}
