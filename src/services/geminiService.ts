import { Word, StoryPassage, DetectedNewWord, StoryToken, ChineseRule } from '../types';

export type AiConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export interface GeminiAutoFillResult {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  hanViet: string;
  exampleSentence: string;
  examplePinyin: string;
  exampleVietnamese: string;
  radicals: string;
  mnemonic: string;
  hskLevel: number;
}

export interface StoryLengthOption {
  type: 'short' | 'medium' | 'long' | 'custom';
  customWords?: number;
}

// Clean and normalize model name using exact model from env/settings
function normalizeModelName(rawModel?: string): string {
  const m = rawModel || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';
  return m.trim().replace(/^models\//, '');
}

// Helper to strip Vietnamese accents for fuzzy offline matching
function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Fallback dictionary for common offline words
const OFFLINE_FALLBACK_DICT: Record<string, Partial<GeminiAutoFillResult>> = {
  'tao': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  'qua tao': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  'pingguo': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },
  '苹果': { hanzi: '苹果', pinyin: 'píngguǒ', vietnamese: 'quả táo', hanViet: 'Bình quả', exampleSentence: '我喜欢吃苹果。', examplePinyin: 'Wǒ xǐhuan chī píngguǒ.', exampleVietnamese: 'Tôi thích ăn táo.', radicals: '艹 + 平 + 果', mnemonic: 'Loại quả mọc từ cây cỏ mang lại sự bình an.', hskLevel: 1 },

  'uong nuoc': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },
  'heshui': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },
  '喝水': { hanzi: '喝水', pinyin: 'hē shuǐ', vietnamese: 'uống nước', hanViet: 'Hát thủy', exampleSentence: '我想喝水。', examplePinyin: 'Wǒ xiǎng hē shuǐ.', exampleVietnamese: 'Tôi muốn uống nước.', radicals: '口 + 氵', mnemonic: 'Mở miệng (口) uống dòng nước (氵).', hskLevel: 1 },

  'an com': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },
  'chifan': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },
  '吃饭': { hanzi: '吃饭', pinyin: 'chī fàn', vietnamese: 'ăn cơm / dùng bữa', hanViet: 'Ngật phạn', exampleSentence: '你吃饭了吗？', examplePinyin: 'Nǐ chī fàn le ma?', exampleVietnamese: 'Bạn ăn cơm chưa?', radicals: '口 + 饣', mnemonic: 'Mở miệng (口) thưởng thức đồ ăn (饣).', hskLevel: 1 },

  'di hoc': { hanzi: '去上学', pinyin: 'qù shàngxué', vietnamese: 'đi học', hanViet: 'Khứ thượng học', exampleSentence: '我们一起去上学吧。', examplePinyin: 'Wǒmen yìqǐ qù shàngxué ba.', exampleVietnamese: 'Chúng ta cùng đi học nhé.', radicals: '土 + 厶 + 冂', mnemonic: 'Bước chân rời nhà đến trường học.', hskLevel: 1 },
  'yeu': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },
  'ai': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },
  '爱': { hanzi: '爱', pinyin: 'ài', vietnamese: 'yêu / thương', hanViet: 'Ái', exampleSentence: '我爱你。', examplePinyin: 'Wǒ ài nǐ.', exampleVietnamese: 'Tôi yêu bạn.', radicals: '爫 + 冖 + 友', mnemonic: 'Dùng cả trái tim và sự bao bọc để đối xử với bạn bè/người thương.', hskLevel: 1 },

  'ban be': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 },
  'pengyou': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 },
  '朋友': { hanzi: '朋友', pinyin: 'péngyou', vietnamese: 'bạn bè / bằng hữu', hanViet: 'Bằng hữu', exampleSentence: '他是我的好朋友。', examplePinyin: 'Tā shì wǒ de hǎo péngyou.', exampleVietnamese: 'Cậu ấy là bạn tốt của tôi.', radicals: '月 + 月 + 又', mnemonic: 'Hai vầng trăng soi chiếu cùng đôi bàn tay kề vai sát cánh.', hskLevel: 1 }
};

export class GeminiService {
  private static connectionState: AiConnectionState = 'idle';
  private static listeners: Set<(state: AiConnectionState) => void> = new Set();

  // Multi-API-Key Pool with Automatic Failover
  private static keyPool: string[] = [];
  private static activeKeyIndex: number = 0;

  public static getConnectionState(): AiConnectionState {
    return GeminiService.connectionState;
  }

  public static onConnectionStateChange(cb: (state: AiConnectionState) => void): () => void {
    GeminiService.listeners.add(cb);
    cb(GeminiService.connectionState);
    return () => {
      GeminiService.listeners.delete(cb);
    };
  }

  private static setConnectionState(state: AiConnectionState) {
    GeminiService.connectionState = state;
    GeminiService.listeners.forEach(cb => cb(state));
  }

