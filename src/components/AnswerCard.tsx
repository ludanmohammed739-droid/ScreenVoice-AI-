import React from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Share2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { QuestionResult } from '../types';

interface AnswerCardProps {
  result: QuestionResult | null;
  isAnalyzing: boolean;
  isSpeaking: boolean;
  onReplayVoice: () => void;
  onStopVoice: () => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  result,
  isAnalyzing,
  isSpeaking,
  onReplayVoice,
  onStopVoice,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `السؤال: ${result.questionText || ''}\nالإجابة: ${result.shortAnswer || ''}\nالشرح: ${result.explanation || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isAnalyzing && !result) {
    return (
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
          <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-semibold text-cyan-300">جاري قراءة محتوى الشاشة بالذكاء الاصطناعي...</p>
        <p className="text-xs text-slate-500">البحث عن أسئلة أو اختبارات وتحضير الإجابة الصوتية الفورية</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 bg-slate-900/80 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-200">بانتظار رصد أول سؤال على الشاشة</h4>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          قم بتشغيل مشاركة الشاشة أو توجيه الكاميرا، وسيقوم المساعد بقراءة أي سؤال فور ظهوره والإجابة عليه صوتياً في الحال!
        </p>
      </div>
    );
  }

  // When screen was scanned but no question was found
  if (!result.hasQuestion) {
    return (
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            آخر فحص: {new Date(result.timestamp).toLocaleTimeString('ar-SA')}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
            شاشة بدون أسئلة
          </span>
        </div>
        <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800 text-sm text-slate-300">
          <p className="text-xs text-slate-400 mb-1">المحتوى الظاهر في الشاشة الآن:</p>
          <p className="font-medium text-slate-200">{result.screenSummary || 'لم يُكتشف أي سؤال معروض حالياً'}</p>
        </div>
        <p className="text-[11px] text-slate-500 text-center">
          المساعد مستمر في مراقبة الشاشة... بمجرد فتح أي سؤال سيجيبك صوتاً فورياً.
        </p>
      </div>
    );
  }

  // When question is detected!
  return (
    <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border-2 border-cyan-500/40 rounded-2xl shadow-xl shadow-cyan-950/30 space-y-4 relative overflow-hidden">
      {/* Top Banner with Type & Accuracy */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            تم رصد السؤال وحله!
          </span>
          {result.confidence && (
            <span className="text-[11px] text-cyan-400 font-mono">
              دقة: {Math.round(result.confidence * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="نسخ السؤال والإجابة"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          نص السؤال المرصود:
        </span>
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 font-semibold text-sm leading-relaxed">
          {result.questionText}
        </div>
      </div>

      {/* Options if Multiple Choice */}
      {result.options && result.options.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400">خيارات السؤال:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.options.map((opt, i) => {
              const isCorrect =
                result.correctOption &&
                (opt.includes(result.correctOption) ||
                  result.correctOption.includes(opt.slice(0, 3)));
              return (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  {isCorrect && (
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                      الإجابة الصحيحة ✅
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Direct Spoken Answer Box (The Star Feature) */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/60 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            الإجابة الصوتية الفورية (المنطوقة):
          </span>
          {isSpeaking ? (
            <button
              onClick={onStopVoice}
              className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              إيقاف الصوت
            </button>
          ) : (
            <button
              onClick={onReplayVoice}
              className="px-2.5 py-1 rounded-lg bg-cyan-600/40 hover:bg-cyan-600 border border-cyan-400/50 text-cyan-100 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة النطق صوتياً
            </button>
          )}
        </div>

        <p className="text-base font-bold text-slate-100 leading-relaxed pt-1">
          {result.spokenAnswer || result.shortAnswer}
        </p>
      </div>

      {/* Explanation Details */}
      {result.explanation && (
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <Lightbulb className="w-3.5 h-3.5" />
            توضيح الحل:
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
        </div>
      )}
    </div>
  );
};
