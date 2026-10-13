import React from 'react';
import { X, Smartphone, Camera, Monitor, Sparkles, Headphones, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              دليل استخدام المساعد المباشر على التليفون
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs md:text-sm text-slate-300">
          {/* Method 1 */}
          <div className="p-4 bg-slate-950/70 border border-cyan-900/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Monitor className="w-4 h-4" />
              1. مشاركة شاشة الهاتف المباشرة (Android & Desktop):
            </div>
            <p className="leading-relaxed text-slate-300">
              اضغط على زر <strong className="text-white">"مشاركة الشاشة"</strong>، ثم اختر <strong className="text-cyan-300">"الشاشة بأكملها" (Entire Screen)</strong>.
            </p>
            <p className="leading-relaxed text-slate-400">
              يمكنك الآن فتح أي تطبيق آخر على هاتفك (تطبيقات مسابقات، كويزات، تيليجرام، امتحانات)، وسيقوم المساعد بمراقبة الشاشة وقراءة وحل أي سؤال يظهر عليها فوراً بصوت واضح في السماعة!
            </p>
          </div>

          {/* Method 2 */}
          <div className="p-4 bg-slate-950/70 border border-indigo-900/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Camera className="w-4 h-4" />
              2. استخدام كاميرا الهاتف (الأنسب لـ iPhone أو أوراق الامتحانات):
            </div>
            <p className="leading-relaxed text-slate-300">
              إذا كنت تستخدم iPhone أو ترغب في حل أسئلة من شاشة لابتوب، آيباد، أو ورقة امتحان أمامك:
            </p>
            <p className="leading-relaxed text-slate-400">
              اختر وضع <strong className="text-white">"كاميرا الهاتف"</strong> ووجّه الكاميرا الخلفية نحو السؤال؛ سيلتقطه المساعد ويجيب عليه صوتاً في ثوانٍ.
            </p>
          </div>

          {/* Method 3 */}
          <div className="p-4 bg-slate-950/70 border border-emerald-900/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              3. تجربة المحاكي المدمج (Screen Sandbox):
            </div>
            <p className="leading-relaxed text-slate-300">
              لتجربة التطبيق فورياً دون الحاجة لفتح تطبيقات أخرى، انتقل لتبويب <strong className="text-emerald-300">"المحاكي المدمج"</strong>.
            </p>
            <p className="leading-relaxed text-slate-400">
              يحتوي على أسئلة اختبارات حقيقية ومتنوعة ومحرر لكتابة أي سؤال مخصص لرؤية كيف يكتشفه المساعد ويجيبه صوتياً فورياً.
            </p>
          </div>

          {/* Method 4: Voice Chat */}
          <div className="p-4 bg-slate-950/70 border border-purple-900/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Headphones className="w-4 h-4" />
              4. التحدث الصوتي المباشر مع المساعد (يرد عليك صوتاً):
            </div>
            <p className="leading-relaxed text-slate-300">
              تكلم مع المساعد صوتياً في أي وقت وسيرد عليك بصوت حي فوري:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li>قل له: <span className="text-white font-semibold">«هالو كيفك تمام؟»</span> وسيرد عليك صوتاً ليؤكد أنه معك وجاهز لايف.</li>
              <li>قل له: <span className="text-white font-semibold">«ارصد أي سؤال على الشاشة وجاوبه صوتاً»</span> وسيقوم بفحص الشاشة والقول: <span className="text-cyan-300 font-medium">«السؤال الأول: ... وإجابته هي: الخيار ب...»</span></li>
              <li>فعّل زر <span className="text-emerald-400 font-semibold">«المحادثة بدون لمس»</span> ليتكلم معك باستمرار عبر السماعة أو ميكروفون الهاتف!</li>
            </ul>
          </div>

          {/* Secret Pro-tip */}
          <div className="p-3.5 bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-500/30 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-cyan-200 block text-xs">نصيحة للمسابقات السريعة:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ضع سماعة بلوتوث في أذنك وفعّل "المحادثة بدون لمس" مع "المسح الآلي"؛ ستسمع حل كل سؤال يظهر على هاتفك مباشرة في أذنك بصوت واضح ولحظي!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
          >
            فهمت، ابدأ الآن
          </button>
        </div>
      </div>
    </div>
  );
};
