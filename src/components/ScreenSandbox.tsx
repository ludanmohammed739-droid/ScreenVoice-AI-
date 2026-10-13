import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, HelpCircle, CheckCircle2, Shuffle, Plus } from 'lucide-react';

export interface SandboxQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

const PRESET_QUESTIONS: SandboxQuestion[] = [
  {
    id: 'q1',
    category: 'رياضيات وذكاء',
    question: 'إذا كان 3س + 15 = 45، فما هي قيمة س؟',
    options: ['أ) س = 8', 'ب) س = 10', 'ج) س = 12', 'د) س = 15'],
    correctIndex: 1,
    hint: 'اطرح 15 من الطرفين: 3س = 30، ثم اقسم على 3 فتصبح س = 10',
  },
  {
    id: 'q2',
    category: 'علوم وطبيعة',
    question: 'ما هو الكوكب الأقرب إلى الشمس في مجموعتنا الشمسية؟',
    options: ['أ) الزهرة', 'ب) المريخ', 'ج) عطارد', 'د) المشتري'],
    correctIndex: 2,
    hint: 'عطارد هو الكوكب الأول والأقرب للشمس بحوالي 58 مليون كم',
  },
  {
    id: 'q3',
    category: 'مسابقات وثقافة عامة',
    question: 'ما هي عاصمة سلطنة عُمان؟',
    options: ['أ) مسقط', 'ب) صلالة', 'ج) نزوى', 'د) المنامة'],
    correctIndex: 0,
    hint: 'مسقط هي العاصمة والمركز السياسي والتجاري للسلطنة',
  },
  {
    id: 'q4',
    category: 'برمجة وتكنولوجيا',
    question: 'ما هو التعقيد الزمني (Time Complexity) للبحث الثنائي (Binary Search) في مصفوفة مرتبة؟',
    options: ['أ) O(n)', 'ب) O(n²)', 'ج) O(log n)', 'د) O(1)'],
    correctIndex: 2,
    hint: 'البحث الثنائي يقسم نطاق البحث إلى النصف في كل خطوة، لذلك تعقيده O(log n)',
  },
  {
    id: 'q5',
    category: 'طب وصحة',
    question: 'أي من الفيتامينات التالية يُصنّعه جسم الإنسان عند التعرض لأشعة الشمس؟',
    options: ['أ) فيتامين C', 'ب) فيتامين D', 'ج) فيتامين B12', 'د) فيتامين A'],
    correctIndex: 1,
    hint: 'الجلد ينتج فيتامين د عند التفاعل مع الأشعة فوق البنفسجية',
  },
  {
    id: 'q6',
    category: 'ألغاز وقدرات ذهنية',
    question: 'سلسلة أرقام: 2، 4، 8، 16، 32، ما هو الرقم التالي؟',
    options: ['أ) 48', 'ب) 64', 'ج) 54', 'د) 72'],
    correctIndex: 1,
    hint: 'كل رقم يتم مضاعفته بالضرب في 2: 32 × 2 = 64',
  },
];

interface ScreenSandboxProps {
  onCaptureRequest?: () => void;
  sandboxRef: React.RefObject<HTMLDivElement | null>;
}

export const ScreenSandbox: React.FC<ScreenSandboxProps> = ({ sandboxRef }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const currentQ = PRESET_QUESTIONS[currentIndex];

  const handleNext = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % PRESET_QUESTIONS.length);
  };

  const handlePrev = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + PRESET_QUESTIONS.length) % PRESET_QUESTIONS.length);
  };

  const handleRandom = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    const rand = Math.floor(Math.random() * PRESET_QUESTIONS.length);
    setCurrentIndex(rand);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Sandbox Top Header */}
      <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-bold text-cyan-400 tracking-wider">
            محاكي شاشة الهاتف التفاعلي (Screen Sandbox)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCustomMode(!isCustomMode)}
            className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
              isCustomMode
                ? 'bg-cyan-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus className="w-3 h-3" />
            سؤال مخصص
          </button>
          <button
            onClick={handleRandom}
            title="سؤال عشوائي"
            className="p-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Sandbox Screen (The area captured by the scanner in sandbox mode) */}
      <div
        ref={sandboxRef}
        id="sandbox-screen-area"
        className="flex-1 p-5 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col justify-between relative overflow-hidden"
      >
        {/* Subtle phone-like watermark / status bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pb-3 border-b border-slate-800/60 font-mono">
          <span>09:41 AM 📶 🔋 100%</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            منصة الاختبارات المباشرة
          </span>
          <span>السؤال {currentIndex + 1} / {PRESET_QUESTIONS.length}</span>
        </div>

        {isCustomMode ? (
          <div className="my-auto space-y-4">
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
              اكتب أي مسألة أو سؤال أو لغز تريده هنا، وسيقوم الماسح الذكي برؤيته فورياً على الشاشة والإجابة عليه صوتياً!
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="مثال: ما هو ناتج 25 × 16؟ أو: ما هي أطول قمة جبلية في العالم؟"
              className="w-full h-32 p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        ) : (
          <div className="my-auto space-y-4 py-2">
            {/* Question Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentQ.category}
              </span>
              <span className="text-[11px] text-slate-400">امتحان تجريبي حقيقي</span>
            </div>

            {/* Question Heading */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl shadow-inner">
              <h3 className="text-base md:text-lg font-bold text-slate-100 leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-900/60';
                if (showAnswer) {
                  if (isCorrect) borderClass = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200';
                  else if (isSelected && !isCorrect) borderClass = 'border-rose-500/70 bg-rose-950/30 text-rose-300';
                } else if (isSelected) {
                  borderClass = 'border-cyan-500 bg-cyan-950/20 text-cyan-200';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between text-sm ${borderClass}`}
                  >
                    <span>{opt}</span>
                    {showAnswer && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sandbox Bottom Controls */}
        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              السابق
            </button>
            <button
              onClick={handleNext}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 transition-colors"
            >
              التالي
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showAnswer ? 'إخفاء الحل' : 'كشف الحل للتأكد'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
