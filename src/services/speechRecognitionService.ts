// Continuous Live Speech Recognition Engine (Never disconnects during active session)

export type SpeechResultCallback = (transcript: string) => void;
export type SpeechInterimCallback = (interimTranscript: string) => void;
export type SpeechStateCallback = (isListening: boolean) => void;

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private isLiveSession = false; // Persistent live call session
  private isMutedForAiSpeech = false;

  private onResultCallback: SpeechResultCallback | null = null;
  private onInterimCallback: SpeechInterimCallback | null = null;
  private onStateCallback: SpeechStateCallback | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ar-SA';
      // Enable continuous listening across turns and interim results for zero latency
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateCallback?.(true);
      };

      let silenceTimer: any = null;
      let pendingTranscript = '';

      this.recognition.onresult = (event: any) => {
        if (this.isMutedForAiSpeech) return;

        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }

        const currentActive = (finalTranscript || interim).trim();

        if (interim && this.onInterimCallback) {
          this.onInterimCallback(interim.trim());
        }

        // Rapid turn-taking: when user speaks and pauses for 350ms, fire immediately!
        if (currentActive) {
          pendingTranscript = currentActive;
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (pendingTranscript && !this.isMutedForAiSpeech) {
              const textToSend = pendingTranscript;
              pendingTranscript = '';
              this.onResultCallback?.(textToSend);
            }
          }, 350);
        }

        if (finalTranscript && finalTranscript.trim()) {
          if (silenceTimer) clearTimeout(silenceTimer);
          pendingTranscript = '';
          this.onResultCallback?.(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is normal when user is quiet during a live call; do not stop session
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition warning:', event.error);
        }

        // If the live call is active, immediately recover
        if (this.isLiveSession) {
          this.ensureRunning();
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateCallback?.(false);

        // Never disconnect if live session is active! Reconnect immediately
        if (this.isLiveSession) {
          this.ensureRunning();
        }
      };
    } catch (err) {
      console.warn('Failed to initialize SpeechRecognition', err);
    }
  }

  private ensureRunning() {
    if (!this.isLiveSession) return;
    setTimeout(() => {
      if (this.isLiveSession && !this.isListening) {
        try {
          this.recognition?.start();
        } catch {
          // In case already running
        }
      }
    }, 50);
  }

  isSupported(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  setCallbacks(
    onResult: SpeechResultCallback,
    onState: SpeechStateCallback,
    onInterim?: SpeechInterimCallback
  ) {
    this.onResultCallback = onResult;
    this.onStateCallback = onState;
    if (onInterim) this.onInterimCallback = onInterim;
  }

  // When AI is speaking, temporarily ignore mic input so AI doesn't hear itself,
  // but keep the session connection fully active!
  setMutedForAi(muted: boolean) {
    this.isMutedForAiSpeech = muted;
  }

  // Start continuous Live Call session (stays alive permanently until stopLiveSession is called)
  startLiveSession() {
    this.isLiveSession = true;
    this.isMutedForAiSpeech = false;
    if (!this.recognition) this.init();

    try {
      this.recognition?.start();
    } catch {
      // Ignore if already started
    }
  }

  // Stop the live call session explicitly by user
  stopLiveSession() {
    this.isLiveSession = false;
    this.isMutedForAiSpeech = false;
    try {
      this.recognition?.stop();
    } catch {
      // Ignore
    }
    this.isListening = false;
    this.onStateCallback?.(false);
  }

  isSessionActive(): boolean {
    return this.isLiveSession;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
