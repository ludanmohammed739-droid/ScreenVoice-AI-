import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Volume2,
  Sparkles,
  Send,
  Loader2,
  Clock,
  Radio,
  CheckCircle2,
  Mic,
  MessageCircle
} from 'lucide-react';

interface VoiceChatBarProps {
  onSendVoiceMessage: (text: string) => void;
  isListening: boolean;
  isLiveSessionActive: boolean;
  onToggleLiveSession: () => void;
  isProcessing: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  lastUserSpeech: string;
  lastAiSpokenResponse: string;
}

export const VoiceChatBar: React.FC<VoiceChatBarProps> = ({
  onSendVoiceMessage,
  isListening,
  isLiveSessionActive,
  onToggleLiveSession,
  isProcessing,
  isSpeaking,
  interimTranscript,
  lastUserSpeech,
  lastAiSpokenResponse,
}) => {
  const [inputText, setInputText] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // Call timer when live session is active
  useEffect(() => {
    let timer: any = null;
    if (isLiveSessionActive) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLiveSessionActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickPrompts = [
    { label: 'هالو كيفك تمام؟', text: 'هالو كيفك تمام؟' },
    { label: 'جاوب لي السؤال اللي على الشاشة', text: 'جاوب لي السؤال اللي على الشاشة صوتاً' },
    { label: 'اقرأ السؤال والخيارات', text: 'اقرأ لي السؤال والخيارات المتاحة' },
    { label: 'اشرح لي الحل بالتفصيل', text: 'اشرح لي حل هذا السؤال بالتفصيل' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendVoiceMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div
      className={`rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md transition-all duration-300 relative overflow-hidden ${
        isLiveSessionActive
          ? 'bg-slate-900/95 border-2 border-emerald-500 shadow-emerald-950/40'
          : 'bg-slate-900/95 border-2 border-indigo-500/40 shadow-indigo-950/30'
      }`}
    >
      {/* Decorative ambient pulses */}
      {isLiveSessionActive && (
        <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none"></div>
      )}

      {/* Main Live Call Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
              isLiveSessionActive
                ? 'bg-emerald-500 shadow-[0_0_12px_#10b981] animate-pulse'
                : 'bg-slate-600'
            }`}
          >
            {isLiveSessionActive && (
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            )}
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-1.5">
              <span>المكالمة الصوتية المباشرة (Live Voice Call)</span>
              {isLiveSessionActive && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  متصل لايف 🟢 {formatDuration(callDuration)}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isLiveSessionActive
                ? 'المكالمة مفتوحة ومستمرة لا تفصل أبداً؛ اسأله في أي لحظة وسيجيبك صوتاً فورياً!'
                : 'اضغط على الزر أدناه لبدء المحادثة المستمرة (تكلم معه وسيرد عليك دون انقطاع).'}
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Live Call Master Button */}
      <div className="py-3">
        <button
          onClick={onToggleLiveSession}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-98 ${
            isLiveSessionActive
              ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-900/40 animate-[pulse_2s_infinite]'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25'
          }`}
        >
          {isLiveSessionActive ? (
            <>
              <PhoneOff className="w-5 h-5 text-white" />
              <span>إنهاء المكالمة المباشرة 🔴 (الآن متصل ومستمر لا يفصل)</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-5 h-5 fill-slate-950" />
              <span>بدء المكالمة الصوتية المباشرة 🟢 (يبقى معك لايف بدون فصل)</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time Voice Waves / Live Audio State Orb */}
      {isLiveSessionActive && (
        <div className="p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2.5 my-1">
          <div className="flex items-center justify-between text-xs font-bold">
            {isSpeaking ? (
              <span className="text-cyan-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
                المساعد يتحدث معك الآن بصوته 🔊
              </span>
            ) : isProcessing ? (
              <span className="text-amber-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                جاري التفكير وتجهيز الرد الفوري...
              </span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                أنا أستمع إليك مباشرة... اسألني أي شيء في أي وقت!
              </span>
            )}

            {/* Audio Waves Indicator */}
            <div className="flex items-center gap-1">
              <span
                className={`w-1 rounded-full bg-emerald-400 transition-all ${
                  isSpeaking || isListening ? 'h-5 animate-[pulse_0.4s_infinite]' : 'h-2'
                }`}
              ></span>
              <span
                className={`w-1 rounded-full bg-cyan-400 transition-all ${
                  isSpeaking || isListening ? 'h-7 animate-[pulse_0.6s_infinite]' : 'h-3'
                }`}
              ></span>
              <span
                className={`w-1 rounded-full bg-indigo-400 transition-all ${
                  isSpeaking || isListening ? 'h-4 animate-[pulse_0.3s_infinite]' : 'h-2'
                }`}
              ></span>
              <span
                className={`w-1 rounded-full bg-emerald-300 transition-all ${
                  isSpeaking || isListening ? 'h-6 animate-[pulse_0.5s_infinite]' : 'h-3'
                }`}
              ></span>
            </div>
          </div>

          {/* Real-time Interim Transcription (User's words appearing in real-time) */}
          {interimTranscript && (
            <div className="p-2 bg-slate-900 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping shrink-0" />
              <span>جاري الاستماع: "{interimTranscript}..."</span>
            </div>
          )}
        </div>
      )}

      {/* Dialog Transcript (What user said & What AI responded with voice) */}
      {(lastUserSpeech || lastAiSpokenResponse) && (
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          {/* User speech */}
          {lastUserSpeech && (
            <div className="flex items-start gap-2 text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-bold shrink-0">
                أنت 🗣️
              </span>
              <p className="font-semibold text-slate-100">{lastUserSpeech}</p>
            </div>
          )}

          {/* AI Voice response */}
          {lastAiSpokenResponse && (
            <div className="flex items-start gap-2 text-indigo-200 pt-1.5 border-t border-slate-800/80">
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-[10px] text-indigo-400 font-bold shrink-0 flex items-center gap-1">
                بصير 🤖 {isSpeaking && <Volume2 className="w-3 h-3 text-cyan-400 animate-bounce" />}
              </span>
              <p className="font-bold text-white leading-relaxed">{lastAiSpokenResponse}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Voice Chips */}
      <div className="pt-2">
        <span className="text-[10px] font-bold text-slate-400 block mb-1">
          أوامر صوتية سريعة بنقرة واحدة:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendVoiceMessage(p.text)}
              disabled={isProcessing}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 hover:border-emerald-500/50 border border-slate-700 rounded-lg text-[11px] text-slate-300 whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>"{p.label}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text fallback input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="أو اكتب كلامك هنا وسيجيبك صوتاً فوراً..."
            className="w-full h-10 pl-10 pr-3 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-30 transition-colors"
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </form>
    </div>
  );
};
