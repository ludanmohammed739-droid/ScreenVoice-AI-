import React from 'react';
import { X, Trash2, Volume2, Clock, CheckCircle2, Copy, Check } from 'lucide-react';
import { QuestionResult } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: QuestionResult[];
  onClearHistory: () => void;
  onPlayItem: (item: QuestionResult) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onPlayItem,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (item: QuestionResult) => {
    const text = `السؤال: ${item.questionText}\nالإجابة: ${item.spokenAnswer || item.shortAnswer}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">سجل الأسئلة المحلولة</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                title="مسح السجل"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 opacity-40" />
              <p className="text-sm">لا توجد أسئلة في السجل حتى الآن</p>
              <p className="text-xs">أي سؤال يلمحه المساعد على الشاشة سيتم حفظه هنا للرجوع إليه</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    محلول
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-200 line-clamp-2">
                  {item.questionText}
                </p>

                <div className="p-2 bg-slate-900 rounded-lg text-xs font-semibold text-cyan-300 border border-cyan-900/40">
                  {item.spokenAnswer || item.shortAnswer}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(item)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>نسخ</span>
                  </button>

                  <button
                    onClick={() => onPlayItem(item)}
                    className="px-2.5 py-1.5 rounded-md bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>تشغيل الصوت</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
