import React from 'react';
import { Volume2, VolumeX, Eye, Maximize2, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { DetectedBox } from '../types';

interface ScannerOverlayProps {
  isScanning: boolean;
  isAnalyzing: boolean;
  isSpeaking: boolean;
  hasQuestionDetected: boolean;
  detectedBox?: DetectedBox;
  captureMode: 'screen' | 'camera' | 'sandbox' | 'upload';
  onTogglePip?: () => void;
  onInstantScan?: () => void;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  isScanning,
  isAnalyzing,
  isSpeaking,
  hasQuestionDetected,
  detectedBox,
  captureMode,
  onTogglePip,
  onInstantScan,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Corner Brackets */}
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm" />
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm" />

      {/* Cyber Grid Lines / Crosshairs in Center */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-12 h-0.5 bg-cyan-400"></div>
        <div className="w-0.5 h-12 bg-cyan-400 absolute"></div>
      </div>

      {/* Animated Scanline Laser when scanning or analyzing */}
      {(isScanning || isAnalyzing) && (
        <div
          className={`absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] transition-all duration-1000 ${
            isAnalyzing ? 'animate-bounce' : 'animate-[scan_3s_ease-in-out_infinite]'
          }`}
          style={{
            animation: isAnalyzing
              ? 'pulse 1s infinite'
              : 'scanLine 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      )}

      {/* Bounding Box Indicator over Detected Question */}
      {hasQuestionDetected && detectedBox && (
        <div
          className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all duration-300 animate-pulse pointer-events-none"
          style={{
            top: `${(detectedBox.ymin / 1000) * 100}%`,
            left: `${(detectedBox.xmin / 1000) * 100}%`,
            width: `${Math.max(15, ((detectedBox.xmax - detectedBox.xmin) / 1000) * 100)}%`,
            height: `${Math.max(10, ((detectedBox.ymax - detectedBox.ymin) / 1000) * 100)}%`,
          }}
        >
          <div className="absolute -top-6 right-0 bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow">
            تم رصد السؤال 🎯
          </div>
        </div>
      )}

      {/* Top Status Bar Inside Video */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-semibold text-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                isScanning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              {captureMode === 'screen'
                ? 'مشاركة الشاشة الحية'
                : captureMode === 'camera'
                ? 'كاميرا الهاتف المباشرة'
                : captureMode === 'sandbox'
                ? 'المحاكي التفاعلي'
                : 'لقطة ثابتة'}
            </span>
          </div>

          {/* Analysis State Pill */}
          {isAnalyzing && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-600/80 backdrop-blur-md text-[11px] font-bold text-cyan-300 animate-pulse">
              <Eye className="w-3 h-3 animate-spin" />
              جاري فحص الشاشة...
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/80 backdrop-blur-md text-[11px] font-bold text-indigo-300">
              <Volume2 className="w-3 h-3 text-indigo-400 animate-bounce" />
              يتحدث بالإجابة صوتياً 🔊
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {onTogglePip && (
            <button
              onClick={onTogglePip}
              title="نافذة عائمة (Picture-in-Picture)"
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Waveform Animation Overlay when Speaking */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-2 bg-slate-950/90 border border-indigo-500/50 rounded-full shadow-2xl backdrop-blur-lg pointer-events-auto">
          <span className="text-[11px] text-indigo-300 font-bold ml-2">الصوت المباشر:</span>
          <span className="w-1 h-3 bg-cyan-400 rounded-full animate-[pulse_0.4s_infinite]"></span>
          <span className="w-1 h-5 bg-indigo-400 rounded-full animate-[pulse_0.6s_infinite]"></span>
          <span className="w-1 h-7 bg-cyan-300 rounded-full animate-[pulse_0.3s_infinite]"></span>
          <span className="w-1 h-4 bg-indigo-300 rounded-full animate-[pulse_0.5s_infinite]"></span>
          <span className="w-1 h-6 bg-cyan-400 rounded-full animate-[pulse_0.4s_infinite]"></span>
          <span className="w-1 h-2 bg-indigo-400 rounded-full animate-[pulse_0.7s_infinite]"></span>
        </div>
      )}
    </div>
  );
};
