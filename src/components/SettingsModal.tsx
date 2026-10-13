import React from 'react';
import { X, Volume2, Sliders, Bell, Sparkles, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const voices = [
    { id: 'Kore', label: 'كوري (Kore)', desc: 'صوت هادئ ومريح وواضح جداً (أنثوي)' },
    { id: 'Puck', label: 'باك (Puck)', desc: 'صوت حماسي وسريع وودود (ذكوري)' },
    { id: 'Zephyr', label: 'زفير (Zephyr)', desc: 'صوت رسمي ومرن' },
    { id: 'Fenrir', label: 'فنرير (Fenrir)', desc: 'صوت عميق وقوي' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">إعدادات المساعد الصوتي والمسح</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 text-sm">
          {/* Scan Interval */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              سرعة المسح التلقائي للشاشة:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 2.5, label: 'سريع (2.5ث)', badge: 'أعلى سرعة' },
                { val: 4, label: 'متوازن (4ث)', badge: 'موصى به' },
                { val: 6, label: 'اقتصادي (6ث)', badge: 'توفير' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => onUpdateSettings({ scanInterval: item.val })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    settings.scanInterval === item.val
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              نبرة الصوت الذكي (Gemini Voice):
            </label>
            <div className="space-y-1.5">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onUpdateSettings({ voiceName: v.id })}
                  className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                    settings.voiceName === v.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-bold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{v.label}</div>
                    <div className="text-[10px] text-slate-400">{v.desc}</div>
                  </div>
                  {settings.voiceName === v.id && (
                    <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">سرعة نطق الإجابة:</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-semibold">
                نطق الجواب صوتياً فور رصده مباشرة
              </span>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-semibold">
                تنبيه صوتي (رنة) عند التقاط السؤال
              </span>
              <input
                type="checkbox"
                checked={settings.soundAlert}
                onChange={(e) => onUpdateSettings({ soundAlert: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
