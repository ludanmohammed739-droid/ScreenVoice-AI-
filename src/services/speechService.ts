// Unified voice playback service: Gemini TTS + Web Speech API fallback

type SpeakingStateListener = (isSpeaking: boolean) => void;

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;
  private listeners: Set<SpeakingStateListener> = new Set();

  subscribe(listener: SpeakingStateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: boolean) {
    this.isSpeaking = state;
    this.listeners.forEach((l) => l(state));
  }

  getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }

  // Stop any currently playing audio or speech synthesis
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.notify(false);
  }

  // Play audio either from Gemini TTS audio URL or browser TTS
  async speak(text: string, audioUrl?: string | null, rate = 1.0): Promise<void> {
    this.stop();

    if (!text || text.trim() === '') return;

    // 1. If Gemini WAV audio data URL is available, play it directly
    if (audioUrl) {
      return new Promise((resolve) => {
        try {
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;
          audio.playbackRate = rate;

          audio.onplay = () => {
            this.notify(true);
          };

          audio.onended = () => {
            this.currentAudio = null;
            this.notify(false);
            resolve();
          };

          audio.onerror = (e) => {
            console.warn('Gemini Audio playback error, falling back to Web Speech:', e);
            this.currentAudio = null;
            this.speakWithBrowser(text, rate).then(resolve);
          };

          audio.play().catch((playErr) => {
            console.warn('Autoplay prevented or failed, fallback to browser speech:', playErr);
            this.speakWithBrowser(text, rate).then(resolve);
          });
        } catch {
          this.speakWithBrowser(text, rate).then(resolve);
        }
      });
    }

    // 2. Fallback to Web Speech API
    return this.speakWithBrowser(text, rate);
  }

  private speakWithBrowser(text: string, rate = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.notify(false);
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.9, Math.min(1.4, rate));

      // Attempt to pick an Arabic voice if available
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(
        (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
      );
      if (arabicVoice) {
        utterance.voice = arabicVoice;
        utterance.lang = arabicVoice.lang;
      } else {
        utterance.lang = 'ar-SA';
      }

      utterance.onstart = () => {
        this.notify(true);
      };

      utterance.onend = () => {
        this.notify(false);
        resolve();
      };

      utterance.onerror = () => {
        this.notify(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const speechService = new SpeechService();
