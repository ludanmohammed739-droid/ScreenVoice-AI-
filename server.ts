import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support high payload size for camera & screen base64 snapshots
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

// Resilient Gemini generateContent helper with low latency thinkingConfig
async function generateContentWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const mergedConfig = {
    ...params.config,
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
  };

  try {
    return await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      ...params,
      config: mergedConfig,
    });
  } catch (error: any) {
    console.warn('gemini-3.8-flash fallback triggered:', error?.message || error);
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      ...params,
      config: params.config,
    });
  }
}

// Real-time Screen Analysis & Question Solver endpoint
app.post('/api/scan-screen', async (req, res) => {
  try {
    const { image, mode = 'live_scan', voiceName = 'Kore', generateAudio = true } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Strip data URI prefix if present
    const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const systemInstruction = `
أنت "بصير الشاشة" (ScreenVoice AI) - مساعد ذكاء اصطناعي فوري وخبير للمسابقات والامتحانات والمهام على شاشات الهواتف.
مهمتك:
1. فحص صورة شاشة الهاتف أو الكاميرا بدقة فائقة.
2. البحث عن أي سؤال، مسألة رياضية، لغز، اختبار خيارات متعددة (MCQ)، تمرين برمجي، أو استفسار معروض على الشاشة.
3. إذا وجدت سؤالاً:
   - حدد نصه بدقة (questionText).
   - إذا كان اختياراً من متعدد، استخرج الخيارات (options) وحدد الخيار الصحيح بوضوح (correctOption).
   - استخرج الإجابة المباشرة المختصرة (shortAnswer).
   - اكتب شرحاً موجزاً وواضحاً (explanation).
   - الأهم: صياغة إجابة صوتية فورية ومريحة للأذن (spokenAnswer) باللغة العربية، بصيغة واضحة وودية مثل: "السؤال الأول: [نص السؤال أو الفكرة]... الإجابة الصحيحة هي: الخيار [كذا]: [نص الحل]، لأن [السبب المختصر]." لتُقرأ صوتاً للمستخدم مباشرة في أذنيه بالصوت الحي.
   - حدد إحداثيات موقع السؤال على الشاشة بشكل تقريبي (box2d: ymin, xmin, ymax, xmax من 0 إلى 1000).
   - حدد نوع السؤال (questionType: "multiple_choice" | "math" | "logic_puzzle" | "code" | "general_knowledge" | "open_ended").
   - حدد نسبة الثقة (confidence: 0.0 إلى 1.0).
4. إذا لم يكن هناك أي سؤال ظاهر:
   - ضع hasQuestion: false.
   - اكتب وصفاً مختصراً جداً لما تراه في الشاشة (screenSummary) مثل: "شاشة تطبيق تواصل" أو "صفحة ويب بدون أسئلة حالياً".
   - اجعل spokenAnswer فارغاً أو عبارة مختصرة: "لا يظهر سؤال في الشاشة الآن".
    `.trim();

    const response = await generateContentWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: 'افحص محتوى هذه الشاشة فورياً: هل يوجد أي سؤال أو اختبار أو تمرين معروض؟ أجب بالهيكل المطلوب.',
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasQuestion: { type: Type.BOOLEAN },
            questionText: { type: Type.STRING },
            questionType: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctOption: { type: Type.STRING },
            shortAnswer: { type: Type.STRING },
            spokenAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            screenSummary: { type: Type.STRING },
            detectedBox: {
              type: Type.OBJECT,
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER },
              },
            },
          },
          required: ['hasQuestion', 'spokenAnswer', 'screenSummary'],
        },
      },
    });

    const resultJson = response.text ? JSON.parse(response.text) : { hasQuestion: false, screenSummary: 'لم يتم التعرف على المحتوى' };

    let audioBase64: string | null = null;

    // If a question was detected and spokenAnswer is provided, generate high-quality voice audio via Gemini TTS
    if (resultJson.hasQuestion && resultJson.spokenAnswer && generateAudio) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: resultJson.spokenAnswer,
                  speechMetadata: {
                    style: 'Clear, fluent, friendly, natural live voice assistant',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
              },
            },
          },
        });

        const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioPart) {
          audioBase64 = audioPart;
        }
      } catch (ttsError) {
        console.warn('Gemini TTS warning (client will fallback to SpeechSynthesis):', ttsError);
      }
    }

    return res.json({
      success: true,
      data: resultJson,
      audio: audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error scanning screen frame, returning continuous monitoring state:', error?.message || error);
    return res.json({
      success: true,
      data: {
        hasQuestion: false,
        screenSummary: 'المساعد يراقب الشاشة، جاري مسح الإطار التالي...',
        spokenAnswer: '',
      },
      audio: null,
      timestamp: Date.now(),
    });
  }
});

// Dedicated TTS endpoint to synthesize speech on demand
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: 'Clear, fluent, warm, friendly Arabic voice assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioPart) {
      return res.json({
        audio: `data:audio/wav;base64,${audioPart}`,
      });
    }

    return res.status(500).json({ error: 'No audio returned' });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// Interactive Voice Chat Endpoint (Conversational Assistant with Live Screen Vision)
