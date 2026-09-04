import { Word, StoryPassage, DetectedNewWord, StoryToken } from '../types';

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

// Clean and normalize model name
function normalizeModelName(rawModel?: string): string {
  if (!rawModel || !rawModel.trim()) {
    return import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }
  return rawModel.trim().replace(/^models\//, '');
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
   * Unified High-Speed Stream Engine:
   * Priority 1: Backend Secure SSE Proxy (/api/ai/generate-stream) - Zero key exposure in browser!
   * Priority 2: Direct browser SSE stream with automatic key rotation fallback
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
    const targetModel = normalizeModelName(envModel);

    if (envKey) {
      GeminiService.setApiKeyPool(envKey);
    }

    // ================= 1. SECURE SERVER SSE PROXY (PRIORITY 1) =================
    try {
      const proxyRes = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: targetModel,
          isJson,
          apiKey: apiKeyInput || undefined
        })
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
                // Not standard JSON, could be raw text chunk
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
      }
    } catch {
      // Fallback to client-side streaming if server proxy fails
    }

    // ================= 2. DIRECT CLIENT HTTP SSE STREAM (FALLBACK) =================
    const totalKeys = Math.max(1, GeminiService.keyPool.length);
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < totalKeys) {
      const currentKey = GeminiService.getActiveApiKey(envKey);
      if (!currentKey) {
        throw new Error('Vui lòng nhập Google Gemini API Key trong phần Cài đặt hoặc file .env');
      }

      try {
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
          })
        });

        if (!response.ok) {
          if ((response.status === 429 || response.status === 403) && GeminiService.keyPool.length > 1) {
            GeminiService.rotateToNextApiKey();
            attempts++;
            continue;
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
                // ignore
              }
            }
          }
        }

        if (!accumulatedText) {
          throw new Error('Gemini API không trả về nội dung stream');
        }

        return accumulatedText;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (GeminiService.keyPool.length > 1 && attempts < totalKeys - 1) {
          GeminiService.rotateToNextApiKey();
          attempts++;
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Không thể kết nối đến Gemini API');
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
      .filter(w => w.isStarred || w.box <= 2 || !w.lastReviewed)
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
  "title": "Tiêu đề tiếng Trung (Chữ Hán)",
  "titlePinyin": "Pinyin tiêu đề",
  "titleVietnamese": "Dịch tiêu đề",
  "chineseText": "Toàn bộ bài viết bằng 100% Chữ Hán",
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
  "title": "Tiêu đề phù hợp bằng Chữ Hán",
  "titlePinyin": "Pinyin tiêu đề",
  "titleVietnamese": "Dịch tiêu đề tiếng Việt",
  "chineseText": "Toàn bộ đoạn văn gốc bằng 100% Chữ Hán",
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

  // 5. Test API Connection (Fast with auto-timeout - Never hangs)
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
      const timer = setTimeout(() => controller.abort(), 7000);

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
}