  // Parses comma-separated or multi-line API keys into pool
  public static setApiKeyPool(rawKeys?: string): void {
    if (!rawKeys) {
      const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!envKeys) {
        GeminiService.keyPool = [];
        return;
      }
      rawKeys = envKeys;
    }
    const parsed = rawKeys
      .split(/[,;\n]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);
    GeminiService.keyPool = parsed;
    if (GeminiService.activeKeyIndex >= parsed.length) {
      GeminiService.activeKeyIndex = 0;
    }
  }

  public static getActiveApiKey(fallbackKey?: string): string {
    if (GeminiService.keyPool.length > 0) {
      return GeminiService.keyPool[GeminiService.activeKeyIndex % GeminiService.keyPool.length];
    }
    const envKeys = fallbackKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    if (envKeys.trim()) {
      GeminiService.setApiKeyPool(envKeys);
      return GeminiService.keyPool[0] || '';
    }
    return '';
  }

  public static rotateToNextApiKey(): { key: string; index: number; total: number } | null {
    if (GeminiService.keyPool.length <= 1) {
      return null;
    }
    GeminiService.activeKeyIndex = (GeminiService.activeKeyIndex + 1) % GeminiService.keyPool.length;
    const nextKey = GeminiService.keyPool[GeminiService.activeKeyIndex];
    console.log(`[Gemini Multi-Key] Tự động chuyển sang API Key #${GeminiService.activeKeyIndex + 1}/${GeminiService.keyPool.length}`);
    return {
      key: nextKey,
      index: GeminiService.activeKeyIndex + 1,
      total: GeminiService.keyPool.length
    };
  }

  // Pre-warm AI connection state check
  public static async prewarmConnection(rawApiKey?: string, model?: string): Promise<void> {
    const envKey = rawApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';

    if (envKey) {
      GeminiService.setApiKeyPool(envKey);
    }

    GeminiService.setConnectionState('connecting');

    // 1. Check Server AI Proxy first
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ready') {
          GeminiService.setConnectionState('connected');
          return;
        }
      }
    } catch {
      // ignore
    }

    // 2. Direct key check if server proxy not ready
    const activeKey = GeminiService.getActiveApiKey(envKey);
    if (!activeKey) {
      GeminiService.setConnectionState('idle');
      return;
    }

    try {
      const targetModel = normalizeModelName(envModel);
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}?key=${activeKey}`;
      const res = await fetch(testUrl, { method: 'GET' });
      if (res.ok) {
        GeminiService.setConnectionState('connected');
      } else {
        GeminiService.setConnectionState('error');
      }
    } catch {
      GeminiService.setConnectionState('error');
    }
  }

  // Super-Resilient JSON extractor and auto-repairer
  public static safeExtractAndParseJson(text: string): any {
    let clean = text.trim();

    if (clean.includes('```json')) {
      const parts = clean.split('```json');
      if (parts[1]) {
        clean = parts[1].split('```')[0].trim();
      }
    } else if (clean.includes('```')) {
      const parts = clean.split('```');
      if (parts[1]) {
        clean = parts[1].split('```')[0].trim();
      }
    }

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    const firstBracket = clean.indexOf('[');
    const lastBracket = clean.lastIndexOf(']');

    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }

    try {
      return JSON.parse(clean);
    } catch {
      try {
        const repaired = clean
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
          .replace(/\\'/g, "'");
        return JSON.parse(repaired);
      } catch {
        try {
          const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
          const chineseMatch = text.match(/"chineseText"\s*:\s*"([^"]*)"/);
          const pinyinMatch = text.match(/"pinyinText"\s*:\s*"([^"]*)"/);
          const viMatch = text.match(/"vietnameseTranslation"\s*:\s*"([^"]*)"/);

          if (chineseMatch && chineseMatch[1]) {
            const rawChinese = chineseMatch[1];
            return {
              title: titleMatch ? titleMatch[1] : 'Đoạn văn luyện đọc',
              titlePinyin: pinyinMatch ? pinyinMatch[1] : '',
              titleVietnamese: viMatch ? viMatch[1] : '',
              chineseText: rawChinese,
              pinyinText: pinyinMatch ? pinyinMatch[1] : '',
              vietnameseTranslation: viMatch ? viMatch[1] : '',
              sentences: rawChinese
                .split(/[。！？\n]/)
                .filter(s => s.trim().length > 0)
                .map(s => ({
                  chinese: s.trim() + '。',
                  pinyin: '',
                  vietnamese: '',
                  tokens: []
                })),
              newWordsDetected: []
            };
          }
        } catch {
          // ignore
        }

        console.error('Failed to parse JSON from AI response:', text);
        throw new Error('Dữ liệu AI trả về không đúng cấu trúc JSON chuẩn. Vui lòng thử lại.');
      }
    }
  }

  /**
   * High-Speed Realtime HTTP SSE Stream Engine:
   * Priority 1: Direct Browser HTTP SSE Stream (Zero intermediary latency, live chunk delivery)
   * Priority 2: Server SSE Stream Proxy (/api/ai/generate-stream)
   * Priority 3: Non-stream Fast Generation Fallback (/api/ai/generate)
   */
  public static async callAiEngineStream(
    apiKeyInput?: string,
    model?: string,
    prompt: string = '',
    isJson: boolean = true,
    onChunk?: (accumulatedText: string, latestChunk: string) => void
  ): Promise<string> {
    const envKey = apiKeyInput || import.meta.env.VITE_GEMINI_API_KEY || '';
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const baseModel = normalizeModelName(envModel);
    const modelsToTry = [...new Set([baseModel, 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])];

    if (envKey) {
      GeminiService.setApiKeyPool(envKey);
    }

    // ================= 1. DIRECT CLIENT HTTP SSE STREAM (PRIORITY 1 - MAXIMUM SPEED) =================
    const totalKeys = Math.max(1, GeminiService.keyPool.length);
    let lastError: Error | null = null;

    for (let k = 0; k < totalKeys; k++) {
      const currentKey = GeminiService.getActiveApiKey(envKey);
      if (!currentKey) break;

      for (const targetModel of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeoutTimer = setTimeout(() => controller.abort(), 20000);

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${currentKey}&alt=sse`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                ...(isJson ? { responseMimeType: 'application/json' } : {})
              }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutTimer);

          if (!response.ok) {
            if (response.status === 404) {
              continue; // try next candidate model
            }
            if ((response.status === 429 || response.status === 403) && GeminiService.keyPool.length > 1) {
              GeminiService.rotateToNextApiKey();
              break; // rotate key
            }
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
          }

          if (!response.body) {
            throw new Error('Không thể khởi tạo luồng dữ liệu stream');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.substring(6).trim();
                if (jsonStr === '[DONE]') continue;
                try {
                  const data = JSON.parse(jsonStr);
                  const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (chunk) {
                    accumulatedText += chunk;
                    onChunk?.(accumulatedText, chunk);
                  }
                } catch {
                  if (jsonStr && !jsonStr.startsWith('{')) {
                    accumulatedText += jsonStr;
                    onChunk?.(accumulatedText, jsonStr);
                  }
                }
              }
            }
          }

          if (accumulatedText.trim().length > 0) {
            return accumulatedText;
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (GeminiService.keyPool.length > 1) {
        GeminiService.rotateToNextApiKey();
      }
    }

    // ================= 2. SECURE SERVER SSE PROXY (PRIORITY 2 FALLBACK) =================
    try {
      const controller = new AbortController();
      const timeoutTimer = setTimeout(() => controller.abort(), 35000);

      const proxyRes = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: baseModel,
          isJson,
          apiKey: apiKeyInput || undefined
        }),
        signal: controller.signal
      });

      if (proxyRes.ok && proxyRes.body) {
        const reader = proxyRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.substring(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const data = JSON.parse(jsonStr);
                const chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (chunk) {
                  accumulatedText += chunk;
                  onChunk?.(accumulatedText, chunk);
                }
              } catch {
                if (jsonStr && !jsonStr.startsWith('{')) {
                  accumulatedText += jsonStr;
                  onChunk?.(accumulatedText, jsonStr);
                }
              }
            }
          }
        }

        clearTimeout(timeoutTimer);
        if (accumulatedText.trim().length > 0) {
          return accumulatedText;
        }
      } else {
        clearTimeout(timeoutTimer);
      }
    } catch (proxyErr) {
      console.warn('[GeminiService] Server proxy stream failed:', proxyErr);
    }

    // ================= 3. ULTRA-FAST SERVER GENERATION (PRIORITY 3 FALLBACK) =================
    try {
      const fallbackRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: baseModel,
          isJson,
          apiKey: apiKeyInput || undefined
        })
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && data.success && data.text) {
          onChunk?.(data.text, data.text);
          return data.text;
        }
      }
    } catch {
      // ignore
    }

    throw lastError || new Error('Không thể kết nối đến Gemini API. Vui lòng kiểm tra lại API Key trong .env');
  }

  // 1. Auto Fill Word Details
  public static async autoFillWord(
    input: { hanzi?: string; pinyin?: string; vietnamese?: string },
    apiKey?: string,
    model?: string
  ): Promise<GeminiAutoFillResult> {
    const rawInput = input.hanzi || input.pinyin || input.vietnamese || '';
    const norm = normalizeText(rawInput);

    if (OFFLINE_FALLBACK_DICT[norm]) {
      const fallback = OFFLINE_FALLBACK_DICT[norm];
      return {
        hanzi: fallback.hanzi || input.hanzi || '',
        pinyin: fallback.pinyin || input.pinyin || '',
        vietnamese: fallback.vietnamese || input.vietnamese || '',
        hanViet: fallback.hanViet || '',
        exampleSentence: fallback.exampleSentence || '',
        examplePinyin: fallback.examplePinyin || '',
        exampleVietnamese: fallback.exampleVietnamese || '',
        radicals: fallback.radicals || '',
        mnemonic: fallback.mnemonic || '',
        hskLevel: fallback.hskLevel || 1
      };
    }

    const prompt = `Bạn là chuyên gia giảng dạy HSK hàng đầu. Hãy phân tích và điền đầy đủ thông tin từ vựng tiếng Trung dựa trên thông tin người dùng cung cấp:
- Chữ Hán: "${input.hanzi || ''}"
- Pinyin: "${input.pinyin || ''}"
- Nghĩa Việt: "${input.vietnamese || ''}"

Yêu cầu BẮT BUỘC:
- "hanzi": Bắt buộc là Chữ Hán Giản Thể.
- "pinyin": Pinyin có dấu thanh điệu chuẩn xác.
- "vietnamese": Dịch nghĩa chuẩn xác và thông dụng nhất.
- "hanViet": Âm Hán Việt (ví dụ: "Nhĩ Hảo", "Tạ Tạ", "Táo").
- "radicals": Liệt kê các bộ thủ cấu thành kèm giải nghĩa (ví dụ: "亻 (nhân) + 尔 (nhĩ)").
- "mnemonic": Mẹo nhớ mặt chữ / chiết tự hình tượng sinh động, dễ thuộc lòng trong 5 giây.
- "exampleSentence": 1 câu ví dụ thực tế ngắn gọn (hoàn toàn bằng Chữ Hán).
- "examplePinyin": Pinyin câu ví dụ có dấu thanh.
- "exampleVietnamese": Dịch nghĩa câu ví dụ.
- "hskLevel": Cấp độ HSK (từ 1 đến 6).

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo đúng schema sau (không thêm văn bản ngoài JSON):
{
  "hanzi": "chữ Hán",
  "pinyin": "pinyin",
  "vietnamese": "nghĩa tiếng Việt",
  "hanViet": "âm Hán Việt",
  "radicals": "bộ thủ cấu thành",
  "mnemonic": "mẹo nhớ mặt chữ",
  "exampleSentence": "câu ví dụ tiếng Trung",
  "examplePinyin": "pinyin câu ví dụ",
  "exampleVietnamese": "dịch ví dụ tiếng Việt",
  "hskLevel": 1
}`;

    const raw = await GeminiService.callAiEngineStream(apiKey, model, prompt, true);
    const parsed = GeminiService.safeExtractAndParseJson(raw);

    return {
      hanzi: parsed.hanzi || input.hanzi || '',
      pinyin: parsed.pinyin || input.pinyin || '',
      vietnamese: parsed.vietnamese || input.vietnamese || '',
      hanViet: parsed.hanViet || '',
      exampleSentence: parsed.exampleSentence || '',
      examplePinyin: parsed.examplePinyin || '',
      exampleVietnamese: parsed.exampleVietnamese || '',
      radicals: parsed.radicals || '',
      mnemonic: parsed.mnemonic || '',
      hskLevel: parsed.hskLevel || 1
    };
  }

  // 2. Batch parse words from raw text
  public static async batchParseWords(
    rawText: string,
    apiKey?: string,
    model?: string
  ): Promise<Partial<Word>[]> {
    const prompt = `Bạn là chuyên gia giảng dạy HSK. Trích xuất và phân tích đầy đủ từ vựng tiếng Trung từ văn bản sau:
"""
${rawText}
"""

Với MỖI từ vựng, BẮT BUỘC cung cấp:
- "radicals": Liệt kê các bộ thủ cấu thành kèm giải nghĩa (ví dụ: "女 (nữ) + 子 (tử)").
- "mnemonic": Mẹo nhớ mặt chữ / chiết tự hình tượng dễ thuộc lòng.
- "hanViet": Âm Hán Việt.
- "exampleSentence", "examplePinyin", "exampleVietnamese": Câu ví dụ ngắn gọn, pinyin và dịch nghĩa.

Trả về mảng JSON chuẩn:
[
  {
    "hanzi": "Chữ Hán",
    "pinyin": "Pinyin có dấu thanh",
    "vietnamese": "Nghĩa tiếng Việt",
    "hanViet": "Âm Hán Việt",
    "exampleSentence": "Câu ví dụ",
    "examplePinyin": "Pinyin ví dụ",
    "exampleVietnamese": "Dịch ví dụ",
    "radicals": "Bộ thủ cấu thành",
    "mnemonic": "Mẹo nhớ mặt chữ sinh động",
    "hskLevel": 1
  }
]`;

    const raw = await GeminiService.callAiEngineStream(apiKey, model, prompt, true);
    const parsed = GeminiService.safeExtractAndParseJson(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu trả về từ AI không đúng định dạng mảng.');
    }

    const now = Date.now();
    return parsed.map((item, index) => ({
      id: `bulk-${now}-${index}`,
      hanzi: item.hanzi || '',
      pinyin: item.pinyin || '',
      vietnamese: item.vietnamese || '',
      hanViet: item.hanViet || '',
      exampleSentence: item.exampleSentence || '',
      examplePinyin: item.examplePinyin || '',
      exampleVietnamese: item.exampleVietnamese || '',
      radicals: item.radicals || '',
      mnemonic: item.mnemonic || '',
      hskLevel: item.hskLevel || 1,
      box: 1,
      isStarred: false,
      reviewCount: 0,
      correctCount: 0,
      wrongCount: 0,
      createdAt: now + index
    }));
  }

  // 3. Real-time Streaming Context Reading Passage Generator
  public static async generateContextStoryStream(
    userWords: Word[],
    topic: string = 'Chào hỏi và làm quen',
    level: string = 'Sơ cấp HSK 1-2',
    format: 'dialogue' | 'article' = 'dialogue',
    lengthOption: StoryLengthOption = { type: 'medium' },
    apiKey?: string,
    model?: string,
    onStreamChunk?: (accumulatedText: string, latestChunk: string) => void
  ): Promise<StoryPassage> {
    const priorityWords = userWords
      .filter(w => w.isStarred || !w.isMastered)
      .map(w => w.hanzi)
      .slice(0, 50)
      .join(', ');

    const allVocabularyList = userWords
      .map(w => `${w.hanzi} (${w.vietnamese})`)
      .join(', ');

    let lengthDesc = 'khoảng 50 - 75 chữ (5 - 7 câu)';
    if (lengthOption.type === 'short') {
      lengthDesc = 'ngắn gọn, khoảng 30 - 45 chữ (3 - 4 câu)';
    } else if (lengthOption.type === 'long') {
      lengthDesc = 'dài phong phú, khoảng 85 - 130 chữ (8 - 12 câu)';
    } else if (lengthOption.type === 'custom' && lengthOption.customWords) {
      lengthDesc = `khoảng ${lengthOption.customWords} chữ`;
    }

    const isDialogue = format === 'dialogue';
    const formatInstruction = isDialogue
      ? `BẮT BUỘC THỂ LOẠI: HỘI THOẠI (Dialogue). Phải là đoạn đối thoại qua lại giữa 2 người (ví dụ: A và B, hoặc 大卫 và 李月). MỖI CÂU BẮT BUỘC PHẢI CÓ TÊN NGƯỜI NÓI (speaker) ở đầu câu.`
      : `BẮT BUỘC THỂ LOẠI: VĂN XUÔI / BÀI BÁO (Article). Là bài văn liền mạch, KHÔNG có tên người đối thoại.`;

    const prompt = `Bạn là tác giả sách giáo khoa tiếng Trung HSK giàu kinh nghiệm.
Nhiệm vụ: Hãy tạo một ${isDialogue ? 'đoạn HỘI THOẠI (Dialogue)' : 'đoạn VĂN XUÔI (Article)'} tiếng Trung trình độ ${level}.

${formatInstruction}
- Chủ đề: "${topic}".
- Độ dài mong muốn: ${lengthDesc}.
- Toàn bộ kho từ vựng học viên đã học: [${allVocabularyList}].
${priorityWords ? `- Ưu tiên lồng ghép các từ học viên đang cần ôn: [${priorityWords}].` : ''}
- Kèm thêm 2-4 TỪ MỚI tự nhiên mở rộng vốn từ.

⚠️ NGUYÊN TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. Trường "chineseText", "sentences[].chinese", và "tokens[].hanzi" BẮT BUỘC 100% PHẢI LÀ CHỮ HÁN GIẢN THỂ (ví dụ: 再见, 谢谢, 你好, 老师, 不客气).
   👉 TUYỆT ĐỐI KHÔNG ĐƯỢC ĐẶT PINYIN (như zàijiàn, nǐhǎo...) HAY CHỮ LA-TINH VÀO TRƯỜNG "chinese" HOẶC "hanzi"!
2. Pinyin CÓ DẤU THANH ĐIỆU chỉ được xuất hiện DUY NHẤT trong các trường: "titlePinyin", "pinyinText", "sentences[].pinyin", và "tokens[].pinyin".
3. Mỗi token trong "tokens":
   - "hanzi": BẮT BUỘC LÀ CHỮ HÁN (ví dụ "再见")
   - "pinyin": Pinyin tương ứng (ví dụ "zàijiàn")
   - "vietnamese": Dịch nghĩa từ đó (ví dụ "tạm biệt")

Bắt buộc trả về duy nhất chuỗi JSON hợp lệ theo đúng schema sau (không thêm bất kỳ văn bản nào ngoài JSON):
{
  "chineseText": "Toàn bộ bài viết bằng 100% Chữ Hán",
  "title": "Tiêu đề tiếng Trung (Chữ Hán)",
  "titlePinyin": "Pinyin tiêu đề",
  "titleVietnamese": "Dịch tiêu đề",
  "pinyinText": "Pinyin toàn bài",
  "vietnameseTranslation": "Dịch toàn bài sang tiếng Việt",
  "format": "${format}",
  "sentences": [
    {
      "chinese": "Câu 100% Chữ Hán ${isDialogue ? '(có tên người nói bằng Chữ Hán ở đầu, ví dụ 李月：再见！)' : ''}",
      "pinyin": "Pinyin câu",
      "vietnamese": "Dịch câu tiếng Việt",
      "speaker": "${isDialogue ? 'Tên nhân vật bằng Chữ Hán (ví dụ 大卫 hoặc 李月)' : ''}",
      "tokens": [
        { "hanzi": "chữ Hán", "pinyin": "pinyin", "vietnamese": "nghĩa ngắn" }
      ]
    }
  ],
  "newWordsDetected": [
    {
      "hanzi": "Chữ Hán từ mới",
      "pinyin": "Pinyin có dấu thanh",
      "vietnamese": "Dịch nghĩa tiếng Việt",
      "hanViet": "Âm Hán Việt",
      "radicals": "Bộ thủ cấu thành",
      "mnemonic": "Mẹo nhớ mặt chữ sinh động",
      "exampleSentence": "Câu ví dụ chứa từ mới",
      "examplePinyin": "Pinyin câu ví dụ",
      "exampleVietnamese": "Dịch câu ví dụ"
    }
  ]
}`;

    const raw = await GeminiService.callAiEngineStream(
      apiKey,
      model,
      prompt,
      true,
      onStreamChunk
    );

    const parsed = GeminiService.safeExtractAndParseJson(raw);

    const knownSet = new Set(userWords.map(w => w.hanzi));
    const processedNewWords: DetectedNewWord[] = (parsed.newWordsDetected || []).map((nw: DetectedNewWord) => ({
      ...nw,
      isAlreadyAdded: knownSet.has(nw.hanzi)
    }));

    return {
      id: `story-${Date.now()}`,
      title: parsed.title || 'Đoạn văn luyện đọc',
      titlePinyin: parsed.titlePinyin || '',
      titleVietnamese: parsed.titleVietnamese || '',
      chineseText: parsed.chineseText || '',
      pinyinText: parsed.pinyinText || '',
      vietnameseTranslation: parsed.vietnameseTranslation || '',
      format: parsed.format || format,
      sentences: parsed.sentences || [],
      newWordsDetected: processedNewWords,
      topic,
      createdAt: Date.now()
    };
  }

  // 4. Custom Passage Analyzer (Interactive Tokens, Pinyin, Meaning & New Words Extraction)
  public static async analyzeCustomPassageStream(
    customText: string,
    userWords: Word[],
    apiKey?: string,
    model?: string,
    onStreamChunk?: (accumulatedText: string, latestChunk: string) => void
  ): Promise<StoryPassage> {
    const allVocabularyList = userWords
      .map(w => w.hanzi)
      .slice(0, 150)
      .join(', ');

    const prompt = `Bạn là chuyên gia giảng dạy tiếng Trung và biên tập viên ngôn ngữ học.
Nhiệm vụ: Hãy phân tích đoạn văn tiếng Trung do người dùng cung cấp sau đây thành bài học tương tác hoàn chỉnh.

ĐOẠN VĂN TIẾNG TRUNG CỦA NGƯỜI DÙNG:
"""
${customText.trim()}
"""

DANH SÁCH TỪ VỰNG HỌC VIÊN ĐÃ HỌC:
[${allVocabularyList}]

⚠️ NGUYÊN TẮC BẮT BUỘC:
1. "chineseText", "sentences[].chinese", và "tokens[].hanzi" BẮT BUỘC 100% PHẢI LÀ CHỮ HÁN GIẢN THỂ (ví dụ: 再见, 谢谢, 你好, 老师). TUYỆT ĐỐI KHÔNG ĐẶT PINYIN HOẶC CHỮ LA-TINH VÀO TRƯỜNG "chinese" HOẶC "hanzi".
2. Tách đoạn văn thành các câu ("sentences") theo đúng mạch văn gốc của người dùng.
3. Trong mỗi câu ("sentences"), tách thành các từ/cụm từ tương tác ("tokens"):
   - "hanzi": Chữ Hán giản thể chuẩn của từ/cụm từ.
   - "pinyin": Pinyin có dấu thanh điệu chuẩn xác (chú ý biến điệu nếu có).
   - "vietnamese": Dịch nghĩa ngắn gọn phù hợp với ngữ cảnh câu.
4. Nếu đoạn văn có dạng đối thoại (ví dụ có "A:", "B:", "李月：", "大卫:"), hãy trích xuất tên người nói vào trường "speaker".
5. So sánh toàn bộ các từ trong bài với danh sách từ học viên đã học: Trích xuất tất cả các TỪ MỚI / TỪ HAY trong bài vào mảng "newWordsDetected" (kèm đầy đủ 8 trường: hanzi, pinyin, vietnamese, hanViet, radicals, mnemonic, exampleSentence, examplePinyin, exampleVietnamese).

Bắt buộc trả về duy nhất chuỗi JSON hợp lệ theo đúng schema sau (không thêm bất kỳ văn bản nào ngoài JSON):
{
  "chineseText": "Toàn bộ đoạn văn gốc bằng 100% Chữ Hán",
  "title": "Tiêu đề phù hợp bằng Chữ Hán",
  "titlePinyin": "Pinyin tiêu đề",
  "titleVietnamese": "Dịch tiêu đề tiếng Việt",
  "pinyinText": "Pinyin toàn bài",
  "vietnameseTranslation": "Dịch toàn bộ bài sang tiếng Việt",
  "format": "article",
  "sentences": [
    {
      "chinese": "Câu Chữ Hán",
      "pinyin": "Pinyin câu",
      "vietnamese": "Dịch câu tiếng Việt",
      "speaker": "Tên người nói nếu có",
      "tokens": [
        { "hanzi": "chữ Hán", "pinyin": "pinyin", "vietnamese": "nghĩa ngắn" }
      ]
    }
  ],
  "newWordsDetected": [
    {
      "hanzi": "Chữ Hán từ mới",
      "pinyin": "Pinyin có dấu",
      "vietnamese": "Nghĩa tiếng Việt ngắn",
      "hanViet": "Âm Hán Việt",
      "radicals": "Bộ thủ cấu thành",
      "mnemonic": "Mẹo nhớ mặt chữ ngắn gọn sinh động",
      "exampleSentence": "Câu ví dụ ngắn chứa từ này",
      "examplePinyin": "Pinyin câu ví dụ",
      "exampleVietnamese": "Dịch câu ví dụ"
    }
  ]
}`;

    const raw = await GeminiService.callAiEngineStream(
      apiKey,
      model,
      prompt,
      true,
      onStreamChunk
    );

    const parsed = GeminiService.safeExtractAndParseJson(raw);

    const knownSet = new Set(userWords.map(w => w.hanzi));
    const processedNewWords: DetectedNewWord[] = (parsed.newWordsDetected || []).map((nw: DetectedNewWord) => ({
      ...nw,
      isAlreadyAdded: knownSet.has(nw.hanzi)
    }));

    return {
      id: `story-custom-${Date.now()}`,
      title: parsed.title || 'Đoạn văn tự nhập',
      titlePinyin: parsed.titlePinyin || '',
      titleVietnamese: parsed.titleVietnamese || '',
      chineseText: parsed.chineseText || customText,
      pinyinText: parsed.pinyinText || '',
      vietnameseTranslation: parsed.vietnameseTranslation || '',
      format: parsed.format || 'article',
      sentences: parsed.sentences || [],
      newWordsDetected: processedNewWords,
      topic: 'Đoạn văn tự nhập',
      createdAt: Date.now()
    };
  }

  // 5. Test API Connection (Fast with exact env model)
  public static async testGeminiApiKey(apiKey?: string, model?: string): Promise<boolean> {
    const envModel = model || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const targetModel = normalizeModelName(envModel);

    // 1. First priority: Server proxy non-stream endpoint (ultra-fast, secure)
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Kiểm tra kết nối: OK',
          model: targetModel,
          isJson: false,
          apiKey: apiKey || undefined
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          GeminiService.setConnectionState('connected');
          return true;
        }
      }
    } catch (err) {
      console.warn('[GeminiService] Server AI test failed, trying direct:', err);
    }

    // 2. Direct client fallback with 7s timeout
    try {
      const envKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
      const activeKey = GeminiService.getActiveApiKey(envKey);
      if (!activeKey) return false;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}?key=${activeKey}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        GeminiService.setConnectionState('connected');
        return true;
      }
    } catch (err) {
      console.error('[GeminiService] Direct AI test error:', err);
    }

    return false;
  }

  /**
   * Auto-generate a complete, pedagogical Chinese grammar / phonology rule with AI
   */
  public static async autoGenerateChineseRule(
    inputTitleOrPrompt: string,
    apiKey?: string,
    model?: string
  ): Promise<Partial<ChineseRule>> {
    const raw = inputTitleOrPrompt?.trim();
    if (!raw) {
      throw new Error('Vui lòng nhập tên quy tắc hoặc chủ đề cần AI soạn.');
    }

    const prompt = `Bạn là chuyên gia ngôn ngữ học và giảng dạy tiếng Trung (HSK 1-6, biến âm ngữ âm, ngữ pháp) hàng đầu.
Người dùng muốn tạo một quy tắc học nhớ trong tiếng Trung với chủ đề / từ khoá: "${raw}".

Hãy phân tích và biên soạn đầy đủ, chuẩn xác, sư phạm và dễ hiểu nhất theo đúng định dạng JSON sau:
{
  "title": "Tên quy tắc đầy đủ, rõ ràng và chuẩn mực tiếng Việt",
  "category": "pronunciation" | "time_numbers" | "grammar" | "vocabulary" | "writing" | "other",
  "formula": "Công thức hoặc sơ đồ nhớ nhanh trực quan (ví dụ: Thanh 3 + Thanh 3 ➔ Thanh 2 + Thanh 3, hoặc S + Thời gian + Địa điểm + V + O)",
  "summary": "Tóm tắt cốt lõi 1-2 câu ngắn gọn, dễ thuộc lòng nhất",
  "detail": "Giải thích chi tiết, cơ chế hoạt động, các trường hợp ngữ pháp/phát âm cụ thể",
  "examples": [
    {
      "chinese": "Chữ Hán giản thể chuẩn",
      "pinyin": "Pinyin có dấu thanh điệu đầy đủ",
      "vietnamese": "Nghĩa tiếng Việt chuẩn xác",
      "note": "Ghi chú ngắn về cách áp dụng quy tắc trong ví dụ này"
    }
  ],
  "exceptions": "Ngoại lệ hoặc các lỗi sai người Việt hay mắc phải cần lưu ý tránh",
  "tags": ["danh", "sách", "thẻ", "từ", "khoá"],
  "practiceQuestions": [
    {
      "id": "q1",
      "question": "Câu hỏi trắc nghiệm kiểm tra việc áp dụng quy tắc này",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "correctAnswer": "Đáp án đúng (phải trùng khớp chính xác 1 trong 4 lựa chọn trên)",
      "explanation": "Lời giải thích cặn kẽ tại sao chọn đáp án này"
    }
  ]
}

Yêu cầu BẮT BUỘC:
- Trả về JSON thuần tuý, không kèm markdown giải thích bên ngoài.
- Cung cấp ít nhất 3 đến 5 ví dụ minh hoạ thực tế, sinh động.
- Cung cấp ít nhất 1-2 câu hỏi trắc nghiệm thực tế để kiểm tra học nhớ.
- Category bắt buộc phải là một trong các giá trị: "pronunciation", "time_numbers", "grammar", "vocabulary", "writing", "other".`;

    try {
      const jsonText = await GeminiService.callAiEngineStream(apiKey, model, prompt, true);
      const parsed = GeminiService.safeExtractAndParseJson(jsonText);

      return {
        title: parsed.title || raw,
        category: parsed.category || 'grammar',
        formula: parsed.formula || '',
        summary: parsed.summary || '',
        detail: parsed.detail || '',
        examples: Array.isArray(parsed.examples) && parsed.examples.length > 0 ? parsed.examples : [
          { chinese: '我吃完了。', pinyin: 'Wǒ chī wán le.', vietnamese: 'Tôi đã ăn xong rồi.', note: 'Ví dụ minh họa' }
        ],
        exceptions: parsed.exceptions || '',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [raw],
        practiceQuestions: Array.isArray(parsed.practiceQuestions) ? parsed.practiceQuestions : []
      };
    } catch (err) {
      console.warn('[GeminiService] AI Rule generation error, checking fallback knowledge templates:', err);
      const lower = raw.toLowerCase();

      if (lower.includes('bả') || lower.includes('ba') || lower.includes('把')) {
        return {
          title: 'Cấu trúc câu chữ 把 (Bǎ)',
          category: 'grammar',
          formula: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (了/bổ ngữ...)',
          summary: 'Dùng để nhấn mạnh sự tác động, xử lý của chủ thể làm thay đổi trạng thái hoặc vị trí của tân ngữ xác định.',
          detail: 'Câu chữ 把 là điểm ngữ pháp cực kỳ trọng yếu trong tiếng Trung (HSK 3-4). Động từ trong câu chữ 把 không được đứng trơ trọi một mình mà luôn phải mang theo thành phần bổ trợ như 了, bổ ngữ kết quả, bổ ngữ xu hướng, hoặc lặp lại động từ. Tân ngữ sau 把 phải là vật/người đã xác định cụ thể.',
          examples: [
            { chinese: '请把门关上。', pinyin: 'Qǐng bǎ mén guān shàng.', vietnamese: 'Làm ơn đóng cửa lại.', note: '把 + tân ngữ "门" (cửa) + động từ kèm bổ ngữ "关上"' },
            { chinese: '他把作业做完了。', pinyin: 'Tā bǎ zuòyè zuò wán le.', vietnamese: 'Anh ấy đã làm xong bài tập rồi.', note: 'Nhấn mạnh bài tập đã được giải quyết xong' },
            { chinese: '我把这本书送给你。', pinyin: 'Wǒ bǎ zhè běn shū sòng gěi nǐ.', vietnamese: 'Tôi tặng bạn cuốn sách này.', note: 'Tân ngữ "zhè běn shū" bị chuyển giao vị trí' }
          ],
          exceptions: 'Phủ định (不, 没) và động từ năng nguyện (想, 要, 能, 可以) phải đứng TRƯỚC chữ 把, tuyệt đối không được đặt sau 把.',
          tags: ['câu chữ 把', 'bǎ', 'ngữ pháp HSK3', 'bổ ngữ'],
          practiceQuestions: [
            {
              id: 'pq_ba_1',
              question: 'Vị trí của từ phủ định "没" trong câu chữ 把 đúng là:',
              options: [
                'Chủ ngữ + 没 + 把 + Tân ngữ + Động từ',
                'Chủ ngữ + 把 + Tân ngữ + 没 + Động từ',
                'Chủ ngữ + 把 + 没 + Tân ngữ + Động từ',
                'Chủ ngữ + 把 + Tân ngữ + Động từ + 没'
              ],
              correctAnswer: 'Chủ ngữ + 没 + 把 + Tân ngữ + Động từ',
              explanation: 'Trong câu chữ 把, từ phủ định (不, 没) bắt buộc phải đứng trước chữ 把.'
            }
          ]
        };
      }

      if (lower.includes('bù') || lower.includes('bu') || lower.includes('bất') || lower.includes('不')) {
        return {
          title: 'Quy tắc biến điệu của chữ 不 (Bù)',
          category: 'pronunciation',
          formula: '不 (bù) + Thanh 4 ➔ 不 (bú) + Thanh 4',
          summary: 'Chữ "不" bản gốc là thanh 4 (bù). Khi đứng trước một từ mang thanh 4, nó bắt buộc phải biến thành thanh 2 (bú).',
          detail: 'Khi đứng trước các thanh 1, thanh 2, thanh 3, hoặc đứng một mình / cuối câu, chữ "不" vẫn giữ nguyên âm gốc là thanh 4 (bù). Chỉ duy nhất khi đứng trước một âm tiết thanh 4 khác, "不" mới chuyển sang đọc thanh 2 (bú) để tạo sự mượt mà khi phát âm.',
          examples: [
            { chinese: '不是', pinyin: 'bú shì', vietnamese: 'Không phải', note: 'Thanh 4 (shì) ➔ "不" đọc thành bú (thanh 2)' },
            { chinese: '不对', pinyin: 'bú duì', vietnamese: 'Không đúng', note: 'Thanh 4 (duì) ➔ "不" đọc thành bú' },
            { chinese: '不去', pinyin: 'bú qù', vietnamese: 'Không đi', note: 'Thanh 4 (qù) ➔ "不" đọc thành bú' },
            { chinese: '不好', pinyin: 'bù hǎo', vietnamese: 'Không tốt', note: 'Thanh 3 (hǎo) ➔ "不" giữ nguyên thanh 4' },
            { chinese: '不吃', pinyin: 'bù chī', vietnamese: 'Không ăn', note: 'Thanh 1 (chī) ➔ "不" giữ nguyên thanh 4' }
          ],
          exceptions: 'Khi nằm ở giữa trong câu hỏi chính phản (A不A) hoặc bổ ngữ khả năng (V得/不C), chữ "不" được đọc nhẹ thành thanh nhẹ (khinh thanh): 看不见 (kàn bu jiàn), 去不去 (qù bu qù).',
          tags: ['biến điệu 不', 'bù', 'bú', 'phát âm', 'thanh điệu'],
          practiceQuestions: [
            {
              id: 'pq_bu_1',
              question: 'Cụm từ "不要" được phát âm chuẩn như thế nào?',
              options: ['bú yào', 'bù yào', 'bǔ yào', 'bū yào'],
              correctAnswer: 'bú yào',
              explanation: 'Vì "要" mang thanh 4 (yào), nên chữ "不" đứng trước nó phải biến điệu thành thanh 2 (bú).'
            }
          ]
        };
      }

      if (lower.includes('yī') || lower.includes('yi') || lower.includes('nhất') || lower.includes('一')) {
        return {
          title: 'Quy tắc biến điệu của chữ 一 (Yī)',
          category: 'pronunciation',
          formula: '一 + Thanh 4 ➔ yí | 一 + Thanh 1/2/3 ➔ yì | Đếm số ➔ yī',
          summary: 'Chữ "一" gốc thanh 1 (yī). Trước thanh 4 đọc thành thanh 2 (yí); trước thanh 1, 2, 3 đọc thành thanh 4 (yì); khi đếm số hoặc cuối câu giữ nguyên thanh 1.',
          detail: 'Biến điệu chữ 一 là một trong những hiện tượng ngữ âm thú vị nhất tiếng Trung:\n1. Đứng trước thanh 4: đọc thành thanh 2 (yí).\n2. Đứng trước thanh 1, thanh 2, thanh 3: đọc thành thanh 4 (yì).\n3. Đọc số thứ tự, số nhà, số điện thoại, đếm 1, 2, 3: giữ nguyên thanh 1 (yī).\n4. Lặp lại động từ (V một V): đọc thanh nhẹ (yi).',
          examples: [
            { chinese: '一共', pinyin: 'yí gòng', vietnamese: 'Tổng cộng', note: 'Gòng (thanh 4) ➔ đọc yí' },
            { chinese: '一天', pinyin: 'yì tiān', vietnamese: 'Một ngày', note: 'Tiān (thanh 1) ➔ đọc yì' },
            { chinese: '一年', pinyin: 'yì nián', vietnamese: 'Một năm', note: 'Nián (thanh 2) ➔ đọc yì' },
            { chinese: '一起', pinyin: 'yì qǐ', vietnamese: 'Cùng nhau', note: 'Qǐ (thanh 3) ➔ đọc yì' },
            { chinese: '第一', pinyin: 'dì-yī', vietnamese: 'Thứ nhất', note: 'Số thứ tự ➔ giữ nguyên thanh 1 yī' }
          ],
          exceptions: 'Trong số phòng, số xe, số điện thoại, "一" thường được đọc là "yāo" để tránh nhầm lẫn với số 7 (qī).',
          tags: ['biến điệu 一', 'yī', 'yí', 'yì', 'yāo', 'phát âm'],
          practiceQuestions: [
            {
              id: 'pq_yi_1',
              question: 'Cụm từ "一块儿" (cùng nhau/một khối) được phát âm chuẩn là:',
              options: ['yí kuàir', 'yì kuàir', 'yī kuàir', 'yi kuàir'],
              correctAnswer: 'yí kuàir',
              explanation: 'Vì "块" (kuài) mang thanh 4, nên "一" đứng trước biến thành thanh 2 (yí).'
            }
          ]
        };
      }

      if (lower.includes('so sánh') || lower.includes('bǐ') || lower.includes('bi') || lower.includes('比')) {
        return {
          title: 'Cấu trúc câu so sánh hơn với chữ 比 (Bǐ)',
          category: 'grammar',
          formula: 'A + 比 + B + Tính từ (+ 一点儿 / 得多 / Số lượng cụ thể)',
          summary: 'Dùng để so sánh sự chênh lệch tính chất, đặc điểm giữa đối tượng A và đối tượng B (A hơn B về mặt tính từ).',
          detail: 'Mẫu câu so sánh cơ bản nhất trong tiếng Trung:\n- Khẳng định: A + 比 + B + Tính từ.\n- Nhấn mạnh mức độ ít: A + 比 + B + Tính từ + 一点儿 / 一些.\n- Nhấn mạnh mức độ nhiều: A + 比 + B + Tính từ + 多了 / 得多.\n- Mức độ cụ thể: A + 比 + B + Tính từ + con số (VD: 大两岁 - lớn hơn 2 tuổi).',
          examples: [
            { chinese: '哥哥比弟弟高。', pinyin: 'Gēge bǐ dìdi gāo.', vietnamese: 'Anh trai cao hơn em trai.', note: 'So sánh cơ bản: A + 比 + B + Tính từ' },
            { chinese: '今天比昨天冷得多。', pinyin: 'Jīntiān bǐ zuótiān lěng de duō.', vietnamese: 'Hôm nay lạnh hơn hôm qua rất nhiều.', note: 'Bổ ngữ mức độ "得多" đặt sau tính từ' },
            { chinese: '他比我大三岁。', pinyin: 'Tā bǐ wǒ dà sān suì.', vietnamese: 'Anh ấy lớn hơn tôi 3 tuổi.', note: 'Số lượng chênh lệch đặt sau tính từ' }
          ],
          exceptions: 'TUYỆT ĐỐI KHÔNG dùng các phó từ chỉ mức độ như 很 (rất), 非常 (vô cùng), 太 (quá) trước tính từ trong câu so sánh chữ 比. Sai: A 比 B 很高 (❌). Đúng: A 比 B 高 (✔️).',
          tags: ['câu so sánh', 'bǐ', 'chữ 比', 'ngữ pháp HSK2', 'HSK3'],
          practiceQuestions: [
            {
              id: 'pq_bi_1',
              question: 'Câu nào sau đây SAI ngữ pháp câu so sánh chữ 比?',
              options: [
                '他比我很大 (❌)',
                '他比我大得多 (✔️)',
                '他比我大两岁 (✔️)',
                '他比我大一点儿 (✔️)'
              ],
              correctAnswer: '他比我很大 (❌)',
              explanation: 'Trong câu so sánh với 比, không được dùng các phó từ mức độ như "很", "非常" đứng trước tính từ.'
            }
          ]
        };
      }

      if (lower.includes('cặp từ') || lower.includes('gang') || lower.includes('刚才') || lower.includes('刚')) {
        return {
          title: 'Phân biệt cặp từ 刚 (Gāng) và 刚才 (Gāngcái)',
          category: 'vocabulary',
          formula: 'Chủ ngữ + 刚 + Động từ | 刚才 + Chủ ngữ + Động từ (hoặc S + 刚才 + V)',
          summary: '"刚" là phó từ (chỉ cảm nhận vừa mới xảy ra, đứng sau S); "刚才" là danh từ chỉ thời gian (khoảng thời gian thực tế vừa trôi qua vài phút trước, đứng trước hoặc sau S).',
          detail: 'Điểm khác biệt then chốt giữa 刚 và 刚才:\n1. Từ loại: "刚" là phó từ, "刚才" là danh từ thời gian.\n2. Vị trí: "刚" chỉ đứng sau chủ ngữ trước động từ. "刚才" có thể đứng trước chủ ngữ hoặc sau chủ ngữ.\n3. Thời gian: "刚" biểu thị cảm nhận chủ quan của người nói (có thể là vừa mới 5 phút, nhưng cũng có thể là vừa tốt nghiệp năm ngoái). "刚才" chỉ thời gian khách quan trong thực tế (cách hiện tại chỉ vài phút/khoảnh khắc ngắn).\n4. Từ ngữ đi kèm: "刚才" có thể đi kèm từ phủ định "没", còn "刚" không thể đi trực tiếp với "没".',
          examples: [
            { chinese: '他刚才去哪儿了？', pinyin: 'Tā gāngcái qù nǎr le?', vietnamese: 'Vừa nãy anh ấy đi đâu thế?', note: '"刚才" là thời điểm khách quan vài phút trước' },
            { chinese: '我刚来中国一个月。', pinyin: 'Wǒ gāng lái Zhōngguó yí gè yuè.', vietnamese: 'Tôi mới đến Trung Quốc được một tháng.', note: '"刚" biểu thị cảm giác chủ quan "vừa mới"' },
            { chinese: '刚才你怎么不说？', pinyin: 'Gāngcái nǐ zěnme bù shuō?', vietnamese: 'Vừa nãy sao bạn không nói?', note: '"刚才" đứng đầu câu trước chủ ngữ "你"' }
          ],
          exceptions: '"刚" không thể đứng trước chủ ngữ (Sai: 刚他走了 ❌. Đúng: 刚才他走了 ✔️). Sau "刚才" không thể có từ chỉ thời gian dài (Sai: 我刚才来北京半年 ❌).',
          tags: ['phân biệt từ', 'gāng', 'gāngcái', '刚', '刚才', 'từ vựng HSK3'],
          practiceQuestions: [
            {
              id: 'pq_gang_1',
              question: 'Điền từ thích hợp vào chỗ trống: "______ 他还在教室，现在去哪儿了？"',
              options: ['刚才', '刚', '刚刚好', '经常'],
              correctAnswer: '刚才',
              explanation: 'Vì vị trí chỗ trống đứng đầu câu trước chủ ngữ "他", chỉ có danh từ thời gian "刚才" mới được đứng trước chủ ngữ.'
            }
          ]
        };
      }

      if (lower.includes('giờ') || lower.includes('phút') || lower.includes('thời gian') || lower.includes('diǎn') || lower.includes('fēn')) {
        return {
          title: 'Quy tắc đọc Giờ & Phút trong tiếng Trung',
          category: 'time_numbers',
          formula: 'Giờ + 点 (diǎn) + [Số 0 零 (líng)] + Phút + [分 (fēn)]',
          summary: 'Đọc theo thứ tự Giờ trước - Phút sau. Phút dưới 10 bắt buộc phải có "零" (líng). Phút trên 10 có thể lược bỏ chữ "分". 15 phút gọi là 一刻 (yí kè), 30 phút gọi là 半 (bàn).',
          detail: 'Các mốc thời gian đặc biệt cần ghi nhớ:\n- 2 giờ: phải dùng 两点 (liǎng diǎn), KHÔNG dùng 二点 (èr diǎn).\n- Phút < 10: bắt buộc nói 零 (líng) + số phút + 分 (fēn), ví dụ 8:05 đọc là 八点零五分.\n- 15 phút: dùng 一刻 (yí kè), ví dụ 3:15 là 三点一刻.\n- 30 phút: dùng 半 (bàn), ví dụ 9:30 là 九点半.\n- 45 phút: 三刻 (sān kè) hoặc nói kém 差 (chà), ví dụ 7:45 là 差一刻八点.\n- Phút tròn từ 10 trở lên: có thể nói tắt bỏ chữ 分, ví dụ 10:20 là 十点二十.',
          examples: [
            { chinese: '两点零五分', pinyin: 'liǎng diǎn líng wǔ fēn', vietnamese: '2 giờ 5 phút', note: '2 giờ dùng 两 (liǎng), 5 phút phải có 零 (líng)' },
            { chinese: '八点半', pinyin: 'bā diǎn bàn', vietnamese: '8 giờ rưỡi (8:30)', note: '30 phút dùng 半 (bàn)' },
            { chinese: '三点一刻', pinyin: 'sān diǎn yí kè', vietnamese: '3 giờ 15 phút', note: '1 khắc = 15 phút' },
            { chinese: '差五分十点', pinyin: 'chà wǔ fēn shí diǎn', vietnamese: '10 giờ kém 5 (9:55)', note: 'Nói giờ kém dùng 差 (chà)' }
          ],
          exceptions: 'Số 2 trong giờ nói là 两 (liǎng diǎn), nhưng số 2 trong phút nếu là 2 phút thì nói là 两分 (hoặc 二分), 12 phút nói là 十二分, 20 phút nói là 二十分.',
          tags: ['đọc giờ', 'thời gian', 'liǎng diǎn', 'bàn', 'yí kè', 'chà', 'con số'],
          practiceQuestions: [
            {
              id: 'pq_time_1',
              question: 'Thời gian 2 giờ 5 phút đọc trong tiếng Trung chuẩn xác là gì?',
              options: ['两点零五分', '二点五分', '两点五', '二点零五'],
              correctAnswer: '两点零五分',
              explanation: '2 giờ phải dùng "两点" (liǎng diǎn), và phút lẻ dưới 10 bắt buộc phải có chữ "零" (líng).'
            }
          ]
        };
      }

      // Default smart structured fallback template if no specific keyword matched
      return {
        title: raw,
        category: 'grammar',
        formula: 'S + ' + raw + ' + V + O',
        summary: `Quy tắc cốt lõi về "${raw}" trong tiếng Trung, giúp ghi nhớ cấu trúc và cách vận dụng chính xác.`,
        detail: `Quy tắc "${raw}" là một nội dung quan trọng khi học tiếng Trung. Cần nắm vững vị trí đứng trong câu, sắc thái biểu đạt và các trường hợp biến thể để tránh nhầm lẫn khi giao tiếp và làm bài thi HSK.`,
        examples: [
          { chinese: '老师讲得很清楚。', pinyin: 'Lǎoshī jiǎng de hěn qīngchǔ.', vietnamese: 'Thầy giáo giảng bài rất rõ ràng.', note: 'Ví dụ áp dụng ngữ pháp chuẩn' },
          { chinese: '我们要好好学习。', pinyin: 'Wǒmen yào hǎohǎo xuéxí.', vietnamese: 'Chúng ta phải chăm chỉ học tập.', note: 'Ví dụ giao tiếp phổ biến' },
          { chinese: '今天的天气真好。', pinyin: 'Jīntiān de tiānqì zhēn hǎo.', vietnamese: 'Thời tiết hôm nay thật đẹp.', note: 'Ví dụ câu miêu tả' }
        ],
        exceptions: 'Cần chú ý trật tự từ và sự phối hợp giữa các thành phần bổ ngữ trong câu.',
        tags: [raw, 'ngữ pháp tiếng Trung', 'quy tắc học nhớ'],
        practiceQuestions: [
          {
            id: 'pq_gen_1',
            question: `Trong tiếng Trung, quy tắc "${raw}" thường được áp dụng như thế nào?`,
            options: [
              'Tuân thủ theo đúng trật tự ngữ pháp và sắc thái ngữ cảnh',
              'Luôn đặt ở vị trí cuối câu',
              'Chỉ dùng trong văn viết, không dùng trong văn nói',
              'Không cần thành phần bổ trợ đi kèm'
            ],
            correctAnswer: 'Tuân thủ theo đúng trật tự ngữ pháp và sắc thái ngữ cảnh',
            explanation: `Cần nắm rõ bản chất quy tắc "${raw}" để áp dụng chính xác trong từng văn cảnh.`
          }
        ]
      };
    }
  }
}