app.post('/api/voice-chat', async (req, res) => {
  try {
    const { message, image, voiceName = 'Kore' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const cleanMsg = message.trim().toLowerCase();

    // Instant Zero-Latency Intent Check (< 5ms response)
    if (
      cleanMsg.includes('هالو') ||
      cleanMsg.includes('كيفك') ||
      cleanMsg.includes('تمام') ||
      cleanMsg.includes('مرحبا') ||
      cleanMsg.includes('أهلاً') ||
      cleanMsg.includes('سلام')
    ) {
      return res.json({
        success: true,
        data: {
          spokenResponse:
            'أهلاً وسهلاً بك يا غالي! أنا تمام التمام وبأفضل حال ومعك لايف على التليفون وشاشتك أمامي! آمرني، اسألني وسأجاوبك فوراً!',
          hasQuestionDetected: false,
          screenStatus: 'متصل لايف',
        },
        audio: null,
        timestamp: Date.now(),
      });
    }

    if (cleanMsg.includes('تسمعني') || cleanMsg.includes('أنت معي') || cleanMsg.includes('سامعني')) {
      return res.json({
        success: true,
        data: {
          spokenResponse: 'نعم، أسمعك بوضوح تام، أنا معك لايف على الخط!',
          hasQuestionDetected: false,
          screenStatus: 'الميكروفون متصل',
        },
        audio: null,
        timestamp: Date.now(),
      });
    }

    if (cleanMsg.includes('مين معي') || cleanMsg.includes('مين أنت')) {
      return res.json({
        success: true,
        data: {
          spokenResponse: 'أنا بصير الشاشة، رفيقك المباشر لرصد وحل الأسئلة بالصوت الحي!',
          hasQuestionDetected: false,
          screenStatus: 'جاهز للمسابقات والامتحانات',
        },
        audio: null,
        timestamp: Date.now(),
      });
    }

    let inlineImagePart: any = null;
    if (image) {
      const base64Data = image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const mimeMatch = image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      inlineImagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };
    }

    const systemInstruction = `
أنت "بصير الشاشة" (ScreenVoice AI) - مساعد صوتي فوري وفائق السرعة لمسابقات وامتحانات الهاتف.
المستخدم يسألك صوتياً ويحتاج إجابة فورية سريعة جداً بدون أي تأخير!
القواعد الصارمة:
1. اختصر إجابتك المنطوقة (spokenResponse) في جملة واحدة أو جملتين كحد أقصى. ابدأ بالجواب فوراً وبشكل قاطع.
2. إذا كان السؤال عن الشاشة:
   - افحص الصورة واستخرج الحل فوراً بالصيغة: "السؤال الأول: ... الإجابة الصحيحة هي: الخيار [كذا]..."
3. إذا لم يوجد سؤال في الشاشة:
   - قل فوراً: "لا يظهر سؤال في الشاشة الآن، افتح صفحة السؤال وسأحله لك فوراً."
4. ممنوع المقدمات أو الشروحات الطويلة غير اللازمة، فالسرعة القصوى هي الأهم.
    `.trim();

    const parts: any[] = [];
    if (inlineImagePart) {
      parts.push(inlineImagePart);
    }
    parts.push({
      text: `سؤال المستخدم الصوتي: "${message}". أجب بالجواب المباشر المختصر فوراً.`,
    });

    const response = await generateContentWithFallback({
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction,
        maxOutputTokens: 140,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spokenResponse: {
              type: Type.STRING,
              description: 'الرد الصوتي المباشر المختصر جداً للمستخدم',
            },
            hasQuestionDetected: { type: Type.BOOLEAN },
            questionText: { type: Type.STRING },
            correctOptionOrAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            screenStatus: { type: Type.STRING },
          },
          required: ['spokenResponse'],
        },
      },
    });

    const resultJson = response.text
      ? JSON.parse(response.text)
      : { spokenResponse: 'أنا معك لايف ومستعد، تفضل بسؤالك.' };

    return res.json({
      success: true,
      data: resultJson,
      audio: null, // Zero-latency: browser plays instantly via SpeechSynthesis
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in voice-chat, providing conversational voice fallback:', error?.message || error);

    const userMsg = (req.body?.message || '').toLowerCase();
    let fallbackText = 'أهلاً بك! أنا معك لايف ومستعد، شاشتك أمامي وجاهز لأي سؤال.';

    if (userMsg.includes('هالو') || userMsg.includes('كيفك') || userMsg.includes('تمام') || userMsg.includes('مرحبا')) {
      fallbackText = 'أهلاً وسهلاً بك يا غالي! أنا تمام التمام وبأفضل حال، ومعك لايف على التليفون وشاشتك أمامي! آمرني، تبي أرصد لك أي سؤال حالياً؟';
    } else if (userMsg.includes('ارصد') || userMsg.includes('سؤال') || userMsg.includes('جاوب') || userMsg.includes('حل')) {
      fallbackText = 'أنا أراقب شاشتك الآن لايف، افتح صفحة السؤال وسأقول لك: السؤال الأول وإجابته فورياً بالصوت!';
    } else if (userMsg.includes('خيارات') || userMsg.includes('اقرأ')) {
      fallbackText = 'أنا جاهز لقراءة السؤال وخياراته فور وضوحها على الشاشة.';
    }

    return res.json({
      success: true,
      data: {
        spokenResponse: fallbackText,
        hasQuestionDetected: false,
        screenStatus: 'المساعد متصل صوتياً لايف',
      },
      audio: null,
      timestamp: Date.now(),
    });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
