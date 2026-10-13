import React from 'react';
import {
  Monitor,
  Camera,
  Layers,
  Upload,
  Play,
  Pause,
  Scan,
  RefreshCw,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Settings,
  HelpCircle,
  History
} from 'lucide-react';
import { CaptureSource, AppSettings } from '../types';

interface ControlBarProps {
  currentSource: CaptureSource;
  onChangeSource: (source: CaptureSource) => void;
  isScanning: boolean;
  isAnalyzing: boolean;
  onInstantScan: () => void;
  onToggleAutoScan: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onFlipCamera?: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  currentSource,
  onChangeSource,
  isScanning,
  isAnalyzing,
  onInstantScan,
  onToggleAutoScan,
  settings,
  onUpdateSettings,
  onFlipCamera,
  onOpenSettings,
  onOpenHelp,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-xl backdrop-blur-md space-y-3">
      {/* Top Source Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => onChangeSource('screen')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
            currentSource === 'screen'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Monitor className="w-4 h-4" />
          مشاركة الشاشة
        </button>

        <button
          onClick={() => onChangeSource('camera')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
            currentSource === 'camera'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          كاميرا الهاتف
        </button>

        <button
          onClick={() => onChangeSource('sandbox')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
            currentSource === 'sandbox'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          المحاكي المدمج
        </button>

        <button
          onClick={() => onChangeSource('upload')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
            currentSource === 'upload'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          لقطة صورة
        </button>
      </div>

      {/* Main Execution Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Left Side: Instant Action Button & Auto Toggle */}
        <div className="flex items-center gap-2">
          {/* Instant Scan Button */}
          <button
            onClick={onInstantScan}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري الرصد...</span>
              </>
            ) : (
              <>
                <Scan className="w-4 h-4" />
                <span>افحص الآن واقرأ الجواب</span>
              </>
            )}
          </button>

          {/* Auto Loop Toggle */}
          <button
            onClick={onToggleAutoScan}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              settings.autoScan
                ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {settings.autoScan ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>المسح الآلي: يعمل ({settings.scanInterval}ث)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>تفعيل المسح الآلي</span>
              </>
            )}
          </button>

          {/* Camera Flip Button if camera mode */}
          {currentSource === 'camera' && onFlipCamera && (
            <button
              onClick={onFlipCamera}
              title="تبديل الكاميرا (أمامية / خلفية)"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Side: Voice, History & Modals */}
        <div className="flex items-center gap-1.5">
          {/* Auto-Speak Toggle */}
          <button
            onClick={() => onUpdateSettings({ autoSpeak: !settings.autoSpeak })}
            title={settings.autoSpeak ? 'النطق التلقائي مفعل' : 'النطق التلقائي معطل'}
            className={`p-2.5 rounded-xl border transition-colors ${
              settings.autoSpeak
                ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {settings.autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            title="سجل الأسئلة المحلولة"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors relative"
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="إعدادات الصوت والمسح"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help Guide Trigger */}
          <button
            onClick={onOpenHelp}
            title="طريقة الاستخدام على الهاتف"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
