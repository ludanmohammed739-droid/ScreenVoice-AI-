import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor,
  Camera,
  Layers,
  Upload,
  Radio,
  Volume2,
  VolumeX,
  HelpCircle,
  Sliders,
  History,
  Sparkles,
  Smartphone,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { CaptureSource, AppSettings, QuestionResult } from './types';
import { ScannerOverlay } from './components/ScannerOverlay';
import { ControlBar } from './components/ControlBar';
import { AnswerCard } from './components/AnswerCard';
import { ScreenSandbox } from './components/ScreenSandbox';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { VoiceChatBar } from './components/VoiceChatBar';
import { captureVideoFrame, generateSandboxFrame } from './services/captureHelper';
import { speechService } from './services/speechService';
import { speechRecognitionService } from './services/speechRecognitionService';
import { soundFx } from './services/soundFx';

export default function App() {
  // Capture & Stream State
  const [source, setSource] = useState<CaptureSource>('sandbox');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null);
  const [history, setHistory] = useState<QuestionResult[]>([]);
  const [lastQuestionFingerprint, setLastQuestionFingerprint] = useState<string>('');

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    autoScan: false,
    scanInterval: 3.5,
    autoSpeak: true,
    voiceName: 'Kore',
    speechRate: 1.0,
    preferGeminiTts: true,
    language: 'ar',
    soundAlert: true,
  });

  // Live Voice Call State (Persistent, never drops between questions)
  const [isListening, setIsListening] = useState(false);
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastUserSpeech, setLastUserSpeech] = useState<string>('');
  const [lastAiSpokenResponse, setLastAiSpokenResponse] = useState<string>(
    'أهلاً بك! اضغط على زر المكالمة المباشرة وسأكون معك لايف باستمرار: تسألني وأجيبك صوتاً دون انقطاع.'
  );

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sandboxRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoScanTimerRef = useRef<any>(null);

  // Helper to extract current visual frame from whatever source is active
  const getCurrentFrame = useCallback((): string | null => {
    if (source === 'screen' || source === 'camera') {
      if (videoRef.current) {
        return captureVideoFrame(videoRef.current);
      }
    } else if (source === 'sandbox') {
      const qText = sandboxRef.current?.querySelector('h3')?.textContent || 'إذا كان 3س + 15 = 45 فما هي قيمة س؟';
      const optionsNodes = sandboxRef.current?.querySelectorAll('button span');
      const opts: string[] = [];
      optionsNodes?.forEach((n) => {
        if (n.textContent && n.textContent.includes(')')) opts.push(n.textContent);
      });
      return generateSandboxFrame(
        qText,
        opts.length ? opts : ['أ) س = 8', 'ب) س = 10', 'ج) س = 12', 'د) س = 15'],
        'مسابقة واختبار مباشر'
      );
    } else if (source === 'upload' && uploadedImage) {
      return uploadedImage;
    }
    return null;
  }, [source, uploadedImage]);

  // Handle incoming voice message (Continuous Live Session with Zero Latency)
  const handleSendVoiceMessage = useCallback(
    async (transcript: string) => {
      if (!transcript || !transcript.trim() || isVoiceProcessing) return;

      const clean = transcript.trim().toLowerCase();
      setLastUserSpeech(transcript);
      setInterimTranscript('');

      // 1. Instant Zero-Latency (< 10ms) local response for greetings:
      if (
        clean.includes('هالو') ||
        clean.includes('كيفك') ||
        clean.includes('تمام') ||
        clean.includes('مرحبا') ||
        clean.includes('أهلاً') ||
        clean.includes('سلام')
      ) {
        const quickReply =
          'أهلاً وسهلاً بك! أنا تمام التمام وبأفضل حال ومعك لايف على التليفون وشاشتك أمامي! آمرني، اسألني وسأجاوبك فوراً!';
        setLastAiSpokenResponse(quickReply);
        speechService.speak(quickReply, null, Math.max(1.1, settings.speechRate));
        return;
      }

      if (clean.includes('تسمعني') || clean.includes('أنت معي') || clean.includes('سامعني')) {
        const quickReply = 'نعم، أسمعك بوضوح تام، معك لايف على الخط!';
        setLastAiSpokenResponse(quickReply);
        speechService.speak(quickReply, null, Math.max(1.1, settings.speechRate));
        return;
      }

      if (clean.includes('مين معي') || clean.includes('مين أنت')) {
        const quickReply = 'أنا بصير الشاشة، رفيقك المباشر لرصد وحل الأسئلة بالصوت الحي!';
        setLastAiSpokenResponse(quickReply);
        speechService.speak(quickReply, null, Math.max(1.1, settings.speechRate));
        return;
      }

      setIsVoiceProcessing(true);

      try {
        // Only attach screen frame if question is actually inquiring about the screen
        const isScreenQuery = /شاش|سؤال|خيارات|حل|ارصد|اقرأ|امتحان|كويز|مسألة/i.test(transcript);
        const currentFrame = isScreenQuery ? getCurrentFrame() : null;

        const response = await fetch('/api/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcript,
            image: currentFrame,
            voiceName: settings.voiceName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const resJson = await response.json();
        const data = resJson.data;

        setLastAiSpokenResponse(data.spokenResponse);

        // If a question was spotted via this turn, update the current result card!
        if (data.hasQuestionDetected && data.questionText) {
          const voiceResult: QuestionResult = {
            id: `q_voice_${Date.now()}`,
            timestamp: Date.now(),
            hasQuestion: true,
            questionText: data.questionText,
            shortAnswer: data.correctOptionOrAnswer,
            spokenAnswer: data.spokenResponse,
            explanation: data.explanation,
            screenSummary: data.screenStatus || 'تم الحل بناءً على سؤالك الصوتي',
            audioUrl: resJson.audio,
            thumbnailUrl: currentFrame || undefined,
          };
          setCurrentResult(voiceResult);
          setHistory((prev) => [voiceResult, ...prev.slice(0, 49)]);
          if (settings.soundAlert) soundFx.playQuestionDetected();
        }

        // Instant voice output! Zero network audio delay
        await speechService.speak(data.spokenResponse, resJson.audio, Math.max(1.1, settings.speechRate));
      } catch (err) {
        console.error('Error during voice chat:', err);
        const fallbackMsg = 'سمعتك بوضوح، أنا معك لايف ومراقب للشاشة.';
        setLastAiSpokenResponse(fallbackMsg);
        speechService.speak(fallbackMsg, null, Math.max(1.1, settings.speechRate));
      } finally {
        setIsVoiceProcessing(false);
      }
    },
    [
      getCurrentFrame,
      isVoiceProcessing,
      settings.voiceName,
      settings.speechRate,
      settings.soundAlert,
    ]
  );

  // Subscribe to speech recognition with interim feedback
  useEffect(() => {
    speechRecognitionService.setCallbacks(
      (transcript) => {
        handleSendVoiceMessage(transcript);
      },
      (listening) => {
        setIsListening(listening);
      },
      (interim) => {
        setInterimTranscript(interim);
      }
    );
  }, [handleSendVoiceMessage]);

  // Toggle persistent Live Call session
  const handleToggleLiveSession = () => {
    if (isLiveSessionActive) {
      speechRecognitionService.stopLiveSession();
      speechService.stop();
      setIsLiveSessionActive(false);
      setInterimTranscript('');
    } else {
      speechRecognitionService.startLiveSession();
      setIsLiveSessionActive(true);
      setInterimTranscript('');
    }
  };

  // Subscribe to speech state changes (mute mic while AI talks so it doesn't hear itself)
  useEffect(() => {
    const unsubscribe = speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
      speechRecognitionService.setMutedForAi(speaking);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Update settings handler
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Stop current active media stream
  const stopMediaStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Start Screen Capture
  const startScreenCapture = useCallback(async () => {
    stopMediaStream();
    setPermissionError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('متصفحك الحالي لا يدعم مشاركة الشاشة المباشرة. يمكنك استخدام وضع كاميرا الهاتف أو المحاكي.');
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Handle stream end when user clicks "Stop Sharing" in browser bar
      mediaStream.getVideoTracks()[0].onended = () => {
        stopMediaStream();
      };
    } catch (err: any) {
      console.warn('Screen capture failed:', err);
      if (err.name !== 'NotAllowedError') {
        setPermissionError(err.message || 'تعذر تشغيل مشاركة الشاشة. يرجى منح الإذن والمحاولة مجدداً.');
      }
    }
  }, [stopMediaStream]);

  // Start Camera Capture
  const startCameraCapture = useCallback(
    async (facing: 'environment' | 'user' = cameraFacing) => {
      stopMediaStream();
      setPermissionError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('الكاميرا غير مدعومة في هذا المتصفح.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.warn('Camera capture failed:', err);
        setPermissionError('تعذر الوصول إلى كاميرا الهاتف. تأكد من إعطاء إذن الكاميرا للمتصفح.');
      }
    },
    [stopMediaStream, cameraFacing]
  );

  // Switch capture mode
  const handleChangeSource = (newSource: CaptureSource) => {
    if (newSource === source) return;
    stopMediaStream();
    setSource(newSource);
    setPermissionError(null);

    if (newSource === 'screen') {
      startScreenCapture();
    } else if (newSource === 'camera') {
      startCameraCapture(cameraFacing);
    }
  };

  // Flip camera between rear and front
  const handleFlipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCameraCapture(nextFacing);
  };

  // Picture in picture support
  const handleTogglePip = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.warn('PiP not supported or failed', e);
    }
  };

  // Upload image handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploadedImage(base64);
      triggerScanWithImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Core scan execution with an image
  const triggerScanWithImage = async (imageData: string) => {
    if (isAnalyzing || !imageData) return;

    setIsAnalyzing(true);
    soundFx.playScanBlip();

    try {
      const response = await fetch('/api/scan-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          voiceName: settings.voiceName,
          generateAudio: settings.preferGeminiTts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const resJson = await response.json();
      const data = resJson.data;

      const newResult: QuestionResult = {
        id: `q_${Date.now()}`,
        timestamp: Date.now(),
        hasQuestion: Boolean(data.hasQuestion),
        questionText: data.questionText,
        questionType: data.questionType,
        options: data.options,
        correctOption: data.correctOption,
        shortAnswer: data.shortAnswer,
        spokenAnswer: data.spokenAnswer,
        explanation: data.explanation,
        confidence: data.confidence,
        screenSummary: data.screenSummary,
        detectedBox: data.detectedBox,
        audioUrl: resJson.audio,
        thumbnailUrl: imageData,
      };

      setCurrentResult(newResult);

      if (newResult.hasQuestion) {
        // Prevent repeating the same question if already spoken and unchanged
        const currentFingerprint = (newResult.questionText || '').trim();
        const isDuplicate = currentFingerprint === lastQuestionFingerprint;

        if (settings.soundAlert) {
          soundFx.playQuestionDetected();
        }

        // Add to history
        setHistory((prev) => [newResult, ...prev.slice(0, 49)]);

        // Speak aloud if autoSpeak enabled and not duplicate
        if (settings.autoSpeak && !isDuplicate && newResult.spokenAnswer) {
          setLastQuestionFingerprint(currentFingerprint);
          speechService.speak(newResult.spokenAnswer, resJson.audio, settings.speechRate);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Instant Scan trigger based on active source
  const handleInstantScan = useCallback(() => {
    if (isAnalyzing) return;

    if (source === 'screen' || source === 'camera') {
      if (videoRef.current) {
        const frame = captureVideoFrame(videoRef.current);
        if (frame) {
          triggerScanWithImage(frame);
        }
      }
    } else if (source === 'sandbox') {
      // Capture the sandbox screen
      const qText = sandboxRef.current?.querySelector('h3')?.textContent || 'إذا كان 3س + 15 = 45 فما هي قيمة س؟';
      const optionsNodes = sandboxRef.current?.querySelectorAll('button span');
      const opts: string[] = [];
      optionsNodes?.forEach((n) => {
        if (n.textContent && n.textContent.includes(')')) opts.push(n.textContent);
      });
      const frame = generateSandboxFrame(
        qText,
        opts.length ? opts : ['أ) س = 8', 'ب) س = 10', 'ج) س = 12', 'د) س = 15'],
        'مسابقة واختبار مباشر'
      );
      triggerScanWithImage(frame);
    } else if (source === 'upload' && uploadedImage) {
      triggerScanWithImage(uploadedImage);
    }
  }, [source, isAnalyzing, uploadedImage]);

  // Auto-Scan interval management
  useEffect(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }

    if (settings.autoScan) {
      autoScanTimerRef.current = setInterval(() => {
        handleInstantScan();
      }, settings.scanInterval * 1000);
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [settings.autoScan, settings.scanInterval, handleInstantScan]);

  // Replay voice handler
  const handleReplayVoice = () => {
    if (currentResult?.spokenAnswer) {
      speechService.speak(
        currentResult.spokenAnswer,
        currentResult.audioUrl,
        settings.speechRate
      );
    }
  };

  const handleStopVoice = () => {
    speechService.stop();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  بصير الشاشة
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  LIVE VOICE AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                مساعد الذكاء الاصطناعي لرصد وحل أسئلة الشاشة بالصوت المباشر
              </p>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-2">
            {/* Live Model Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Gemini 3.8 Multimodal</span>
            </div>

            {/* Quick Mute Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  speechService.stop();
                }
                handleUpdateSettings({ autoSpeak: !settings.autoSpeak });
              }}
              title={settings.autoSpeak ? 'الصوت مفعّل' : 'الصوت مكتوم'}
              className={`p-2 rounded-xl border transition-all ${
                settings.autoSpeak
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {settings.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="دليل الاستخدام على الهاتف"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4">
        {/* Permission / Browser Warning Banner if any */}
        {permissionError && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs md:text-sm text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{permissionError}</span>
            </div>
            <button
              onClick={() => setSource('sandbox')}
              className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
            >
              الانتقال للمحاكي المدمج
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
          {/* Left Column: Visual Monitor / Video Stream / Sandbox (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Visual Screen Container */}
            <div className="relative aspect-[16/10] sm:aspect-video lg:aspect-[4/3] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
              {/* Screen Share or Camera Video */}
              {(source === 'screen' || source === 'camera') && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black"
                  />

                  {/* Empty Stream Fallback Placeholder */}
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90 z-10">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                        {source === 'screen' ? <Monitor className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
                      </div>
                      <h3 className="text-base font-bold text-slate-100">
                        {source === 'screen' ? 'جاهز لمشاركة شاشة الهاتف' : 'جاهز لتشغيل كاميرا الهاتف'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                        {source === 'screen'
                          ? 'اضغط لبدء مشاركة الشاشة، ثم افتح أي تطبيق مسابقات أو امتحان على هاتفك وسيقوم المساعد بقراءته وحله مباشرة!'
                          : 'اضغط لتشغيل الكاميرا وتوجيهها نحو أي سؤال في شاشة أخرى أو ورقة امتحان.'}
                      </p>
                      <button
                        onClick={source === 'screen' ? startScreenCapture : () => startCameraCapture(cameraFacing)}
                        className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        {source === 'screen' ? 'بدء مشاركة الشاشة الحية' : 'تشغيل كاميرا الهاتف'}
                      </button>
                    </div>
                  )}

                  {/* Cyber Scanner Reticle Overlay */}
                  <ScannerOverlay
                    isScanning={Boolean(stream)}
                    isAnalyzing={isAnalyzing}
                    isSpeaking={isSpeaking}
                    hasQuestionDetected={Boolean(currentResult?.hasQuestion)}
                    detectedBox={currentResult?.detectedBox}
                    captureMode={source}
                    onTogglePip={handleTogglePip}
                    onInstantScan={handleInstantScan}
                  />
                </>
              )}

              {/* Sandbox Mode */}
              {source === 'sandbox' && (
                <div className="w-full h-full p-2 relative">
                  <ScreenSandbox
                    sandboxRef={sandboxRef}
                    onCaptureRequest={handleInstantScan}
                  />
                  {/* Scanner laser overlay over sandbox */}
                  <ScannerOverlay
                    isScanning={true}
                    isAnalyzing={isAnalyzing}
                    isSpeaking={isSpeaking}
                    hasQuestionDetected={Boolean(currentResult?.hasQuestion)}
                    detectedBox={currentResult?.detectedBox}
                    captureMode={source}
                    onInstantScan={handleInstantScan}
                  />
                </div>
              )}

              {/* Upload Mode */}
              {source === 'upload' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {uploadedImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={uploadedImage}
                        alt="Uploaded screenshot"
                        className="max-h-full max-w-full object-contain rounded-xl"
                      />
                      <ScannerOverlay
                        isScanning={false}
                        isAnalyzing={isAnalyzing}
                        isSpeaking={isSpeaking}
                        hasQuestionDetected={Boolean(currentResult?.hasQuestion)}
                        detectedBox={currentResult?.detectedBox}
                        captureMode={source}
                        onInstantScan={handleInstantScan}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 right-4 px-3 py-1.5 bg-slate-900/90 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        اختيار لقطة أخرى
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                        <Upload className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-200">
                        رفع لقطة شاشة أو صورة من ألبوم الهاتف
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs">
                        اختر لقطة شاشة من جهازك وسيقوم المساعد بحلها ونطق الإجابة فوراً
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                      >
                        اختيار صورة من الهاتف
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Instructions Pill */}
            <div className="px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                {source === 'sandbox'
                  ? 'جرب تقليب الأسئلة في المحاكي واضغط "افحص الآن" لسماع الإجابة صوتاً!'
                  : 'المساعد يراقب الشاشة المباشرة؛ سيجيبك صوتاً فور رصد أي سؤال.'}
              </span>
              <button
                onClick={() => setShowHelp(true)}
                className="text-slate-400 hover:text-cyan-300 underline font-medium"
              >
                كيف أستخدمه مع التطبيقات الأخرى؟
              </button>
            </div>
          </div>

          {/* Right Column: Controls & Answer Card (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Control Bar with source tabs & actions */}
            <ControlBar
              currentSource={source}
              onChangeSource={handleChangeSource}
              isScanning={Boolean(stream) || source === 'sandbox'}
              isAnalyzing={isAnalyzing}
              onInstantScan={handleInstantScan}
              onToggleAutoScan={() => handleUpdateSettings({ autoScan: !settings.autoScan })}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onFlipCamera={handleFlipCamera}
              onOpenSettings={() => setShowSettings(true)}
              onOpenHelp={() => setShowHelp(true)}
              onOpenHistory={() => setShowHistory(true)}
              historyCount={history.length}
            />

            {/* Interactive Continuous Live Voice Call Bar */}
            <VoiceChatBar
              onSendVoiceMessage={handleSendVoiceMessage}
              isListening={isListening}
              isLiveSessionActive={isLiveSessionActive}
              onToggleLiveSession={handleToggleLiveSession}
              isProcessing={isVoiceProcessing}
              isSpeaking={isSpeaking}
              interimTranscript={interimTranscript}
              lastUserSpeech={lastUserSpeech}
              lastAiSpokenResponse={lastAiSpokenResponse}
            />

            {/* Live Solution Card */}
            <AnswerCard
              result={currentResult}
              isAnalyzing={isAnalyzing}
              isSpeaking={isSpeaking}
              onReplayVoice={handleReplayVoice}
              onStopVoice={handleStopVoice}
            />
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <HistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        onPlayItem={(item) => {
          if (item.spokenAnswer) {
            speechService.speak(item.spokenAnswer, item.audioUrl, settings.speechRate);
          }
        }}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}
